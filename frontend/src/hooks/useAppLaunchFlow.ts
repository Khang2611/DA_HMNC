/**
 * useAppLaunchFlow.ts — Explicit State Machine for 7Bank Launch & Auth Navigation
 *
 * States:
 *   - 'initializing': App starting, checking session in AsyncStorage
 *   - 'guest': First-time user or signed-out user (Welcome / SignIn / SignUp)
 *   - 'locked': Returning user with registered account (LockedHomeShell + QuickAuthOverlay)
 *   - 'authenticated': Active session, live HomeScreen unlocked
 *
 * Ensures HomeScreen is NEVER mounted behind guest screens or before authentication.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getLaunchSessionState, SessionState } from '../services/authService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AuthState =
  | 'initializing'
  | 'guest'
  | 'locked'
  | 'authenticated';

export type AppScreen =
  | 'splash'
  | 'welcome'
  | 'sign_in'
  | 'sign_up'
  | 'locked_home'
  | 'home';

export interface AppLaunchState {
  authState: AuthState;
  currentScreen: AppScreen;
  isSplashDismissed: boolean;
  isInitialized: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAppLaunchFlow() {
  const [state, setState] = useState<AppLaunchState>({
    authState: 'initializing',
    currentScreen: 'splash',
    isSplashDismissed: false,
    isInitialized: false,
  });

  // Track if splash logo animation has completed
  const logoCompleteRef = useRef(false);
  // Track resolved session target
  const resolvedTargetRef = useRef<{ auth: AuthState; screen: AppScreen } | null>(null);

  // Commit the resolved navigation target to state
  const commitTarget = useCallback((target: { auth: AuthState; screen: AppScreen }) => {
    setState((prev) => ({
      ...prev,
      authState: target.auth,
      currentScreen: target.screen,
      isInitialized: true,
    }));
  }, []);

  // Check launch session state on mount
  useEffect(() => {
    let cancelled = false;

    getLaunchSessionState().then((sessionState: SessionState) => {
      if (cancelled) return;

      const isGuest = sessionState === 'unauthenticated';
      const target: { auth: AuthState; screen: AppScreen } = {
        auth: isGuest ? 'guest' : 'locked',
        screen: isGuest ? 'welcome' : 'locked_home',
      };

      resolvedTargetRef.current = target;

      // If the logo animation already finished before session check resolved,
      // commit immediately so the destination screen renders underneath
      if (logoCompleteRef.current) {
        commitTarget(target);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [commitTarget]);

  /**
   * Called by AnimatedSplashScreen when the 7.→bank logo animation completes.
   * Resolves and mounts the destination screen underneath BEFORE the splash fades out.
   */
  const onLogoComplete = useCallback(() => {
    logoCompleteRef.current = true;
    if (resolvedTargetRef.current) {
      commitTarget(resolvedTargetRef.current);
    }
  }, [commitTarget]);

  /**
   * Called by AnimatedSplashScreen when its 350ms fade-out animation completes.
   * Safely unmounts the splash component from the React tree.
   */
  const onSplashDismissed = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isSplashDismissed: true,
    }));
  }, []);

  const navigateTo = useCallback((screen: AppScreen) => {
    setState((prev) => ({
      ...prev,
      currentScreen: screen,
      // Update authState accordingly if navigating within guest flow
      authState:
        screen === 'home'
          ? 'authenticated'
          : screen === 'locked_home'
          ? 'locked'
          : screen === 'splash'
          ? prev.authState
          : 'guest',
    }));
  }, []);

  const onAuthSuccess = useCallback(() => {
    setState((prev) => ({
      ...prev,
      authState: 'authenticated',
      currentScreen: 'home',
    }));
  }, []);

  const onSignOut = useCallback(() => {
    setState((prev) => ({
      ...prev,
      authState: 'guest',
      currentScreen: 'welcome',
    }));
  }, []);

  const onLockSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      authState: 'locked',
      currentScreen: 'locked_home',
    }));
  }, []);

  return {
    ...state,
    onLogoComplete,
    onSplashDismissed,
    navigateTo,
    onAuthSuccess,
    onSignOut,
    onLockSession,
  };
}

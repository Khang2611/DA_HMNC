/**
 * SettingsScreen.tsx — Complete Profile & Settings Module
 *
 * Mauve Banking profile & settings experience.
 * - Single continuous dark background (Palette.bg = '#16131F')
 * - Full subpage navigation stack within the existing Settings tab
 * - Profile viewing & contact info editing
 * - eKYC identity info viewing with privacy masking
 * - Default checking account selection
 * - Security: simulated change password, change PIN, biometrics toggle, auto-lock
 * - Session devices management
 * - Privacy: balance & preview hiding
 * - Notifications preferences
 * - Appearance & Reduce Motion
 * - Language selection
 * - Searchable Help Center FAQs
 * - Customer Support channels & Chatbot AI integration
 * - Terms of Service & Privacy Policy documents
 * - About App information
 * - Sign Out confirmation sheet
 */

import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';

import { Account } from '../types/banking';
import {
  UserProfile,
  SettingsPreferences,
  SettingsSubpageKey,
} from '../types/settings';
import { Palette } from '../theme/tokens';
import { ScreenHeader } from '../components/ScreenHeader';

import { SettingsMainView } from './settings/SettingsMainView';
import { ProfileDetailView } from './settings/ProfileDetailView';
import { IdentityInfoView } from './settings/IdentityInfoView';
import { DefaultAccountView } from './settings/DefaultAccountView';
import { SecurityView } from './settings/SecurityView';
import { SessionDevicesView } from './settings/SessionDevicesView';
import { PrivacyView } from './settings/PrivacyView';
import { NotificationsView } from './settings/NotificationsView';
import { AppearanceView } from './settings/AppearanceView';
import { LanguageView } from './settings/LanguageView';
import { BalanceVisibilityView } from './settings/BalanceVisibilityView';
import { HelpCenterView } from './settings/HelpCenterView';
import { ContactSupportView } from './settings/ContactSupportView';
import { LegalDocView } from './settings/LegalDocView';
import { AboutAppView } from './settings/AboutAppView';

interface SettingsScreenProps {
  visible: boolean;
  initialPage?: 'main' | 'profile';
  accounts: Account[];
  userProfile: UserProfile;
  preferences: SettingsPreferences;
  onUpdateUserProfile: (updated: UserProfile) => void;
  onUpdatePreferences: (updated: SettingsPreferences) => void;
  onOpenChatbot: () => void;
  onClose: () => void;
  onSignOut?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  visible,
  initialPage = 'main',
  accounts,
  userProfile,
  preferences,
  onUpdateUserProfile,
  onUpdatePreferences,
  onOpenChatbot,
  onClose,
  onSignOut,
}) => {
  const [currentSubpage, setCurrentSubpage] = useState<SettingsSubpageKey | null>(
    initialPage === 'profile' ? 'profile' : null
  );
  const [prevInitialPage, setPrevInitialPage] = useState(initialPage);
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible || initialPage !== prevInitialPage) {
    setPrevVisible(visible);
    setPrevInitialPage(initialPage);
    if (visible) {
      setCurrentSubpage(initialPage === 'profile' ? 'profile' : null);
    }
  }

  if (!visible) return null;

  const getSubpageTitle = (key: SettingsSubpageKey): string => {
    switch (key) {
      case 'profile':
        return 'Thông tin cá nhân';
      case 'identity':
        return 'Thông tin định danh';
      case 'default_account':
        return 'Tài khoản mặc định';
      case 'security':
        return 'Bảo mật tài khoản';
      case 'devices':
        return 'Thiết bị đăng nhập';
      case 'privacy':
        return 'Quyền riêng tư';
      case 'notifications':
        return 'Cài đặt thông báo';
      case 'appearance':
        return 'Giao diện & Trợ năng';
      case 'language':
        return 'Ngôn ngữ ứng dụng';
      case 'balance_visibility':
        return 'Hiển thị số dư';
      case 'help':
        return 'Trung tâm trợ giúp';
      case 'contact':
        return 'Liên hệ hỗ trợ';
      case 'terms':
        return 'Điều khoản sử dụng';
      case 'privacy_policy':
        return 'Chính sách bảo mật';
      case 'about':
        return 'Thông tin ứng dụng';
    }
  };

  const handleBackToMain = () => {
    setCurrentSubpage(null);
  };

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      onClose();
    }
  };

  const renderSubpageContent = () => {
    if (!currentSubpage) return null;

    switch (currentSubpage) {
      case 'profile':
        return (
          <ProfileDetailView
            userProfile={userProfile}
            onUpdateProfile={onUpdateUserProfile}
            onNavigateIdentity={() => setCurrentSubpage('identity')}
          />
        );
      case 'identity':
        return <IdentityInfoView userProfile={userProfile} />;
      case 'default_account':
        return (
          <DefaultAccountView
            accounts={accounts}
            preferences={preferences}
            onUpdatePreferences={onUpdatePreferences}
          />
        );
      case 'security':
        return (
          <SecurityView
            preferences={preferences}
            onUpdatePreferences={onUpdatePreferences}
            onNavigateDevices={() => setCurrentSubpage('devices')}
          />
        );
      case 'devices':
        return <SessionDevicesView />;
      case 'privacy':
        return (
          <PrivacyView
            preferences={preferences}
            onUpdatePreferences={onUpdatePreferences}
          />
        );
      case 'notifications':
        return (
          <NotificationsView
            preferences={preferences}
            onUpdatePreferences={onUpdatePreferences}
          />
        );
      case 'appearance':
        return (
          <AppearanceView
            preferences={preferences}
            onUpdatePreferences={onUpdatePreferences}
          />
        );
      case 'language':
        return (
          <LanguageView
            preferences={preferences}
            onUpdatePreferences={onUpdatePreferences}
          />
        );
      case 'balance_visibility':
        return (
          <BalanceVisibilityView
            preferences={preferences}
            onUpdatePreferences={onUpdatePreferences}
          />
        );
      case 'help':
        return (
          <HelpCenterView
            onNavigateContact={() => setCurrentSubpage('contact')}
          />
        );
      case 'contact':
        return <ContactSupportView onOpenChatbot={onOpenChatbot} />;
      case 'terms':
        return <LegalDocView docType="terms" />;
      case 'privacy_policy':
        return <LegalDocView docType="privacy_policy" />;
      case 'about':
        return <AboutAppView />;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {currentSubpage === null ? (
        <SettingsMainView
          userProfile={userProfile}
          preferences={preferences}
          onNavigateSubpage={(key) => setCurrentSubpage(key)}
          onClose={onClose}
          onSignOut={handleSignOut}
        />
      ) : (
        <View style={styles.subpageContainer}>
          {/* Subpage Top Bar */}
          <ScreenHeader
            title={getSubpageTitle(currentSubpage)}
            onBack={handleBackToMain}
            rightElement={
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={({ pressed }) => [styles.subpageCloseBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Đóng"
              >
                <X size={20} color={Palette.gray400} strokeWidth={1.75} />
              </Pressable>
            }
          />

          {/* Subpage Body */}
          <View style={styles.subpageBody}>{renderSubpageContent()}</View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bg, // Back in Black #16131F
  },
  subpageContainer: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  subpageCloseBtn: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1,
  },
  btnPressed: {
    opacity: 0.72,
  },
  subpageBody: {
    flex: 1,
  },
});

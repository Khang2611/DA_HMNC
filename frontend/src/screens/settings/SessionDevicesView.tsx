/**
 * SessionDevicesView.tsx — Session & Device Management
 *
 * Review currently active sessions and manage trusted devices.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Smartphone, Monitor, LogOut, ShieldCheck, Info } from 'lucide-react-native';

import { SessionDevice } from '../../types/settings';
import { MOCK_SESSIONS } from '../../data/mockUser';
import { Palette, Typography, Spacing, Radius } from '../../theme/tokens';
import { GlassView } from '../../components/GlassView';
import { ConfirmationBottomSheet } from '../../components/ConfirmationBottomSheet';
import { FeedbackDialog } from '../../components/FeedbackDialog';

export const SessionDevicesView: React.FC = () => {
  const [sessions, setSessions] = useState<SessionDevice[]>(MOCK_SESSIONS);
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    confirmLabel: 'Đăng xuất',
    onConfirm: () => {},
  });

  const [feedbackDialog, setFeedbackDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const handleTerminateSession = (sessionId: string, deviceName: string) => {
    setConfirmDialog({
      visible: true,
      title: 'Đăng xuất thiết bị',
      message: `Bạn có chắc chắn muốn kết thúc phiên đăng nhập trên thiết bị "${deviceName}"?`,
      confirmLabel: 'Đăng xuất',
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, visible: false }));
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setFeedbackDialog({
          visible: true,
          title: 'Thu hồi thành công',
          message: `Đã thu hồi phiên đăng nhập trên thiết bị "${deviceName}".`,
        });
      },
    });
  };

  const handleTerminateAllOther = () => {
    setConfirmDialog({
      visible: true,
      title: 'Đăng xuất tất cả thiết bị khác',
      message: 'Tất cả các phiên đăng nhập khác ngoại trừ thiết bị hiện tại sẽ bị thu hồi ngay lập tức.',
      confirmLabel: 'Đăng xuất tất cả',
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, visible: false }));
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        setFeedbackDialog({
          visible: true,
          title: 'Thu hồi thành công',
          message: 'Đã đăng xuất khỏi tất cả các thiết bị khác.',
        });
      },
    });
  };

  const getDeviceIcon = (type: SessionDevice['deviceType']) => {
    switch (type) {
      case 'web':
        return Monitor;
      case 'ios':
      case 'android':
      default:
        return Smartphone;
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.introCard}>
        <View style={styles.introHeader}>
          <ShieldCheck size={20} color={Palette.incomeGreen} strokeWidth={2} />
          <Text style={styles.introTitle}>Bảo vệ phiên đăng nhập</Text>
        </View>
        <Text style={styles.introText}>
          Danh sách thiết bị đã đăng nhập vào tài khoản của bạn. Nếu phát hiện thiết bị lạ, hãy đăng xuất ngay và đổi mật khẩu tài khoản.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>THIẾT BỊ ĐANG KẾT NỐI ({sessions.length})</Text>
      </View>

      <View style={styles.sessionsList}>
        {sessions.map((device) => {
          const IconComponent = getDeviceIcon(device.deviceType);

          return (
            <View
              key={device.id}
              style={[
                styles.deviceCard,
                device.isCurrent && styles.deviceCardCurrent,
              ]}
            >
              <View style={styles.deviceRow}>
                <View
                  style={[
                    styles.deviceIconWrap,
                    device.isCurrent && styles.deviceIconWrapCurrent,
                  ]}
                >
                  <IconComponent
                    size={20}
                    color={device.isCurrent ? Palette.incomeGreen : Palette.light}
                    strokeWidth={1.75}
                  />
                </View>

                <View style={styles.deviceMeta}>
                  <View style={styles.deviceNameRow}>
                    <Text style={styles.deviceName}>{device.deviceName}</Text>
                    {device.isCurrent ? (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Thiết bị này</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.deviceDetails}>{device.operatingSystem}</Text>
                  <Text style={styles.deviceLocation}>
                    {device.location} • {device.lastActive}
                  </Text>
                  <Text style={styles.deviceIp}>IP: {device.ipAddress}</Text>
                </View>

                {!device.isCurrent ? (
                  <Pressable
                    onPress={() => handleTerminateSession(device.id, device.deviceName)}
                    android_ripple={{ color: 'rgba(255, 69, 58, 0.15)', borderless: true, radius: 20 }}
                    style={({ pressed }) => [styles.logoutBtn, pressed && styles.btnPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Đăng xuất khỏi ${device.deviceName}`}
                  >
                    <LogOut size={16} color={Palette.expenseRed} strokeWidth={1.75} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      {/* ── Terminate All Other Sessions Button ── */}
      {otherSessionsCount > 0 ? (
        <Pressable
          onPress={handleTerminateAllOther}
          style={({ pressed }) => [styles.terminateAllBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Đăng xuất khỏi tất cả các thiết bị khác"
        >
          <LogOut size={16} color={Palette.expenseRed} strokeWidth={1.75} />
          <Text style={styles.terminateAllText}>
            Đăng xuất khỏi {otherSessionsCount} thiết bị khác
          </Text>
        </Pressable>
      ) : null}

      {/* ── Demo Notice ── */}
      <GlassView variant="card" borderRadius={Radius.md} style={styles.noticeCard}>
        <View style={styles.noticeInner}>
          <Info size={16} color={Palette.secondary} strokeWidth={1.75} style={styles.noticeIcon} />
          <Text style={styles.noticeText}>
            Dữ liệu phiên kết nối trên đang được mô phỏng. Khi tích hợp với hệ thống Identity & Session Management thực tế, các yêu cầu đăng xuất từ xa sẽ lập tức vô hiệu hóa JWT refresh token của thiết bị đó.
          </Text>
        </View>
      </GlassView>

      <ConfirmationBottomSheet
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel="Huỷ bỏ"
        variant="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, visible: false }))}
      />

      <FeedbackDialog
        visible={feedbackDialog.visible}
        variant="success"
        title={feedbackDialog.title}
        message={feedbackDialog.message}
        onClose={() => setFeedbackDialog((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
  },
  introCard: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    marginBottom: Spacing.xl,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 6,
  },
  introTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  introText: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.gray300,
    lineHeight: 18,
  },
  sectionHeader: {
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: 0.8,
  },
  sessionsList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  deviceCard: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    padding: Spacing.lg,
  },
  deviceCardCurrent: {
    borderColor: 'rgba(50, 215, 75, 0.3)',
    backgroundColor: 'rgba(30, 24, 38, 0.85)',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(240, 217, 228, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  deviceIconWrapCurrent: {
    backgroundColor: 'rgba(50, 215, 75, 0.12)',
  },
  deviceMeta: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  deviceName: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  currentBadge: {
    backgroundColor: 'rgba(50, 215, 75, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.incomeGreen,
  },
  deviceDetails: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray300,
    marginBottom: 2,
  },
  deviceLocation: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.gray400,
  },
  deviceIp: {
    fontSize: 10,
    color: Palette.gray500,
    marginTop: 2,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  btnPressed: {
    opacity: 0.7,
  },
  terminateAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.25)',
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  terminateAllText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.expenseRed,
  },
  noticeCard: {
    backgroundColor: 'rgba(30, 24, 38, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.15)',
    padding: Spacing.md,
  },
  noticeInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noticeIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray300,
    lineHeight: 17,
  },
});

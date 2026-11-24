/**
 * DateRangePickerModal — Liquid Glass Date Range Picker
 *
 * Clean, zero-dependency calendar & preset picker designed for Mauve Banking.
 * Supports presets (7 days, 30 days, 90 days) and custom date ranges.
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from './GlassView';
import { DatePreset, formatDateDisplay } from '../utils/transactionHistory';

export interface DateRangePickerModalProps {
  visible: boolean;
  initialPreset: DatePreset;
  initialCustomStart?: Date;
  initialCustomEnd?: Date;
  onApply: (preset: DatePreset, start?: Date, end?: Date) => void;
  onClose: () => void;
}

const PRESET_OPTIONS: { id: DatePreset; label: string; desc: string }[] = [
  { id: '7_days',  label: '7 ngày qua',  desc: 'Giao dịch trong 7 ngày gần nhất' },
  { id: '30_days', label: '30 ngày qua', desc: 'Giao dịch trong 30 ngày gần nhất' },
  { id: '90_days', label: '90 ngày qua', desc: 'Giao dịch trong 90 ngày gần nhất' },
  { id: 'custom',  label: 'Tùy chọn',    desc: 'Chọn ngày bắt đầu và kết thúc cụ thể' },
];

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const DateRangePickerModal: React.FC<DateRangePickerModalProps> = ({
  visible,
  initialPreset,
  initialCustomStart,
  initialCustomEnd,
  onApply,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  const [selectedPreset, setSelectedPreset] = useState<DatePreset>(initialPreset);
  const [startDate, setStartDate] = useState<Date>(() => {
    if (initialCustomStart) return initialCustomStart;
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(() => initialCustomEnd || new Date());

  // Currently displayed month in calendar view
  const [viewDate, setViewDate] = useState<Date>(() => new Date(endDate));
  // Mode when clicking calendar days: selecting 'start' or 'end'
  const [selectionTarget, setSelectionTarget] = useState<'start' | 'end'>('start');

  // Generate calendar grid for displayed month
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday is 0, Sunday is 6
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }

    return cells;
  }, [viewDate]);

  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: Date) => {
    setSelectedPreset('custom');
    if (selectionTarget === 'start') {
      if (day.getTime() > endDate.getTime()) {
        setStartDate(day);
        setEndDate(day);
        setSelectionTarget('end');
      } else {
        setStartDate(day);
        setSelectionTarget('end');
      }
    } else {
      if (day.getTime() < startDate.getTime()) {
        setStartDate(day);
        setSelectionTarget('end');
      } else {
        setEndDate(day);
        setSelectionTarget('start');
      }
    }
  };

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const isBetweenDays = (day: Date, start: Date, end: Date) => {
    const time = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    return time > s && time < e;
  };

  const handleApply = () => {
    if (selectedPreset === 'custom') {
      const validStart = startDate.getTime() <= endDate.getTime() ? startDate : endDate;
      const validEnd = startDate.getTime() <= endDate.getTime() ? endDate : startDate;
      onApply('custom', validStart, validEnd);
    } else {
      onApply(selectedPreset);
    }
    onClose();
  };

  const monthYearLabel = `Tháng ${viewDate.getMonth() + 1}, ${viewDate.getFullYear()}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
          <GlassView variant="card" borderRadius={Radius.xxl} luminousBorder style={styles.sheetContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <CalendarIcon size={20} color={Palette.light} strokeWidth={1.75} />
                <Text style={styles.headerTitle}>Thời gian tra cứu</Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Đóng"
              >
                <X size={20} color={Palette.secondary} strokeWidth={1.75} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Presets Grid */}
              <View style={styles.presetsGrid}>
                {PRESET_OPTIONS.map((opt) => {
                  const isActive = selectedPreset === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setSelectedPreset(opt.id)}
                      style={[styles.presetCard, isActive && styles.presetCardActive]}
                      accessibilityRole="button"
                      accessibilityLabel={opt.label}
                    >
                      <View style={styles.presetTextCol}>
                        <Text style={[styles.presetLabel, isActive && styles.presetLabelActive]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.presetDesc} numberOfLines={1}>
                          {opt.desc}
                        </Text>
                      </View>
                      {isActive && (
                        <View style={styles.checkCircle}>
                          <Check size={14} color={Palette.white} strokeWidth={2.5} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Custom Date Range Section */}
              {selectedPreset === 'custom' && (
                <View style={styles.customSection}>
                  <Text style={styles.sectionSubtitle}>Khoảng ngày tùy chỉnh</Text>

                  {/* Start/End date selectors */}
                  <View style={styles.dateRangeBoxRow}>
                    <Pressable
                      onPress={() => setSelectionTarget('start')}
                      style={[
                        styles.dateBox,
                        selectionTarget === 'start' && styles.dateBoxActive,
                      ]}
                    >
                      <Text style={styles.dateBoxLabel}>Từ ngày</Text>
                      <Text style={styles.dateBoxValue}>{formatDateDisplay(startDate)}</Text>
                    </Pressable>

                    <Text style={styles.dateRangeArrow}>→</Text>

                    <Pressable
                      onPress={() => setSelectionTarget('end')}
                      style={[
                        styles.dateBox,
                        selectionTarget === 'end' && styles.dateBoxActive,
                      ]}
                    >
                      <Text style={styles.dateBoxLabel}>Đến ngày</Text>
                      <Text style={styles.dateBoxValue}>{formatDateDisplay(endDate)}</Text>
                    </Pressable>
                  </View>

                  {/* Month navigation */}
                  <View style={styles.monthNav}>
                    <Pressable
                      onPress={handlePrevMonth}
                      hitSlop={8}
                      style={styles.navArrowBtn}
                    >
                      <ChevronLeft size={20} color={Palette.light} strokeWidth={1.75} />
                    </Pressable>
                    <Text style={styles.monthLabel}>{monthYearLabel}</Text>
                    <Pressable
                      onPress={handleNextMonth}
                      hitSlop={8}
                      style={styles.navArrowBtn}
                    >
                      <ChevronRight size={20} color={Palette.light} strokeWidth={1.75} />
                    </Pressable>
                  </View>

                  {/* Weekday headers */}
                  <View style={styles.weekdaysRow}>
                    {WEEKDAYS.map((wd) => (
                      <Text key={wd} style={styles.weekdayText}>
                        {wd}
                      </Text>
                    ))}
                  </View>

                  {/* Calendar Grid */}
                  <View style={styles.calendarGrid}>
                    {calendarDays.map((day, idx) => {
                      if (!day) {
                        return <View key={`empty_${idx}`} style={styles.calendarCell} />;
                      }

                      const isStart = isSameDay(day, startDate);
                      const isEnd = isSameDay(day, endDate);
                      const inRange = isBetweenDays(day, startDate, endDate);
                      const isSelected = isStart || isEnd;

                      return (
                        <Pressable
                          key={day.toISOString()}
                          onPress={() => handleSelectDay(day)}
                          style={[
                            styles.calendarCell,
                            inRange && styles.cellInRange,
                            isStart && styles.cellStart,
                            isEnd && styles.cellEnd,
                          ]}
                        >
                          <View
                            style={[
                              styles.dayCircle,
                              isSelected && styles.dayCircleSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayText,
                                isSelected && styles.dayTextSelected,
                                inRange && styles.dayTextInRange,
                              ]}
                            >
                              {day.getDate()}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Action buttons */}
            <View style={styles.actionsRow}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Hủy"
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </Pressable>

              <Pressable
                onPress={handleApply}
                style={({ pressed }) => [styles.applyBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Áp dụng bộ lọc thời gian"
              >
                <GlassView
                  variant="card"
                  borderRadius={Radius.lg}
                  luminousBorder
                  style={styles.applyBtnInner}
                >
                  <Text style={styles.applyBtnText}>Áp dụng</Text>
                </GlassView>
              </Pressable>
            </View>
          </GlassView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 8, 14, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '90%',
    paddingHorizontal: Spacing.md,
  },
  sheetContent: {
    padding: Spacing.xl,
    backgroundColor: 'rgba(28, 22, 36, 0.96)',
    maxHeight: 650,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
  },
  closeBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(193, 160, 172, 0.10)',
  },
  scroll: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  presetsGrid: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  presetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(40, 33, 50, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
  },
  presetCardActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    borderColor: 'rgba(240, 217, 228, 0.30)',
  },
  presetTextCol: {
    flex: 1,
  },
  presetLabel: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.gray200,
    marginBottom: 2,
  },
  presetLabelActive: {
    color: Palette.white,
  },
  presetDesc: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    backgroundColor: Palette.incomeGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  customSection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(240, 217, 228, 0.08)',
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wider,
  },
  dateRangeBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  dateBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(32, 26, 39, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.1)',
    alignItems: 'center',
  },
  dateBoxActive: {
    borderColor: Palette.light,
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
  },
  dateBoxLabel: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginBottom: 2,
  },
  dateBoxValue: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  dateRangeArrow: {
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.fontSize.body,
    color: Palette.secondary,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  navArrowBtn: {
    padding: Spacing.xs,
  },
  monthLabel: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xs,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  cellInRange: {
    backgroundColor: 'rgba(128, 108, 121, 0.22)',
  },
  cellStart: {
    borderTopLeftRadius: Radius.pill,
    borderBottomLeftRadius: Radius.pill,
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
  },
  cellEnd: {
    borderTopRightRadius: Radius.pill,
    borderBottomRightRadius: Radius.pill,
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSelected: {
    backgroundColor: Palette.light,
  },
  dayText: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.white,
  },
  dayTextSelected: {
    color: Palette.bg,
    fontWeight: Typography.fontWeight.bold,
  },
  dayTextInRange: {
    color: Palette.light,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(240, 217, 228, 0.08)',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.25)',
  },
  cancelBtnText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
  applyBtn: {
    flex: 2,
    height: 48,
  },
  applyBtnInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 108, 121, 0.65)',
  },
  applyBtnText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
  },
  btnPressed: {
    opacity: 0.8,
  },
});

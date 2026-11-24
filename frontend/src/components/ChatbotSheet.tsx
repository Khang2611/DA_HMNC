import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChatMessage } from '../types/banking';
import { INITIAL_CHAT_MESSAGES } from '../data/mockData';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from './GlassView';

interface ChatbotSheetProps {
  onClose?: () => void;
}

/**
 * Native Mauve AI Banking Assistant.
 * Built with Apple-inspired minimalist bubbles, suggested actions, and clean financial cards.
 */
export const ChatbotSheet: React.FC<ChatbotSheetProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend?: string) => {
    const content = textToSend || inputText.trim();
    if (!content) return;

    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `msg_${currentTime.getTime()}`;

    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: content,
      timestamp: formattedTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Subtle natural response simulation
    setTimeout(() => {
      let replyText = 'Tôi đã ghi nhận yêu cầu của quý khách.';
      let card: ChatMessage['financialCard'];

      if (content.toLowerCase().includes('chi tiêu')) {
        replyText = 'Tổng quan tuần này: Quý khách đã chi tiêu 4.383.000 ₫, thấp hơn 18% so với tuần trước.';
        card = {
          type: 'spending_summary',
          title: 'Phân tích chi tiêu tuần',
          detail: 'Mua sắm (45%) • Ẩm thực (32%) • Dịch vụ (23%)',
          amount: 4383000,
        };
      } else if (content.toLowerCase().includes('thẻ') || content.toLowerCase().includes('hạn mức')) {
        replyText = 'Thẻ Infinite Mauve của bạn còn hạn mức khả dụng là 81.550.000 ₫.';
        card = {
          type: 'balance_alert',
          title: 'Hạn mức Thẻ Tín Dụng',
          detail: 'Hạn mức tối đa 100.000.000 ₫ • Đến hạn 05/12',
          amount: 81550000,
        };
      } else if (content.toLowerCase().includes('tiết kiệm')) {
        replyText = 'Gói Tiết kiệm Tích lũy Thịnh vượng đang có lãi suất ưu đãi 6.2%/năm kỳ hạn 12 tháng.';
      }

      const botTime = new Date();
      const botReply: ChatMessage = {
        id: `msg_bot_${botTime.getTime()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: botTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        financialCard: card,
        suggestedActions: [
          'Chuyển tiền nhanh',
          'Sao kê tháng 11',
          'Khóa thẻ khẩn cấp',
        ],
      };

      setMessages((prev) => [...prev, botReply]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Assistant Header */}
      <GlassView variant="card" borderRadius={0} style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>✦</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Trợ lý Mauve AI</Text>
            <Text style={styles.headerSubtitle}>Trực tuyến • Bảo mật cấp ngân hàng</Text>
          </View>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        )}
      </GlassView>

      {/* Message Stream */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isUser = item.sender === 'user';
          return (
            <View
              style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowBot,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isUser ? styles.bubbleUser : styles.bubbleBot,
                ]}
              >
                <Text style={[styles.messageText, isUser ? styles.textUser : styles.textBot]}>
                  {item.text}
                </Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>

              {/* Financial Card Preview if present */}
              {item.financialCard && (
                <GlassView variant="dark" borderRadius={Radius.md} style={styles.financialCard}>
                  <Text style={styles.cardHeader}>{item.financialCard.title}</Text>
                  <Text style={styles.cardDetail}>{item.financialCard.detail}</Text>
                </GlassView>
              )}

              {/* Suggested Actions Capsules */}
              {item.suggestedActions && (
                <View style={styles.suggestionsContainer}>
                  {item.suggestedActions.map((action, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleSend(action)}
                      style={styles.suggestionCapsule}
                    >
                      <Text style={styles.suggestionText}>{action}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>Mauve AI đang phản hồi...</Text>
            </View>
          ) : undefined
        }
      />

      {/* Input Bar */}
      <GlassView variant="dark" borderRadius={0} style={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Hỏi trợ lý tài chính Mauve AI..."
          placeholderTextColor={Palette.secondary}
          style={styles.textInput}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          onPress={() => handleSend()}
          style={styles.sendButton}
          activeOpacity={0.8}
        >
          <Text style={styles.sendButtonText}>↑</Text>
        </TouchableOpacity>
      </GlassView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(193, 160, 172, 0.2)',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: Palette.white,
    fontSize: 18,
  },
  headerTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  closeText: {
    color: Palette.secondary,
    fontSize: 18,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  messageRow: {
    marginVertical: Spacing.xs,
  },
  messageRowUser: {
    alignItems: 'flex-end',
  },
  messageRowBot: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  bubbleUser: {
    backgroundColor: Palette.primary,
    borderBottomRightRadius: Radius.xs,
  },
  bubbleBot: {
    backgroundColor: '#26202D',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.2)',
    borderBottomLeftRadius: Radius.xs,
  },
  messageText: {
    fontSize: Typography.fontSize.subheadline,
    lineHeight: Typography.lineHeight.subheadline,
  },
  textUser: {
    color: Palette.white,
  },
  textBot: {
    color: Palette.gray100,
  },
  timestamp: {
    fontSize: Typography.fontSize.caption2,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  financialCard: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.3)',
    width: '82%',
  },
  cardHeader: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  cardDetail: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.light,
    marginTop: 2,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  suggestionCapsule: {
    backgroundColor: 'rgba(74, 63, 75, 0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.2)',
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  suggestionText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.light,
  },
  typingIndicator: {
    padding: Spacing.sm,
  },
  typingText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(193, 160, 172, 0.15)',
    backgroundColor: '#1E1825',
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#292131',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    color: Palette.white,
    fontSize: Typography.fontSize.subheadline,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.2)',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  sendButtonText: {
    color: Palette.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
});

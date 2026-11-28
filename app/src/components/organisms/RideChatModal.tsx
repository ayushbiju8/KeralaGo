/**
 * Organism: RideChatModal
 *
 * In-app interactive chat modal for real-time messaging between passenger and driver.
 * Follows KeralaGo Atomic Design architecture and theme tokens.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Icon, Avatar } from '../atoms';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';
import { apiGet, apiPost } from '../../services/apiClient';
import telemetrySocket from '../../services/telemetrySocket';

export interface ChatMessage {
  id: string;
  senderId?: string;
  senderName: string;
  isDriver: boolean;
  message: string;
  timestamp: string;
}

export interface RideChatModalProps {
  visible: boolean;
  rideId: string;
  recipientName: string;
  recipientRole?: 'driver' | 'passenger';
  recipientAvatar?: string;
  currentUserId?: string;
  isCurrentUserDriver?: boolean;
  onClose: () => void;
}

const QUICK_CHIPS = [
  "I'm at the pickup point",
  "Coming in 2 mins",
  "Please turn on AC",
  "Where are you now?",
];

export const RideChatModal: React.FC<RideChatModalProps> = ({
  visible,
  rideId,
  recipientName,
  recipientRole = 'driver',
  recipientAvatar,
  currentUserId,
  isCurrentUserDriver = false,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load chat history & subscribe to WebSocket
  useEffect(() => {
    if (!visible || !rideId) return;

    let isMounted = true;
    setIsLoading(true);

    apiGet<ChatMessage[]>(`/rides/${rideId}/messages/`, []).then((res) => {
      if (isMounted) {
        setMessages(res.data || []);
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    const unsubscribe = telemetrySocket.onRideChatMessage((payload) => {
      if (payload.rideId === rideId && payload.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [visible, rideId]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || !rideId) return;

    setInputText('');
    setIsSending(true);

    const tempId = `msg_temp_${Date.now()}`;
    const localMsg: ChatMessage = {
      id: tempId,
      senderId: currentUserId,
      senderName: isCurrentUserDriver ? 'Driver' : 'Passenger',
      isDriver: isCurrentUserDriver,
      message: content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, localMsg]);

    // Send via WebSocket and REST API
    telemetrySocket.sendRideChatMessage(rideId, localMsg);

    try {
      await apiPost(`/rides/${rideId}/messages/`, { message: content });
    } catch (e) {
      console.warn('Chat dispatch note:', e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Icon library="Ionicons" name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
              {recipientName}
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary}>
              {recipientRole === 'driver' ? 'Driver Partner' : 'Passenger'} • Live Trip Chat
            </Typography>
          </View>

          <View style={styles.avatarWrap}>
            <Avatar size="sm" src={recipientAvatar} name={recipientName} />
          </View>
        </View>

        {/* Message Thread */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.threadContainer}
          keyboardVerticalOffset={20}
        >
          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.centerBox}>
              <Icon library="Ionicons" name="chatbubble-ellipses-outline" size={42} color={Colors.textMuted} />
              <Typography variant="body2" color={Colors.textMuted} style={{ marginTop: 8 }}>
                No messages yet. Send a quick update!
              </Typography>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollList}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((item) => {
                const isMine = isCurrentUserDriver ? item.isDriver : !item.isDriver;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.msgBubbleWrap,
                      isMine ? styles.msgRight : styles.msgLeft,
                    ]}
                  >
                    <View
                      style={[
                        styles.msgBubble,
                        isMine ? styles.msgBubbleMine : styles.msgBubblePeer,
                      ]}
                    >
                      <Typography
                        variant="body2"
                        color={isMine ? Colors.white : Colors.textPrimary}
                        style={{ lineHeight: 18 }}
                      >
                        {item.message}
                      </Typography>
                    </View>
                    <Typography variant="xs" color={Colors.textMuted} style={styles.timestampText}>
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Quick Reply Chips */}
          <View style={styles.chipsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
              {QUICK_CHIPS.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chipPill}
                  activeOpacity={0.75}
                  onPress={() => handleSendMessage(chip)}
                >
                  <Typography variant="caption" weight="medium" color={Colors.primary}>
                    {chip}
                  </Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Type message to driver..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() ? styles.sendBtnDisabled : null]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim()}
              activeOpacity={0.8}
            >
              <Icon library="Ionicons" name="send" size={17} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  avatarWrap: {
    marginLeft: 8,
  },
  threadContainer: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  msgBubbleWrap: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  msgRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  msgLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  msgBubble: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  msgBubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  msgBubblePeer: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timestampText: {
    fontSize: 10,
    marginTop: 3,
    paddingHorizontal: 4,
  },
  chipsRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: Colors.white,
    paddingVertical: 8,
  },
  chipsContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  chipPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F1F5F9',
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
});

export default RideChatModal;

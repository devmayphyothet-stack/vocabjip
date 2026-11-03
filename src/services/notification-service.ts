import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  REMINDER_ENABLED: '@vocabjip:daily_reminder_enabled',
  REMINDER_TIME: '@vocabjip:daily_reminder_time', // "20:00"
  NOTIFICATION_ID: '@vocabjip:daily_notification_id',
};

// Configure foreground presentation
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const NotificationService = {
  /**
   * Request permission for notifications
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (window.Notification.permission === 'granted') return true;
          if (window.Notification.permission !== 'denied') {
            await window.Notification.requestPermission();
          }
        }
      } catch (_) {}
      return true;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily-streak', {
          name: 'Daily Study Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563EB',
        });
      }

      return true;
    } catch (e) {
      console.warn('Error requesting notification permissions:', e);
      return false;
    }
  },

  /**
   * Schedule or update the daily streak study reminder
   * @param hour Hour of day (0-23), default 20 (8:00 PM)
   * @param minute Minute of hour (0-59), default 0
   */
  async scheduleDailyReminder(hour = 20, minute = 0): Promise<boolean> {
    if (Platform.OS === 'web') {
      try {
        await this.requestPermissions();
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.REMINDER_ENABLED, 'true'),
          AsyncStorage.setItem(STORAGE_KEYS.REMINDER_TIME, `${hour}:${minute}`),
        ]);
        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          window.Notification.permission === 'granted'
        ) {
          try {
            new window.Notification('🔥 VocabJip Study Reminder Enabled', {
              body: 'နေ့စဉ် ည ၈:၀၀ နာရီတိုင်း TOPIK လေ့ကျင့်ရန် သတိပေးချက် ဖွင့်ထားပြီးပါပြီ။',
            });
          } catch (_) {}
        }
        return true;
      } catch (e) {
        console.warn('Error saving web reminder:', e);
        return false;
      }
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      // Cancel previous scheduled notification if any
      await this.cancelDailyReminder();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 VocabJip TOPIK Streak Reminder',
          body: 'ဒီနေ့အတွက် နေ့စဉ် TOPIK II စကားလုံး လေ့ကျင့်ဖို့ မမေ့နဲ့နော်! Streak ကို ဆက်လက် ထိန်းသိမ်းပါ။',
          data: { screen: 'learn' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          channelId: 'daily-streak',
          hour,
          minute,
        },
      });

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.REMINDER_ENABLED, 'true'),
        AsyncStorage.setItem(STORAGE_KEYS.REMINDER_TIME, `${hour}:${minute}`),
        AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_ID, notificationId),
      ]);

      return true;
    } catch (e) {
      console.warn('Error scheduling daily reminder:', e);
      return false;
    }
  },

  /**
   * Cancel the daily study reminder
   */
  async cancelDailyReminder(): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.REMINDER_ENABLED, 'false');
        await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATION_ID);
      } catch (e) {
        console.warn('Error cancelling web reminder:', e);
      }
      return;
    }

    try {
      const storedId = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_ID);
      if (storedId) {
        await Notifications.cancelScheduledNotificationAsync(storedId);
      }
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDER_ENABLED, 'false');
      await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATION_ID);
    } catch (e) {
      console.warn('Error cancelling reminder:', e);
    }
  },

  /**
   * Check if the daily reminder is currently active
   */
  async isReminderEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.REMINDER_ENABLED);
      return enabled === 'true';
    } catch (_) {
      return false;
    }
  },
};


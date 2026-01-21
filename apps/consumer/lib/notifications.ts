import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      // Permission refused
      return;
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      })).data;
    } catch (error) {
      console.log('Error fetching push token:', error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Register push token with the backend for surge notifications
 */
export async function registerPushTokenWithBackend(token: string): Promise<boolean> {
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';

    const { error } = await supabase.functions.invoke('register-push-token', {
      body: {
        expo_push_token: token,
        platform,
      },
    });

    if (error) {
      console.error('Failed to register push token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}

/**
 * Full push notification registration flow
 * Requests permissions, gets token, and registers with backend
 */
export async function setupPushNotifications(): Promise<string | undefined> {
  const token = await registerForPushNotificationsAsync();

  if (token) {
    await registerPushTokenWithBackend(token);
  }

  return token;
}

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      setIsSubscribed(!!sub);
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Push notifications enabled');
        return true;
      } else {
        toast.error('Push notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  };

  const subscribe = async (): Promise<PushSubscription | null> => {
    if (!isSupported) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // You would replace this with your actual VAPID public key
      const vapidPublicKey = 'your-vapid-public-key';
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      setSubscription(sub);
      setIsSubscribed(true);
      
      // Send subscription to your server
      await sendSubscriptionToServer(sub);
      
      toast.success('Successfully subscribed to push notifications');
      return sub;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Failed to subscribe to push notifications');
      return null;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription) return false;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      setIsSubscribed(false);
      
      // Remove subscription from your server
      await removeSubscriptionFromServer(subscription);
      
      toast.success('Unsubscribed from push notifications');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error('Failed to unsubscribe from push notifications');
      return false;
    }
  };

  const sendNotification = async (options: PushNotificationOptions) => {
    if (!isSupported || Notification.permission !== 'granted') {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/pwa-192x192.png',
        badge: options.badge || '/pwa-192x192.png',
        tag: options.tag,
        data: options.data,
        vibrate: [200, 100, 200],
        actions: [
          {
            action: 'view',
            title: 'View',
            icon: '/pwa-192x192.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/pwa-192x192.png'
          }
        ]
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    // In a real app, you would send this to your backend
    console.log('Sending subscription to server:', subscription);
    
    try {
      // Example API call
      // await fetch('/api/push-subscriptions', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(subscription),
      // });
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  };

  const removeSubscriptionFromServer = async (subscription: PushSubscription) => {
    // In a real app, you would remove this from your backend
    console.log('Removing subscription from server:', subscription);
    
    try {
      // Example API call
      // await fetch('/api/push-subscriptions', {
      //   method: 'DELETE',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ endpoint: subscription.endpoint }),
      // });
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    sendNotification,
  };
};
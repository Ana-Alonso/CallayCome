import { LocalNotifications } from '@capacitor/local-notifications';

export class NotificationService {
  private static is_capacitor(): boolean {
    return (window as any).Capacitor !== undefined;
  }

  public static async request_permission(): Promise<boolean> {
    try {
      if (this.is_capacitor()) {
        const permission_status = await LocalNotifications.requestPermissions();
        return permission_status.display === 'granted';
      } else if ('Notification' in window) {
        const permission_status = await Notification.requestPermission();
        return permission_status === 'granted';
      }
    } catch (error) {
      console.warn(error);
    }
    return false;
  }

  public static async check_permission(): Promise<boolean> {
    try {
      if (this.is_capacitor()) {
        const permission_status = await LocalNotifications.checkPermissions();
        return permission_status.display === 'granted';
      } else if ('Notification' in window) {
        return Notification.permission === 'granted';
      }
    } catch (error) {
      console.warn(error);
    }
    return false;
  }

  public static async send_notification(notification_title: string, notification_body: string): Promise<void> {
    console.log(notification_title, notification_body);
    
    const notification_event = new CustomEvent('in-app-notification', {
      detail: { title: notification_title, body: notification_body }
    });
    window.dispatchEvent(notification_event);

    try {
      const is_granted = await this.check_permission();
      if (!is_granted) {
        const requested = await this.request_permission();
        if (!requested) {
          return;
        }
      }

      if (this.is_capacitor()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: notification_title,
              body: notification_body,
              id: Math.floor(Math.random() * 100000),
              sound: undefined,
              attachments: [],
              actionTypeId: '',
              extra: null
            }
          ]
        });
      } else if ('Notification' in window) {
        new Notification(notification_title, {
          body: notification_body,
          icon: '/favicon.svg'
        });
      }
    } catch (error) {
      console.warn(error);
    }
  }
}

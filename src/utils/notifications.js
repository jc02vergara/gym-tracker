import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

async function createChannel() {
    if (Capacitor.isNativePlatform()) {
        await LocalNotifications.createChannel({
            id: 'gym_timer',
            name: 'Temporizador Gym',
            description: 'Notificaciones del temporizador de descanso',
            importance: 5, // High importance
            visibility: 1,
            sound: 'default',
            vibration: true
        });
    }
}

export async function requestNotificationPermission() {
    if (Capacitor.isNativePlatform()) {
        const result = await LocalNotifications.requestPermissions();
        if (result.display === 'granted') {
            await createChannel();
            return true;
        }
        return false;
    } else {
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification');
            return false;
        }
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
}

export async function scheduleNotification(title, body, id = 1, delaySeconds = 1) {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    if (Capacitor.isNativePlatform()) {
        // Cancel any existing notification with this ID first
        await LocalNotifications.cancel({ notifications: [{ id }] });

        await LocalNotifications.schedule({
            notifications: [
                {
                    title,
                    body,
                    id,
                    schedule: { at: new Date(Date.now() + delaySeconds * 1000), allowWhileIdle: true },
                    sound: 'default',
                    channelId: 'gym_timer',
                    smallIcon: 'ic_launcher',
                    actionTypeId: "",
                    extra: null
                }
            ]
        });
    } else {
        // Web fallback
        setTimeout(() => {
            new Notification(title, { body });
        }, delaySeconds * 1000);
    }
}

export async function cancelNotification(id = 1) {
    if (Capacitor.isNativePlatform()) {
        await LocalNotifications.cancel({ notifications: [{ id }] });
    }
    // Web notifications can't really be "cancelled" if scheduled via setTimeout easily without storing the timer ID, 
    // but for this use case, the main issue is Android background execution.
}

const pendingTimers = new Map();

export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return false;
    }
    if (Notification.permission === 'granted') return true;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

export async function scheduleNotification(title, body, id = 1, delaySeconds = 1) {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    // Cancel any existing notification with this ID first
    cancelNotification(id);

    const timer = setTimeout(() => {
        pendingTimers.delete(id);
        new Notification(title, { body });
    }, delaySeconds * 1000);
    pendingTimers.set(id, timer);
}

export async function cancelNotification(id = 1) {
    const timer = pendingTimers.get(id);
    if (timer) {
        clearTimeout(timer);
        pendingTimers.delete(id);
    }
}

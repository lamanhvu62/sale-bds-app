import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useToast } from './Toast';

export default function PushNotificationManager() {
    const [permission, setPermission] = useState(Notification.permission);
    const toast = useToast();

    useEffect(() => {
        if (permission === 'granted') {
            registerAndSubscribe();
        }
    }, [permission]);

    const requestPermission = async () => {
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === 'granted') {
                toast.success('Đã bật thông báo nhắc lịch hẹn!');
                await registerAndSubscribe();
            } else {
                toast.warning('Bạn sẽ không nhận được nhắc nhở lịch hẹn');
            }
        } catch (error) {
            console.error('Lỗi xin quyền:', error);
            toast.error('Không thể yêu cầu quyền thông báo');
        }
    };

    const registerAndSubscribe = async () => {
        if (!('serviceWorker' in navigator)) {
            console.warn('Trình duyệt không hỗ trợ Service Worker');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('SW registered');

            // Lấy VAPID public key từ biến môi trường
            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) {
                console.error('Thiếu VAPID public key');
                return;
            }

            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                });
            }

            // Lưu subscription vào Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    subscription: subscription,
                }, { onConflict: 'user_id' });

            if (error) {
                console.error('Lỗi lưu subscription:', error);
            } else {
                console.log('Subscription saved');
            }
        } catch (error) {
            console.error('Lỗi đăng ký push:', error);
        }
    };

    return null; // Component này không render giao diện
}

// Helper: chuyển base64 string thành Uint8Array cho applicationServerKey
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
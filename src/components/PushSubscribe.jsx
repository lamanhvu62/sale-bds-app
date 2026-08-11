import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useToast } from './Toast';

export default function PushSubscribe() {
    const toast = useToast();
    const [subscribed, setSubscribed] = useState(false);

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
    };

    const subscribe = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast.warning('Bạn đã từ chối nhận thông báo');
                return;
            }
            const reg = await navigator.serviceWorker.getRegistration();
            if (!reg) {
                toast.error('Không tìm thấy Service Worker');
                return;
            }
            const vapidPublicKey = import.meta.env.VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) {
                toast.error('Thiếu VAPID public key');
                return;
            }
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
            // Lưu lên Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Bạn chưa đăng nhập');
                return;
            }
            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({ user_id: user.id, subscription: subscription }, { onConflict: 'user_id' });
            if (error) {
                console.error('Lỗi lưu subscription:', error);
                toast.error('Lỗi lưu đăng ký thông báo');
            } else {
                toast.success('Đã bật thông báo nhắc lịch hẹn!');
                setSubscribed(true);
            }
        } catch (err) {
            console.error(err);
            toast.error('Có lỗi xảy ra');
        }
    };

    // Helper chuyển Base64 sang Uint8Array
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Hiển thị nút nếu chưa đăng ký
    if (subscribed) return null;

    return (
        <button
            onClick={subscribe}
            className="fixed bottom-24 right-4 z-30 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium hover:bg-emerald-700"
        >
            🔔 Bật thông báo
        </button>
    );
}
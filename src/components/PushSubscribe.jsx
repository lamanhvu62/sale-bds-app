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
        try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (!reg) return;
            const sub = await reg.pushManager.getSubscription();
            setSubscribed(!!sub);
        } catch (err) {
            console.log('Kiểm tra subscription:', err);
        }
    };

    const subscribe = async () => {
        try {
            // 1. Xin quyền
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast.warning('Bạn đã từ chối nhận thông báo');
                return;
            }

            // 2. Đợi Service Worker sẵn sàng
            const reg = await navigator.serviceWorker.ready;
            if (!reg) {
                toast.error('Service Worker chưa sẵn sàng, thử lại sau');
                return;
            }

            // 3. Lấy public key từ biến môi trường
            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            console.log('🔑 VAPID public key:', vapidPublicKey); // Log kiểm tra

            if (!vapidPublicKey) {
                toast.error('Thiếu VAPID public key (kiểm tra file .env)');
                return;
            }

            // 4. Chuyển đổi key (dễ lỗi nếu key sai định dạng)
            let convertedKey;
            try {
                convertedKey = urlBase64ToUint8Array(vapidPublicKey);
            } catch (e) {
                console.error('Lỗi chuyển đổi VAPID key:', e);
                toast.error('VAPID key không đúng định dạng');
                return;
            }

            // 5. Tạo subscription
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey,
            });

            console.log('📨 Subscription:', subscription);

            // 6. Lưu vào Supabase
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
                toast.error('Lỗi lưu đăng ký: ' + error.message);
            } else {
                toast.success('Đã bật thông báo nhắc lịch hẹn!');
                setSubscribed(true);
            }
        } catch (err) {
            console.error('❌ Lỗi subscribe:', err);
            toast.error('Có lỗi: ' + (err.message || 'Không xác định'));
        }
    };

    // Helper chuyển đổi Base64 URL-safe thành Uint8Array
    function urlBase64ToUint8Array(base64String) {
        // Thêm padding nếu thiếu
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
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

    if (subscribed) return null; // Đã đăng ký thì không hiện nút nữa

    return (
        <button
            onClick={subscribe}
            className="fixed bottom-24 right-4 z-30 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium hover:bg-emerald-700"
        >
            🔔 Bật thông báo
        </button>
    );
}
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useToast } from './Toast';

export default function PushSubscribe() {
    const toast = useToast();
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (!reg) return;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                // Đã có subscription trong trình duyệt
                // Kiểm tra xem trong DB đã lưu chưa (tùy chọn, nhưng nên làm)
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase
                        .from('push_subscriptions')
                        .select('id')
                        .eq('user_id', user.id)
                        .maybeSingle();
                    if (data) {
                        setSubscribed(true);
                    } else {
                        // Có sub trong trình duyệt nhưng chưa có trong DB -> cần lưu lại
                        setSubscribed(false);
                    }
                }
            } else {
                setSubscribed(false);
            }
        } catch (err) {
            console.log('Kiểm tra subscription:', err);
        }
    };

    const subscribe = async () => {
        setLoading(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast.warning('Bạn đã từ chối nhận thông báo');
                setLoading(false);
                return;
            }

            const reg = await navigator.serviceWorker.ready;
            if (!reg) {
                toast.error('Service Worker chưa sẵn sàng');
                setLoading(false);
                return;
            }

            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            console.log('🔑 VAPID key:', vapidPublicKey);
            if (!vapidPublicKey) {
                toast.error('Thiếu VAPID key trong .env');
                setLoading(false);
                return;
            }

            // Tạo subscription
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            console.log('📨 Subscription object:', subscription);

            // Lưu vào Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Bạn chưa đăng nhập');
                setLoading(false);
                return;
            }

            // Thử insert
            const { error: insertError } = await supabase
                .from('push_subscriptions')
                .upsert({ user_id: user.id, subscription: subscription }, { onConflict: 'user_id' });

            if (insertError) {
                console.error('Lỗi lưu subscription:', insertError);
                toast.error('Lỗi lưu đăng ký: ' + insertError.message);
            } else {
                toast.success('Đã bật thông báo nhắc lịch hẹn!');
                setSubscribed(true);
            }
        } catch (err) {
            console.error('Lỗi subscribe:', err);
            toast.error('Có lỗi: ' + (err.message || 'Không xác định'));
        } finally {
            setLoading(false);
        }
    };

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Luôn hiển thị nút nếu chưa subscribed, bất kể lỗi trước đó
    if (subscribed) return null;

    return (
        <button
            onClick={subscribe}
            disabled={loading}
            className="fixed bottom-24 right-4 z-30 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
            {loading ? 'Đang đăng ký...' : '🔔 Bật thông báo'}
        </button>
    );
}
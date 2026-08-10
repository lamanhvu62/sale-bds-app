import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const vapidKeys = {
    publicKey: Deno.env.get("VAPID_PUBLIC_KEY")!,
    privateKey: Deno.env.get("VAPID_PRIVATE_KEY")!,
    subject: "mailto:you@example.com",
};

webpush.setVapidDetails(vapidKeys.subject, vapidKeys.publicKey, vapidKeys.privateKey);

serve(async (req) => {
    try {
        // Khởi tạo Supabase client với service_role để có quyền đọc tất cả user
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        // Lấy các lịch hẹn sắp tới (trong 30 phút) chưa gửi nhắc
        const now = new Date();
        const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

        const { data: upcomingAppointments, error: appointmentError } = await supabaseAdmin
            .from("lich_hen")
            .select("id, user_id, tieu_de, thoi_gian, khach_hang(ten)")
            .gte("thoi_gian", now.toISOString())
            .lte("thoi_gian", thirtyMinutesLater.toISOString())
            .eq("da_hoan_thanh", false);

        if (appointmentError) throw appointmentError;

        for (const appointment of upcomingAppointments || []) {
            // Kiểm tra đã gửi chưa
            const { data: alreadySent } = await supabaseAdmin
                .from("notification_log")
                .select("id")
                .eq("lich_hen_id", appointment.id)
                .maybeSingle();

            if (alreadySent) continue;

            // Lấy subscription của user
            const { data: subscriptionData } = await supabaseAdmin
                .from("push_subscriptions")
                .select("subscription")
                .eq("user_id", appointment.user_id)
                .maybeSingle();

            if (!subscriptionData?.subscription) continue;

            // Gửi push
            const customerName = appointment.khach_hang?.ten || "Khách hàng";
            const time = new Date(appointment.thoi_gian).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            });

            const payload = JSON.stringify({
                title: "🔔 Nhắc lịch hẹn",
                body: `${customerName} - ${appointment.tieu_de} lúc ${time}`,
                url: "/lich-hen",
            });

            try {
                await webpush.sendNotification(
                    subscriptionData.subscription,
                    payload,
                );
                // Ghi log
                await supabaseAdmin.from("notification_log").insert({
                    user_id: appointment.user_id,
                    lich_hen_id: appointment.id,
                });
            } catch (err) {
                console.error(`Gửi push thất bại cho user ${appointment.user_id}:`, err);
                // Nếu subscription không hợp lệ (410 Gone), xóa nó
                if (err.statusCode === 410) {
                    await supabaseAdmin
                        .from("push_subscriptions")
                        .delete()
                        .eq("user_id", appointment.user_id);
                }
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
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
    // Tạo Supabase client với service role (bỏ qua RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

    // Lấy lịch hẹn sắp tới chưa hoàn thành
    const { data: appointments } = await supabaseAdmin
      .from("lich_hen")
      .select("id, user_id, tieu_de, thoi_gian, khach_hang(ten)")
      .gte("thoi_gian", now.toISOString())
      .lte("thoi_gian", thirtyMinutesLater.toISOString())
      .eq("da_hoan_thanh", false);

    if (!appointments) {
      return new Response(JSON.stringify({ message: "No appointments" }), { status: 200 });
    }

    for (const appt of appointments) {
      // Kiểm tra đã gửi chưa
      const { data: alreadySent } = await supabaseAdmin
        .from("notification_log")
        .select("id")
        .eq("lich_hen_id", appt.id)
        .maybeSingle();

      if (alreadySent) continue;

      // Lấy subscription của user
      const { data: subData } = await supabaseAdmin
        .from("push_subscriptions")
        .select("subscription")
        .eq("user_id", appt.user_id)
        .maybeSingle();

      if (!subData?.subscription) continue;

      const customerName = appt.khach_hang?.ten || "Khách hàng";
      const time = new Date(appt.thoi_gian).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const payload = JSON.stringify({
        title: "🔔 Nhắc lịch hẹn",
        body: `${customerName} - ${appt.tieu_de} lúc ${time}`,
        url: "/lich-hen",
      });

      try {
        await webpush.sendNotification(subData.subscription, payload);
        // Ghi log
        await supabaseAdmin.from("notification_log").insert({
          user_id: appt.user_id,
          lich_hen_id: appt.id,
        });
      } catch (err) {
        console.error("Push failed:", err);
        // Nếu lỗi 410 (subscription hết hạn) thì xóa khỏi DB
        if (err.statusCode === 410) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("user_id", appt.user_id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
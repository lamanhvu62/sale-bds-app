# Kế hoạch phát triển SaleBDS

> Cập nhật: 09/08/2026

---

## ✅ Đã hoàn thành (MVP)

- [x] **Xác thực người dùng**: Đăng nhập qua Google OAuth (Supabase Auth)
- [x] **Quản lý khách hàng (CRM)**:
  - Thêm/sửa/xóa khách hàng
  - Form thêm nhanh chỉ với Tên + SĐT
  - Import hàng loạt từ Excel/CSV
  - Parse text tự động (AI tách thông tin từ đoạn chat)
  - Phân loại theo trạng thái (tiềm năng, đang chăm, sắp chốt, đã mua)
  - Tìm kiếm & lọc
- [x] **Quản lý dự án (Kho BĐS)**:
  - Thêm/sửa/xóa dự án
  - Upload ảnh dự án (Supabase Storage)
  - Carousel xem ảnh
  - Phân loại theo loại hình & tiến độ
  - Copy thông tin nhanh
- [x] **Lịch hẹn (Calendar)**:
  - Calendar view theo tháng
  - Thêm/sửa/xóa lịch hẹn
  - Liên kết khách hàng & dự án
  - Đánh dấu hoàn thành
- [x] **Tính toán (Calculator)**:
  - Tính tổng giá căn hộ (gốc + VAT + phí bảo trì - chiết khấu)
  - Tính vay ngân hàng (dư nợ giảm dần / trả đều)
  - Xem lịch trả nợ 12 tháng đầu
- [x] **Dashboard**:
  - Thống kê tổng quan (số khách, cần follow-up, dự án đang bán, lịch hẹn hôm nay)
  - Menu điều hướng nhanh
  - Nút thêm nhanh khách hàng/dự án

---

## 🟢 Giai đoạn 1: Trải nghiệm người dùng (UX/UI) — Ưu tiên cao

### 1. Toast Notification
- **Mô tả**: Thay thế toàn bộ `alert()` bằng toast message trượt từ trên xuống.
- **Chi tiết**: Toast có 4 loại (success, error, warning, info), tự động biến mất sau 3 giây, có icon tương ứng.
- **Lợi ích**: Trải nghiệm mượt mà, chuyên nghiệp hơn.
- **Thời gian dự kiến**: 15 phút

### 2. Confirm Dialog đẹp
- **Mô tả**: Thay thế `window.confirm()` bằng modal xác nhận có icon và style đồng nhất.
- **Chi tiết**: Modal có icon ⚠️, tiêu đề, nội dung, nút Xác nhận (đỏ) và Hủy (xám).
- **Lợi ích**: Đồng nhất UI, tăng độ tin cậy.
- **Thời gian dự kiến**: 10 phút

### 3. Loading Skeleton
- **Mô tả**: Khi load danh sách, hiển thị khung xám nhấp nháy thay vì spinner.
- **Chi tiết**: Skeleton cho danh sách khách hàng, dự án, lịch hẹn.
- **Lợi ích**: Giảm cảm giác chờ đợi, chuyên nghiệp.
- **Thời gian dự kiến**: 20 phút

### 4. Auth Splash Screen
- **Mô tả**: Khi mở app, kiểm tra session → hiển thị màn hình splash với logo.
- **Chi tiết**: Logo SaleBDS + "Đang tải..." khi đang check auth.
- **Lợi ích**: Tránh giật màn hình, bảo mật hơn.
- **Thời gian dự kiến**: 10 phút

### 5. Empty State đẹp
- **Mô tả**: Khi không có dữ liệu, hiển thị hình minh họa + hướng dẫn.
- **Chi tiết**: Icon lớn, text "Chưa có X nào", nút "Thêm X đầu tiên".
- **Lợi ích**: Dẫn dắt người dùng mới.
- **Thời gian dự kiến**: 10 phút

---

## 🟡 Giai đoạn 2: Tự động hóa & Năng suất — Ưu tiên trung bình

### 6. Nhắc nhở lịch hẹn (Push/Email)
- **Mô tả**: Tự động gửi nhắc nhở trước 30 phút / 1 ngày.
- **Công nghệ**: Supabase Edge Functions + Web Push API hoặc Email.
- **Lợi ích**: Sale không bỏ lỡ cuộc hẹn nào.
- **Thời gian dự kiến**: 2-3 giờ

### 7. Auto Follow-up
- **Mô tả**: Sau X ngày không liên hệ, tự động đưa vào danh sách "Cần gọi lại".
- **Chi tiết**: Cấu hình số ngày, hiển thị badge trên Dashboard.
- **Lợi ích**: Tăng tỷ lệ chốt sale, không bỏ quên khách.
- **Thời gian dự kiến**: 1-2 giờ

### 8. Mẫu tin nhắn nhanh
- **Mô tả**: Chọn khách hàng → chọn mẫu tin → copy hoặc mở Zalo/Facebook.
- **Chi tiết**: Các mẫu: giới thiệu dự án, báo giá, chúc mừng sinh nhật, follow-up...
- **Lợi ích**: Tiết kiệm thời gian soạn tin, chuyên nghiệp.
- **Thời gian dự kiến**: 1-2 giờ

### 9. Xuất báo cáo PDF/Excel
- **Mô tả**: Xuất danh sách khách hàng, dự án, lịch hẹn ra file.
- **Công nghệ**: `jspdf` + `xlsx` (hoặc dùng thư viện).
- **Lợi ích**: Gửi báo cáo cho sếp/đối tác.
- **Thời gian dự kiến**: 2-3 giờ

### 10. Gắn tag tự động
- **Mô tả**: Dựa vào nhu cầu + ngân sách → tự động gắn tag "Khách VIP", "Đầu tư"...
- **Chi tiết**: Rule-based: nếu ngân sách > 5 tỷ → tag VIP.
- **Lợi ích**: Phân loại khách nhanh hơn.
- **Thời gian dự kiến**: 1 giờ

---

## 🔵 Giai đoạn 3: Chuyên nghiệp hóa — Ưu tiên thấp

### 11. PWA hoàn chỉnh
- **Mô tả**: Cấu hình service worker, cache offline, push notification, cài lên mobile.
- **Công nghệ**: `vite-plugin-pwa`.
- **Lợi ích**: Dùng offline, có icon trên màn hình chính điện thoại.
- **Thời gian dự kiến**: 2-3 giờ

### 12. Quản lý nhóm (Team)
- **Mô tả**: Phân quyền Admin, Manager, Sale.
- **Chi tiết**: Manager xem được data của cả team. Mời thành viên qua email.
- **Lợi ích**: Phù hợp công ty BĐS nhiều sale.
- **Thời gian dự kiến**: 4-6 giờ

### 13. Dashboard nâng cao (Biểu đồ)
- **Mô tả**: Biểu đồ cột/tròn: tỷ lệ chốt, nguồn khách hàng, top dự án quan tâm.
- **Công nghệ**: Chart.js / Recharts.
- **Lợi ích**: Cái nhìn trực quan, ra quyết định nhanh.
- **Thời gian dự kiến**: 2-3 giờ

### 14. Tích hợp AI gợi ý dự án
- **Mô tả**: Khi thêm khách → AI tự động gợi ý 3 dự án phù hợp nhất.
- **Công nghệ**: DeepSeek API (parse nhu cầu + so khớp dự án).
- **Lợi ích**: Tăng khả năng chốt sale.
- **Thời gian dự kiến**: 2-3 giờ

### 15. Gọi điện trực tiếp
- **Mô tả**: Nút bấm gọi ngay trong app (dùng `tel:` link).
- **Chi tiết**: Trong danh sách khách hàng, card lịch hẹn.
- **Lợi ích**: Tiện lợi, không cần copy SĐT.
- **Thời gian dự kiến**: 15 phút

---

## 🟣 Giai đoạn 4: Mở rộng hệ sinh thái — Tương lai

### 16. Mobile App Native (React Native)
- **Mô tả**: Build app native từ code React hiện có.
- **Lợi ích**: Publish lên App Store / CH Play, tiếp cận nhiều người dùng hơn.
- **Thời gian dự kiến**: Vài tuần

### 17. Tích hợp Zalo OA / Facebook Lead Ads
- **Mô tả**: Tự động đổ lead từ quảng cáo Facebook/Zalo vào app.
- **Công nghệ**: Webhook + Supabase Edge Functions.
- **Lợi ích**: Không cần nhập tay, lead vào ngay hệ thống.
- **Thời gian dự kiến**: Vài ngày

### 18. Chatbot AI tư vấn
- **Mô tả**: Tích hợp AI chat trên web giới thiệu dự án, thu thập thông tin khách tự động.
- **Công nghệ**: DeepSeek API + nhúng widget.
- **Lợi ích**: Tự động thu lead 24/7.
- **Thời gian dự kiến**: Vài ngày

### 19. Ký hợp đồng điện tử
- **Mô tả**: Tích hợp e-sign (DocuSign, BKAV), lưu hợp đồng online.
- **Lợi ích**: Quy trình chuyên nghiệp, không giấy tờ.
- **Thời gian dự kiến**: Vài ngày

### 20. Đa ngôn ngữ (i18n)
- **Mô tả**: Hỗ trợ tiếng Anh, tiếng Việt (và có thể thêm ngôn ngữ khác).
- **Công nghệ**: `react-i18next`.
- **Lợi ích**: Mở rộng đối tượng người dùng.
- **Thời gian dự kiến**: 2-3 giờ

---

## 📊 Tổng quan lộ trình

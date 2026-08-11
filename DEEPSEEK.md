# SaleBDS - Ứng dụng cho sale bất động sản

> Cập nhật: 09/08/2026

## 🎯 Mục tiêu
Web app giúp sale bất động sản quản lý khách hàng, dự án, lịch hẹn và tính toán nhanh.
Có thể dùng như PWA trên mobile (thêm vào home screen). Ưu tiên trải nghiệm mobile-first, thao tác nhanh.

## 👤 Đối tượng người dùng
- Sale bất động sản cá nhân hoặc nhóm nhỏ.
- Cần app đơn giản, dễ dùng, tối ưu cho điện thoại.

## 🛠️ Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS (v3)
- **Router:** react-router-dom v6
- **Icons:** lucide-react
- **Backend/DB:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Auth:** Supabase Auth (Google OAuth, Magic Link)
- **Libraries:** xlsx (import Excel), @supabase/supabase-js
- **Hosting:** Vercel (frontend)
- **PWA:** vite-plugin-pwa (sẽ cấu hình sau)

## 📁 Cấu trúc thư mục
sale-bds-app/
├── DEEPSEEK.md ← File định hướng cho AI
├── README.md ← File giới thiệu cho người đọc
├── PROJECT_PLAN.md ← Lộ trình phát triển chi tiết
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env ← Chứa key thật (đã gitignore)
├── .env.example ← Mẫu biến môi trường
├── .gitignore
├── index.html
└── src/
├── components/
│ ├── BottomNav.jsx ← Thanh điều hướng dưới cùng (mobile)
│ ├── ImportModal.jsx ← Modal import Excel/CSV
│ ├── QuickAddModal.jsx ← Modal thêm nhanh bằng parse text
│ ├── Toast.jsx ← Toast notification (context + provider)
│ └── ConfirmDialog.jsx ← Modal xác nhận thay window.confirm
├── pages/
│ ├── Login.jsx ← Đăng nhập (Google, Magic Link)
│ ├── Dashboard.jsx ← Tổng quan (số liệu thực từ Supabase)
│ ├── KhachHang.jsx ← Quản lý khách hàng (CRUD, filter, search)
│ ├── DuAn.jsx ← Quản lý dự án (CRUD, upload ảnh, carousel)
│ ├── LichHen.jsx ← Lịch hẹn (calendar tháng, liên kết KH & DA)
│ └── Calculator.jsx ← Tính giá + vay ngân hàng
├── hooks/ ← (chưa có custom hook)
├── services/
│ └── supabase.js ← Supabase client config (dùng biến môi trường)
├── utils/ ← (chưa có helper thuần)
├── App.jsx ← Router + Auth guard + ToastProvider
├── index.css ← Tailwind directives
└── main.jsx ← Entry point (bọc ToastProvider)

## 📐 Quy ước code
- **Naming:** camelCase cho biến/hàm, PascalCase cho components, UPPER_CASE cho constants.
- **Export:** Named export cho utils/hooks, Default export cho components/pages.
- **CSS:** Dùng Tailwind utility classes, hạn chế custom CSS. Không dùng inline style.
- **Responsive:** Mobile-first, container chính `max-w-lg mx-auto`, padding bottom `pb-20` để chừa chỗ cho BottomNav.
- **State:** useState + useEffect, chưa dùng Context (ngoại trừ Toast).
- **API calls:** Gọi Supabase trực tiếp từ client qua `supabase.from(...)`, RLS đảm bảo bảo mật.
- **Comment:** Tiếng Việt cho logic phức tạp.
- **Toast:** Mọi thông báo dùng `useToast()` (success/error/warning/info).
- **Xác nhận xóa:** Dùng `ConfirmDialog` (import từ `../components/ConfirmDialog`), không dùng `window.confirm`.

## 🎨 Màu sắc chủ đạo
- Primary: `emerald-600` (#059669)
- Background: `gray-50`
- Card: `white` với `shadow-sm`
- Badge trạng thái: vàng/xanh dương/xanh lá/xám

## 🔒 Biến môi trường
File `.env` (không commit):
- Phải bắt đầu bằng `VITE_` để Vite đọc được.
- `.env.example` là mẫu, có thể commit.

## 🗄️ Database Schema (Supabase)

### Bảng `khach_hang`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT (PK) | Auto increment |
| user_id | UUID (FK → auth.users) | Người tạo |
| ten | TEXT | NOT NULL |
| sdt | TEXT | NOT NULL |
| nhu_cau | TEXT | |
| ngan_sach | TEXT | |
| khu_vuc | TEXT | |
| nguon | TEXT | |
| trang_thai | TEXT | 'tiem-nang', 'dang-cham', 'sap-chot', 'da-mua', 'khong-nhu-cau' |
| ghi_chu | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### Bảng `du_an`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT (PK) | Auto increment |
| user_id | UUID (FK) | Người tạo |
| ten | TEXT | NOT NULL |
| chu_dau_tu | TEXT | |
| vi_tri | TEXT | NOT NULL |
| gia | TEXT | NOT NULL |
| dien_tich | TEXT | |
| loai_hinh | TEXT | 'Chung cư', 'Nhà phố', 'Biệt thự', 'Đất nền'... |
| tien_ich | TEXT[] | Array tag |
| tien_do | TEXT | 'dang-mo-ban', 'sap-mo-ban', 'da-ban-het', 'dang-xay' |
| hinh_anh | TEXT[] | Array URL từ Supabase Storage |
| mo_ta | TEXT | |
| link_tham_khao | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### Bảng `lich_hen`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT (PK) | Auto increment |
| user_id | UUID (FK) | Người tạo |
| tieu_de | TEXT | NOT NULL |
| thoi_gian | TIMESTAMPTZ | NOT NULL |
| dia_diem | TEXT | |
| khach_hang_id | BIGINT (FK → khach_hang) | ON DELETE SET NULL |
| du_an_id | BIGINT (FK → du_an) | ON DELETE SET NULL |
| ghi_chu | TEXT | |
| da_hoan_thanh | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

- Tất cả bảng đều bật **Row Level Security** (RLS): user chỉ xem/sửa được dữ liệu của chính mình.

## 📦 Storage Bucket (Supabase)
- **`du-an-anh`**: Public bucket chứa ảnh dự án.
- Quyền: SELECT công khai; INSERT, UPDATE, DELETE chỉ cho authenticated users.

## ✅ Đã hoàn thành (MVP)

### Auth
- [x] Đăng nhập Google OAuth (Supabase Auth).
- [x] Magic Link (có trong giao diện, chưa dùng).
- [x] Auth guard (chặn trang nếu chưa đăng nhập).

### Khách hàng
- [x] Thêm/sửa/xóa khách hàng (modal form).
- [x] Form thêm nhanh: chỉ Tên + SĐT, toggle mở rộng chi tiết.
- [x] Import Excel/CSV (map cột tự động, preview 5 dòng).
- [x] Thêm nhanh bằng parse text (QuickAddModal).
- [x] Lọc theo trạng thái, tìm kiếm theo tên/SĐT.
- [x] Hiển thị badge trạng thái, context menu (Sửa/Xóa).
- [x] Toast thông báo khi thao tác.
- [x] ConfirmDialog khi xóa.

### Dự án
- [x] Thêm/sửa/xóa dự án (modal form).
- [x] Upload nhiều ảnh lên Supabase Storage (tối đa 10 ảnh).
- [x] Xem ảnh dạng carousel full màn hình.
- [x] Lọc theo loại hình & tiến độ, tìm kiếm.
- [x] Tags tiện ích, copy thông tin nhanh.
- [x] Thống kê nhỏ (tổng DA, đang bán, sắp bán).
- [x] Toast + ConfirmDialog.

### Lịch hẹn
- [x] Calendar tháng tự build, đánh dấu ngày có lịch.
- [x] Chọn ngày → hiển thị danh sách lịch hẹn.
- [x] Thêm/sửa/xóa lịch hẹn (form modal).
- [x] Liên kết khách hàng & dự án (dropdown).
- [x] Đánh dấu hoàn thành (toggle check).
- [x] Toast + ConfirmDialog.

### Calculator
- [x] Tính tổng giá: giá gốc + VAT + phí bảo trì - chiết khấu.
- [x] Nhập linh hoạt: tổng giá hoặc diện tích × đơn giá.
- [x] Tự động điền 70% giá trị căn hộ vào phần vay.
- [x] Tính vay ngân hàng: dư nợ giảm dần / trả đều.
- [x] Xem lịch trả nợ 12 tháng đầu.
- [x] Copy kết quả.

### Dashboard
- [x] Thống kê thực từ Supabase: tổng khách, cần follow-up, dự án đang bán, lịch hẹn hôm nay.
- [x] Loading skeleton.
- [x] Menu chức năng, nút thêm nhanh.

### UX/UI
- [x] Toast notification (success/error/warning/info).
- [x] ConfirmDialog thay thế window.confirm.
- [x] BottomNav cố định dưới cùng.
- [x] Empty state với icon và hướng dẫn.
- [x] Loading Skeleton cho Khách hàng, Dự án, Lịch hẹn.
- [x] Quét thông tin khách hàng từ ảnh (OCR với Tesseract.js)

## 🚧 Đang làm / Kế hoạch gần (Giai đoạn 1 – UX/UI)
Xem chi tiết trong `PROJECT_PLAN.md`. Ưu tiên:
- [ ] Loading skeleton cho danh sách (thay spinner).
- [ ] Splash screen khi kiểm tra auth.
- [ ] Cải thiện empty state đồng nhất.

## 📋 Kế hoạch tương lai (Giai đoạn 2+)
Tham khảo `PROJECT_PLAN.md` để biết toàn bộ lộ trình:
- Nhắc nhở lịch hẹn (Edge Functions).
- Auto follow-up, mẫu tin nhắn nhanh.
- Xuất báo cáo PDF/Excel.
- PWA hoàn chỉnh.
- Quản lý nhóm (team).
- Dashboard nâng cao (biểu đồ).
- Tích hợp AI gợi ý dự án.
- Gọi điện trực tiếp, tích hợp Zalo OA/Facebook Lead Ads.
- Mobile App Native.

## 📝 Ghi chú cho AI
- **Luôn đọc file này trước khi code** để nắm context.
- Database schema ở trên, RLS đã bật → mọi query đều tự filter theo user.
- Toast: import `useToast` từ `components/Toast`, dùng `toast.success()`, `.error()`, `.warning()`, `.info()`.
- ConfirmDialog: import từ `components/ConfirmDialog`, cần state `confirmState` và hàm mở/đóng.
- Modal form: dùng `fixed inset-0` với overlay, nội dung `rounded-t-2xl` từ dưới lên.
- Màu chính: `emerald-600`.
- Container trang: `pb-20 max-w-lg mx-auto`.
- Tất cả các trang đều có `<BottomNav />` ở cuối (trừ Login).
- Import Excel dùng thư viện `xlsx`.
- Parse text trong QuickAddModal dùng regex cơ bản.
- Khi thêm/sửa/xóa thành công, luôn gọi `toast.success()` và refresh data (gọi lại fetch).
- Khi có lỗi từ Supabase, hiển thị `toast.error()`.
- Sử dụng optional chaining khi truy cập nested object từ Supabase.
- Hình ảnh upload lên bucket `du-an-anh`, public URL lấy qua `supabase.storage.from('du-an-anh').getPublicUrl(fileName)`.
- Biến môi trường: `import.meta.env.VITE_SUPABASE_URL`.

## 🔗 Tài liệu tham khảo
- Supabase: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Lucide Icons: https://lucide.dev/icons
- Vite: https://vitejs.dev
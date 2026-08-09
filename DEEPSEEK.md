# SaleBDS - Ứng dụng cho sale bất động sản

## 🎯 Mục tiêu
Web app giúp sale bất động sản quản lý khách hàng, dự án, lịch hẹn và tính toán nhanh.
Có thể dùng như PWA trên mobile (thêm vào home screen).

## 👤 Đối tượng người dùng
- Sale bất động sản cá nhân hoặc nhóm nhỏ
- Cần app đơn giản, mobile-first, dùng mọi lúc mọi nơi

## 🛠️ Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Router:** react-router-dom v6
- **Icons:** lucide-react
- **Backend/DB:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Auth:** Supabase Auth (Google OAuth)
- **Hosting:** Vercel (frontend)
- **PWA:** vite-plugin-pwa (sẽ cấu hình sau)

## 📁 Cấu trúc thư mục
sale-bds-app/
├── DEEPSEEK.md ← File định hướng cho AI
├── README.md ← File giới thiệu cho người đọc
├── package.json
├── vite.config.js
├── index.html
└── src/
├── components/
│ └── BottomNav.jsx
├── pages/
│ ├── Login.jsx
│ ├── Dashboard.jsx
│ ├── KhachHang.jsx ✅ Đã code + kết nối Supabase
│ ├── DuAn.jsx ⏳ Placeholder
│ ├── LichHen.jsx ⏳ Placeholder
│ └── Calculator.jsx ⏳ Placeholder
├── hooks/
├── services/
│ └── supabase.js ← Supabase client config
├── utils/
├── App.jsx ← Router + Auth guard
├── index.css ← Chỉ có @import "tailwindcss"
└── main.jsx

## 📐 Quy ước code
- **Naming:** camelCase cho biến/hàm, PascalCase cho components
- **Export:** Named export cho utils, Default export cho components/pages
- **CSS:** Dùng Tailwind utility classes, hạn chế custom CSS
- **Responsive:** Mobile-first, max-width container là `max-w-lg` (tối ưu cho màn hình điện thoại)
- **State:** Ưu tiên useState, sẽ nâng cấp lên Context/Zustand khi cần
- **Comment:** Tiếng Việt cho logic phức tạp
- **API calls:** Tất cả gọi Supabase trực tiếp từ client (dùng RLS để bảo mật)

## 🔒 Biến môi trường

File `.env` chứa API keys (không commit lên Git):

| Biến | Mô tả |
|------|-------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous public key |

- File `.env` đã có trong `.gitignore`
- File `.env.example` là mẫu để copy (có thể commit)

## ⚠️ Quy tắc bảo mật
- **KHÔNG** hardcode API keys trong code
- **KHÔNG** commit file `.env` lên Git
- **LUÔN** dùng `import.meta.env.VITE_...` để đọc biến môi trường
- Prefix `VITE_` là bắt buộc với Vite

## 🎨 Màu sắc chủ đạo
- Primary: `emerald-600` (#059669)
- Background: `gray-50`
- Card: `white` với `shadow-sm`
- Badge trạng thái: yellow/blue/green/gray

## 🗄️ Database Schema (Supabase)

### Bảng `khach_hang`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT (PK) | Auto increment |
| user_id | UUID (FK → auth.users) | Người tạo |
| ten | TEXT | NOT NULL |
| sdt | TEXT | NOT NULL |
| nhu_cau | TEXT | Mua/thuê... |
| ngan_sach | TEXT | VD: "2-3 tỷ" |
| khu_vuc | TEXT | Khu vực quan tâm |
| nguon | TEXT | Facebook/Zalo/... |
| trang_thai | TEXT | tiem-nang / dang-cham / sap-chot / da-mua |
| ghi_chu | TEXT | Ghi chú tự do |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

### Bảng `du_an` (sẽ tạo)
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT (PK) | Auto increment |
| user_id | UUID (FK) | Người tạo |
| ten | TEXT | Tên dự án |
| vi_tri | TEXT | Địa chỉ |
| gia | TEXT | VD: "2-5 tỷ" |
| dien_tich | TEXT | VD: "60-120m²" |
| tien_ich | TEXT | Tiện ích nội khu |
| hinh_anh | TEXT[] | Array URL ảnh |
| trang_thai | TEXT | dang-mo-ban / sap-mo-ban / da-ban-het |
| created_at | TIMESTAMPTZ | Auto |

### Bảng `lich_hen` (sẽ tạo)
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT (PK) | Auto increment |
| user_id | UUID (FK) | Người tạo |
| khach_hang_id | BIGINT (FK) | Liên kết khách hàng |
| tieu_de | TEXT | Tiêu đề cuộc hẹn |
| thoi_gian | TIMESTAMPTZ | Ngày giờ hẹn |
| dia_diem | TEXT | Địa điểm |
| ghi_chu | TEXT | Ghi chú |
| da_hoan_thanh | BOOLEAN | Đã xong chưa |

## ✅ Đã hoàn thành
- [x] Setup project Vite + React + Tailwind
- [x] Cấu hình Supabase (client + auth)
- [x] Trang Login với Google OAuth
- [x] Auth guard (chặn truy cập khi chưa đăng nhập)
- [x] Trang Dashboard với menu điều hướng + tên user
- [x] Bottom Navigation (5 tab)
- [x] Trang Khách hàng (CRUD + filter + search)
- [x] Kết nối Khách hàng với Supabase (thêm/sửa/xóa/lấy danh sách)
- [x] Row Level Security (mỗi user chỉ xem được data của mình)

## 🚧 Đang làm
- [ ] Trang Dự án (kho BĐS)
- [ ] Trang Lịch hẹn (calendar + reminder)
- [ ] Trang Calculator (tính giá + vay ngân hàng)

## 📋 Kế hoạch tiếp theo
1. **Trang Dự án** - CRUD dự án BĐS, upload ảnh lên Supabase Storage, filter
2. **Trang Lịch hẹn** - Calendar view, đặt lịch, reminder, liên kết với khách hàng
3. **Trang Calculator** - Tính giá căn hộ (gốc + VAT + phí), lịch trả nợ vay ngân hàng
4. **Cải thiện UX** - Loading skeleton, toast notification, confirm dialog đẹp hơn
5. **PWA** - Cấu hình service worker để cài lên mobile
6. **Deploy** - Lên Vercel

## 📝 Ghi chú cho AI
- **KHÔNG dùng Firebase nữa** — đã chuyển hoàn toàn sang Supabase
- Supabase config trong `services/supabase.js`, cần thay URL + anon key thật
- Auth: Dùng `supabase.auth.getUser()` để kiểm tra, `supabase.auth.signInWithOAuth()` để login
- Database: Gọi trực tiếp từ client qua `supabase.from('table_name').select/insert/update/delete()`
- RLS đã bật — mọi query đều tự động filter theo `user_id = auth.uid()`
- Các trang đều có `<BottomNav />` ở cuối, trừ trang Login
- Container chính mỗi trang có class `pb-20 max-w-lg mx-auto` để chừa chỗ cho BottomNav
- Form thêm/sửa dùng modal (fixed + overlay), không chuyển trang
- Màu chủ đạo là `emerald` (xanh lá Supabase), không phải `blue` (Firebase)

## 🔗 Tài liệu tham khảo
- Supabase: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Lucide Icons: https://lucide.dev/icons
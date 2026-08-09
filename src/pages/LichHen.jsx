import { useState, useEffect } from 'react';
import {
  Plus, ChevronLeft, ChevronRight, MapPin, Clock, User, Building2,
  MoreVertical, X, Check, Calendar, Phone, AlertCircle
} from 'lucide-react';
import { supabase } from '../services/supabase';
import BottomNav from '../components/BottomNav';

// Helper: format ngày giờ
const formatDate = (date) => {
  return date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTime = (date) => {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const formatDateTimeLocal = (date) => {
  // Convert to local datetime string for input[type="datetime-local"]
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Helper: lấy ngày đầu tháng, số ngày trong tháng
const getMonthData = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
  return { firstDay, lastDay, daysInMonth, startDayOfWeek };
};

export default function LichHen() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [appointments, setAppointments] = useState([]); // tất cả lịch trong tháng
  const [dayAppointments, setDayAppointments] = useState([]); // lịch của ngày được chọn
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [khachHangList, setKhachHangList] = useState([]);
  const [duAnList, setDuAnList] = useState([]);

  // Form state
  const [form, setForm] = useState({
    tieu_de: '',
    thoi_gian: formatDateTimeLocal(today),
    dia_diem: '',
    khach_hang_id: '',
    du_an_id: '',
    ghi_chu: '',
    da_hoan_thanh: false,
  });

  // Fetch khách hàng & dự án cho dropdown
  useEffect(() => {
    const fetchDropdownData = async () => {
      const { data: kh } = await supabase.from('khach_hang').select('id, ten, sdt').order('ten');
      const { data: da } = await supabase.from('du_an').select('id, ten').order('ten');
      setKhachHangList(kh || []);
      setDuAnList(da || []);
    };
    fetchDropdownData();
  }, []);

  // Fetch lịch hẹn trong tháng hiện tại
  useEffect(() => {
    fetchMonthAppointments();
  }, [currentMonth]);

  // Fetch lịch hẹn của ngày được chọn
  useEffect(() => {
    fetchDayAppointments(selectedDate);
  }, [selectedDate, appointments]);

  const fetchMonthAppointments = async () => {
    setLoading(true);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startOfMonth = new Date(year, month, 1).toISOString();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const { data, error } = await supabase
      .from('lich_hen')
      .select('*')
      .gte('thoi_gian', startOfMonth)
      .lte('thoi_gian', endOfMonth)
      .order('thoi_gian', { ascending: true });

    if (error) {
      console.error('Lỗi load lịch tháng:', error);
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  const fetchDayAppointments = async (date) => {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).toISOString();

    const { data, error } = await supabase
      .from('lich_hen')
      .select('*, khach_hang(id, ten, sdt), du_an(id, ten)')
      .gte('thoi_gian', startOfDay)
      .lte('thoi_gian', endOfDay)
      .order('thoi_gian', { ascending: true });

    if (error) {
      console.error('Lỗi load lịch ngày:', error);
      setDayAppointments([]);
    } else {
      setDayAppointments(data || []);
    }
  };

  // Tạo map: ngày -> có lịch hẹn không (để hiển thị chấm)
  const appointmentsByDate = {};
  appointments.forEach((appt) => {
    const d = new Date(appt.thoi_gian);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!appointmentsByDate[key]) appointmentsByDate[key] = [];
    appointmentsByDate[key].push(appt);
  });

  // Điều hướng tháng
  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  const goToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  // Mở form thêm mới (mặc định ngày được chọn)
  const openAddForm = () => {
    setEditingAppt(null);
    setForm({
      tieu_de: '',
      thoi_gian: formatDateTimeLocal(selectedDate),
      dia_diem: '',
      khach_hang_id: '',
      du_an_id: '',
      ghi_chu: '',
      da_hoan_thanh: false,
    });
    setShowForm(true);
  };

  // Mở form sửa
  const openEditForm = (appt) => {
    setEditingAppt(appt);
    const thoiGianDate = new Date(appt.thoi_gian);
    setForm({
      tieu_de: appt.tieu_de || '',
      thoi_gian: formatDateTimeLocal(thoiGianDate),
      dia_diem: appt.dia_diem || '',
      khach_hang_id: appt.khach_hang_id || '',
      du_an_id: appt.du_an_id || '',
      ghi_chu: appt.ghi_chu || '',
      da_hoan_thanh: appt.da_hoan_thanh || false,
    });
    setShowForm(true);
  };

  // Lưu lịch hẹn
  const handleSave = async () => {
    if (!form.tieu_de.trim() || !form.thoi_gian) {
      alert('Vui lòng nhập tiêu đề và thời gian!');
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const apptData = {
      tieu_de: form.tieu_de.trim(),
      thoi_gian: new Date(form.thoi_gian).toISOString(),
      dia_diem: form.dia_diem.trim(),
      khach_hang_id: form.khach_hang_id || null,
      du_an_id: form.du_an_id || null,
      ghi_chu: form.ghi_chu.trim(),
      da_hoan_thanh: form.da_hoan_thanh,
      user_id: user.id,
    };

    if (editingAppt) {
      const { error } = await supabase.from('lich_hen').update(apptData).eq('id', editingAppt.id);
      if (error) {
        alert('Lỗi cập nhật: ' + error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from('lich_hen').insert([apptData]);
      if (error) {
        alert('Lỗi thêm mới: ' + error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setShowForm(false);
    fetchMonthAppointments();
    fetchDayAppointments(selectedDate);
  };

  // Xóa lịch hẹn
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa lịch hẹn này?')) return;
    const { error } = await supabase.from('lich_hen').delete().eq('id', id);
    if (error) {
      alert('Lỗi xóa: ' + error.message);
      return;
    }
    fetchMonthAppointments();
    fetchDayAppointments(selectedDate);
  };

  // Toggle hoàn thành
  const toggleComplete = async (appt) => {
    const { error } = await supabase
      .from('lich_hen')
      .update({ da_hoan_thanh: !appt.da_hoan_thanh })
      .eq('id', appt.id);
    if (error) {
      alert('Lỗi cập nhật: ' + error.message);
      return;
    }
    fetchMonthAppointments();
    fetchDayAppointments(selectedDate);
  };

  // Render lịch tháng
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const { daysInMonth, startDayOfWeek } = getMonthData(year, month);

  // Tạo mảng ngày (bao gồm ngày trống đầu tháng)
  const calendarDays = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null); // ô trống
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }

  // Chia thành các tuần
  const weeks = [];
  let week = [];
  calendarDays.forEach((day, index) => {
    week.push(day);
    if ((index + 1) % 7 === 0) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length > 0) weeks.push(week);

  return (
    <div className="pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Lịch hẹn
          </h1>
          <button
            onClick={openAddForm}
            className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Thêm lịch
          </button>
        </div>

        {/* Điều hướng tháng */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={goToPrevMonth} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-base font-semibold text-gray-800">
            {currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Nút Hôm nay */}
        <button
          onClick={goToToday}
          className="text-xs text-emerald-600 font-medium hover:underline"
        >
          Hôm nay
        </button>

        {/* Lịch tháng */}
        <div className="mt-2 bg-gray-50 rounded-xl p-2">
          {/* Tên thứ */}
          <div className="grid grid-cols-7 mb-1">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((thu) => (
              <div key={thu} className="text-center text-xs font-medium text-gray-500 py-1">
                {thu}
              </div>
            ))}
          </div>

          {/* Các tuần */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day, di) => {
                if (!day) {
                  return <div key={`empty-${di}`} className="h-10" />;
                }

                const isToday =
                  day.getDate() === today.getDate() &&
                  day.getMonth() === today.getMonth() &&
                  day.getFullYear() === today.getFullYear();
                const isSelected =
                  day.getDate() === selectedDate.getDate() &&
                  day.getMonth() === selectedDate.getMonth() &&
                  day.getFullYear() === selectedDate.getFullYear();
                const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                const hasAppointments = appointmentsByDate[dateKey]?.length > 0;

                return (
                  <button
                    key={`${wi}-${di}`}
                    onClick={() => setSelectedDate(day)}
                    className={`h-10 flex flex-col items-center justify-center rounded-lg transition-colors relative ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : isToday
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{day.getDate()}</span>
                    {hasAppointments && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Danh sách lịch hẹn của ngày được chọn */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">
            📅 {formatDate(selectedDate)}
          </h3>
          <span className="text-xs text-gray-400">{dayAppointments.length} lịch hẹn</span>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : dayAppointments.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Chưa có lịch hẹn nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayAppointments.map((appt) => (
              <div
                key={appt.id}
                className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
                  appt.da_hoan_thanh ? 'border-gray-300 opacity-70' : 'border-emerald-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold ${appt.da_hoan_thanh ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {appt.tieu_de}
                    </h4>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{formatTime(new Date(appt.thoi_gian))}</span>
                      {appt.dia_diem && (
                        <>
                          <span className="mx-1">·</span>
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{appt.dia_diem}</span>
                        </>
                      )}
                    </div>
                    {appt.khach_hang && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{appt.khach_hang.ten}</span>
                        {appt.khach_hang.sdt && (
                          <>
                            <span className="mx-1">·</span>
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{appt.khach_hang.sdt}</span>
                          </>
                        )}
                      </div>
                    )}
                    {appt.du_an && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{appt.du_an.ten}</span>
                      </div>
                    )}
                    {appt.ghi_chu && (
                      <p className="text-xs text-gray-400 mt-1 italic">📝 {appt.ghi_chu}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => toggleComplete(appt)}
                      className={`p-1.5 rounded-full ${
                        appt.da_hoan_thanh
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-gray-100 text-gray-400 hover:text-emerald-600'
                      }`}
                      title={appt.da_hoan_thanh ? 'Đánh dấu chưa xong' : 'Đánh dấu đã xong'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <div className="relative group/menu">
                      <button className="p-1.5 hover:bg-gray-100 rounded-full">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg py-1 hidden group-hover/menu:block z-10 min-w-[100px] border">
                        <button
                          onClick={() => openEditForm(appt)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(appt.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== FORM MODAL ========== */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {editingAppt ? 'Sửa lịch hẹn' : 'Thêm lịch hẹn mới'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Tiêu đề */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.tieu_de}
                  onChange={(e) => setForm({ ...form, tieu_de: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="VD: Dẫn khách xem căn hộ"
                />
              </div>

              {/* Thời gian */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={form.thoi_gian}
                  onChange={(e) => setForm({ ...form, thoi_gian: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Địa điểm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm</label>
                <input
                  type="text"
                  value={form.dia_diem}
                  onChange={(e) => setForm({ ...form, dia_diem: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="VD: Vinhomes Grand Park"
                />
              </div>

              {/* Khách hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                <select
                  value={form.khach_hang_id}
                  onChange={(e) => setForm({ ...form, khach_hang_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {khachHangList.map((kh) => (
                    <option key={kh.id} value={kh.id}>
                      {kh.ten} - {kh.sdt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dự án */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dự án</label>
                <select
                  value={form.du_an_id}
                  onChange={(e) => setForm({ ...form, du_an_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Chọn dự án --</option>
                  {duAnList.map((da) => (
                    <option key={da.id} value={da.id}>
                      {da.ten}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={form.ghi_chu}
                  onChange={(e) => setForm({ ...form, ghi_chu: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Ghi chú thêm..."
                />
              </div>

              {/* Đã hoàn thành */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.da_hoan_thanh}
                  onChange={(e) => setForm({ ...form, da_hoan_thanh: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Đã hoàn thành</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-5 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> Đang lưu...</>
                ) : (
                  <>{editingAppt ? 'Cập nhật' : 'Thêm lịch hẹn'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
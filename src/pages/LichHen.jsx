import { useState, useEffect } from 'react';
import {
  Plus, ChevronLeft, ChevronRight, MapPin, Clock, User, Building2,
  MoreVertical, X, Check, Calendar
} from 'lucide-react';
import { supabase } from '../services/supabase';
import BottomNav from '../components/BottomNav';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { LichHenSkeleton } from '../components/Skeleton';

// Helper: format ngày giờ
const formatDate = (date) => {
  return date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTime = (date) => {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const formatDateTimeLocal = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Helper: lấy ngày đầu tháng, số ngày trong tháng
const getMonthData = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  return { firstDay, lastDay, daysInMonth, startDayOfWeek };
};

export default function LichHen() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [appointments, setAppointments] = useState([]);
  const [dayAppointments, setDayAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [khachHangList, setKhachHangList] = useState([]);
  const [duAnList, setDuAnList] = useState([]);

  const toast = useToast();
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

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

  // Fetch lịch hẹn của ngày được chọn (chỉ phụ thuộc selectedDate)
  useEffect(() => {
    fetchDayAppointments(selectedDate);
  }, [selectedDate]);

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
      toast.error('Lỗi tải lịch tháng: ' + error.message);
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  const fetchDayAppointments = async (date) => {
    setLoading(true); // set loading khi fetch ngày
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
    setLoading(false);
  };

  // Tạo map ngày -> có lịch hẹn không
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

  // Mở form thêm mới
  const openAddForm = () => {
    setEditingAppt(null);
    // Nếu selectedDate là hôm nay, dùng giờ hiện tại; ngược lại đặt 09:00
    const isToday =
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();
    const defaultTime = isToday
      ? new Date()
      : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 9, 0);
    setForm({
      tieu_de: '',
      thoi_gian: formatDateTimeLocal(defaultTime),
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
      toast.warning('Vui lòng nhập tiêu đề và thời gian!');
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
        toast.error('Lỗi cập nhật: ' + error.message);
        setSaving(false);
        return;
      }
      toast.success('Đã cập nhật lịch hẹn!');
    } else {
      const { error } = await supabase.from('lich_hen').insert([apptData]);
      if (error) {
        toast.error('Lỗi thêm mới: ' + error.message);
        setSaving(false);
        return;
      }
      toast.success('Đã thêm lịch hẹn mới!');
    }

    setSaving(false);
    setShowForm(false);
    fetchMonthAppointments();
    fetchDayAppointments(selectedDate);
  };

  // Mở Confirm xóa
  const handleDeleteRequest = (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Xóa lịch hẹn',
      message: 'Bạn có chắc muốn xóa lịch hẹn này? Hành động này không thể hoàn tác.',
      onConfirm: () => performDelete(id),
    });
  };

  const performDelete = async (id) => {
    const { error } = await supabase.from('lich_hen').delete().eq('id', id);
    if (error) {
      toast.error('Lỗi xóa: ' + error.message);
      return;
    }
    toast.success('Đã xóa lịch hẹn!');
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
      toast.error('Lỗi cập nhật: ' + error.message);
      return;
    }
    toast.success(appt.da_hoan_thanh ? 'Đã đánh dấu chưa hoàn thành' : 'Đã đánh dấu hoàn thành');
    fetchMonthAppointments();
    fetchDayAppointments(selectedDate);
  };

  // Render lịch tháng
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const { daysInMonth, startDayOfWeek } = getMonthData(year, month);

  const calendarDays = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }

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
    <div className="pb-24 max-w-lg mx-auto">
      {/* Header & Calendar Controls */}
      <div className="p-3 sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-1">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Lịch hẹn
          </h1>
          <button
            onClick={openAddForm}
            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold hover:bg-emerald-500 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Lịch mới
          </button>
        </div>

        {/* Month Selector - compact */}
        <div className="flex items-center justify-between bg-slate-800/80 rounded-lg p-1">
          <button onClick={goToPrevMonth} className="p-1 hover:bg-white/10 rounded text-gray-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wide">
              {currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={goToToday}
              className="text-[10px] font-medium text-emerald-500 hover:underline"
            >
              Hôm nay
            </button>
          </div>
          <button onClick={goToNextMonth} className="p-1 hover:bg-white/10 rounded text-gray-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mini Calendar View - compact */}
        <div className="mt-2 bg-slate-900/70 rounded-xl p-2">
          <div className="grid grid-cols-7 mb-1">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((thu) => (
              <div key={thu} className="text-center text-[9px] font-bold text-slate-500 uppercase">
                {thu}
              </div>
            ))}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-0.5">
              {week.map((day, di) => {
                if (!day) return <div key={`empty-${di}`} className="h-7" />;

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
                    className={`h-7 flex flex-col items-center justify-center rounded-lg transition-all relative ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isToday
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold leading-none">{day.getDate()}</span>
                    {hasAppointments && (
                      <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Appointment List */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            📅 {formatDate(selectedDate)}
          </h3>
          <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-lg">
            {dayAppointments.length} sự kiện
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <LichHenSkeleton key={i} />
            ))}
          </div>
        ) : dayAppointments.length === 0 ? (
          <div className="text-center py-10 bg-slate-900 rounded-2xl border border-dashed border-slate-700">
            <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm font-medium">Trống lịch cho ngày này</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayAppointments.map((appt) => (
              <div
                key={appt.id}
                className={`bg-slate-900 rounded-2xl p-4 border border-slate-800 transition-all ${
                  appt.da_hoan_thanh ? 'opacity-50' : 'hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-400">{formatTime(new Date(appt.thoi_gian))}</span>
                    </div>
                    
                    <h4 className={`text-base font-bold leading-tight mb-2 ${appt.da_hoan_thanh ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                      {appt.tieu_de}
                    </h4>

                    <div className="space-y-1.5">
                      {appt.dia_diem && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{appt.dia_diem}</span>
                        </div>
                      )}
                      {appt.khach_hang && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="text-emerald-500 font-medium">{appt.khach_hang.ten}</span>
                          {appt.khach_hang.sdt && (
                            <>
                              <span className="text-slate-600">|</span>
                              <span className="text-slate-400">{appt.khach_hang.sdt}</span>
                            </>
                          )}
                        </div>
                      )}
                      {appt.du_an && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="text-blue-400">{appt.du_an.ten}</span>
                        </div>
                      )}
                    </div>

                    {appt.ghi_chu && (
                      <div className="mt-3 p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <p className="text-xs text-gray-400 italic">“ {appt.ghi_chu} ”</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => toggleComplete(appt)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        appt.da_hoan_thanh
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-500 hover:bg-emerald-500/20 hover:text-emerald-400'
                      }`}
                      title={appt.da_hoan_thanh ? 'Đánh dấu chưa xong' : 'Đánh dấu đã xong'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <div className="relative group/menu">
                      <button className="w-8 h-8 bg-slate-800 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-700">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-10 bg-slate-900 shadow-2xl rounded-xl py-1.5 hidden group-hover/menu:block z-20 min-w-[140px] border border-slate-700 overflow-hidden">
                        <button onClick={() => openEditForm(appt)} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-800 flex items-center gap-2">
                          ✏️ Chỉnh sửa
                        </button>
                        <button onClick={() => handleDeleteRequest(appt.id)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                          🗑️ Hủy lịch
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
        <div className="fixed inset-0 bg-black/60 z-30 flex items-end justify-center">
          <div className="bg-slate-900 rounded-t-2xl w-full max-w-lg p-5 max-h-[85vh] overflow-y-auto shadow-2xl border-t border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-100">
                {editingAppt ? 'Sửa lịch hẹn' : 'Thêm lịch hẹn mới'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.tieu_de}
                  onChange={(e) => setForm({ ...form, tieu_de: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="VD: Dẫn khách xem căn hộ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Thời gian <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={form.thoi_gian}
                  onChange={(e) => setForm({ ...form, thoi_gian: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Địa điểm</label>
                <input
                  type="text"
                  value={form.dia_diem}
                  onChange={(e) => setForm({ ...form, dia_diem: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="VD: Vinhomes Grand Park"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Khách hàng</label>
                <select
                  value={form.khach_hang_id}
                  onChange={(e) => setForm({ ...form, khach_hang_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {khachHangList.map((kh) => (
                    <option key={kh.id} value={kh.id}>
                      {kh.ten} - {kh.sdt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Dự án</label>
                <select
                  value={form.du_an_id}
                  onChange={(e) => setForm({ ...form, du_an_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Chọn dự án --</option>
                  {duAnList.map((da) => (
                    <option key={da.id} value={da.id}>
                      {da.ten}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Ghi chú</label>
                <textarea
                  value={form.ghi_chu}
                  onChange={(e) => setForm({ ...form, ghi_chu: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Ghi chú thêm..."
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.da_hoan_thanh}
                  onChange={(e) => setForm({ ...form, da_hoan_thanh: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-300">Đã hoàn thành</span>
              </label>
            </div>

            <div className="flex gap-3 mt-5 pt-3 border-t border-slate-700">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-slate-700"
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          if (confirmState.onConfirm) confirmState.onConfirm();
        }}
        title={confirmState.title}
        message={confirmState.message}
        type="danger"
      />

      <BottomNav />
    </div>
  );
}
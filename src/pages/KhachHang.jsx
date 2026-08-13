import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Phone, MapPin, MoreVertical, X, Upload, Sparkles, Zap, ChevronDown, ChevronUp, Camera, PhoneCall, MessageCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import BottomNav from '../components/BottomNav';
import ImportModal from '../components/ImportModal';
import QuickAddModal from '../components/QuickAddModal';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { KhachHangSkeleton } from '../components/Skeleton';
import ImageOCRModal from '../components/ImageOCRModal';
import MessageTemplateModal from '../components/MessageTemplateModal';
import VoiceInput from '../components/VoiceInput';
import { Mic } from 'lucide-react';

const trangThaiConfig = {
  'tiem-nang': { label: 'Tiềm năng', color: 'bg-yellow-100 text-yellow-700' },
  'dang-cham': { label: 'Đang chăm', color: 'bg-blue-100 text-blue-700' },
  'sap-chot': { label: 'Sắp chốt', color: 'bg-green-100 text-green-700' },
  'da-mua': { label: 'Đã mua', color: 'bg-gray-100 text-gray-700' },
  'khong-nhu-cau': { label: 'Không nhu cầu', color: 'bg-red-100 text-red-700' }, // ← Thêm dòng này
};

const nguonOptions = ['Facebook', 'Zalo', 'Website', 'Người quen giới thiệu', 'Gọi tới', 'Khác'];
const nhuCauOptions = ['Mua chung cư', 'Mua nhà phố', 'Mua đất nền', 'Thuê chung cư', 'Thuê nhà phố', 'Khác'];

export default function KhachHang() {
  const [khachHangList, setKhachHangList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingKhach, setEditingKhach] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const addMenuRef = useRef(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showVoice, setShowVoice] = useState(false);

  const toast = useToast();
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const [form, setForm] = useState({
    ten: '',
    sdt: '',
    trangThai: 'tiem-nang',
    nhuCau: '',
    nganSach: '',
    khuVuc: '',
    nguon: '',
    ghiChu: '',
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load khách hàng
  useEffect(() => {
    fetchKhachHang();
  }, []);

  const openTemplateModal = (khach) => {
    setSelectedCustomer(khach);
    setShowTemplateModal(true);
  };

  const fetchKhachHang = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('khach_hang')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Lỗi tải dữ liệu: ' + error.message);
    } else {
      setKhachHangList(data || []);
    }
    setLoading(false);
  };

  // Filter & search
  const filteredList = khachHangList.filter(kh => {
    // Lọc theo trạng thái (gồm cả can-follow-up)
    let matchStatus = true;
    if (filterStatus === 'can-follow-up') {
      const isPotential = kh.trang_thai === 'tiem-nang' || kh.trang_thai === 'dang-cham';
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const isOverdue = !kh.last_contacted_at || new Date(kh.last_contacted_at) < threeDaysAgo;
      matchStatus = isPotential && isOverdue;
    } else {
      matchStatus = filterStatus === 'all' || kh.trang_thai === filterStatus;
    }

    const matchSearch = kh.ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kh.sdt.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  // Mở form thêm nhanh
  const openAddForm = () => {
    setEditingKhach(null);
    setForm({ ten: '', sdt: '', trangThai: 'tiem-nang', nhuCau: '', nganSach: '', khuVuc: '', nguon: '', ghiChu: '' });
    setShowDetails(false);
    setShowForm(true);
  };

  // Mở form sửa
  const openEditForm = (khach) => {
    setEditingKhach(khach);
    setForm({
      ten: khach.ten,
      sdt: khach.sdt,
      trangThai: khach.trang_thai,
      nhuCau: khach.nhu_cau || '',
      nganSach: khach.ngan_sach || '',
      khuVuc: khach.khu_vuc || '',
      nguon: khach.nguon || '',
      ghiChu: khach.ghi_chu || '',
    });
    const hasDetail = khach.nhu_cau || khach.ngan_sach || khach.khu_vuc || khach.nguon || khach.ghi_chu;
    setShowDetails(hasDetail);
    setShowForm(true);
  };

  // Lưu khách hàng
  const handleSave = async () => {
    if (!form.ten.trim() || !form.sdt.trim()) {
      toast.warning('Vui lòng nhập tên và số điện thoại!');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const khachData = {
      ten: form.ten.trim(),
      sdt: form.sdt.trim(),
      trang_thai: form.trangThai,
      nhu_cau: form.nhuCau,
      ngan_sach: form.nganSach,
      khu_vuc: form.khuVuc,
      nguon: form.nguon,
      ghi_chu: form.ghiChu,
      user_id: user.id,
      last_contacted_at: new Date().toISOString(),
    };

    if (editingKhach) {
      const { error } = await supabase
        .from('khach_hang')
        .update(khachData)
        .eq('id', editingKhach.id);

      if (error) {
        toast.error('Lỗi cập nhật: ' + error.message);
        return;
      }
      toast.success('Đã cập nhật khách hàng!');
    } else {
      const { error } = await supabase
        .from('khach_hang')
        .insert([khachData]);

      if (error) {
        toast.error('Lỗi thêm mới: ' + error.message);
        return;
      }
      toast.success('Đã thêm khách hàng mới!');
    }

    setShowForm(false);
    fetchKhachHang();
  };

  // Xác nhận xóa
  const handleDeleteRequest = (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Xóa khách hàng',
      message: 'Bạn có chắc muốn xóa khách hàng này? Hành động này không thể hoàn tác.',
      onConfirm: () => performDelete(id),
    });
  };

  const performDelete = async (id) => {
    const { error } = await supabase
      .from('khach_hang')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Lỗi xóa: ' + error.message);
      return;
    }
    toast.success('Đã xóa khách hàng!');
    fetchKhachHang();
  };

  const handleMarkContacted = async (id) => {
    const { error } = await supabase
      .from('khach_hang')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error('Lỗi cập nhật: ' + error.message);
    } else {
      toast.success('Đã cập nhật liên hệ!');
      fetchKhachHang();
    }
  };

  const countCanFollowUp = khachHangList.filter(kh => {
    const isPotential = kh.trang_thai === 'tiem-nang' || kh.trang_thai === 'dang-cham';
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const isOverdue = !kh.last_contacted_at || new Date(kh.last_contacted_at) < threeDaysAgo;
    return isPotential && isOverdue;
  }).length;

  const handleSaveFromVoice = async (customerData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('khach_hang').insert({
      ten: customerData.ten,
      sdt: customerData.sdt,
      nhu_cau: customerData.nhuCau,
      ngan_sach: customerData.nganSach,
      khu_vuc: customerData.khuVuc,
      ghi_chu: customerData.ghiChu,
      trang_thai: customerData.trangThai || 'tiem-nang',
      user_id: user.id,
      last_contacted_at: new Date().toISOString(),
    });
    if (error) {
      toast.error('Lỗi lưu: ' + error.message);
      return;
    }
    toast.success('Đã thêm khách hàng!');
    setShowVoice(false);
    fetchKhachHang();
  };

  // Đếm nhanh
  const countByStatus = (status) => khachHangList.filter(kh => kh.trang_thai === status).length;

  return (
    <div className="pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        {/* Header */}
        <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-800">Khách hàng</h1>

            <div className="relative" ref={addMenuRef}>
              {/* ===== Dropdown Thêm mới ===== */}
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-emerald-700 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Thêm mới
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
                </button>

                {showAddMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border py-2 z-20 animate-in fade-in zoom-in-95 origin-top-right">
                    <button
                      onClick={() => { setShowVoice(true); setShowAddMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Mic className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="font-medium text-gray-700">Nhập bằng giọng nói</p>
                        <p className="text-xs text-gray-400">Nói thông tin khách</p>
                      </div>
                    </button>
                    <button
                      onClick={() => { openAddForm(); setShowAddMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Zap className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="font-medium text-gray-700">Thêm nhanh</p>
                        <p className="text-xs text-gray-400">Chỉ Tên + SĐT</p>
                      </div>
                    </button>
                    <button
                      onClick={() => { setShowQuickAdd(true); setShowAddMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="font-medium text-gray-700">Quick Add</p>
                        <p className="text-xs text-gray-400">Parse từ đoạn text</p>
                      </div>
                    </button>
                    <button
                      onClick={() => { setShowImport(true); setShowAddMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Upload className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-700">Import Excel</p>
                        <p className="text-xs text-gray-400">Từ file .xlsx, .csv</p>
                      </div>
                    </button>
                    <button
                      onClick={() => { setShowOCR(true); setShowAddMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Camera className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="font-medium text-gray-700">Quét ảnh</p>
                        <p className="text-xs text-gray-400">Nhận dạng từ ảnh</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${filterStatus === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
          >
            Tất cả ({khachHangList.length})
          </button>
          <button
            onClick={() => setFilterStatus('can-follow-up')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${filterStatus === 'can-follow-up' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
          >
            Cần follow-up ({countCanFollowUp})
          </button>
          {Object.entries(trangThaiConfig).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${filterStatus === key ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
            >
              {value.label} ({countByStatus(key)})
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách khách hàng */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <KhachHangSkeleton key={i} />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-400">
              {searchTerm ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có khách hàng nào'}
            </p>
            <button onClick={openAddForm} className="text-emerald-600 text-sm mt-2 font-medium">
              + Thêm khách hàng đầu tiên
            </button>
          </div>
        ) : (
          filteredList.map((kh) => (
            <div key={kh.id} className="bg-white rounded-xl p-4 shadow-sm relative group/card">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{kh.ten}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="mr-1">{kh.sdt}</span>
                    <a
                      href={`tel:${kh.sdt}`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-50 text-green-600 hover:bg-green-100 active:scale-90 transition-all"
                      title="Gọi điện"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://zalo.me/${kh.sdt}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-90 transition-all"
                      title="Chat Zalo"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  {kh.khu_vuc && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{kh.khu_vuc}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${trangThaiConfig[kh.trang_thai]?.color || 'bg-gray-100 text-gray-700'}`}>
                    {trangThaiConfig[kh.trang_thai]?.label || kh.trang_thai}
                  </span>
                  <div className="relative group/menu">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    <div className="absolute right-0 top-6 bg-white shadow-lg rounded-lg py-1 hidden group-hover/menu:block z-10 min-w-[100px] border">
                      <button
                        onClick={() => openEditForm(kh)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(kh.id)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        🗑️ Xóa
                      </button>
                      <button
                        onClick={() => { setSelectedCustomer(kh); setShowMessageModal(true); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        💬 Nhắn tin
                      </button>
                      <button
                        onClick={() => handleMarkContacted(kh.id)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        ✅ Đã liên hệ
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-2">
                {kh.nhu_cau && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{kh.nhu_cau}</span>}
                {kh.ngan_sach && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{kh.ngan_sach}</span>}
                {kh.nguon && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">📌 {kh.nguon}</span>}
              </div>

              {kh.ghi_chu && (
                <p className="mt-2 text-xs text-gray-400 italic line-clamp-1">📝 {kh.ghi_chu}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* ========== FORM THÊM NHANH (MODAL) ========== */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-end justify-center overflow-hidden">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto overflow-x-hidden shadow-2xl box-border">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 truncate">
                  {editingKhach ? 'Sửa khách hàng' : 'Thêm khách hàng nhanh'}
                </h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* === FIELD BẮT BUỘC === */}
            <div className="space-y-3 mb-2">
              {/* Tên */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên khách hàng <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-full box-border"
                  placeholder="Nhập tên khách hàng" autoFocus />
              </div>

              {/* SĐT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input type="tel" value={form.sdt} onChange={(e) => setForm({ ...form, sdt: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-full box-border"
                  placeholder="Nhập số điện thoại" />
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(trangThaiConfig).map(([key, value]) => (
                    <button key={key} type="button"
                      onClick={() => setForm({ ...form, trangThai: key })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${form.trangThai === key
                        ? 'ring-2 ring-emerald-500 ring-offset-1 ' + value.color
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}>
                      {value.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Toggle chi tiết */}
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors mb-2"
            >
              {showDetails ? (
                <><ChevronUp className="w-4 h-4 flex-shrink-0" /> Ẩn chi tiết</>
              ) : (
                <><ChevronDown className="w-4 h-4 flex-shrink-0" /> Thêm chi tiết (nhu cầu, ngân sách...)</>
              )}
            </button>

            {/* === FIELD CHI TIẾT === */}
            {showDetails && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                {/* Nhu cầu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhu cầu</label>
                  <div className="flex flex-wrap gap-2">
                    {nhuCauOptions.map((option) => (
                      <button key={option} type="button"
                        onClick={() => setForm({ ...form, nhuCau: form.nhuCau === option ? '' : option })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${form.nhuCau === option
                          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}>
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ngân sách + Khu vực */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngân sách</label>
                    <input type="text" value={form.nganSach} onChange={(e) => setForm({ ...form, nganSach: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-full box-border"
                      placeholder="VD: 2-3 tỷ" />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực</label>
                    <input type="text" value={form.khuVuc} onChange={(e) => setForm({ ...form, khuVuc: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-full box-border"
                      placeholder="VD: Quận 2" />
                  </div>
                </div>

                {/* Nguồn */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn khách</label>
                  <div className="flex flex-wrap gap-2">
                    {nguonOptions.map((option) => (
                      <button key={option} type="button"
                        onClick={() => setForm({ ...form, nguon: form.nguon === option ? '' : option })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${form.nguon === option
                          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}>
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} rows={2}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-full box-border resize-none"
                    placeholder="Ghi chú nhanh..." />
                </div>
              </div>
            )}

            {/* Nút Lưu */}
            <div className="flex gap-3 mt-5 pt-3 border-t border-gray-100">
              <button onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 min-w-0">
                Hủy
              </button>
              <button onClick={handleSave}
                className="flex-[2] px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-w-0">
                <Zap className="w-4 h-4 flex-shrink-0" />
                {editingKhach ? 'Cập nhật' : 'Lưu ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); fetchKhachHang(); toast.success('Import thành công!'); }}
        />
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddModal
          onClose={() => setShowQuickAdd(false)}
          onSuccess={() => { setShowQuickAdd(false); fetchKhachHang(); toast.success('Đã thêm khách hàng!'); }}
        />
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
      {/* Image OCR Modal */}
      {showOCR && (
        <ImageOCRModal
          onClose={() => setShowOCR(false)}
          onSuccess={() => { setShowOCR(false); fetchKhachHang(); }}
        />
      )}

      {showMessageModal && (
        <MessageTemplateModal
          onClose={() => setShowMessageModal(false)}
          customer={selectedCustomer}
        />
      )}

      {showVoice && (
        <VoiceInput
          onClose={() => setShowVoice(false)}
          onSave={handleSaveFromVoice}
        />
      )}

      <BottomNav />
    </div>
  );
}
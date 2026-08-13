import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Phone,
  MapPin,
  MoreVertical,
  X,
  Upload,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  Camera,
  PhoneCall,
  MessageCircle,
} from "lucide-react";
import { supabase } from "../services/supabase";
import BottomNav from "../components/BottomNav";
import ImportModal from "../components/ImportModal";
import QuickAddModal from "../components/QuickAddModal";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import { KhachHangSkeleton } from "../components/Skeleton";
import ImageOCRModal from "../components/ImageOCRModal";
import MessageTemplateModal from "../components/MessageTemplateModal";
import VoiceInput from "../components/VoiceInput";
import { Mic } from "lucide-react";
import ProjectSuggestionModal from "../components/ProjectSuggestionModal";

const trangThaiConfig = {
  "tiem-nang": { label: "Tiềm năng", color: "bg-yellow-100 text-yellow-700" },
  "dang-cham": { label: "Đang chăm", color: "bg-blue-100 text-blue-700" },
  "sap-chot": { label: "Sắp chốt", color: "bg-green-100 text-green-700" },
  "da-mua": { label: "Đã mua", color: "bg-gray-100 text-gray-700" },
  "khong-nhu-cau": { label: "Không nhu cầu", color: "bg-red-100 text-red-700" }, // ← Thêm dòng này
};

const nguonOptions = [
  "Facebook",
  "Zalo",
  "Website",
  "Người quen giới thiệu",
  "Gọi tới",
  "Khác",
];
const nhuCauOptions = [
  "Mua chung cư",
  "Mua nhà phố",
  "Mua đất nền",
  "Thuê chung cư",
  "Thuê nhà phố",
  "Khác",
];

export default function KhachHang() {
  const [khachHangList, setKhachHangList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
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
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestionCustomer, setSuggestionCustomer] = useState(null);

  const toast = useToast();
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const [form, setForm] = useState({
    ten: "",
    sdt: "",
    trangThai: "tiem-nang",
    nhuCau: "",
    nganSach: "",
    khuVuc: "",
    nguon: "",
    ghiChu: "",
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      .from("khach_hang")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Lỗi tải dữ liệu: " + error.message);
    } else {
      setKhachHangList(data || []);
    }
    setLoading(false);
  };

  // Filter & search
  const filteredList = khachHangList.filter((kh) => {
    // Lọc theo trạng thái (gồm cả can-follow-up)
    let matchStatus = true;
    if (filterStatus === "can-follow-up") {
      const isPotential =
        kh.trang_thai === "tiem-nang" || kh.trang_thai === "dang-cham";
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const isOverdue =
        !kh.last_contacted_at || new Date(kh.last_contacted_at) < threeDaysAgo;
      matchStatus = isPotential && isOverdue;
    } else {
      matchStatus = filterStatus === "all" || kh.trang_thai === filterStatus;
    }

    const matchSearch =
      kh.ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kh.sdt.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  // Mở form thêm nhanh
  const openAddForm = () => {
    setEditingKhach(null);
    setForm({
      ten: "",
      sdt: "",
      trangThai: "tiem-nang",
      nhuCau: "",
      nganSach: "",
      khuVuc: "",
      nguon: "",
      ghiChu: "",
    });
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
      nhuCau: khach.nhu_cau || "",
      nganSach: khach.ngan_sach || "",
      khuVuc: khach.khu_vuc || "",
      nguon: khach.nguon || "",
      ghiChu: khach.ghi_chu || "",
    });
    const hasDetail =
      khach.nhu_cau ||
      khach.ngan_sach ||
      khach.khu_vuc ||
      khach.nguon ||
      khach.ghi_chu;
    setShowDetails(hasDetail);
    setShowForm(true);
  };

  // Lưu khách hàng
  const handleSave = async () => {
    if (!form.ten.trim() || !form.sdt.trim()) {
      toast.warning("Vui lòng nhập tên và số điện thoại!");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

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
        .from("khach_hang")
        .update(khachData)
        .eq("id", editingKhach.id);

      if (error) {
        toast.error("Lỗi cập nhật: " + error.message);
        return;
      }
      toast.success("Đã cập nhật khách hàng!");
    } else {
      const { error } = await supabase.from("khach_hang").insert([khachData]);

      if (error) {
        toast.error("Lỗi thêm mới: " + error.message);
        return;
      }
      toast.success("Đã thêm khách hàng mới!");
    }

    setShowForm(false);
    fetchKhachHang();
  };

  // Xác nhận xóa
  const handleDeleteRequest = (id) => {
    setConfirmState({
      isOpen: true,
      title: "Xóa khách hàng",
      message:
        "Bạn có chắc muốn xóa khách hàng này? Hành động này không thể hoàn tác.",
      onConfirm: () => performDelete(id),
    });
  };

  const performDelete = async (id) => {
    const { error } = await supabase.from("khach_hang").delete().eq("id", id);

    if (error) {
      toast.error("Lỗi xóa: " + error.message);
      return;
    }
    toast.success("Đã xóa khách hàng!");
    fetchKhachHang();
  };

  const handleMarkContacted = async (id) => {
    const { error } = await supabase
      .from("khach_hang")
      .update({ last_contacted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Lỗi cập nhật: " + error.message);
    } else {
      toast.success("Đã cập nhật liên hệ!");
      fetchKhachHang();
    }
  };

  const countCanFollowUp = khachHangList.filter((kh) => {
    const isPotential =
      kh.trang_thai === "tiem-nang" || kh.trang_thai === "dang-cham";
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const isOverdue =
      !kh.last_contacted_at || new Date(kh.last_contacted_at) < threeDaysAgo;
    return isPotential && isOverdue;
  }).length;

  const handleSaveFromVoice = async (customerData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("khach_hang").insert({
      ten: customerData.ten,
      sdt: customerData.sdt,
      nhu_cau: customerData.nhuCau,
      ngan_sach: customerData.nganSach,
      khu_vuc: customerData.khuVuc,
      ghi_chu: customerData.ghiChu,
      trang_thai: customerData.trangThai || "tiem-nang",
      user_id: user.id,
      last_contacted_at: new Date().toISOString(),
    });
    if (error) {
      toast.error("Lỗi lưu: " + error.message);
      return;
    }
    toast.success("Đã thêm khách hàng!");
    setShowVoice(false);
    fetchKhachHang();
  };

  // Đếm nhanh
  const countByStatus = (status) =>
    khachHangList.filter((kh) => kh.trang_thai === status).length;

  return (
        <div className="pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="glass-effect p-4 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Khách hàng
          </h1>

          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-900/20"
            >
              <Plus className="w-4 h-4" />
              Thêm
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showAddMenu ? "rotate-180" : ""}`}
              />
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 rounded-2xl shadow-2xl border border-white/10 py-2 z-30 animate-in fade-in zoom-in-95 origin-top-right">
                <button
                  onClick={() => {
                    setShowVoice(true);
                    setShowAddMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 transition-colors"
                >
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Mic className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-200">Giọng nói</p>
                    <p className="text-[10px] text-gray-500">Nói để nhập liệu</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    openAddForm();
                    setShowAddMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 transition-colors"
                >
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-200">Thêm nhanh</p>
                    <p className="text-[10px] text-gray-500">Chỉ Tên + SĐT</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowQuickAdd(true);
                    setShowAddMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 transition-colors"
                >
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-200">AI Parse</p>
                    <p className="text-[10px] text-gray-500">Tách từ đoạn chat</p>
                  </div>
                </button>
                <div className="h-px bg-white/5 my-1 mx-2"></div>
                <button
                  onClick={() => {
                    setShowImport(true);
                    setShowAddMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 flex items-center gap-3 text-gray-400"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import Excel</span>
                </button>
                <button
                  onClick={() => {
                    setShowOCR(true);
                    setShowAddMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 flex items-center gap-3 text-gray-400"
                >
                  <Camera className="w-4 h-4" />
                  <span>Quét ảnh (OCR)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border-white/5 rounded-2xl text-sm focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterStatus === "all"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                : "bg-slate-800 text-gray-400 border border-white/5"
            }`}
          >
            Tất cả ({khachHangList.length})
          </button>
          <button
            onClick={() => setFilterStatus("can-follow-up")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterStatus === "can-follow-up"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20"
                : "bg-slate-800 text-gray-400 border border-white/5"
            }`}
          >
            Cần chăm ({countCanFollowUp})
          </button>
          {Object.entries(trangThaiConfig).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterStatus === key
                  ? "bg-slate-200 text-slate-900"
                  : "bg-slate-800 text-gray-400 border border-white/5"
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách khách hàng */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <KhachHangSkeleton key={i} />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-white/10">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-gray-500 font-medium">
              {searchTerm
                ? "Không tìm thấy khách hàng phù hợp"
                : "Chưa có khách hàng nào"}
            </p>
            <button
              onClick={openAddForm}
              className="text-emerald-500 text-sm mt-4 font-bold hover:underline"
            >
              + Thêm khách hàng ngay
            </button>
          </div>
        ) : (
          filteredList.map((kh) => (
            <div
              key={kh.id}
              className="bg-white rounded-2xl p-5 border border-white/5 relative group/card transition-all hover:border-emerald-500/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-100 text-lg leading-tight mb-1">
                    {kh.ten}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{kh.sdt}</span>
                    </div>
                    {kh.khu_vuc && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px]">{kh.khu_vuc}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${trangThaiConfig[kh.trang_thai]?.color || "bg-slate-800 text-gray-400"}`}
                  >
                    {trangThaiConfig[kh.trang_thai]?.label || kh.trang_thai}
                  </span>
                  <div className="relative group/menu">
                    <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    <div className="absolute right-0 top-8 bg-slate-900 shadow-2xl rounded-2xl py-2 hidden group-hover/menu:block z-20 min-w-[140px] border border-white/10 overflow-hidden">
                      <button
                        onClick={() => openEditForm(kh)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 flex items-center gap-2 text-gray-300"
                      >
                        ✏️ Chỉnh sửa
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCustomer(kh);
                          setShowMessageModal(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 flex items-center gap-2 text-gray-300"
                      >
                        💬 Gửi tin nhắn
                      </button>
                      <button
                        onClick={() => {
                          setSuggestionCustomer(kh);
                          setShowSuggestion(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 flex items-center gap-2 text-gray-300"
                      >
                        🏠 Gợi ý dự án
                      </button>
                      <button
                        onClick={() => handleMarkContacted(kh.id)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 flex items-center gap-2 text-gray-300"
                      >
                        ✅ Đã chăm sóc
                      </button>
                      <div className="h-px bg-white/5 my-1"></div>
                      <button
                        onClick={() => handleDeleteRequest(kh.id)}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                      >
                        🗑️ Xóa khách
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-2">
                <a
                  href={`tel:${kh.sdt}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all active:scale-95"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Gọi điện
                </a>
                <a
                  href={`https://zalo.me/${kh.sdt}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 text-blue-500 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition-all active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Zalo
                </a>
              </div>

              {/* Tags & Ghi chú */}
              {(kh.nhu_cau || kh.ngan_sach || kh.ghi_chu) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {kh.nhu_cau && (
                    <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded-md">
                      {kh.nhu_cau}
                    </span>
                  )}
                  {kh.ngan_sach && (
                    <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded-md">
                      💰 {kh.ngan_sach}
                    </span>
                  )}
                  {kh.ghi_chu && (
                    <p className="w-full mt-2 text-xs text-gray-500 italic line-clamp-2 bg-slate-800/30 p-2 rounded-lg border border-white/5">
                      “ {kh.ghi_chu} ”
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ========== FORM MODAL ========== */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-slate-900 rounded-t-[32px] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl border-t border-white/10 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-100">
                    {editingKhach ? "Sửa thông tin" : "Thêm khách mới"}
                  </h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Thông tin chi tiết</p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.ten}
                  onChange={(e) => setForm({ ...form, ten: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-800 border-white/5 rounded-2xl text-sm focus:ring-emerald-500"
                  placeholder="VD: Nguyễn Văn A"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.sdt}
                  onChange={(e) => setForm({ ...form, sdt: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-800 border-white/5 rounded-2xl text-sm focus:ring-emerald-500"
                  placeholder="VD: 0901234567"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                  Trạng thái khách hàng
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(trangThaiConfig).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({ ...form, trangThai: key })}
                      className={`px-3 py-3 rounded-xl text-xs font-bold transition-all border ${
                        form.trangThai === key
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40"
                          : "bg-slate-800 border-white/5 text-gray-400 hover:bg-slate-750"
                      }`}
                    >
                      {value.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between px-4 py-4 bg-slate-800/50 rounded-2xl border border-dashed border-white/10 text-sm font-bold text-gray-400 hover:text-emerald-400 transition-colors"
              >
                <span>Mở rộng thêm chi tiết</span>
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showDetails && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                      Nhu cầu sản phẩm
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {nhuCauOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              nhuCau: form.nhuCau === option ? "" : option,
                            })
                          }
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                            form.nhuCau === option
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                              : "bg-slate-800 text-gray-400 border border-white/5"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                        Ngân sách
                      </label>
                      <input
                        type="text"
                        value={form.nganSach}
                        onChange={(e) =>
                          setForm({ ...form, nganSach: e.target.value })
                        }
                        className="w-full px-4 py-3.5 bg-slate-800 border-white/5 rounded-2xl text-sm"
                        placeholder="VD: 5 tỷ"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                        Khu vực
                      </label>
                      <input
                        type="text"
                        value={form.khuVuc}
                        onChange={(e) =>
                          setForm({ ...form, khuVuc: e.target.value })
                        }
                        className="w-full px-4 py-3.5 bg-slate-800 border-white/5 rounded-2xl text-sm"
                        placeholder="VD: Quận 7"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                      Ghi chú thêm
                    </label>
                    <textarea
                      value={form.ghiChu}
                      onChange={(e) =>
                        setForm({ ...form, ghiChu: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-3.5 bg-slate-800 border-white/5 rounded-2xl text-sm resize-none"
                      placeholder="Thông tin bổ sung về khách hàng..."
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-4 bg-slate-800 text-gray-400 rounded-2xl text-sm font-bold hover:bg-slate-750 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="flex-[2] px-4 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black hover:bg-emerald-500 active:scale-95 transition-all shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2"
                >
                  {editingKhach ? "Cập nhật ngay" : "Lưu khách hàng"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Import Modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            fetchKhachHang();
            toast.success("Import thành công!");
          }}
        />
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddModal
          onClose={() => setShowQuickAdd(false)}
          onSuccess={() => {
            setShowQuickAdd(false);
            fetchKhachHang();
            toast.success("Đã thêm khách hàng!");
          }}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
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
          onSuccess={() => {
            setShowOCR(false);
            fetchKhachHang();
          }}
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

      {showSuggestion && suggestionCustomer && (
        <ProjectSuggestionModal
          customer={suggestionCustomer}
          onClose={() => setShowSuggestion(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}

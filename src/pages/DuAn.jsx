import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  MapPin,
  MoreVertical,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Building2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { supabase } from "../services/supabase";
import BottomNav from "../components/BottomNav";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import { DuAnSkeleton } from "../components/Skeleton";
import { enrichProjectWithAI } from "../services/ai";

const loaiHinhOptions = [
  "Chung cư",
  "Nhà phố",
  "Biệt thự",
  "Đất nền",
  "Shophouse",
  "Condotel",
];
const tienDoOptions = [
  { value: "dang-mo-ban", label: "Đang mở bán" },
  { value: "sap-mo-ban", label: "Sắp mở bán" },
  { value: "da-ban-het", label: "Đã bán hết" },
  { value: "dang-xay", label: "Đang xây dựng" },
];
const tienIchOptions = [
  "Hồ bơi",
  "Gym",
  "Công viên",
  "Bảo vệ 24/7",
  "Siêu thị",
  "Trường học",
  "Khu vui chơi",
  "BBQ",
  "Spa",
  "Yoga",
  "Cà phê",
  "Nhà hàng",
];

const tienDoConfig = {
  "dang-mo-ban": { label: "Đang mở bán", color: "bg-green-100 text-green-700" },
  "sap-mo-ban": { label: "Sắp mở bán", color: "bg-yellow-100 text-yellow-700" },
  "da-ban-het": { label: "Đã bán hết", color: "bg-gray-100 text-gray-700" },
  "dang-xay": { label: "Đang xây", color: "bg-blue-100 text-blue-700" },
};

export default function DuAn() {
  const [duAnList, setDuAnList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoaiHinh, setFilterLoaiHinh] = useState("all");
  const [filterTienDo, setFilterTienDo] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingDuAn, setEditingDuAn] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCarousel, setShowCarousel] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const fileInputRef = useRef(null);
  const [aiLoading, setAiLoading] = useState(false);

  const toast = useToast();
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const [form, setForm] = useState({
    ten: "",
    chu_dau_tu: "",
    vi_tri: "",
    gia: "",
    dien_tich: "",
    loai_hinh: "Chung cư",
    tien_ich: [],
    tien_do: "dang-mo-ban",
    hinh_anh: [],
    mo_ta: "",
    link_tham_khao: "",
  });

  useEffect(() => {
    fetchDuAn();
  }, []);

  const fetchDuAn = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("du_an")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Lỗi tải dự án: " + error.message);
    } else {
      setDuAnList(data || []);
    }
    setLoading(false);
  };

  const filteredList = duAnList.filter((da) => {
    const matchLoaiHinh =
      filterLoaiHinh === "all" || da.loai_hinh === filterLoaiHinh;
    const matchTienDo = filterTienDo === "all" || da.tien_do === filterTienDo;
    const matchSearch =
      da.ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
      da.vi_tri.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (da.chu_dau_tu || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchLoaiHinh && matchTienDo && matchSearch;
  });

  const openAddForm = () => {
    setEditingDuAn(null);
    setForm({
      ten: "",
      chu_dau_tu: "",
      vi_tri: "",
      gia: "",
      dien_tich: "",
      loai_hinh: "Chung cư",
      tien_ich: [],
      tien_do: "dang-mo-ban",
      hinh_anh: [],
      mo_ta: "",
      link_tham_khao: "",
    });
    setShowForm(true);
  };

  const openEditForm = (duAn) => {
    setEditingDuAn(duAn);
    setForm({
      ten: duAn.ten || "",
      chu_dau_tu: duAn.chu_dau_tu || "",
      vi_tri: duAn.vi_tri || "",
      gia: duAn.gia || "",
      dien_tich: duAn.dien_tich || "",
      loai_hinh: duAn.loai_hinh || "Chung cư",
      tien_ich: duAn.tien_ich || [],
      tien_do: duAn.tien_do || "dang-mo-ban",
      hinh_anh: duAn.hinh_anh || [],
      mo_ta: duAn.mo_ta || "",
      link_tham_khao: duAn.link_tham_khao || "",
    });
    setShowForm(true);
  };

  const handleUploadImage = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const newImages = [...form.hinh_anh];

    for (const file of files) {
      if (newImages.length >= 10) {
        toast.warning("Tối đa 10 ảnh mỗi dự án!");
        break;
      }
      if (!file.type.startsWith("image/")) {
        toast.warning("Chỉ chấp nhận file ảnh!");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.warning("Ảnh tối đa 5MB!");
        continue;
      }

      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("du-an-anh")
        .upload(fileName, file);
      if (error) {
        toast.error("Lỗi upload ảnh: " + error.message);
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("du-an-anh").getPublicUrl(fileName);
        newImages.push(publicUrl);
      }
    }
    setForm({ ...form, hinh_anh: newImages });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (index) => {
    const newImages = form.hinh_anh.filter((_, i) => i !== index);
    setForm({ ...form, hinh_anh: newImages });
  };

  const handleSave = async () => {
    if (!form.ten.trim() || !form.vi_tri.trim() || !form.gia.trim()) {
      toast.warning("Vui lòng nhập Tên dự án, Vị trí và Giá!");
      return;
    }
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const duAnData = {
      ten: form.ten.trim(),
      chu_dau_tu: form.chu_dau_tu.trim(),
      vi_tri: form.vi_tri.trim(),
      gia: form.gia.trim(),
      dien_tich: form.dien_tich.trim(),
      loai_hinh: form.loai_hinh,
      tien_ich: form.tien_ich,
      tien_do: form.tien_do,
      hinh_anh: form.hinh_anh,
      mo_ta: form.mo_ta.trim(),
      link_tham_khao: form.link_tham_khao.trim(),
      user_id: user.id,
    };

    if (editingDuAn) {
      const { error } = await supabase
        .from("du_an")
        .update(duAnData)
        .eq("id", editingDuAn.id);
      if (error) {
        toast.error("Lỗi cập nhật: " + error.message);
        setSaving(false);
        return;
      }
      toast.success("Đã cập nhật dự án!");
    } else {
      const { error } = await supabase.from("du_an").insert([duAnData]);
      if (error) {
        toast.error("Lỗi thêm mới: " + error.message);
        setSaving(false);
        return;
      }
      toast.success("Đã thêm dự án mới!");
    }
    setSaving(false);
    setShowForm(false);
    fetchDuAn();
  };

  const handleDeleteRequest = (id) => {
    setConfirmState({
      isOpen: true,
      title: "Xóa dự án",
      message:
        "Bạn có chắc muốn xóa dự án này? Hành động này không thể hoàn tác.",
      onConfirm: () => performDelete(id),
    });
  };

  const performDelete = async (id) => {
    const { error } = await supabase.from("du_an").delete().eq("id", id);
    if (error) {
      toast.error("Lỗi xóa: " + error.message);
      return;
    }
    toast.success("Đã xóa dự án!");
    fetchDuAn();
  };

  const handleCopyInfo = (duAn) => {
    const text = `🏢 ${duAn.ten}\n📍 ${duAn.vi_tri}\n💰 ${duAn.gia}\n📐 ${duAn.dien_tich || "Đang cập nhật"}\n🏗️ ${tienDoConfig[duAn.tien_do]?.label || duAn.tien_do}`;
    navigator.clipboard.writeText(text);
    toast.info("Đã copy thông tin dự án!");
  };

  const handleAIEnrich = async () => {
    setAiLoading(true);
    try {
      const enriched = await enrichProjectWithAI({
        ten: form.ten,
        chu_dau_tu: form.chu_dau_tu,
        vi_tri: form.vi_tri,
        gia: form.gia,
        dien_tich: form.dien_tich,
        loai_hinh: form.loai_hinh,
      });

      setForm((prev) => ({
        ...prev,
        chu_dau_tu: prev.chu_dau_tu || enriched.chu_dau_tu || "",
        vi_tri: prev.vi_tri || enriched.vi_tri || "",
        gia: prev.gia || enriched.gia || "",
        dien_tich: prev.dien_tich || enriched.dien_tich || "",
        loai_hinh: prev.loai_hinh || enriched.loai_hinh || prev.loai_hinh,
        tien_ich: prev.tien_ich.length > 0 ? prev.tien_ich : (enriched.tien_ich || []),
        tien_do: prev.tien_do || enriched.tien_do || prev.tien_do,
        mo_ta: prev.mo_ta || enriched.mo_ta || "",
        link_tham_khao: prev.link_tham_khao || enriched.link_tham_khao || "",
      }));
      toast.success("Đã điền thông tin bằng AI! Hãy kiểm tra lại");
    } catch (err) {
      console.error("Lỗi AI:", err);
      toast.error("Lỗi AI: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const stats = {
    tong: duAnList.length,
    dangBan: duAnList.filter((d) => d.tien_do === "dang-mo-ban").length,
    sapBan: duAnList.filter((d) => d.tien_do === "sap-mo-ban").length,
  };

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Header & Stats */}
      <div className="glass-effect p-4 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Dự án BĐS
          </h1>
          <button
            onClick={openAddForm}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" />
            Dự án mới
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-gray-100">{stats.tong}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tổng kho</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-emerald-400">{stats.dangBan}</p>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Đang bán</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-orange-400">{stats.sapBan}</p>
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Sắp mở</p>
          </div>
        </div>

        {/* Search & Lọc */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm theo tên, vị trí, chủ đầu tư..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border-white/5 rounded-2xl text-sm focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <select
              value={filterLoaiHinh}
              onChange={(e) => setFilterLoaiHinh(e.target.value)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-gray-300 border-white/5 focus:ring-emerald-500"
            >
              <option value="all">Mọi loại hình</option>
              {loaiHinhOptions.map((lh) => (
                <option key={lh} value={lh}>{lh}</option>
              ))}
            </select>
            <select
              value={filterTienDo}
              onChange={(e) => setFilterTienDo(e.target.value)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-gray-300 border-white/5 focus:ring-emerald-500"
            >
              <option value="all">Mọi tiến độ</option>
              {tienDoOptions.map((td) => (
                <option key={td.value} value={td.value}>{td.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Danh sách dự án */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <DuAnSkeleton key={i} />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-white/10">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-gray-500 font-medium">Không tìm thấy dự án nào</p>
          </div>
        ) : (
          filteredList.map((da) => (
            <div
              key={da.id}
              className="bg-white rounded-[32px] border border-white/5 overflow-hidden group/card hover:border-emerald-500/20 transition-all"
            >
              {da.hinh_anh && da.hinh_anh.length > 0 ? (
                <div
                  className="relative h-52 bg-slate-800 cursor-pointer overflow-hidden"
                  onClick={() => {
                    setShowCarousel(da.hinh_anh);
                    setCarouselIndex(0);
                  }}
                >
                  <img
                    src={da.hinh_anh[0]}
                    alt={da.ten}
                    className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                  {da.hinh_anh.length > 1 && (
                    <span className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/10">
                      +{da.hinh_anh.length - 1} ẢNH
                    </span>
                  )}
                  <div className="absolute bottom-4 left-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${tienDoConfig[da.tien_do]?.color || "bg-slate-800 text-gray-400"}`}>
                      {tienDoConfig[da.tien_do]?.label || da.tien_do}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-2 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-100 text-xl leading-tight mb-1 group-hover/card:text-emerald-400 transition-colors">
                      {da.ten}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      {da.chu_dau_tu && (
                        <p className="text-xs font-bold text-gray-500 italic">
                          CĐT: {da.chu_dau_tu}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="truncate">{da.vi_tri}</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative group/menu">
                    <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                    <div className="absolute right-0 top-8 bg-slate-900 shadow-2xl rounded-2xl py-2 hidden group-hover/menu:block z-20 min-w-[150px] border border-white/10 overflow-hidden">
                      <button
                        onClick={() => handleCopyInfo(da)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 flex items-center gap-2 text-gray-300 transition-colors"
                      >
                        <Copy className="w-4 h-4" /> Sao chép tin
                      </button>
                      <button
                        onClick={() => openEditForm(da)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 flex items-center gap-2 text-gray-300 transition-colors"
                      >
                        ✏️ Chỉnh sửa
                      </button>
                      <div className="h-px bg-white/5 my-1"></div>
                      <button
                        onClick={() => handleDeleteRequest(da.id)}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                      >
                        🗑️ Xóa dự án
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-800/30 rounded-2xl p-3 border border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Giá bán từ</p>
                    <p className="text-lg font-black text-emerald-400">{da.gia}</p>
                  </div>
                  <div className="bg-slate-800/30 rounded-2xl p-3 border border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Diện tích</p>
                    <p className="text-lg font-black text-blue-400">{da.dien_tich || '---'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] font-black bg-slate-800 text-gray-400 px-3 py-1.5 rounded-xl border border-white/5 uppercase tracking-wider">
                    {da.loai_hinh}
                  </span>
                  {da.tien_ich &&
                    da.tien_ich.slice(0, 3).map((ti, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl border border-emerald-500/10 uppercase tracking-wider"
                      >
                        {ti}
                      </span>
                    ))}
                  {da.tien_ich && da.tien_ich.length > 3 && (
                    <span className="text-[10px] font-black text-gray-500 self-center">
                      +{da.tien_ich.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal (Dark theme) */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-slate-900 rounded-t-[32px] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl border-t border-white/10 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-100">
                    {editingDuAn ? "Sửa dự án" : "Dự án mới"}
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
              <button
                type="button"
                onClick={handleAIEnrich}
                disabled={aiLoading || !form.ten.trim()}
                className="w-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-4 rounded-2xl text-sm font-black hover:bg-indigo-600/30 disabled:opacity-30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {aiLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                TỰ ĐỘNG ĐIỀN BẰNG AI (GEMINI)
              </button>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Tên dự án *</label>
                <input
                  type="text"
                  value={form.ten}
                  onChange={(e) => setForm({ ...form, ten: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-800 border-white/5 rounded-2xl text-sm focus:ring-emerald-500"
                  placeholder="VD: Vinhomes Grand Park"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Chủ đầu tư</label>
                <input
                  type="text"
                  value={form.chu_dau_tu}
                  onChange={(e) => setForm({ ...form, chu_dau_tu: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-800 border-white/5 rounded-2xl text-sm focus:ring-emerald-500"
                  placeholder="VD: Vingroup"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Vị trí *</label>
                  <input
                    type="text"
                    value={form.vi_tri}
                    onChange={(e) => setForm({ ...form, vi_tri: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-800 border-white/5 rounded-2xl text-sm"
                    placeholder="VD: Quận 9"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Giá bán *</label>
                  <input
                    type="text"
                    value={form.gia}
                    onChange={(e) => setForm({ ...form, gia: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-800 border-white/5 rounded-2xl text-sm"
                    placeholder="VD: 3.5 Tỷ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Loại hình</label>
                  <select
                    value={form.loai_hinh}
                    onChange={(e) => setForm({ ...form, loai_hinh: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-800 border-white/5 rounded-2xl text-sm focus:ring-emerald-500"
                  >
                    {loaiHinhOptions.map((lh) => (
                      <option key={lh} value={lh}>{lh}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Diện tích</label>
                  <input
                    type="text"
                    value={form.dien_tich}
                    onChange={(e) => setForm({ ...form, dien_tich: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-800 border-white/5 rounded-2xl text-sm"
                    placeholder="VD: 75m2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Trạng thái dự án</label>
                <div className="grid grid-cols-2 gap-2">
                  {tienDoOptions.map((td) => (
                    <button
                      key={td.value}
                      type="button"
                      onClick={() => setForm({ ...form, tien_do: td.value })}
                      className={`px-3 py-3 rounded-xl text-xs font-bold transition-all border ${
                        form.tien_do === td.value
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40"
                          : "bg-slate-800 border-white/5 text-gray-400 hover:bg-slate-700"
                      }`}
                    >
                      {td.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiện ích */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Tiện ích</label>
                <div className="flex flex-wrap gap-2">
                  {tienIchOptions.map((ti) => (
                    <button
                      key={ti}
                      type="button"
                      onClick={() => {
                        const newList = form.tien_ich.includes(ti)
                          ? form.tien_ich.filter((t) => t !== ti)
                          : [...form.tien_ich, ti];
                        setForm({ ...form, tien_ich: newList });
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        form.tien_ich.includes(ti)
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                          : "bg-slate-800 border-white/5 text-gray-400 hover:bg-slate-700"
                      }`}
                    >
                      {form.tien_ich.includes(ti) && <Check className="w-3 h-3 inline mr-1" />}
                      {ti}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hình ảnh */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Hình ảnh dự án ({form.hinh_anh.length}/10)</label>
                <div className="flex flex-wrap gap-2">
                  {form.hinh_anh.map((img, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 shadow-lg group">
                      <img src={img} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ))}
                  {form.hinh_anh.length < 10 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-20 h-20 bg-slate-800 border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
                    >
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span className="text-[10px] font-bold mt-1 uppercase">Tải lên</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUploadImage} />
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Mô tả</label>
                <textarea
                  value={form.mo_ta}
                  onChange={(e) => setForm({ ...form, mo_ta: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3.5 bg-slate-800 border-white/5 rounded-2xl text-sm focus:ring-emerald-500 resize-none"
                  placeholder="Mô tả thêm về dự án..."
                />
              </div>

              {/* Link tham khảo */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Link tham khảo</label>
                <input
                  type="url"
                  value={form.link_tham_khao}
                  onChange={(e) => setForm({ ...form, link_tham_khao: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-800 border-white/5 rounded-2xl text-sm"
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-4 bg-slate-800 text-gray-400 rounded-2xl text-sm font-bold hover:bg-slate-700 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-[2] px-4 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black hover:bg-emerald-500 active:scale-95 transition-all shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : editingDuAn ? (
                    "CẬP NHẬT DỰ ÁN"
                  ) : (
                    "LƯU DỰ ÁN"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Carousel */}
      {showCarousel && (
        <div className="fixed inset-0 bg-black z-30 flex items-center justify-center">
          <button
            onClick={() => setShowCarousel(null)}
            className="absolute top-4 right-4 z-40 p-2 bg-white/20 rounded-full hover:bg-white/40"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {showCarousel.length > 1 && (
            <>
              <button
                onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                disabled={carouselIndex === 0}
                className="absolute left-4 z-40 p-2 bg-white/20 rounded-full hover:bg-white/40 disabled:opacity-30"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={() =>
                  setCarouselIndex(
                    Math.min(showCarousel.length - 1, carouselIndex + 1),
                  )
                }
                disabled={carouselIndex === showCarousel.length - 1}
                className="absolute right-4 z-40 p-2 bg-white/20 rounded-full hover:bg-white/40 disabled:opacity-30"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}
          <img
            src={showCarousel[carouselIndex]}
            alt={`Ảnh ${carouselIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
            {carouselIndex + 1} / {showCarousel.length}
          </div>
        </div>
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

      <BottomNav />
    </div>
  );
}
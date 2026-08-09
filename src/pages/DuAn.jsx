import { useState, useEffect, useRef } from 'react';
import { Plus, Search, MapPin, DollarSign, Home, MoreVertical, X, Upload, ChevronLeft, ChevronRight, Copy, ExternalLink, Building2, Check } from 'lucide-react';
import { supabase } from '../services/supabase';
import BottomNav from '../components/BottomNav';

const loaiHinhOptions = ['Chung cư', 'Nhà phố', 'Biệt thự', 'Đất nền', 'Shophouse', 'Condotel'];
const tienDoOptions = [
  { value: 'dang-mo-ban', label: 'Đang mở bán' },
  { value: 'sap-mo-ban', label: 'Sắp mở bán' },
  { value: 'da-ban-het', label: 'Đã bán hết' },
  { value: 'dang-xay', label: 'Đang xây dựng' },
];
const tienIchOptions = ['Hồ bơi', 'Gym', 'Công viên', 'Bảo vệ 24/7', 'Siêu thị', 'Trường học', 'Khu vui chơi', 'BBQ', 'Spa', 'Yoga', 'Cà phê', 'Nhà hàng'];

const tienDoConfig = {
  'dang-mo-ban': { label: 'Đang mở bán', color: 'bg-green-100 text-green-700' },
  'sap-mo-ban': { label: 'Sắp mở bán', color: 'bg-yellow-100 text-yellow-700' },
  'da-ban-het': { label: 'Đã bán hết', color: 'bg-gray-100 text-gray-700' },
  'dang-xay': { label: 'Đang xây', color: 'bg-blue-100 text-blue-700' },
};

export default function DuAn() {
  const [duAnList, setDuAnList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoaiHinh, setFilterLoaiHinh] = useState('all');
  const [filterTienDo, setFilterTienDo] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDuAn, setEditingDuAn] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCarousel, setShowCarousel] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    ten: '',
    chu_dau_tu: '',
    vi_tri: '',
    gia: '',
    dien_tich: '',
    loai_hinh: 'Chung cư',
    tien_ich: [],
    tien_do: 'dang-mo-ban',
    hinh_anh: [],
    mo_ta: '',
    link_tham_khao: '',
  });

  // Load dự án
  useEffect(() => {
    fetchDuAn();
  }, []);

  const fetchDuAn = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('du_an')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Lỗi load dự án:', error);
    } else {
      setDuAnList(data || []);
    }
    setLoading(false);
  };

  // Filter & search
  const filteredList = duAnList.filter(da => {
    const matchLoaiHinh = filterLoaiHinh === 'all' || da.loai_hinh === filterLoaiHinh;
    const matchTienDo = filterTienDo === 'all' || da.tien_do === filterTienDo;
    const matchSearch = da.ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        da.vi_tri.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (da.chu_dau_tu || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchLoaiHinh && matchTienDo && matchSearch;
  });

  // Mở form thêm mới
  const openAddForm = () => {
    setEditingDuAn(null);
    setForm({ ten: '', chu_dau_tu: '', vi_tri: '', gia: '', dien_tich: '', loai_hinh: 'Chung cư', tien_ich: [], tien_do: 'dang-mo-ban', hinh_anh: [], mo_ta: '', link_tham_khao: '' });
    setShowForm(true);
  };

  // Mở form sửa
  const openEditForm = (duAn) => {
    setEditingDuAn(duAn);
    setForm({
      ten: duAn.ten || '',
      chu_dau_tu: duAn.chu_dau_tu || '',
      vi_tri: duAn.vi_tri || '',
      gia: duAn.gia || '',
      dien_tich: duAn.dien_tich || '',
      loai_hinh: duAn.loai_hinh || 'Chung cư',
      tien_ich: duAn.tien_ich || [],
      tien_do: duAn.tien_do || 'dang-mo-ban',
      hinh_anh: duAn.hinh_anh || [],
      mo_ta: duAn.mo_ta || '',
      link_tham_khao: duAn.link_tham_khao || '',
    });
    setShowForm(true);
  };

  // Upload ảnh lên Supabase Storage
  const handleUploadImage = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const newImages = [...form.hinh_anh];

    for (const file of files) {
      // Giới hạn 10 ảnh
      if (newImages.length >= 10) {
        alert('Tối đa 10 ảnh mỗi dự án!');
        break;
      }

      // Kiểm tra định dạng
      if (!file.type.startsWith('image/')) {
        alert('Chỉ chấp nhận file ảnh!');
        continue;
      }

      // Kiểm tra dung lượng (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Ảnh tối đa 5MB!');
        continue;
      }

      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('du-an-anh')
        .upload(fileName, file);

      if (error) {
        console.error('Lỗi upload:', error);
        alert('Lỗi upload ảnh: ' + error.message);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('du-an-anh')
          .getPublicUrl(fileName);
        newImages.push(publicUrl);
      }
    }

    setForm({ ...form, hinh_anh: newImages });
    setUploading(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Xóa ảnh
  const handleRemoveImage = (index) => {
    const newImages = form.hinh_anh.filter((_, i) => i !== index);
    setForm({ ...form, hinh_anh: newImages });
  };

  // Lưu dự án
  const handleSave = async () => {
    if (!form.ten.trim() || !form.vi_tri.trim() || !form.gia.trim()) {
      alert('Vui lòng nhập Tên dự án, Vị trí và Giá!');
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

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
        .from('du_an')
        .update(duAnData)
        .eq('id', editingDuAn.id);
      if (error) {
        alert('Lỗi cập nhật: ' + error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('du_an')
        .insert([duAnData]);
      if (error) {
        alert('Lỗi thêm mới: ' + error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setShowForm(false);
    fetchDuAn();
  };

  // Xóa dự án
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa dự án này?')) return;
    const { error } = await supabase.from('du_an').delete().eq('id', id);
    if (error) {
      alert('Lỗi xóa: ' + error.message);
      return;
    }
    fetchDuAn();
  };

  // Copy thông tin nhanh
  const handleCopyInfo = (duAn) => {
    const text = `🏢 ${duAn.ten}\n📍 ${duAn.vi_tri}\n💰 ${duAn.gia}\n📐 ${duAn.dien_tich || 'Đang cập nhật'}\n🏗️ ${tienDoConfig[duAn.tien_do]?.label || duAn.tien_do}`;
    navigator.clipboard.writeText(text);
    alert('Đã copy thông tin dự án!');
  };

  // Đếm nhanh
  const stats = {
    tong: duAnList.length,
    dangBan: duAnList.filter(d => d.tien_do === 'dang-mo-ban').length,
    sapBan: duAnList.filter(d => d.tien_do === 'sap-mo-ban').length,
  };

  return (
    <div className="pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-800">Dự án</h1>
          <button
            onClick={openAddForm}
            className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Thêm dự án
          </button>
        </div>

        {/* Stats mini */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-emerald-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-emerald-700">{stats.tong}</p>
            <p className="text-xs text-emerald-600">Tổng</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-green-700">{stats.dangBan}</p>
            <p className="text-xs text-green-600">Đang bán</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-yellow-700">{stats.sapBan}</p>
            <p className="text-xs text-yellow-600">Sắp bán</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, vị trí, chủ đầu tư..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {/* Lọc loại hình */}
          <select
            value={filterLoaiHinh}
            onChange={(e) => setFilterLoaiHinh(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Tất cả loại hình</option>
            {loaiHinhOptions.map(lh => (
              <option key={lh} value={lh}>{lh}</option>
            ))}
          </select>
          {/* Lọc tiến độ */}
          <select
            value={filterTienDo}
            onChange={(e) => setFilterTienDo(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Tất cả tiến độ</option>
            {tienDoOptions.map(td => (
              <option key={td.value} value={td.value}>{td.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Danh sách dự án */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-3">Đang tải...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏢</div>
            <p className="text-gray-400">
              {searchTerm ? 'Không tìm thấy dự án phù hợp' : 'Chưa có dự án nào'}
            </p>
            <button onClick={openAddForm} className="text-emerald-600 text-sm mt-2 font-medium">
              + Thêm dự án đầu tiên
            </button>
          </div>
        ) : (
          filteredList.map((da) => (
            <div key={da.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Ảnh thumbnail */}
              {da.hinh_anh && da.hinh_anh.length > 0 && (
                <div
                  className="relative h-40 bg-gray-200 cursor-pointer"
                  onClick={() => { setShowCarousel(da.hinh_anh); setCarouselIndex(0); }}
                >
                  <img src={da.hinh_anh[0]} alt={da.ten} className="w-full h-full object-cover" />
                  {da.hinh_anh.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      +{da.hinh_anh.length - 1} ảnh
                    </span>
                  )}
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{da.ten}</h3>
                    {da.chu_dau_tu && (
                      <p className="text-xs text-gray-400 mt-0.5">CĐT: {da.chu_dau_tu}</p>
                    )}
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{da.vi_tri}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-emerald-600 font-medium mt-0.5">
                      <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{da.gia}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tienDoConfig[da.tien_do]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {tienDoConfig[da.tien_do]?.label || da.tien_do}
                    </span>
                    <div className="relative group/menu">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg py-1 hidden group-hover/menu:block z-10 min-w-[120px] border">
                        <button onClick={() => handleCopyInfo(da)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                          <Copy className="w-3.5 h-3.5" /> Copy info
                        </button>
                        <button onClick={() => openEditForm(da)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                          ✏️ Sửa
                        </button>
                        <button onClick={() => handleDelete(da.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2">
                          🗑️ Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1">
                    <Home className="w-3 h-3" /> {da.loai_hinh}
                  </span>
                  {da.dien_tich && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">📐 {da.dien_tich}</span>
                  )}
                  {da.tien_ich && da.tien_ich.slice(0, 3).map((ti, i) => (
                    <span key={i} className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">✓ {ti}</span>
                  ))}
                  {da.tien_ich && da.tien_ich.length > 3 && (
                    <span className="text-xs text-gray-400">+{da.tien_ich.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========== FORM THÊM/SỬA ========== */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {editingDuAn ? 'Sửa dự án' : 'Thêm dự án mới'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Tên dự án */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên dự án <span className="text-red-500">*</span></label>
                <input type="text" value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="VD: Vinhomes Grand Park" />
              </div>

              {/* Chủ đầu tư */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đầu tư</label>
                <input type="text" value={form.chu_dau_tu} onChange={(e) => setForm({ ...form, chu_dau_tu: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="VD: Vingroup" />
              </div>

              {/* Vị trí + Giá */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí <span className="text-red-500">*</span></label>
                  <input type="text" value={form.vi_tri} onChange={(e) => setForm({ ...form, vi_tri: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="VD: Quận 9, TP.Thủ Đức" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá <span className="text-red-500">*</span></label>
                  <input type="text" value={form.gia} onChange={(e) => setForm({ ...form, gia: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="VD: 2-5 tỷ/căn" />
                </div>
              </div>

              {/* Diện tích + Loại hình */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diện tích</label>
                  <input type="text" value={form.dien_tich} onChange={(e) => setForm({ ...form, dien_tich: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="VD: 60-120m²" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại hình <span className="text-red-500">*</span></label>
                  <select value={form.loai_hinh} onChange={(e) => setForm({ ...form, loai_hinh: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {loaiHinhOptions.map(lh => (
                      <option key={lh} value={lh}>{lh}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tiến độ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiến độ</label>
                <div className="flex gap-2 flex-wrap">
                  {tienDoOptions.map(td => (
                    <button key={td.value} type="button"
                      onClick={() => setForm({ ...form, tien_do: td.value })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        form.tien_do === td.value
                          ? 'ring-2 ring-emerald-500 ring-offset-1 ' + tienDoConfig[td.value].color
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {td.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiện ích */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiện ích</label>
                <div className="flex flex-wrap gap-1.5">
                  {tienIchOptions.map(ti => (
                    <button key={ti} type="button"
                      onClick={() => {
                        const newList = form.tien_ich.includes(ti)
                          ? form.tien_ich.filter(t => t !== ti)
                          : [...form.tien_ich, ti];
                        setForm({ ...form, tien_ich: newList });
                      }}
                      className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        form.tien_ich.includes(ti)
                          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {form.tien_ich.includes(ti) && <Check className="w-3 h-3 inline mr-1" />}
                      {ti}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload ảnh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh ({form.hinh_anh.length}/10)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.hinh_anh.map((img, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                      <img src={img} alt={`Ảnh ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {form.hinh_anh.length < 10 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors"
                    >
                      {uploading ? (
                        <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span className="text-xs mt-0.5">Thêm</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleUploadImage}
                />
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea value={form.mo_ta} onChange={(e) => setForm({ ...form, mo_ta: e.target.value })} rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Mô tả thêm về dự án..." />
              </div>

              {/* Link tham khảo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link tham khảo</label>
                <input type="url" value={form.link_tham_khao} onChange={(e) => setForm({ ...form, link_tham_khao: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://..." />
              </div>
            </div>

            {/* Nút lưu */}
            <div className="flex gap-3 mt-5 pt-3 border-t border-gray-100">
              <button onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                Hủy
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-[2] px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? (
                  <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> Đang lưu...</>
                ) : (
                  <>{editingDuAn ? 'Cập nhật' : 'Lưu dự án'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== CAROUSEL XEM ẢNH ========== */}
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
                onClick={() => setCarouselIndex(Math.min(showCarousel.length - 1, carouselIndex + 1))}
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

          {/* Chỉ số ảnh */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
            {carouselIndex + 1} / {showCarousel.length}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
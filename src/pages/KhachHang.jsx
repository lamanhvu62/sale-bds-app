import { useState, useEffect } from 'react';
import { Plus, Search, Phone, MapPin, MoreVertical, X } from 'lucide-react';
import { supabase } from '../services/supabase';
import BottomNav from '../components/BottomNav';

const trangThaiConfig = {
  'tiem-nang': { label: 'Tiềm năng', color: 'bg-yellow-100 text-yellow-700' },
  'dang-cham': { label: 'Đang chăm', color: 'bg-blue-100 text-blue-700' },
  'sap-chot': { label: 'Sắp chốt', color: 'bg-green-100 text-green-700' },
  'da-mua': { label: 'Đã mua', color: 'bg-gray-100 text-gray-700' },
};

export default function KhachHang() {
  const [khachHangList, setKhachHangList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingKhach, setEditingKhach] = useState(null);

  const [form, setForm] = useState({
    ten: '',
    sdt: '',
    nhuCau: '',
    nganSach: '',
    khuVuc: '',
    nguon: '',
    trangThai: 'tiem-nang',
    ghiChu: '',
  });

  // Load khách hàng từ Supabase
  useEffect(() => {
    fetchKhachHang();
  }, []);

  const fetchKhachHang = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('khach_hang')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Lỗi load khách hàng:', error);
    } else {
      setKhachHangList(data || []);
    }
    setLoading(false);
  };

  // Filter & search
  const filteredList = khachHangList.filter(kh => {
    const matchStatus = filterStatus === 'all' || kh.trang_thai === filterStatus;
    const matchSearch = kh.ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        kh.sdt.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  const openAddForm = () => {
    setEditingKhach(null);
    setForm({ ten: '', sdt: '', nhuCau: '', nganSach: '', khuVuc: '', nguon: '', trangThai: 'tiem-nang', ghiChu: '' });
    setShowForm(true);
  };

  const openEditForm = (khach) => {
    setEditingKhach(khach);
    setForm({
      ten: khach.ten,
      sdt: khach.sdt,
      nhuCau: khach.nhu_cau || '',
      nganSach: khach.ngan_sach || '',
      khuVuc: khach.khu_vuc || '',
      nguon: khach.nguon || '',
      trangThai: khach.trang_thai,
      ghiChu: khach.ghi_chu || '',
    });
    setShowForm(true);
  };

  // Lưu khách hàng
  const handleSave = async () => {
    if (!form.ten || !form.sdt) {
      alert('Vui lòng nhập tên và số điện thoại!');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const khachData = {
      ten: form.ten,
      sdt: form.sdt,
      nhu_cau: form.nhuCau,
      ngan_sach: form.nganSach,
      khu_vuc: form.khuVuc,
      nguon: form.nguon,
      trang_thai: form.trangThai,
      ghi_chu: form.ghiChu,
      user_id: user.id,
    };

    if (editingKhach) {
      // Cập nhật
      const { error } = await supabase
        .from('khach_hang')
        .update(khachData)
        .eq('id', editingKhach.id);

      if (error) {
        alert('Lỗi cập nhật: ' + error.message);
        return;
      }
    } else {
      // Thêm mới
      const { error } = await supabase
        .from('khach_hang')
        .insert([khachData]);

      if (error) {
        alert('Lỗi thêm mới: ' + error.message);
        return;
      }
    }

    setShowForm(false);
    fetchKhachHang(); // Load lại danh sách
  };

  // Xóa khách hàng
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa khách hàng này?')) return;

    const { error } = await supabase
      .from('khach_hang')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Lỗi xóa: ' + error.message);
      return;
    }

    fetchKhachHang(); // Load lại danh sách
  };

  return (
    <div className="pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-800">Khách hàng</h1>
          <button
            onClick={openAddForm}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
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

        {/* Filter theo trạng thái */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              filterStatus === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Tất cả
          </button>
          {Object.entries(trangThaiConfig).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                filterStatus === key ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách khách hàng */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-3">Đang tải...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Chưa có khách hàng nào</p>
            <button onClick={openAddForm} className="text-emerald-600 text-sm mt-2">
              + Thêm khách hàng đầu tiên
            </button>
          </div>
        ) : (
          filteredList.map((kh) => (
            <div key={kh.id} className="bg-white rounded-xl p-4 shadow-sm relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{kh.ten}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{kh.sdt}</span>
                  </div>
                  {kh.khu_vuc && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{kh.khu_vuc}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${trangThaiConfig[kh.trang_thai]?.color}`}>
                    {trangThaiConfig[kh.trang_thai]?.label}
                  </span>
                  <div className="relative group">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg py-1 hidden group-hover:block z-10 min-w-[100px]">
                      <button
                        onClick={() => openEditForm(kh)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(kh.id)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {kh.nhu_cau && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{kh.nhu_cau}</span>}
                {kh.ngan_sach && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{kh.ngan_sach}</span>}
                {kh.nguon && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{kh.nguon}</span>}
              </div>

              {kh.ghi_chu && (
                <p className="mt-2 text-xs text-gray-400 italic">📝 {kh.ghi_chu}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Form Modal (giữ nguyên giao diện, chỉ sửa màu emerald) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {editingKhach ? 'Sửa khách hàng' : 'Thêm khách hàng mới'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng *</label>
                <input type="text" value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nhập tên khách hàng" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                <input type="text" value={form.sdt} onChange={(e) => setForm({ ...form, sdt: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nhập số điện thoại" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhu cầu</label>
                <select value={form.nhuCau} onChange={(e) => setForm({ ...form, nhuCau: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Chọn nhu cầu</option>
                  <option value="Mua chung cư">Mua chung cư</option>
                  <option value="Mua nhà phố">Mua nhà phố</option>
                  <option value="Mua đất nền">Mua đất nền</option>
                  <option value="Thuê chung cư">Thuê chung cư</option>
                  <option value="Thuê nhà phố">Thuê nhà phố</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngân sách</label>
                  <input type="text" value={form.nganSach} onChange={(e) => setForm({ ...form, nganSach: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="VD: 2-3 tỷ" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực</label>
                  <input type="text" value={form.khuVuc} onChange={(e) => setForm({ ...form, khuVuc: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="VD: Quận 2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn khách</label>
                  <select value={form.nguon} onChange={(e) => setForm({ ...form, nguon: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Chọn nguồn</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Zalo">Zalo</option>
                    <option value="Website">Website</option>
                    <option value="Người quen giới thiệu">Người quen giới thiệu</option>
                    <option value="Gọi tới">Gọi tới</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select value={form.trangThai} onChange={(e) => setForm({ ...form, trangThai: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="tiem-nang">Tiềm năng</option>
                    <option value="dang-cham">Đang chăm</option>
                    <option value="sap-chot">Sắp chốt</option>
                    <option value="da-mua">Đã mua</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ghi chú thêm về khách hàng..." />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                Hủy
              </button>
              <button onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                {editingKhach ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
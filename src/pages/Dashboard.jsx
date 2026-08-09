import { useState, useEffect } from 'react';
import { Building2, Users, Calendar, Calculator, LogOut, TrendingUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const menuItems = [
  { icon: Users, label: 'Khách hàng', path: '/khach-hang', color: 'bg-green-500' },
  { icon: Building2, label: 'Dự án', path: '/du-an', color: 'bg-blue-500' },
  { icon: Calendar, label: 'Lịch hẹn', path: '/lich-hen', color: 'bg-orange-500' },
  { icon: Calculator, label: 'Tính toán', path: '/calculator', color: 'bg-purple-500' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({
    tongKhach: 0,
    canFollowUp: 0,
    tongDuAn: 0,
    dangMoBan: 0,
    lichHenHomNay: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Bạn');

      // Tổng khách hàng
      const { count: tongKhach } = await supabase
        .from('khach_hang')
        .select('*', { count: 'exact', head: true });

      // Khách cần follow-up (tiềm năng + đang chăm)
      const { count: canFollowUp } = await supabase
        .from('khach_hang')
        .select('*', { count: 'exact', head: true })
        .in('trang_thai', ['tiem-nang', 'dang-cham']);

      // Tổng dự án
      const { count: tongDuAn } = await supabase
        .from('du_an')
        .select('*', { count: 'exact', head: true });

      // Dự án đang mở bán
      const { count: dangMoBan } = await supabase
        .from('du_an')
        .select('*', { count: 'exact', head: true })
        .eq('tien_do', 'dang-mo-ban');

      // Lịch hẹn hôm nay (sẽ luôn là 0 cho đến khi tạo bảng lich_hen)
      const today = new Date().toISOString().split('T')[0];
      const { count: lichHenHomNay } = await supabase
        .from('lich_hen')
        .select('*', { count: 'exact', head: true })
        .gte('thoi_gian', `${today}T00:00:00`)
        .lte('thoi_gian', `${today}T23:59:59`)
        .eq('da_hoan_thanh', false);

      setStats({
        tongKhach: tongKhach || 0,
        canFollowUp: canFollowUp || 0,
        tongDuAn: tongDuAn || 0,
        dangMoBan: dangMoBan || 0,
        lichHenHomNay: lichHenHomNay || 0,
      });
    } catch (error) {
      console.error('Lỗi fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="p-4 max-w-lg mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">SaleBDS</h1>
          <p className="text-sm text-gray-500">Xin chào, {userName}!</p>
        </div>
        <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg">
          <LogOut className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-16 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-20"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-500">Khách hàng</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.tongKhach}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.canFollowUp} cần chăm sóc</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">Cần follow-up</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.canFollowUp}</p>
            <p className="text-xs text-gray-400 mt-1">Tiềm năng & đang chăm</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-gray-500">Dự án</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.tongDuAn}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.dangMoBan} đang mở bán</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-500">Lịch hẹn</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.lichHenHomNay}</p>
            <p className="text-xs text-gray-400 mt-1">Hôm nay</p>
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Chức năng</h2>
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all active:scale-95 text-center"
            >
              <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-700">{item.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
        <p className="font-semibold mb-3">⚡ Thêm nhanh</p>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/khach-hang')}
            className="flex-1 bg-white/20 hover:bg-white/30 rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            + Khách hàng
          </button>
          <button
            onClick={() => navigate('/du-an')}
            className="flex-1 bg-white/20 hover:bg-white/30 rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            + Dự án
          </button>
        </div>
      </div>
    </div>
  );
}
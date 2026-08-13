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

      // Khách cần follow-up: trạng thái tiềm năng/đang chăm và đã quá 3 ngày chưa liên hệ
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

      const { count: canFollowUp } = await supabase
        .from('khach_hang')
        .select('*', { count: 'exact', head: true })
        .in('trang_thai', ['tiem-nang', 'dang-cham'])
        .or(`last_contacted_at.lt.${threeDaysAgo},last_contacted_at.is.null`);

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
        <div className="p-4 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 glass-effect p-4 -mx-4 -mt-4 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">SaleBDS</h1>
          <p className="text-xs text-gray-500 font-medium">Xin chào, {userName}!</p>
        </div>
        <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <LogOut className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse border border-white/5">
              <div className="h-4 bg-slate-700 rounded w-16 mb-4"></div>
              <div className="h-8 bg-slate-700 rounded w-12 mb-2"></div>
              <div className="h-3 bg-slate-800 rounded w-20"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-white/5 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-green-500/10 rounded-lg">
                <Users className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.tongKhach}</p>
            <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
               {stats.canFollowUp} cần chăm sóc
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Follow-up</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.canFollowUp}</p>
            <p className="text-[10px] text-gray-400 mt-2">Tiềm năng & đang chăm</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-white/5 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <Building2 className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dự án</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.tongDuAn}</p>
            <p className="text-[10px] text-gray-400 mt-2">{stats.dangMoBan} đang mở bán</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-white/5 hover:border-orange-500/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-orange-500/10 rounded-lg">
                <Clock className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lịch hẹn</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.lichHenHomNay}</p>
            <p className="text-[10px] text-gray-400 mt-2">Trong hôm nay</p>
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="mb-8">
        <h2 className="text-[11px] font-bold text-slate-500 mb-4 uppercase tracking-[0.2em] px-1">Chức năng chính</h2>
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-2xl p-5 border border-white/5 hover:border-white/20 transition-all active:scale-[0.97] group"
            >
              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-bold text-gray-700 tracking-tight">{item.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
        <div className="relative z-10">
          <p className="text-lg font-black mb-4 flex items-center gap-2">
            
            Thao tác nhanh
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/khach-hang')}
              className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl py-3 text-sm font-bold transition-all active:scale-95"
            >
              + Khách hàng
            </button>
            <button
              onClick={() => navigate('/du-an')}
              className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl py-3 text-sm font-bold transition-all active:scale-95"
            >
              + Dự án
            </button>
          </div>
        </div>
      </div>
    </div>

  );
}
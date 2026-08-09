import { useState, useEffect } from 'react';
import { Building2, Users, Calendar, Calculator, LogOut } from 'lucide-react';
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
  const [stats, setStats] = useState({ tong: 0, canFollowUp: 0 });

  useEffect(() => {
    // Lấy thông tin user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email);
      } else {
        navigate('/');
      }
    });

    // TODO: Lấy số liệu thật từ Supabase
    setStats({ tong: 3, canFollowUp: 2 });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">SaleBDS</h1>
          <p className="text-sm text-gray-500">Xin chào, {userName}!</p>
        </div>
        <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg">
          <LogOut className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-800">{stats.tong}</p>
          <p className="text-xs text-gray-500">Tổng khách hàng</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-800">{stats.canFollowUp}</p>
          <p className="text-xs text-gray-500">Cần follow-up</p>
        </div>
      </div>

      {/* Menu */}
      <div className="grid grid-cols-2 gap-3">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
              <item.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-700">{item.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
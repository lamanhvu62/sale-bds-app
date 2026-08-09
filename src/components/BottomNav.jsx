import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Building2, Calendar, Calculator, LayoutDashboard } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard' },
  { icon: Users, label: 'Khách hàng', path: '/khach-hang' },
  { icon: Building2, label: 'Dự án', path: '/du-an' },
  { icon: Calendar, label: 'Lịch hẹn', path: '/lich-hen' },
  { icon: Calculator, label: 'Tính toán', path: '/calculator' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 backdrop-blur px-2 py-2 flex justify-around items-center max-w-lg mx-auto">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
              isActive ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
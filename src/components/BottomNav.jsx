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
    <div className="fixed bottom-0 left-0 right-0 glass-effect border-t border-white/5 px-2 py-3 flex justify-around items-center max-w-lg mx-auto z-10 rounded-t-[24px]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1.5 px-4 py-1 rounded-xl transition-all duration-300 relative ${isActive ? 'text-emerald-400 scale-110' : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            {isActive && (
              <span className="absolute -top-1 w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]"></span>
            )}
            <item.icon className={`w-5 h-5 ${isActive ? 'fill-emerald-400/10' : ''}`} />
            <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-50'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
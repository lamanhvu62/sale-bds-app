import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KhachHang from './pages/KhachHang';
import DuAn from './pages/DuAn';
import LichHen from './pages/LichHen';
import Calculator from './pages/Calculator';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra session hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Lắng nghe thay đổi auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/khach-hang" element={user ? <KhachHang /> : <Navigate to="/" />} />
          <Route path="/du-an" element={user ? <DuAn /> : <Navigate to="/" />} />
          <Route path="/lich-hen" element={user ? <LichHen /> : <Navigate to="/" />} />
          <Route path="/calculator" element={user ? <Calculator /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
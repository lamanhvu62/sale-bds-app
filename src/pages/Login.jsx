import { useState } from 'react';
import { supabase } from '../services/supabase';
import { Building2 } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      
      if (error) throw error;
      
      // Supabase OAuth sẽ redirect sang Google, không cần navigate ở đây
    } catch (error) {
      console.error('Login failed:', error.message);
      alert('Đăng nhập thất bại: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">SaleBDS</h1>
          <p className="text-slate-400 mt-2">Ứng dụng dành cho sale bất động sản</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-6 py-3 flex items-center justify-center gap-3 hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span className="text-slate-200 font-medium">
            {loading ? 'Đang chuyển hướng...' : 'Đăng nhập với Google'}
          </span>
        </button>

        <p className="text-xs text-slate-500 mt-6">
          Dùng tài khoản Google để đăng nhập
        </p>
      </div>
    </div>
  );
}
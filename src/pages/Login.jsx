import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">SaleBDS</h1>
          <p className="text-gray-500 mt-2">Ứng dụng dành cho sale bất động sản</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-gray-300 rounded-lg px-6 py-3 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span className="text-gray-700 font-medium">
            {loading ? 'Đang chuyển hướng...' : 'Đăng nhập với Google'}
          </span>
        </button>

        <p className="text-xs text-gray-400 mt-6">
          Dùng tài khoản Google để đăng nhập
        </p>
      </div>
    </div>
  );
}
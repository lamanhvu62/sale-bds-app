import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, MapPin, DollarSign, Home, ExternalLink, Copy } from 'lucide-react';
import { supabase } from '../services/supabase';
import { suggestSingleProjectForCustomer } from '../services/ai';
import { useToast } from './Toast';

export default function ProjectSuggestionModal({ customer, onClose }) {
  const [loading, setLoading] = useState(true);
  const [suggestion, setSuggestion] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchSuggestion();
  }, []);

  const fetchSuggestion = async () => {
    setLoading(true);
    try {
      // Lấy danh sách dự án của user
      const { data: projects, error: projectError } = await supabase
        .from('du_an')
        .select('id, ten, vi_tri, gia, dien_tich, loai_hinh, tien_ich, tien_do, mo_ta')
        .eq('user_id', (await supabase.auth.getUser()).data.user.id);

      if (projectError) throw projectError;
      if (!projects || projects.length === 0) {
        toast.warning('Chưa có dự án nào để gợi ý');
        onClose();
        return;
      }

      const result = await suggestSingleProjectForCustomer(customer, projects);
      setSuggestion(result);
    } catch (error) {
      console.error('Lỗi gợi ý dự án:', error);
      toast.error('Lỗi: ' + error.message);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!suggestion) return;
    const text = `🏢 Dự án phù hợp: ${suggestion.ten}\n📍 Vị trí: ${suggestion.vi_tri || ''}\n💰 Giá: ${suggestion.gia || ''}\n📝 Lý do: ${suggestion.ly_do || ''}`;
    navigator.clipboard.writeText(text);
    toast.success('Đã copy gợi ý!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-20 flex items-end justify-center overflow-hidden">
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto overflow-x-hidden shadow-2xl box-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Gợi ý dự án phù hợp
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Thông tin khách hàng */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-500">Khách hàng:</p>
          <p className="font-medium">{customer.ten} - {customer.sdt}</p>
          {customer.nhu_cau && <p className="text-sm text-gray-600">Nhu cầu: {customer.nhu_cau}</p>}
          {customer.ngan_sach && <p className="text-sm text-gray-600">Ngân sách: {customer.ngan_sach}</p>}
          {customer.khu_vuc && <p className="text-sm text-gray-600">Khu vực: {customer.khu_vuc}</p>}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">AI đang tìm dự án phù hợp...</p>
          </div>
        ) : suggestion ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
              <h3 className="text-lg font-bold text-emerald-800">{suggestion.ten}</h3>
              <div className="flex flex-wrap gap-3 text-sm text-gray-700 mt-2">
                {suggestion.vi_tri && (
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-emerald-600" /> {suggestion.vi_tri}</span>
                )}
                {suggestion.gia && (
                  <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-emerald-600" /> {suggestion.gia}</span>
                )}
                {suggestion.loai_hinh && (
                  <span className="flex items-center gap-1"><Home className="w-4 h-4 text-emerald-600" /> {suggestion.loai_hinh}</span>
                )}
              </div>
            </div>
            {suggestion.ly_do && (
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-sm text-gray-600"><span className="font-semibold">💡 Lý do phù hợp:</span> {suggestion.ly_do}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleCopy} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                <Copy className="w-4 h-4" /> Copy
              </button>
              <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">Không thể gợi ý dự án.</p>
          </div>
        )}
      </div>
    </div>
  );
}
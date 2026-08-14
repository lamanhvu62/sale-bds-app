import { useState } from 'react';
import { X, Zap, Sparkles, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../services/supabase';

const trangThaiConfig = {
  'tiem-nang': { label: 'Tiềm năng', color: 'bg-yellow-100 text-yellow-700' },
  'dang-cham': { label: 'Đang chăm', color: 'bg-blue-100 text-blue-700' },
  'sap-chot': { label: 'Sắp chốt', color: 'bg-green-100 text-green-700' },
  'da-mua': { label: 'Đã mua', color: 'bg-gray-100 text-gray-700' },
  'khong-nhu-cau': { label: 'Không nhu cầu', color: 'bg-red-100 text-red-700' },
};

// Hàm parse text thông minh
function parseText(input) {
  const result = {
    ten: '',
    sdt: '',
    nhuCau: '',
    nganSach: '',
    khuVuc: '',
    nguon: '',
    ghiChu: '',
    trangThai: 'tiem-nang',
  };

  if (!input.trim()) return result;

  const text = input.trim();

  // 1. Tìm SĐT (ưu tiên các format phổ biến ở VN)
  const phonePatterns = [
    /(?:sđt|sdt|số điện thoại|điện thoại|phone|tel|mobile|call|liên hệ|zalo)[:\s]*(\+?\d{9,12})/i,
    /(\+?84\d{9,10})/,
    /(0\d{8,10})/,
    /(\d{10})/,
  ];

  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.sdt = match[1].replace(/^84/, '0');
      break;
    }
  }

  // 2. Tìm tên (thường ở đầu câu, trước SĐT, hoặc sau "anh/chị/em")
  const namePatterns = [
    /(?:anh|chị|em|bạn|cô|chú|bác|ông|bà)\s+([A-ZÀ-Ỹ][a-zà-ỹ]*(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]*){1,4})/i,
    /tên(?:\s+là)?[:\s]*([A-ZÀ-Ỹ][a-zà-ỹ]*(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]*){1,4})/i,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.ten = match[1].trim();
      break;
    }
  }

  // Nếu chưa tìm thấy tên, lấy đoạn text đầu tiên trước SĐT
  if (!result.ten && result.sdt) {
    const beforePhone = text.split(result.sdt)[0].trim();
    // Lấy 2-4 từ cuối cùng trước SĐT
    const words = beforePhone.split(/\s+/);
    result.ten = words.slice(-3).join(' ');
  }

  // Nếu vẫn không có, lấy dòng đầu tiên không chứa SĐT
  if (!result.ten) {
    const lines = text.split(/[\n,]+/);
    for (const line of lines) {
      const cleaned = line.replace(/\d{6,}/g, '').trim();
      if (cleaned.length > 3 && cleaned.length < 50) {
        result.ten = cleaned;
        break;
      }
    }
  }

  // 3. Tìm nhu cầu
  const nhuCauPatterns = [
    /(?:nhu cầu|cần|muốn|tìm|mua|thuê|đầu tư)[:\s]*(mua\s+(?:chung cư|nhà phố|nhà|đất|đất nền|biệt thự|căn hộ))|(thuê\s+(?:chung cư|nhà phố|nhà|đất|căn hộ|mặt bằng))/i,
    /mua\s+(?:chung cư|nhà phố|nhà|đất|đất nền|biệt thự|căn hộ)/i,
    /thuê\s+(?:chung cư|nhà phố|nhà|đất|căn hộ|mặt bằng)/i,
    /cần\s+mua/i,
    /cần\s+thuê/i,
  ];

  for (const pattern of nhuCauPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.nhuCau = match[0].trim();
      // Chuẩn hóa
      result.nhuCau = result.nhuCau.charAt(0).toUpperCase() + result.nhuCau.slice(1).toLowerCase();
      break;
    }
  }

  // 4. Tìm ngân sách
  const budgetPatterns = [
    /(?:ngân sách|khoảng|tầm|giá|budget)[:\s]*(\d+[\s-]*\d*\s*(?:triệu|tr|tỷ|tỉ|ty|ti|m))\b/i,
    /(\d+[\s-]*\d*\s*(?:triệu|tr|tỷ|tỉ|ty|ti))\b/i,
    /(\d+\s*(?:đến|tới|-)\s*\d+\s*(?:triệu|tr|tỷ|tỉ|ty|ti))\b/i,
  ];

  for (const pattern of budgetPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.nganSach = match[0].trim();
      break;
    }
  }

  // 5. Tìm khu vực
  const areaPatterns = [
    /(?:khu vực|quận|huyện|thành phố|tp|ở|khu)[:\s]*((?:quận|huyện|Q\.|H\.)?\s*\d*\s*[A-ZÀ-Ỹ][a-zà-ỹ]*(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]*)?)/i,
    /quận\s+\d+/i,
    /quận\s+[A-ZÀ-Ỹ][a-zà-ỹ]+/i,
    /(?:thủ đức|bình thạnh|gò vấp|tân bình|tân phú|phú nhuận|bình tân|quận \d+|hóc môn|củ chi|nhà bè|cần giờ)/i,
  ];

  for (const pattern of areaPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.khuVuc = match[0].trim();
      // Chuẩn hóa
      result.khuVuc = result.khuVuc.charAt(0).toUpperCase() + result.khuVuc.slice(1);
      break;
    }
  }

  // 6. Tìm nguồn
  const sourcePatterns = [
    /(?:nguồn|từ|qua|bên)\s+(facebook|fb|zalo|website|web|google|ads|giới thiệu|bạn bè|người quen)/i,
    /(facebook|fb|zalo|website|google|ads)/i,
  ];

  for (const pattern of sourcePatterns) {
    const match = text.match(pattern);
    if (match) {
      const sourceMap = {
        'fb': 'Facebook',
        'facebook': 'Facebook',
        'zalo': 'Zalo',
        'website': 'Website',
        'web': 'Website',
        'google': 'Google',
        'ads': 'Quảng cáo',
        'giới thiệu': 'Người quen giới thiệu',
        'bạn bè': 'Người quen giới thiệu',
        'người quen': 'Người quen giới thiệu',
      };
      result.nguon = sourceMap[match[1].toLowerCase()] || match[1];
      break;
    }
  }

  // 7. Phần còn lại → ghi chú
  let remaining = text;
  if (result.ten) remaining = remaining.replace(result.ten, '');
  if (result.sdt) remaining = remaining.replace(result.sdt, '');
  remaining = remaining.replace(/tên|sđt|sdt|số điện thoại|điện thoại|nhu cầu|ngân sách|khu vực|nguồn/gi, '');
  remaining = remaining.replace(/[:\s]+/g, ' ').trim();

  if (remaining.length > 5) {
    result.ghiChu = remaining;
  }

  return result;
}

export default function QuickAddModal({ onClose, onSuccess }) {
  const [inputText, setInputText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleParse = () => {
    if (!inputText.trim()) return;
    const result = parseText(inputText);
    setParsed(result);
  };

  const handleSave = async () => {
    if (!parsed || !parsed.ten || !parsed.sdt) {
      alert('Cần có ít nhất Tên và Số điện thoại. Vui lòng kiểm tra lại!');
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const khachData = {
      ten: parsed.ten,
      sdt: parsed.sdt,
      nhu_cau: parsed.nhuCau,
      ngan_sach: parsed.nganSach,
      khu_vuc: parsed.khuVuc,
      nguon: parsed.nguon,
      ghi_chu: parsed.ghiChu,
      trang_thai: parsed.trangThai,
      user_id: user.id,
      last_contacted_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('khach_hang').insert([khachData]);

    if (error) {
      alert('Lỗi thêm khách hàng: ' + error.message);
    } else {
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  const handleCopyText = () => {
    if (parsed) {
      const summary = `${parsed.ten} | ${parsed.sdt} | ${parsed.nhuCau} | ${parsed.nganSach}`;
      navigator.clipboard.writeText(summary);
    }
  };

  // Ví dụ mẫu
  const examples = [
    'Anh Nguyễn Văn A, 0912345678, cần mua chung cư quận 2, ngân sách 2-3 tỷ, từ Facebook',
    'Chị Trần Thị B 0987654321 muốn thuê nhà phố Q.7 giá 15tr/tháng',
    'Em tên Lê Văn C sđt 0909123456 nhu cầu mua đất nền Bình Chánh khoảng 1-2 tỷ',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Thêm nhanh bằng text</h2>
              <p className="text-xs text-gray-400">Paste đoạn text → AI tự điền thông tin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Text input */}
        <div className="mb-3">
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setParsed(null); // Reset parsed khi thay đổi text
            }}
            placeholder="Dán nội dung tin nhắn hoặc ghi chú của khách hàng vào đây...&#10;&#10;VD: Anh A 0912345678 cần mua chung cư quận 2, ngân sách 3 tỷ"
            rows={4}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') {
                handleParse();
              }
            }}
          />
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <span>Ctrl+Enter để parse nhanh</span>
            <span className="mx-1">·</span>
            <span>{inputText.length} ký tự</span>
          </p>
        </div>

        {/* Ví dụ mẫu */}
        {!parsed && (
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-2">💡 Ví dụ mẫu (bấm để thử):</p>
            <div className="space-y-1">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputText(example);
                    setParsed(null);
                  }}
                  className="w-full text-left text-xs text-gray-500 bg-gray-50 hover:bg-emerald-50 px-3 py-2 rounded-lg truncate transition-colors"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nút Parse */}
        <button
          onClick={handleParse}
          disabled={!inputText.trim()}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
        >
          <Sparkles className="w-4 h-4" />
          Parse thông tin
        </button>

        {/* Kết quả parse */}
        {parsed && (
          <div className="bg-gray-50 rounded-xl p-4 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-500" />
                Kết quả parse
              </h3>
              <button
                onClick={handleCopyText}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>

            <div className="space-y-2">
              {/* Tên + SĐT (luôn hiện) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                  <p className="text-xs text-gray-400 mb-0.5">👤 Tên</p>
                  <p className={`text-sm font-medium ${parsed.ten ? 'text-gray-800' : 'text-gray-300 italic'}`}>
                    {parsed.ten || 'Chưa xác định'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                  <p className="text-xs text-gray-400 mb-0.5">📞 SĐT</p>
                  <p className={`text-sm font-medium ${parsed.sdt ? 'text-emerald-600' : 'text-gray-300 italic'}`}>
                    {parsed.sdt || 'Chưa xác định'}
                  </p>
                </div>
              </div>

              {/* Toggle xem thêm */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 py-1"
              >
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}
              </button>

              {showDetails && (
                <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-1">
                  <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                    <p className="text-xs text-gray-400 mb-0.5">🎯 Nhu cầu</p>
                    <p className={`text-sm ${parsed.nhuCau ? 'text-gray-800' : 'text-gray-300 italic'}`}>
                      {parsed.nhuCau || 'Chưa xác định'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                    <p className="text-xs text-gray-400 mb-0.5">💰 Ngân sách</p>
                    <p className={`text-sm ${parsed.nganSach ? 'text-gray-800' : 'text-gray-300 italic'}`}>
                      {parsed.nganSach || 'Chưa xác định'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                    <p className="text-xs text-gray-400 mb-0.5">📍 Khu vực</p>
                    <p className={`text-sm ${parsed.khuVuc ? 'text-gray-800' : 'text-gray-300 italic'}`}>
                      {parsed.khuVuc || 'Chưa xác định'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                    <p className="text-xs text-gray-400 mb-0.5">📌 Nguồn</p>
                    <p className={`text-sm ${parsed.nguon ? 'text-gray-800' : 'text-gray-300 italic'}`}>
                      {parsed.nguon || 'Chưa xác định'}
                    </p>
                  </div>
                </div>
              )}

              {/* Trạng thái */}
              <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                <p className="text-xs text-gray-400 mb-1">📊 Trạng thái</p>
                <div className="flex gap-2">
                  {Object.entries(trangThaiConfig).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setParsed({ ...parsed, trangThai: key })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${parsed.trangThai === key
                        ? 'ring-2 ring-emerald-500 ring-offset-1 ' + value.color
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                      {value.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ghi chú */}
              {parsed.ghiChu && (
                <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                  <p className="text-xs text-gray-400 mb-0.5">📝 Ghi chú</p>
                  <p className="text-sm text-gray-600">{parsed.ghiChu}</p>
                </div>
              )}
            </div>

            {/* Nút lưu */}
            <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setParsed(null);
                  setInputText('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Làm lại
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !parsed.ten || !parsed.sdt}
                className="flex-[2] px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Lưu ngay
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
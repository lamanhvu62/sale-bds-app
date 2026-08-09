import { useState } from 'react';
import { Calculator, Home, PiggyBank, Calendar, Copy, TrendingDown } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useToast } from '../components/Toast';

export default function CalculatorPage() {
  const [activeTab, setActiveTab] = useState('tong-gia');

  // State cho tính tổng giá
  const [giaGoc, setGiaGoc] = useState('');
  const [dienTich, setDienTich] = useState('');
  const [donGia, setDonGia] = useState('');
  const [vat, setVat] = useState(10);
  const [phiBaoTri, setPhiBaoTri] = useState(2);
  const [chietKhau, setChietKhau] = useState(0);
  const [chietKhauType, setChietKhauType] = useState('percent');

  // State cho tính vay ngân hàng
  const [soTienVay, setSoTienVay] = useState(''); // Có thể là string hoặc number
  const [laiSuat, setLaiSuat] = useState('');
  const [thoiHan, setThoiHan] = useState(20);
  const [phuongThuc, setPhuongThuc] = useState('giam-dan');
  const [showAmortization, setShowAmortization] = useState(false);
  const [amortizationData, setAmortizationData] = useState([]);

  const toast = useToast();

  // ========== HELPER FUNCTIONS ==========

  // Format số thành tiền VND
  const formatMoney = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0 VND';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Chuyển đổi mọi định dạng đầu vào thành số (number)
  const toNumber = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    const str = String(value).trim();
    
    // Nếu là số thuần (có thể có dấu .)
    if (/^\d+\.?\d*$/.test(str)) {
      return parseFloat(str);
    }

    // Parse từ định dạng có chữ "tỷ", "triệu", "tr", "VND", "₫"
    const cleaned = str.replace(/[₫\sVND,\.]/gi, ''); // Xóa ký hiệu tiền tệ, dấu cách, dấu chấm (phân cách)
    const num = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return 0;

    if (/t[ỷyỉĩ]/i.test(str)) return num * 1e9;
    if (/triệu|tr/i.test(str)) return num * 1e6;
    return num;
  };

  // Format hiển thị cho input (giữ nguyên giá trị người dùng nhập hoặc hiển thị số đã format)
  const displayMoneyInput = (value) => {
    if (typeof value === 'number') {
      return formatMoney(value);
    }
    return value; // Chuỗi người dùng nhập
  };

  // ========== TÍNH TỔNG GIÁ ==========
  const calculateTotalPrice = () => {
    let giaNhap = 0;

    if (giaGoc) {
      giaNhap = toNumber(giaGoc);
    } else if (dienTich && donGia) {
      giaNhap = parseFloat(dienTich) * toNumber(donGia);
    }

    if (giaNhap === 0) return null;

    const tienVat = giaNhap * (vat / 100);
    const tienBaoTri = giaNhap * (phiBaoTri / 100);

    let tienChietKhau = 0;
    if (chietKhauType === 'percent') {
      tienChietKhau = giaNhap * (chietKhau / 100);
    } else {
      tienChietKhau = toNumber(chietKhau);
    }

    const tongTien = giaNhap + tienVat + tienBaoTri - tienChietKhau;

    return { giaNhap, tienVat, tienBaoTri, tienChietKhau, tongTien };
  };

  const totalResult = calculateTotalPrice();

  // ========== TÍNH VAY NGÂN HÀNG ==========
  const calculateLoan = () => {
    let soTien;
    if (soTienVay !== '' && soTienVay !== null) {
      soTien = toNumber(soTienVay);
    } else {
      soTien = totalResult ? totalResult.tongTien * 0.7 : 0;
    }

    const lai = parseFloat(laiSuat) || 0;
    const thang = (parseInt(thoiHan) || 20) * 12;

    if (soTien === 0 || lai === 0) return null;

    const laiThang = lai / 12 / 100;
    const gocHangThang = soTien / thang;

    let duNo = soTien;
    let tongLai = 0;
    const lichTra = [];

    for (let i = 1; i <= thang; i++) {
      let gocThangNay, laiThangNay;
      if (phuongThuc === 'giam-dan') {
        gocThangNay = gocHangThang;
        laiThangNay = duNo * laiThang;
      } else {
        // Trả đều
        const tongTra = soTien * laiThang * Math.pow(1 + laiThang, thang) / (Math.pow(1 + laiThang, thang) - 1);
        laiThangNay = duNo * laiThang;
        gocThangNay = tongTra - laiThangNay;
      }
      duNo -= gocThangNay;
      tongLai += laiThangNay;
      lichTra.push({
        thang: i,
        goc: gocThangNay,
        lai: laiThangNay,
        tong: gocThangNay + laiThangNay,
        conLai: duNo > 0 ? duNo : 0,
      });
    }

    return {
      soTien,
      tongLai,
      tongPhaiTra: soTien + tongLai,
      thangDau: lichTra[0],
      lichTra,
    };
  };

  const loanResult = calculateLoan();

  // ========== HANDLERS ==========
  const handleAutoFillLoan = () => {
    if (totalResult && totalResult.tongTien) {
      setSoTienVay(totalResult.tongTien * 0.7);
      toast.info('Đã tự điền 70% tổng giá căn hộ');
    }
  };

  const handleCopyResult = () => {
    if (activeTab === 'tong-gia' && totalResult) {
      const text = `🏢 TÍNH GIÁ CĂN HỘ\n`
        + `Giá gốc: ${formatMoney(totalResult.giaNhap)}\n`
        + `VAT (${vat}%): ${formatMoney(totalResult.tienVat)}\n`
        + `Phí bảo trì (${phiBaoTri}%): ${formatMoney(totalResult.tienBaoTri)}\n`
        + `Chiết khấu: -${formatMoney(totalResult.tienChietKhau)}\n`
        + `👉 TỔNG: ${formatMoney(totalResult.tongTien)}`;
      navigator.clipboard.writeText(text);
      toast.success('Đã copy kết quả tổng giá!');
    } else if (activeTab === 'vay-ngan-hang' && loanResult) {
      const text = `🏦 TÍNH VAY NGÂN HÀNG\n`
        + `Số tiền vay: ${formatMoney(loanResult.soTien)}\n`
        + `Lãi suất: ${laiSuat}%/năm\n`
        + `Thời hạn: ${thoiHan} năm\n`
        + `Trả tháng đầu: ${formatMoney(loanResult.thangDau.tong)}/tháng\n`
        + `Tổng lãi: ${formatMoney(loanResult.tongLai)}\n`
        + `👉 TỔNG PHẢI TRẢ: ${formatMoney(loanResult.tongPhaiTra)}`;
      navigator.clipboard.writeText(text);
      toast.success('Đã copy kết quả vay!');
    } else {
      toast.warning('Chưa có kết quả để copy');
    }
  };

  // ========== RENDER ==========
  return (
    <div className="pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-600" />
          Tính toán
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b">
        <button
          onClick={() => setActiveTab('tong-gia')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'tong-gia' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500'
          }`}
        >
          <Home className="w-4 h-4 inline mr-1" /> Tổng giá
        </button>
        <button
          onClick={() => setActiveTab('vay-ngan-hang')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'vay-ngan-hang' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500'
          }`}
        >
          <PiggyBank className="w-4 h-4 inline mr-1" /> Vay ngân hàng
        </button>
      </div>

      <div className="p-4">
        {/* ============ TAB TỔNG GIÁ ============ */}
        {activeTab === 'tong-gia' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              <p className="text-sm font-medium text-gray-700">Nhập thông tin căn hộ</p>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tổng giá căn hộ</label>
                <input
                  type="text"
                  value={giaGoc}
                  onChange={(e) => { setGiaGoc(e.target.value); setDienTich(''); setDonGia(''); }}
                  placeholder="VD: 2,5 tỷ hoặc 2500000000"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400">hoặc tính theo m²</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Diện tích (m²)</label>
                  <input type="number" value={dienTich} onChange={(e) => { setDienTich(e.target.value); setGiaGoc(''); }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="VD: 70" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Đơn giá/m²</label>
                  <input type="text" value={donGia} onChange={(e) => { setDonGia(e.target.value); setGiaGoc(''); }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="VD: 35 triệu" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              <p className="text-sm font-medium text-gray-700">Thuế & Phí</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">VAT (%)</label>
                  <input type="number" value={vat} onChange={(e) => setVat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phí bảo trì (%)</label>
                  <input type="number" value={phiBaoTri} onChange={(e) => setPhiBaoTri(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              <p className="text-sm font-medium text-gray-700">Chiết khấu / Ưu đãi</p>
              <div className="flex gap-2">
                <input type="number" value={chietKhau} onChange={(e) => setChietKhau(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Số tiền hoặc %" />
                <select value={chietKhauType} onChange={(e) => setChietKhauType(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="percent">%</option>
                  <option value="amount">VNĐ</option>
                </select>
              </div>
            </div>

            {totalResult && (
              <div className="bg-emerald-50 rounded-xl p-4 animate-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-emerald-800">📊 Kết quả</h3>
                  <button onClick={handleCopyResult} className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Giá gốc</span><span className="font-medium">{formatMoney(totalResult.giaNhap)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">VAT ({vat}%)</span><span className="font-medium text-orange-600">+{formatMoney(totalResult.tienVat)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Phí bảo trì ({phiBaoTri}%)</span><span className="font-medium text-orange-600">+{formatMoney(totalResult.tienBaoTri)}</span></div>
                  {totalResult.tienChietKhau > 0 && (
                    <div className="flex justify-between"><span className="text-gray-600">Chiết khấu</span><span className="font-medium text-green-600">-{formatMoney(totalResult.tienChietKhau)}</span></div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-emerald-200">
                    <span className="font-semibold text-emerald-800">TỔNG CỘNG</span>
                    <span className="font-bold text-emerald-800 text-lg">{formatMoney(totalResult.tongTien)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ TAB VAY NGÂN HÀNG ============ */}
        {activeTab === 'vay-ngan-hang' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Thông tin khoản vay</p>
                {totalResult && (
                  <button onClick={handleAutoFillLoan} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Tự điền 70%
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Số tiền vay</label>
                <input
                  type="text"
                  value={displayMoneyInput(soTienVay)}
                  onChange={(e) => setSoTienVay(e.target.value)}
                  placeholder="VD: 1,5 tỷ"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Lãi suất (%/năm)</label>
                  <input type="number" value={laiSuat} onChange={(e) => setLaiSuat(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="VD: 8.5" step="0.1" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Thời hạn (năm)</label>
                  <select value={thoiHan} onChange={(e) => setThoiHan(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {[5, 10, 15, 20, 25, 30].map(y => <option key={y} value={y}>{y} năm</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phương thức trả</label>
                <select value={phuongThuc} onChange={(e) => setPhuongThuc(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="giam-dan">Dư nợ giảm dần</option>
                  <option value="co-dinh">Trả đều hàng tháng</option>
                </select>
              </div>
            </div>

            {loanResult && (
              <>
                <div className="bg-emerald-50 rounded-xl p-4 animate-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-emerald-800">📊 Kết quả vay</h3>
                    <button onClick={handleCopyResult} className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Số tiền vay</span><span className="font-medium">{formatMoney(loanResult.soTien)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Trả tháng đầu</span><span className="font-medium text-orange-600">{formatMoney(loanResult.thangDau.tong)}/tháng</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Tổng lãi</span><span className="font-medium text-red-500">{formatMoney(loanResult.tongLai)}</span></div>
                    <div className="flex justify-between pt-2 border-t border-emerald-200">
                      <span className="font-semibold text-emerald-800">TỔNG PHẢI TRẢ</span>
                      <span className="font-bold text-emerald-800 text-lg">{formatMoney(loanResult.tongPhaiTra)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowAmortization(!showAmortization);
                    setAmortizationData(loanResult.lichTra.slice(0, 12));
                  }}
                  className="w-full bg-white rounded-xl p-4 shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  {showAmortization ? 'Ẩn lịch trả nợ' : 'Xem lịch trả nợ (12 tháng đầu)'}
                </button>

                {showAmortization && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-in slide-in-from-top-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tháng</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Gốc</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Lãi</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Tổng</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Còn lại</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {amortizationData.map((row) => (
                            <tr key={row.thang} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-800">{row.thang}</td>
                              <td className="px-3 py-2 text-right text-gray-600">{formatMoney(row.goc)}</td>
                              <td className="px-3 py-2 text-right text-orange-600">{formatMoney(row.lai)}</td>
                              <td className="px-3 py-2 text-right font-medium">{formatMoney(row.tong)}</td>
                              <td className="px-3 py-2 text-right text-gray-400">{formatMoney(row.conLai)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-400 text-center py-2">* Hiển thị 12 tháng đầu tiên</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
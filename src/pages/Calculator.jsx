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
  // Chuyển đổi mọi định dạng đầu vào thành số (number)
const toNumber = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const str = String(value).trim();

  // Nếu là số thuần (chỉ có số và có thể một dấu chấm thập phân)
  if (/^\d+(\.\d+)?$/.test(str)) {
    return parseFloat(str);
  }

  // Lấy phần số và dấu phân cách
  let cleaned = str.replace(/[^\d.,]/g, '');

  // Xác định dấu thập phân
  let decimalSeparator = '.';
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Chỉ có dấu phẩy -> coi là dấu thập phân
    decimalSeparator = ',';
  } else if (cleaned.includes('.') && !cleaned.includes(',')) {
    // Chỉ có dấu chấm -> có thể là thập phân hoặc phân cách hàng nghìn
    const parts = cleaned.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      decimalSeparator = '.';
    } else {
      // Coi là phân cách hàng nghìn -> loại bỏ dấu chấm
      decimalSeparator = '';
    }
  } else if (cleaned.includes(',') && cleaned.includes('.')) {
    // Cả hai: ưu tiên dấu phẩy là thập phân nếu sau nó có 1-2 chữ số
    const lastCommaIndex = cleaned.lastIndexOf(',');
    const lastDotIndex = cleaned.lastIndexOf('.');
    if (lastCommaIndex > lastDotIndex) {
      decimalSeparator = ',';
    } else {
      decimalSeparator = '.';
    }
  }

  let normalized;
  if (decimalSeparator === ',') {
    // Thay dấu phẩy thập phân thành dấu chấm, xóa dấu chấm phân cách
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (decimalSeparator === '.') {
    // Xóa dấu phẩy phân cách (nếu có)
    normalized = cleaned.replace(/,/g, '');
  } else {
    // Không có dấu thập phân, xóa tất cả dấu chấm phẩy
    normalized = cleaned.replace(/[.,]/g, '');
  }

  const num = parseFloat(normalized);
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
    
        <div className="pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="glass-effect p-4 sticky top-0 z-10">
        <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
          <Calculator className="w-6 h-6 text-emerald-400" />
          Công cụ tính toán
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900/50 p-1 mx-4 mt-4 rounded-2xl border border-white/5">
        <button
          onClick={() => setActiveTab('tong-gia')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
            activeTab === 'tong-gia' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500'
          }`}
        >
          <Home className="w-4 h-4" /> Tổng giá
        </button>
        <button
          onClick={() => setActiveTab('vay-ngan-hang')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
            activeTab === 'vay-ngan-hang' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500'
          }`}
        >
          <PiggyBank className="w-4 h-4" /> Vay vốn
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* ============ TAB TỔNG GIÁ ============ */}
        {activeTab === 'tong-gia' && (
          <div className="space-y-6">
            <div className="bg-white rounded-[32px] p-6 border border-white/5 space-y-5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Thông tin căn hộ</p>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Tổng giá gốc (VNĐ)</label>
                <input
                  type="text"
                  value={giaGoc}
                  onChange={(e) => { setGiaGoc(e.target.value); setDienTich(''); setDonGia(''); }}
                  placeholder="VD: 2.5 tỷ"
                  className="w-full px-4 py-4 bg-slate-800 border-white/5 rounded-2xl text-sm font-bold text-gray-100"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/5"></div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Hoặc</span>
                <div className="flex-1 h-px bg-white/5"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Diện tích (m²)</label>
                  <input type="number" value={dienTich} onChange={(e) => { setDienTich(e.target.value); setGiaGoc(''); }}
                    className="w-full px-4 py-4 bg-slate-800 border-white/5 rounded-2xl text-sm font-bold" placeholder="70" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Đơn giá/m²</label>
                  <input type="text" value={donGia} onChange={(e) => { setDonGia(e.target.value); setGiaGoc(''); }}
                    className="w-full px-4 py-4 bg-slate-800 border-white/5 rounded-2xl text-sm font-bold" placeholder="35 tr" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 border border-white/5 space-y-5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Thuế, phí & Chiết khấu</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">VAT (%)</label>
                  <input type="number" value={vat} onChange={(e) => setVat(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-4 bg-slate-800 border-white/5 rounded-2xl text-sm font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Bảo trì (%)</label>
                  <input type="number" value={phiBaoTri} onChange={(e) => setPhiBaoTri(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-4 bg-slate-800 border-white/5 rounded-2xl text-sm font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Chiết khấu ưu đãi</label>
                <div className="flex gap-2">
                  <input type="number" value={chietKhau} onChange={(e) => setChietKhau(parseFloat(e.target.value) || 0)}
                    className="flex-[2] px-4 py-4 bg-slate-800 border-white/5 rounded-2xl text-sm font-bold" placeholder="Số tiền hoặc %" />
                  <select value={chietKhauType} onChange={(e) => setChietKhauType(e.target.value)}
                    className="flex-1 px-4 py-4 bg-slate-800 border-white/5 rounded-2xl text-sm font-bold">
                    <option value="percent">%</option>
                    <option value="amount">VNĐ</option>
                  </select>
                </div>
              </div>
            </div>

            {totalResult && (
              <div className="bg-emerald-500/10 rounded-[32px] p-6 border border-emerald-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest">Kết quả tính giá</h3>
                  <button onClick={handleCopyResult} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all active:scale-90">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-400 font-medium"><span>Giá gốc căn hộ</span><span className="text-gray-200">{formatMoney(totalResult.giaNhap)}</span></div>
                  <div className="flex justify-between text-gray-400 font-medium"><span>Thuế VAT ({vat}%)</span><span className="text-orange-400">+{formatMoney(totalResult.tienVat)}</span></div>
                  <div className="flex justify-between text-gray-400 font-medium"><span>Phí bảo trì ({phiBaoTri}%)</span><span className="text-orange-400">+{formatMoney(totalResult.tienBaoTri)}</span></div>
                  {totalResult.tienChietKhau > 0 && (
                    <div className="flex justify-between text-gray-400 font-medium"><span>Tổng chiết khấu</span><span className="text-emerald-400">-{formatMoney(totalResult.tienChietKhau)}</span></div>
                  )}
                  <div className="h-px bg-emerald-500/10 my-4"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Tổng giá cuối</span>
                    <span className="text-2xl font-black text-emerald-400">{formatMoney(totalResult.tongTien)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ TAB VAY NGÂN HÀNG ============ */}
        {activeTab === 'vay-ngan-hang' && (
          <div className="space-y-6">
            <div className="bg-white rounded-[32px] p-6 border border-white/5 space-y-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Khoản vay ngân hàng</p>
                {totalResult && (
                  <button onClick={handleAutoFillLoan} className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                    <TrendingDown className="w-3.5 h-3.5" /> Lấy 70% tổng giá
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Số tiền muốn vay</label>
                <input
                  type="text"
                  value={displayMoneyInput(soTienVay)}
                  onChange={(e) => setSoTienVay(e.target.value)}
                  placeholder="VD: 1.5 tỷ"
                  className="w-full px-4 py-4 bg-slate-800 border-white/5 rounded-2xl text-sm font-bold text-gray-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Lãi suất (%/năm)</label>
                  <input type="number" value={laiSuat} onChange={(e) => setLaiSuat(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-800 border-white/5 rounded-2xl text-sm font-bold" placeholder="8.5" step="0.1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Thời hạn (Năm)</label>
                  <select value={thoiHan} onChange={(e) => setThoiHan(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-800 border-white/5 rounded-2xl text-sm font-bold">
                    {[5, 10, 15, 20, 25, 30].map(y => <option key={y} value={y}>{y} năm</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Cách thức trả nợ</label>
                <select value={phuongThuc} onChange={(e) => setPhuongThuc(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-800 border-white/5 rounded-2xl text-sm font-bold">
                  <option value="giam-dan">Dư nợ giảm dần (Gốc + Lãi)</option>
                  <option value="co-dinh">Trả đều hàng tháng</option>
                </select>
              </div>
            </div>

            {loanResult && (
              <>
                <div className="bg-blue-500/10 rounded-[32px] p-6 border border-blue-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest">Kết quả trả nợ</h3>
                    <button onClick={handleCopyResult} className="p-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all active:scale-90">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-400 font-medium"><span>Số tiền vay gốc</span><span className="text-gray-200">{formatMoney(loanResult.soTien)}</span></div>
                    <div className="flex justify-between text-gray-400 font-medium"><span>Trả tháng đầu tiên</span><span className="text-orange-400 font-bold">{formatMoney(loanResult.thangDau.tong)}</span></div>
                    <div className="flex justify-between text-gray-400 font-medium"><span>Tổng lãi phải trả</span><span className="text-red-400">{formatMoney(loanResult.tongLai)}</span></div>
                    <div className="h-px bg-blue-500/10 my-4"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Tổng phải trả</span>
                      <span className="text-2xl font-black text-blue-400">{formatMoney(loanResult.tongPhaiTra)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowAmortization(!showAmortization);
                    setAmortizationData(loanResult.lichTra.slice(0, 12));
                  }}
                  className="w-full bg-slate-800/50 rounded-2xl py-4 border border-white/5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-blue-400" />
                  {showAmortization ? 'Ẩn bảng chi tiết' : 'Xem chi tiết 12 tháng đầu'}
                </button>

                {showAmortization && (
                  <div className="bg-white rounded-[24px] border border-white/5 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead className="bg-slate-800/50 text-slate-500 font-black uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 text-left">Tháng</th>
                            <th className="px-4 py-3 text-right">Gốc</th>
                            <th className="px-4 py-3 text-right">Lãi</th>
                            <th className="px-4 py-3 text-right">Tổng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-bold">
                          {amortizationData.map((row) => (
                            <tr key={row.thang} className="hover:bg-white/5">
                              <td className="px-4 py-3 text-slate-400">{row.thang}</td>
                              <td className="px-4 py-3 text-right text-gray-300">{formatMoney(row.goc)}</td>
                              <td className="px-4 py-3 text-right text-orange-400/80">{formatMoney(row.lai)}</td>
                              <td className="px-4 py-3 text-right text-gray-100">{formatMoney(row.tong)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
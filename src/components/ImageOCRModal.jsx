import { useState, useRef } from 'react';
import { X, Upload, Camera, Zap, Loader2, Check, Plus, Trash2, Users, Sparkles } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { supabase } from '../services/supabase';
import { useToast } from './Toast';
import { parseCustomersWithAI } from '../services/ai';

const trangThaiConfig = {
    'tiem-nang': { label: 'Tiềm năng', color: 'bg-yellow-100 text-yellow-700' },
    'dang-cham': { label: 'Đang chăm', color: 'bg-blue-100 text-blue-700' },
    'sap-chot': { label: 'Sắp chốt', color: 'bg-green-100 text-green-700' },
    'da-mua': { label: 'Đã mua', color: 'bg-gray-100 text-gray-700' },
    'khong-nhu-cau': { label: 'Không nhu cầu', color: 'bg-red-100 text-red-700' },
};

export default function ImageOCRModal({ onClose, onSuccess }) {
    const [image, setImage] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [parsedText, setParsedText] = useState('');
    const [customers, setCustomers] = useState([]);
    const [step, setStep] = useState('upload'); // upload | processing | result | saving
    const [progress, setProgress] = useState(0);
    const [aiLoading, setAiLoading] = useState(false);
    const fileInputRef = useRef(null);
    const toast = useToast();

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.warning('Vui lòng chọn file ảnh!');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.warning('Ảnh quá lớn, vui lòng chọn ảnh dưới 10MB');
            return;
        }
        setImage(file);
        setImageUrl(URL.createObjectURL(file));
        setCustomers([]);
        setParsedText('');
    };

    const handleOCR = async () => {
        if (!image) return;
        setStep('processing');
        setProgress(0);
        setAiLoading(false);

        try {
            // Bước 1: OCR
            const result = await Tesseract.recognize(image, 'vie+eng', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                },
            });
            const text = result.data.text;
            setParsedText(text);

            // Bước 2: Gọi AI phân tích
            setAiLoading(true);
            try {
                const aiResult = await parseCustomersWithAI(text);
                if (Array.isArray(aiResult) && aiResult.length > 0) {
                    const withStatus = aiResult.map(c => ({
                        ...c,
                        trangThai: c.trangThai || 'tiem-nang',
                        ten: c.ten || '',
                        sdt: c.sdt || '',
                        nhuCau: c.nhuCau || '',
                        nganSach: c.nganSach || '',
                        khuVuc: c.khuVuc || '',
                        ghiChu: c.ghiChu || '',
                    }));
                    setCustomers(withStatus);
                    toast.success(`AI đã tìm thấy ${withStatus.length} khách hàng`);
                } else {
                    toast.warning('AI không tìm thấy khách hàng nào trong ảnh');
                    setCustomers([]);
                }
            } catch (aiError) {
                toast.error('Lỗi phân tích AI: ' + aiError.message);
                setCustomers([]);
            } finally {
                setAiLoading(false);
            }

            setStep('result');
        } catch (error) {
            toast.error('Lỗi nhận dạng ảnh: ' + error.message);
            setStep('upload');
        }
    };

    // Gọi lại AI thủ công (nếu muốn thử lại)
    const handleRetryAI = async () => {
        setAiLoading(true);
        try {
            const aiResult = await parseCustomersWithAI(parsedText);
            if (Array.isArray(aiResult) && aiResult.length > 0) {
                const withStatus = aiResult.map(c => ({
                    ...c,
                    trangThai: c.trangThai || 'tiem-nang',
                    ten: c.ten || '',
                    sdt: c.sdt || '',
                    nhuCau: c.nhuCau || '',
                    nganSach: c.nganSach || '',
                    khuVuc: c.khuVuc || '',
                    ghiChu: c.ghiChu || '',
                }));
                setCustomers(withStatus);
                toast.success(`AI đã tìm thấy ${withStatus.length} khách hàng`);
            } else {
                toast.warning('AI không tìm thấy khách hàng nào');
            }
        } catch (error) {
            toast.error('Lỗi AI: ' + error.message);
        } finally {
            setAiLoading(false);
        }
    };

    // Cập nhật thông tin khách hàng trong danh sách
    const updateCustomer = (index, field, value) => {
        const updated = [...customers];
        updated[index] = { ...updated[index], [field]: value };
        setCustomers(updated);
    };

    // Xóa một khách hàng khỏi danh sách
    const removeCustomer = (index) => {
        setCustomers(customers.filter((_, i) => i !== index));
    };

    // Thêm khách hàng trống
    const addEmptyCustomer = () => {
        setCustomers([...customers, {
            ten: '', sdt: '', nhuCau: '', nganSach: '', khuVuc: '', nguon: '', ghiChu: '', trangThai: 'tiem-nang'
        }]);
    };

    // Lưu tất cả khách hàng
    const handleSaveAll = async () => {
        const validCustomers = customers.filter(c => c.ten.trim() && c.sdt.trim());
        if (validCustomers.length === 0) {
            toast.warning('Không có khách hàng hợp lệ để lưu!');
            return;
        }

        setStep('saving');
        const { data: { user } } = await supabase.auth.getUser();
        let successCount = 0;
        let failCount = 0;

        for (const c of validCustomers) {
            const khachData = {
                ten: c.ten.trim(),
                sdt: c.sdt.trim(),
                nhu_cau: c.nhuCau || '',
                ngan_sach: c.nganSach || '',
                khu_vuc: c.khuVuc || '',
                nguon: c.nguon || '',
                ghi_chu: c.ghiChu || '',
                trang_thai: c.trangThai || 'tiem-nang',
                user_id: user.id,
                last_contacted_at: new Date().toISOString(),
            };
            const { error } = await supabase.from('khach_hang').insert([khachData]);
            if (error) failCount++;
            else successCount++;
        }

        if (failCount > 0) {
            toast.warning(`Đã lưu ${successCount} khách hàng, ${failCount} lỗi.`);
        } else {
            toast.success(`Đã lưu ${successCount} khách hàng!`);
        }
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-end justify-center overflow-hidden">
            <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto overflow-x-hidden shadow-2xl box-border">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Camera className="w-4 h-4 text-purple-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">Quét bảng thông tin</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {step === 'upload' && (
                    <div className="space-y-4">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
                        >
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                            {imageUrl ? (
                                <img src={imageUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                            ) : (
                                <>
                                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Bấm để chọn ảnh bảng tính, danh sách khách hàng</p>
                                    <p className="text-xs text-gray-400 mt-1">Hỗ trợ ảnh chụp màn hình, ảnh tài liệu</p>
                                </>
                            )}
                        </div>
                        <button onClick={handleOCR} disabled={!image}
                            className="w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                            <Zap className="w-4 h-4" /> Quét và phân tích
                        </button>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="text-center py-8">
                        {!aiLoading ? (
                            <>
                                <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-4" />
                                <p className="text-gray-600 font-medium">Đang nhận dạng văn bản...</p>
                                <p className="text-sm text-gray-400 mt-1">{progress}%</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                                    <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                </div>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-10 h-10 text-indigo-600 animate-pulse mx-auto mb-4" />
                                <p className="text-gray-600 font-medium">AI đang phân tích thông tin khách hàng...</p>
                                <p className="text-sm text-gray-400 mt-1">Trích xuất tên, SĐT, nhu cầu...</p>
                            </>
                        )}
                    </div>
                )}

                {step === 'result' && (
                    <div className="space-y-4">
                        {imageUrl && (
                            <img src={imageUrl} alt="Scanned" className="w-full h-32 object-cover rounded-lg" />
                        )}

                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-600" />
                                {customers.length > 0 ? `Đã tìm thấy ${customers.length} khách hàng` : 'Không tìm thấy khách hàng'}
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={addEmptyCustomer}
                                    className="text-sm text-purple-600 font-medium hover:underline flex items-center gap-1">
                                    <Plus className="w-4 h-4" /> Thêm tay
                                </button>
                                <button onClick={handleRetryAI} disabled={aiLoading}
                                    className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
                                    <Sparkles className="w-4 h-4" /> Thử lại AI
                                </button>
                            </div>
                        </div>

                        {customers.length > 0 && (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {customers.map((customer, index) => (
                                    <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">#{index + 1}</span>
                                            <button onClick={() => removeCustomer(index)}
                                                className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <label className="text-xs text-gray-400">👤 Tên</label>
                                                <input value={customer.ten} onChange={(e) => updateCustomer(index, 'ten', e.target.value)}
                                                    className="w-full bg-white border rounded px-2 py-1 text-sm mt-0.5 focus:ring-1 focus:ring-purple-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400">📞 SĐT</label>
                                                <input value={customer.sdt} onChange={(e) => updateCustomer(index, 'sdt', e.target.value)}
                                                    className="w-full bg-white border rounded px-2 py-1 text-sm mt-0.5 focus:ring-1 focus:ring-purple-500 text-emerald-600 font-medium" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400">🎯 Nhu cầu</label>
                                                <input value={customer.nhuCau || ''} onChange={(e) => updateCustomer(index, 'nhuCau', e.target.value)}
                                                    className="w-full bg-white border rounded px-2 py-1 text-sm mt-0.5 focus:ring-1 focus:ring-purple-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400">💰 Ngân sách</label>
                                                <input value={customer.nganSach || ''} onChange={(e) => updateCustomer(index, 'nganSach', e.target.value)}
                                                    className="w-full bg-white border rounded px-2 py-1 text-sm mt-0.5 focus:ring-1 focus:ring-purple-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400">📍 Khu vực</label>
                                                <input value={customer.khuVuc || ''} onChange={(e) => updateCustomer(index, 'khuVuc', e.target.value)}
                                                    className="w-full bg-white border rounded px-2 py-1 text-sm mt-0.5 focus:ring-1 focus:ring-purple-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400">📌 Nguồn</label>
                                                <input value={customer.nguon || ''} onChange={(e) => updateCustomer(index, 'nguon', e.target.value)}
                                                    className="w-full bg-white border rounded px-2 py-1 text-sm mt-0.5 focus:ring-1 focus:ring-purple-500" />
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <label className="text-xs text-gray-400">📝 Ghi chú</label>
                                            <input value={customer.ghiChu || ''} onChange={(e) => updateCustomer(index, 'ghiChu', e.target.value)}
                                                className="w-full bg-white border rounded px-2 py-1 text-sm mt-0.5 focus:ring-1 focus:ring-purple-500" />
                                        </div>
                                        <div className="mt-2 flex gap-2 flex-wrap">
                                            {Object.entries(trangThaiConfig).map(([key, value]) => (
                                                <button key={key} type="button"
                                                    onClick={() => updateCustomer(index, 'trangThai', key)}
                                                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${customer.trangThai === key
                                                        ? 'ring-2 ring-purple-500 ring-offset-1 ' + value.color
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                        }`}>
                                                    {value.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <details className="text-xs text-gray-400">
                            <summary className="cursor-pointer">Xem văn bản gốc đã nhận dạng</summary>
                            <pre className="mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded border text-xs max-h-32 overflow-y-auto">{parsedText}</pre>
                        </details>

                        <div className="flex gap-3">
                            <button onClick={() => { setStep('upload'); setImage(null); setImageUrl(null); setCustomers([]); }}
                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                                ← Chọn ảnh khác
                            </button>
                            <button onClick={handleSaveAll} disabled={customers.length === 0 || step === 'saving'}
                                className="flex-[2] px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                <Check className="w-4 h-4" />
                                Lưu {customers.filter(c => c.ten.trim() && c.sdt.trim()).length} khách hàng
                            </button>
                        </div>
                    </div>
                )}

                {step === 'saving' && (
                    <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
                        <p className="text-gray-600">Đang lưu danh sách khách hàng...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
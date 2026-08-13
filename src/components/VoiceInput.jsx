import { useState } from 'react';
import { Mic, Loader2, X, Sparkles, Check } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { parseCustomersWithAI } from '../services/ai';
import { useToast } from './Toast';

const trangThaiConfig = {
    'tiem-nang': { label: 'Tiềm năng', color: 'bg-yellow-100 text-yellow-700' },
    'dang-cham': { label: 'Đang chăm', color: 'bg-blue-100 text-blue-700' },
    'sap-chot': { label: 'Sắp chốt', color: 'bg-green-100 text-green-700' },
    'da-mua': { label: 'Đã mua', color: 'bg-gray-100 text-gray-700' },
};

export default function VoiceInput({ onSave, onClose }) {
    const [step, setStep] = useState('listening'); // listening | processing | result | saving
    const [customerData, setCustomerData] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const { isListening, transcript, error, startListening, stopListening } = useSpeechRecognition();
    const toast = useToast();

    const handleStartListening = () => {
        setStep('listening');
        startListening();
    };

    const handleStopAndParse = async () => {
        stopListening();
        if (!transcript) {
            toast.warning('Chưa nghe được nội dung, hãy thử lại');
            return;
        }
        setStep('processing');
        setAiLoading(true);
        try {
            const aiResult = await parseCustomersWithAI(transcript);
            if (Array.isArray(aiResult) && aiResult.length > 0) {
                // Lấy khách hàng đầu tiên (vì giọng nói thường chỉ 1 người)
                setCustomerData({
                    ten: aiResult[0].ten || '',
                    sdt: aiResult[0].sdt || '',
                    nhuCau: aiResult[0].nhuCau || '',
                    nganSach: aiResult[0].nganSach || '',
                    khuVuc: aiResult[0].khuVuc || '',
                    ghiChu: aiResult[0].ghiChu || '',
                    trangThai: 'tiem-nang',
                });
                setStep('result');
            } else {
                toast.warning('Không tìm thấy khách hàng trong câu nói');
                setStep('listening');
            }
        } catch (err) {
            toast.error('Lỗi AI: ' + err.message);
            setStep('listening');
        } finally {
            setAiLoading(false);
        }
    };

    const handleSave = async () => {
        if (!customerData || !customerData.ten || !customerData.sdt) {
            toast.warning('Cần có tên và số điện thoại');
            return;
        }
        setStep('saving');
        // Gọi hàm onSave từ component cha
        await onSave(customerData);
        // onSave sẽ tự đóng modal nếu thành công
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-end justify-center overflow-hidden">
            <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto overflow-x-hidden shadow-2xl box-border">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Mic className="w-5 h-5 text-emerald-600" />
                        Nhập khách hàng bằng giọng nói
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {step === 'listening' && (
                    <div className="space-y-4 text-center">
                        <div className={`p-6 rounded-full ${isListening ? 'bg-emerald-50 animate-pulse' : 'bg-gray-50'}`}>
                            <Mic className={`w-16 h-16 mx-auto ${isListening ? 'text-emerald-600' : 'text-gray-400'}`} />
                        </div>
                        <p className="text-gray-600 font-medium">
                            {isListening ? 'Đang nghe... Hãy nói thông tin khách hàng' : 'Nhấn nút để bắt đầu nói'}
                        </p>
                        {transcript && (
                            <div className="bg-gray-50 rounded-lg p-3 text-left">
                                <p className="text-xs text-gray-400 mb-1">Nội dung đã nghe:</p>
                                <p className="text-sm text-gray-700">{transcript}</p>
                            </div>
                        )}
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="flex gap-3">
                            {!isListening ? (
                                <button onClick={handleStartListening} className="flex-1 bg-emerald-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
                                    <Mic className="w-4 h-4" /> Bắt đầu nói
                                </button>
                            ) : (
                                <button onClick={handleStopAndParse} className="flex-1 bg-gray-800 text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-900 flex items-center justify-center gap-2">
                                    <Check className="w-4 h-4" /> Nghe xong, phân tích
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-gray-400">Ví dụ: "Anh Nguyễn Văn A, 0912345678, cần mua chung cư quận 2, ngân sách 2 đến 3 tỷ"</p>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="text-center py-8">
                        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">AI đang phân tích thông tin...</p>
                    </div>
                )}

                {step === 'result' && customerData && (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-1">Nội dung đã nghe:</p>
                            <p className="text-sm text-gray-800">{transcript}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-semibold text-gray-800 mb-3">Thông tin AI trích xuất</h3>
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white rounded-lg p-2.5 border">
                                        <p className="text-xs text-gray-400">👤 Tên</p>
                                        <input value={customerData.ten} onChange={(e) => setCustomerData({ ...customerData, ten: e.target.value })}
                                            className="w-full text-sm font-medium mt-0.5 bg-transparent focus:outline-none border-b border-gray-200" />
                                    </div>
                                    <div className="bg-white rounded-lg p-2.5 border">
                                        <p className="text-xs text-gray-400">📞 SĐT</p>
                                        <input value={customerData.sdt} onChange={(e) => setCustomerData({ ...customerData, sdt: e.target.value })}
                                            className="w-full text-sm font-medium text-emerald-600 mt-0.5 bg-transparent focus:outline-none border-b border-gray-200" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white rounded-lg p-2.5 border">
                                        <p className="text-xs text-gray-400">🎯 Nhu cầu</p>
                                        <input value={customerData.nhuCau || ''} onChange={(e) => setCustomerData({ ...customerData, nhuCau: e.target.value })}
                                            className="w-full text-sm mt-0.5 bg-transparent focus:outline-none border-b border-gray-200" />
                                    </div>
                                    <div className="bg-white rounded-lg p-2.5 border">
                                        <p className="text-xs text-gray-400">💰 Ngân sách</p>
                                        <input value={customerData.nganSach || ''} onChange={(e) => setCustomerData({ ...customerData, nganSach: e.target.value })}
                                            className="w-full text-sm mt-0.5 bg-transparent focus:outline-none border-b border-gray-200" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white rounded-lg p-2.5 border">
                                        <p className="text-xs text-gray-400">📍 Khu vực</p>
                                        <input value={customerData.khuVuc || ''} onChange={(e) => setCustomerData({ ...customerData, khuVuc: e.target.value })}
                                            className="w-full text-sm mt-0.5 bg-transparent focus:outline-none border-b border-gray-200" />
                                    </div>
                                    <div className="bg-white rounded-lg p-2.5 border">
                                        <p className="text-xs text-gray-400">📝 Ghi chú</p>
                                        <input value={customerData.ghiChu || ''} onChange={(e) => setCustomerData({ ...customerData, ghiChu: e.target.value })}
                                            className="w-full text-sm mt-0.5 bg-transparent focus:outline-none border-b border-gray-200" />
                                    </div>
                                </div>
                                {/* Trạng thái */}
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">📊 Trạng thái</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {Object.entries(trangThaiConfig).map(([key, value]) => (
                                            <button key={key} type="button"
                                                onClick={() => setCustomerData({ ...customerData, trangThai: key })}
                                                className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${customerData.trangThai === key
                                                        ? 'ring-2 ring-emerald-500 ring-offset-1 ' + value.color
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}>
                                                {value.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setStep('listening')} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                                ← Nghe lại
                            </button>
                            <button onClick={handleSave} className="flex-[2] px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
                                <Check className="w-4 h-4" /> Lưu khách hàng
                            </button>
                        </div>
                    </div>
                )}

                {step === 'saving' && (
                    <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                        <p className="text-gray-600">Đang lưu...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
import { useState, useRef } from 'react';
import { Mic, Loader2, X, Check, Square, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from '../services/supabase';
import { transcribeVoiceWithGemini } from '../services/ai';
import { useToast } from './Toast';

const trangThaiConfig = {
    'tiem-nang': { label: 'Tiềm năng', color: 'bg-yellow-100 text-yellow-700' },
    'dang-cham': { label: 'Đang chăm', color: 'bg-blue-100 text-blue-700' },
    'sap-chot': { label: 'Sắp chốt', color: 'bg-green-100 text-green-700' },
    'da-mua': { label: 'Đã mua', color: 'bg-gray-100 text-gray-700' },
};

export default function VoiceInput({ onSave, onClose }) {
    const [step, setStep] = useState('idle'); // idle | recording | processing | result | saving
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [customerData, setCustomerData] = useState(null);
    const [transcript, setTranscript] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);
    const toast = useToast();

    const startRecording = async () => {
        setError(null);
        setTranscript('');
        setCustomerData(null);
        setAudioBlob(null);
        setAudioUrl(null);
        setStep('recording');
        setIsRecording(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mimeType = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : 'audio/mp4';

            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                setIsRecording(false);
                // Tự động gọi AI phân tích
                handleProcessAudio(blob, mimeType);
            };

            recorder.start();
        } catch (err) {
            console.error('Lỗi truy cập mic:', err);
            setIsRecording(false);
            setStep('idle');
            if (err.name === 'NotAllowedError') {
                setError('Bạn cần cấp quyền microphone');
            } else {
                setError('Không thể truy cập microphone: ' + err.message);
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            // Stop stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        }
    };

    const handleProcessAudio = async (blob, mimeType) => {
        setStep('processing');
        setAiLoading(true);
        try {
            // Chuyển blob thành base64
            const base64 = await blobToBase64(blob);
            const aiResult = await transcribeVoiceWithGemini(base64, mimeType);
            if (Array.isArray(aiResult) && aiResult.length > 0) {
                const first = aiResult[0];
                setCustomerData({
                    ten: first.ten || '',
                    sdt: first.sdt || '',
                    nhuCau: first.nhuCau || '',
                    nganSach: first.nganSach || '',
                    khuVuc: first.khuVuc || '',
                    ghiChu: first.ghiChu || '',
                    trangThai: 'tiem-nang',
                });
                setTranscript(first.ghiChu ? `${first.ten} ${first.sdt} ${first.nhuCau} ${first.nganSach} ${first.khuVuc} ${first.ghiChu}` : `${first.ten} ${first.sdt} ${first.nhuCau} ${first.nganSach} ${first.khuVuc}`);
                setStep('result');
            } else {
                setError('Không tìm thấy thông tin khách hàng trong đoạn ghi âm');
                setStep('idle');
            }
        } catch (err) {
            console.error('Lỗi xử lý audio:', err);
            setError('Lỗi AI: ' + err.message);
            setStep('idle');
        } finally {
            setAiLoading(false);
        }
    };

    const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleSave = async () => {
        if (!customerData || !customerData.ten || !customerData.sdt) {
            toast.warning('Cần có tên và số điện thoại');
            return;
        }
        setStep('saving');
        await onSave(customerData);
    };

    const resetToIdle = () => {
        setStep('idle');
        setAudioBlob(null);
        setAudioUrl(null);
        setCustomerData(null);
        setTranscript('');
        setError(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center overflow-hidden">
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

                {step === 'idle' && (
                    <div className="space-y-4 text-center">
                        <div className="relative w-32 h-32 mx-auto cursor-pointer" onClick={startRecording}>
                            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-75"></div>
                            <div className="relative flex items-center justify-center w-full h-full bg-emerald-500 rounded-full shadow-lg">
                                <Mic className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <p className="text-gray-600 font-medium">Nhấn nút để bắt đầu ghi âm</p>
                        <button onClick={startRecording} className="w-full bg-emerald-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
                            <Mic className="w-4 h-4" /> Bắt đầu nói
                        </button>
                    </div>
                )}

                {step === 'recording' && (
                    <div className="space-y-4 text-center">
                        <div className="relative w-32 h-32 mx-auto">
                            {/* Các vòng sóng */}
                            <div className="mic-wave"></div>
                            <div className="mic-wave delay-1"></div>
                            <div className="mic-wave delay-2"></div>
                            {/* Nút mic trung tâm */}
                            <div className="absolute inset-0 flex items-center justify-center bg-emerald-500 rounded-full shadow-lg">
                                <Mic className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <p className="text-gray-600 font-medium">Đang ghi âm... Hãy nói thông tin khách hàng</p>
                        <button onClick={stopRecording} className="w-full bg-red-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-red-600 flex items-center justify-center gap-2">
                            <Square className="w-4 h-4" /> Dừng và phân tích
                        </button>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="text-center py-8">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <p className="text-gray-600 font-medium">AI đang phân tích...</p>
                    </div>
                )}

                {step === 'result' && customerData && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-emerald-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-1">Nội dung đã nhận dạng:</p>
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
                            <button onClick={resetToIdle} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                                ← Ghi âm lại
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
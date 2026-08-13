import { useState, useRef, useCallback } from 'react';

export function useSpeechRecognition() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);
    const retryCountRef = useRef(0);

    const startListening = useCallback(async () => {
        // Reset lỗi và transcript
        setError(null);
        setTranscript('');

        // Kiểm tra hỗ trợ SpeechRecognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Trình duyệt không hỗ trợ nhận dạng giọng nói');
            return;
        }

        // Kiểm tra và xin quyền microphone
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                // Quan trọng: chủ động xin quyền mic trước
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Dừng stream ngay vì SpeechRecognition sẽ tự truy cập mic
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            } catch (err) {
                console.error('Lỗi xin quyền microphone:', err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError('Bạn cần cấp quyền microphone để dùng giọng nói');
                } else if (err.name === 'NotFoundError') {
                    setError('Không tìm thấy microphone');
                } else {
                    setError('Không thể truy cập microphone: ' + err.message);
                }
                return;
            }
        }

        // Dừng recognition cũ nếu có
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.stop();
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = true; // Cho phép nghe liên tục
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event) => {
            let final = '';
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptPart = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcriptPart;
                } else {
                    interim += transcriptPart;
                }
            }
            setTranscript(final || interim);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'aborted') {
                // Nếu bị aborted, cố gắng khởi động lại tối đa 2 lần
                if (retryCountRef.current < 2) {
                    retryCountRef.current += 1;
                    setTimeout(() => {
                        recognition.start();
                    }, 500);
                } else {
                    retryCountRef.current = 0;
                    setIsListening(false);
                    setError('Quá trình nghe bị ngắt, hãy thử lại');
                }
            } else if (event.error === 'not-allowed') {
                setIsListening(false);
                setError('Bạn đã từ chối quyền microphone');
            } else if (event.error === 'no-speech') {
                // Không nghe được gì, vẫn giữ trạng thái listening để người dùng nói tiếp
                console.log('Không phát hiện giọng nói');
            } else if (event.error === 'network') {
                setIsListening(false);
                setError('Lỗi mạng, hãy kiểm tra kết nối');
            } else {
                setIsListening(false);
                setError('Lỗi: ' + event.error);
            }
        };

        recognition.onend = () => {
            // Nếu vẫn đang có ý định nghe và chưa có lỗi, tự khởi động lại
            if (isListening && !error) {
                // đôi khi onend được gọi mà không có lý do, khởi động lại nếu cần
                // nhưng tránh loop vô hạn
                if (retryCountRef.current < 2) {
                    retryCountRef.current += 1;
                    try {
                        recognition.start();
                    } catch (e) {
                        console.log('Không thể khởi động lại:', e);
                        retryCountRef.current = 0;
                        setIsListening(false);
                    }
                } else {
                    retryCountRef.current = 0;
                    setIsListening(false);
                }
            } else {
                retryCountRef.current = 0;
                setIsListening(false);
            }
        };

        recognitionRef.current = recognition;
        retryCountRef.current = 0;

        try {
            recognition.start();
        } catch (err) {
            console.error('Lỗi khi start recognition:', err);
            setIsListening(false);
            setError('Không thể bắt đầu nhận dạng');
        }
    }, [isListening, error]); // cần theo dõi isListening và error để tránh cập nhật sai

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.stop();
        }
        retryCountRef.current = 0;
        setIsListening(false);
    }, []);

    return { isListening, transcript, error, startListening, stopListening };
}
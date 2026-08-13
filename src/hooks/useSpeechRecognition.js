import { useState, useRef, useCallback } from 'react';

export function useSpeechRecognition() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);
    const isListeningRef = useRef(false); // Thêm ref để tránh re-render

    const startListening = useCallback(async () => {
        setError(null);
        setTranscript('');
        if (isListeningRef.current) return; // Đang nghe rồi thì không tạo mới

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Trình duyệt không hỗ trợ nhận dạng giọng nói');
            return;
        }

        // Dừng recognition cũ nếu có
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = false; // Chỉ nghe một lần, tránh lỗi trên Android
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isListeningRef.current = true;
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
            if (event.error === 'not-allowed') {
                setError('Bạn đã từ chối quyền microphone');
            } else if (event.error === 'no-speech') {
                setError('Không nghe thấy giọng nói, hãy thử lại');
            } else if (event.error === 'aborted') {
                setError('Quá trình nghe bị ngắt, hãy thử lại');
            } else {
                setError('Lỗi: ' + event.error);
            }
            isListeningRef.current = false;
            setIsListening(false);
        };

        recognition.onend = () => {
            isListeningRef.current = false;
            setIsListening(false);
            // Không tự khởi động lại, người dùng sẽ bấm nút lại nếu cần
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (err) {
            console.error('Lỗi khi start recognition:', err);
            isListeningRef.current = false;
            setIsListening(false);
            setError('Không thể bắt đầu nhận dạng');
        }
    }, []); // Không cần dependency vì dùng ref

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        isListeningRef.current = false;
        setIsListening(false);
    }, []);

    return { isListening, transcript, error, startListening, stopListening };
}
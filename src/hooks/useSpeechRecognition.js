import { useState, useRef, useCallback } from 'react';

export function useSpeechRecognition() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);

    const startListening = useCallback(async () => {
        // Kiểm tra hỗ trợ
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                setError('Trình duyệt không hỗ trợ nhận dạng giọng nói');
                return;
            }

            // Dừng nếu đang nghe
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }

            const recognition = new SpeechRecognition();
            recognition.lang = 'vi-VN';
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setIsListening(true);
                setTranscript('');
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
                setError(event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'aborted') {
                    // Tự động khởi động lại sau 300ms
                    setTimeout(() => {
                        recognition.start();
                    }, 300);
                } else {
                    setError(event.error);
                    setIsListening(false);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            setError('Không thể truy cập microphone: ' + err.message);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    }, []);

    return { isListening, transcript, error, startListening, stopListening };
}
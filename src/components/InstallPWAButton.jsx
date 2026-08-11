import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallPWAButton() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        // Lắng nghe sự kiện beforeinstallprompt từ Chrome/Edge
        const handler = (e) => {
            e.preventDefault(); // Ngăn popup tự động
            setInstallPrompt(e); // Lưu lại để dùng sau
            setShowButton(true); // Hiển thị nút cài đặt
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Kiểm tra xem app đã được cài chưa (nếu có standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowButton(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;
        // Hiển thị hộp thoại cài đặt
        installPrompt.prompt();
        const result = await installPrompt.userChoice;
        if (result.outcome === 'accepted') {
            console.log('Người dùng đã cài đặt app');
            setShowButton(false);
        }
        setInstallPrompt(null);
    };

    if (!showButton) return null; // Không hiển thị nếu không cần

    return (
        <button
            onClick={handleInstall}
            className="fixed bottom-24 left-4 z-30 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 active:scale-95 transition-all"
        >
            <Download className="w-4 h-4" />
            Cài đặt ứng dụng
        </button>
    );
}
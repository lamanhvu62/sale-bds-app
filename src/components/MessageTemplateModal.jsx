import { useState, useEffect } from 'react';
import { X, Copy, MessageCircle, ExternalLink, Check, ChevronDown, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useToast } from './Toast';

const BUILT_IN_TEMPLATES = [
    {
        id: 'gioi-thieu-du-an',
        label: 'Giới thiệu dự án',
        template: 'Chào [tên khách hàng],\n\nBên em đang có dự án [dự án] tại [vị trí], giá chỉ từ [giá]. Anh/chị có quan tâm tham khảo thêm không ạ?\n\nLiên hệ: [tên sale] - [số điện thoại]',
    },
    {
        id: 'bao-gia',
        label: 'Báo giá',
        template: 'Chào [tên khách hàng],\n\nEm gửi anh/chị báo giá căn hộ [dự án]:\n- Diện tích: [diện tích]\n- Giá: [giá]\n- Thanh toán: [tiến độ]\n\nAnh/chị xem qua và cho em ý kiến nhé ạ.',
    },
    {
        id: 'hen-xem-nha',
        label: 'Hẹn xem nhà',
        template: 'Chào [tên khách hàng],\n\nAnh/chị sắp xếp thời gian đi xem [dự án] vào [thời gian] được không ạ? Bên em có xe đưa đón tận nơi.\n\nĐịa chỉ: [vị trí]\nLiên hệ: [số điện thoại]',
    },
    {
        id: 'cam-on',
        label: 'Cảm ơn sau xem',
        template: 'Cảm ơn anh/chị [tên khách hàng] đã dành thời gian ghé thăm [dự án] hôm nay. Nếu cần thêm thông tin, anh/chị cứ nhắn em nhé!',
    },
    {
        id: 'chuc-mung',
        label: 'Chúc mừng sinh nhật / lễ',
        template: 'Chúc anh/chị [tên khách hàng] một ngày thật vui vẻ và hạnh phúc! Cảm ơn anh/chị đã luôn tin tưởng và đồng hành cùng em.',
    },
    {
        id: 'follow-up',
        label: 'Chăm sóc sau bán',
        template: 'Chào [tên khách hàng],\n\nEm chỉ hỏi thăm anh/chị dạo này thế nào, nhà cửa có vấn đề gì cần hỗ trợ không ạ? Có gì anh/chị cứ gọi em nhé.',
    },
];

export default function MessageTemplateModal({ onClose, customer }) {
    const [selectedTemplate, setSelectedTemplate] = useState(BUILT_IN_TEMPLATES[0].id);
    const [message, setMessage] = useState('');
    const [duAnList, setDuAnList] = useState([]);
    const [selectedDuAn, setSelectedDuAn] = useState(null);
    const toast = useToast();

    // Lấy danh sách dự án của sale
    useEffect(() => {
        const fetchDuAn = async () => {
            const { data } = await supabase.from('du_an').select('*').order('ten');
            setDuAnList(data || []);
        };
        fetchDuAn();
    }, []);

    // Tự động cập nhật message khi đổi mẫu hoặc dự án
    useEffect(() => {
        const template = BUILT_IN_TEMPLATES.find(t => t.id === selectedTemplate);
        if (!template) return;

        let text = template.template;
        // Thay thế placeholder từ customer
        text = text.replace(/\[tên khách hàng\]/g, customer?.ten || '');
        text = text.replace(/\[tên sale\]/g, 'Tư vấn viên');

        // Thay thế placeholder từ dự án được chọn
        if (selectedDuAn) {
            text = text.replace(/\[dự án\]/g, selectedDuAn.ten);
            text = text.replace(/\[vị trí\]/g, selectedDuAn.vi_tri || 'Vị trí dự án');
            text = text.replace(/\[giá\]/g, selectedDuAn.gia || 'Giá');
            text = text.replace(/\[diện tích\]/g, selectedDuAn.dien_tich || '');
            text = text.replace(/\[tiến độ\]/g, selectedDuAn.tien_do || '');
        } else {
            // Nếu chưa chọn dự án, giữ placeholder hoặc thay bằng "..."
            text = text.replace(/\[dự án\]/g, '...');
            text = text.replace(/\[vị trí\]/g, '...');
            text = text.replace(/\[giá\]/g, '...');
            text = text.replace(/\[diện tích\]/g, '...');
            text = text.replace(/\[tiến độ\]/g, '...');
        }

        text = text.replace(/\[số điện thoại\]/g, customer?.sdt || '...');
        text = text.replace(/\[thời gian\]/g, '...');

        setMessage(text);
    }, [selectedTemplate, selectedDuAn, customer]);

    const handleCopy = () => {
        navigator.clipboard.writeText(message);
        toast.success('Đã copy tin nhắn!');
    };

    const handleOpenZalo = () => {
        if (!customer?.sdt) {
            toast.warning('Không có số điện thoại khách hàng');
            return;
        }
        window.open(`https://zalo.me/${customer.sdt}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center overflow-hidden">
            <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto overflow-x-hidden shadow-2xl box-border">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Tin nhắn mẫu</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Thông tin khách hàng */}
                {customer && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                        <span className="text-gray-500">Gửi đến: </span>
                        <span className="font-medium">{customer.ten}</span>
                        <span className="text-gray-400 ml-2">{customer.sdt}</span>
                    </div>
                )}

                {/* Chọn mẫu */}
                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn mẫu</label>
                    <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    >
                        {BUILT_IN_TEMPLATES.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {/* Chọn dự án */}
                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn dự án</label>
                    <select
                        value={selectedDuAn?.id || ''}
                        onChange={(e) => {
                            const found = duAnList.find(d => d.id === parseInt(e.target.value));
                            setSelectedDuAn(found || null);
                        }}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="">-- Không chọn dự án --</option>
                        {duAnList.map(da => (
                            <option key={da.id} value={da.id}>{da.ten}</option>
                        ))}
                    </select>
                </div>

                {/* Nội dung tin nhắn */}
                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleCopy}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                        <Copy className="w-4 h-4" /> Copy
                    </button>
                    <button
                        onClick={handleOpenZalo}
                        className="flex-[2] px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                        <MessageCircle className="w-4 h-4" /> Mở Zalo
                    </button>
                </div>
            </div>
        </div>
    );
}
import { useState, useEffect } from 'react';
import { X, Plus, Copy, MessageCircle, Trash2, Edit3, Check, Zap } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useToast } from './Toast';
import ConfirmDialog from './ConfirmDialog';

const DEFAULT_TEMPLATES = [
    {
        title: 'Giới thiệu dự án',
        content: 'Chào {ten},\n\nBên em đang có dự án {du_an} với giá {ngan_sach} rất phù hợp với nhu cầu của anh/chị. Mình hẹn xem nhà cuối tuần này nhé!\n\nThông tin chi tiết: [Link dự án]',
    },
    {
        title: 'Báo giá',
        content: 'Dạ {ten} ơi,\n\nBên em vừa có bảng giá mới nhất của dự án {du_an}. Giá chỉ từ {ngan_sach}. Anh/chị quan tâm em gửi chi tiết nhé.',
    },
    {
        title: 'Chăm sóc sau xem',
        content: 'Cảm ơn {ten} đã dành thời gian xem dự án {du_an} hôm nay. Nếu có thắc mắc gì anh/chị cứ nhắn em nhé. Em sẽ gửi thêm thông tin thanh toán và chính sách chiết khấu.',
    },
    {
        title: 'Nhắc lịch hẹn',
        content: 'Chào {ten},\n\nEm nhắc lịch hẹn xem dự án {du_an} vào lúc [giờ] ngày [ngày] tại [địa điểm]. Anh/chị sắp xếp thời gian giúp em nhé.',
    },
];

export default function TemplateMessageModal({ isOpen, onClose, customer }) {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [previewText, setPreviewText] = useState('');
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', content: '' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const toast = useToast();

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        const { data, error } = await supabase
            .from('message_templates')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Lỗi lấy mẫu:', error);
            return;
        }

        if (data && data.length > 0) {
            setTemplates(data);
        } else {
            // Nếu user chưa có mẫu nào, tự động thêm mẫu mặc định
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const templatesToInsert = DEFAULT_TEMPLATES.map(t => ({ ...t, user_id: user.id }));
                const { data: inserted } = await supabase.from('message_templates').insert(templatesToInsert).select();
                if (inserted) setTemplates(inserted);
            }
        }
    };

    // Xử lý thay thế placeholder
    const processTemplate = (content) => {
        if (!customer) return content;
        return content
            .replace(/{ten}/g, customer.ten || '[Tên KH]')
            .replace(/{sdt}/g, customer.sdt || '[SĐT]')
            .replace(/{du_an}/g, customer.du_an_quan_tam || '[Dự án]')
            .replace(/{ngan_sach}/g, customer.ngan_sach || '[Ngân sách]');
    };

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template.id);
        setPreviewText(processTemplate(template.content));
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(previewText);
        toast.success('Đã copy tin nhắn!');
    };

    const handleOpenZalo = () => {
        const text = encodeURIComponent(previewText);
        window.open(`https://zalo.me/${customer.sdt}?text=${text}`, '_blank');
    };

    // CRUD templates
    const handleAddNew = () => {
        setEditingTemplate(null);
        setForm({ title: '', content: '' });
        setShowForm(true);
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setForm({ title: template.title, content: template.content });
        setShowForm(true);
    };

    const handleSaveTemplate = async () => {
        if (!form.title.trim() || !form.content.trim()) {
            toast.warning('Vui lòng nhập tiêu đề và nội dung mẫu!');
            return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (editingTemplate) {
            const { error } = await supabase
                .from('message_templates')
                .update({ title: form.title, content: form.content })
                .eq('id', editingTemplate.id);
            if (error) {
                toast.error('Lỗi cập nhật mẫu');
                return;
            }
            toast.success('Đã cập nhật mẫu');
        } else {
            const { error } = await supabase
                .from('message_templates')
                .insert({ ...form, user_id: user.id });
            if (error) {
                toast.error('Lỗi thêm mẫu');
                return;
            }
            toast.success('Đã thêm mẫu mới');
        }
        setShowForm(false);
        fetchTemplates();
    };

    const handleDelete = async (id) => {
        setShowDeleteConfirm(id);
    };

    const performDelete = async () => {
        if (!showDeleteConfirm) return;
        const { error } = await supabase
            .from('message_templates')
            .delete()
            .eq('id', showDeleteConfirm);
        if (error) {
            toast.error('Lỗi xóa mẫu');
        } else {
            toast.success('Đã xóa mẫu');
            if (selectedTemplate === showDeleteConfirm) {
                setSelectedTemplate(null);
                setPreviewText('');
            }
            fetchTemplates();
        }
        setShowDeleteConfirm(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-end justify-center overflow-hidden">
            <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto overflow-x-hidden shadow-2xl box-border">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Zap className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Gửi tin nhắn mẫu</h2>
                            {customer && <p className="text-xs text-gray-500">Đến: {customer.ten} - {customer.sdt}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {showForm ? (
                    /* Form thêm/sửa mẫu */
                    <div className="space-y-3">
                        <input
                            placeholder="Tiêu đề mẫu"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                        />
                        <textarea
                            placeholder="Nội dung mẫu (dùng {ten}, {du_an}, {ngan_sach}...)"
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            rows={5}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setShowForm(false)} className="flex-1 border py-2 rounded-lg text-sm">Hủy</button>
                            <button onClick={handleSaveTemplate} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm">Lưu</button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Danh sách mẫu */}
                        <div className="grid grid-cols-1 gap-2 mb-4 max-h-48 overflow-y-auto">
                            {templates.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => handleSelectTemplate(t)}
                                    className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center ${selectedTemplate === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                                        }`}
                                >
                                    <span className="text-sm font-medium truncate">{t.title}</span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(t); }}
                                            className="p-1 hover:bg-white rounded"
                                        >
                                            <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                            className="p-1 hover:bg-white rounded"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={handleAddNew} className="border border-dashed border-gray-300 p-3 rounded-lg text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> Thêm mẫu mới
                            </button>
                        </div>

                        {/* Xem trước */}
                        {previewText && (
                            <div className="bg-gray-50 p-4 rounded-xl mb-4">
                                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{previewText}</pre>
                            </div>
                        )}

                        {/* Nút hành động */}
                        {selectedTemplate && (
                            <div className="flex gap-2">
                                <button onClick={handleCopy} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2">
                                    <Copy className="w-4 h-4" /> Copy
                                </button>
                                <button onClick={handleOpenZalo} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm flex items-center justify-center gap-2">
                                    <MessageCircle className="w-4 h-4" /> Gửi Zalo
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Confirm Dialog */}
                <ConfirmDialog
                    isOpen={!!showDeleteConfirm}
                    onClose={() => setShowDeleteConfirm(null)}
                    onConfirm={performDelete}
                    title="Xóa mẫu"
                    message="Bạn có chắc muốn xóa mẫu tin nhắn này?"
                    type="danger"
                />
            </div>
        </div>
    );
}
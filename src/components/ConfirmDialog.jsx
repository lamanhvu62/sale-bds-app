import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Xác nhận', cancelText = 'Hủy', type = 'warning' }) {
  if (!isOpen) return null;

  const typeStyles = {
    warning: { icon: AlertTriangle, iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', buttonColor: 'bg-red-500 hover:bg-red-600' },
    danger: { icon: AlertTriangle, iconBg: 'bg-red-100', iconColor: 'text-red-600', buttonColor: 'bg-red-600 hover:bg-red-700' },
    info: { icon: AlertTriangle, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', buttonColor: 'bg-emerald-600 hover:bg-emerald-700' },
  };

  const style = typeStyles[type] || typeStyles.warning;
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <div className="p-6 text-center">
          <div className={`w-14 h-14 ${style.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-7 h-7 ${style.iconColor}`} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">{title || 'Xác nhận'}</h3>
          <p className="text-sm text-gray-600 mb-6">{message || 'Bạn có chắc chắn muốn thực hiện hành động này?'}</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-medium transition-colors ${style.buttonColor}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
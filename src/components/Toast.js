import { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: <FaCheckCircle className="text-green-500" size={20} />,
        error: <FaExclamationCircle className="text-red-500" size={20} />,
        info: <FaInfoCircle className="text-blue-500" size={20} />,
        warning: <FaExclamationCircle className="text-yellow-500" size={20} />
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200',
        warning: 'bg-yellow-50 border-yellow-200'
    };

    return (
        <div className={`fixed top-4 right-4 z-50 animate-slideIn`}>
            <div className={`${bgColors[type]} border-l-4 rounded-lg shadow-hover p-4 pr-12 max-w-md`}>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {icons[type]}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toast;

import React, { useEffect } from 'react';

interface NotificationProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
    duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose, duration = 5000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        <div className={`notification-toast notification-${type}`}>
            <div className="notification-content">
                {message}
            </div>
            <button className="notification-close" onClick={onClose}>×</button>
        </div>
    );
};

export default Notification;

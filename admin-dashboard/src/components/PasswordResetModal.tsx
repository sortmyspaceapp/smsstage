import React, { useState, useEffect } from 'react';
import api from '../config/axios';

interface PasswordResetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: {
        id: string;
        email: string;
        profile?: {
            firstName: string;
            lastName: string;
        };
    } | null;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ isOpen, onClose, onSuccess, user }) => {
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({ newPassword: '', confirmPassword: '' });
            setError(null);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!user) {
            setError('User not found');
            return;
        }

        setLoading(true);

        try {
            await api.put(`/api/user/${user.id}/reset-password`, {
                newPassword: formData.newPassword
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            setError(error.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    const userName = user.profile
        ? `${user.profile.firstName} ${user.profile.lastName}`.trim() || user.email
        : user.email;

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="form-modal-header">
                    <h3>Reset Password</h3>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-modal-body">
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '5px' }}>
                            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                                Resetting password for: <strong style={{ color: '#333' }}>{userName}</strong>
                            </p>
                            <p style={{ margin: '0.25rem 0 0 0', color: '#999', fontSize: '0.85rem' }}>
                                {user.email}
                            </p>
                        </div>

                        {error && (
                            <div className="error-message" style={{ marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label>New Password *</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    placeholder="Enter new password (min 6 characters)"
                                    required
                                    minLength={6}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                                >
                                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Confirm Password *</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder="Confirm new password"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="form-modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel action-btn">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-submit action-btn">
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordResetModal;

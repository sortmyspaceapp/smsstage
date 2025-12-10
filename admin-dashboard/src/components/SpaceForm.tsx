import React, { useState, useEffect } from 'react';
import api from '../config/axios';

interface SpaceFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingSpace: any | null;
}

const SpaceForm: React.FC<SpaceFormProps> = ({ isOpen, onClose, onSuccess, editingSpace }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'RETAIL',
        sizeSqft: '',
        priceMonthly: '',
        availabilityStatus: 'AVAILABLE',
        description: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingSpace) {
            setFormData({
                name: editingSpace.name,
                type: editingSpace.type,
                sizeSqft: editingSpace.size.toString(),
                priceMonthly: editingSpace.price.toString(),
                availabilityStatus: editingSpace.availability,
                description: editingSpace.description || ''
            });
        } else {
            setFormData({
                name: '',
                type: 'RETAIL',
                sizeSqft: '',
                priceMonthly: '',
                availabilityStatus: 'AVAILABLE',
                description: ''
            });
        }
    }, [editingSpace]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                name: formData.name,
                type: formData.type,
                sizeSqft: parseFloat(formData.sizeSqft),
                priceMonthly: parseFloat(formData.priceMonthly),
                availabilityStatus: formData.availabilityStatus,
                description: formData.description || undefined
            };

            if (editingSpace) {
                await api.put(`/api/spaces/${editingSpace.id}`, payload);
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to save space');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="form-modal-header">
                    <h3>Edit Space</h3>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-modal-body">
                        <div className="form-group">
                            <label>Space Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Type *</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                required
                            >
                                <option value="RETAIL">Retail</option>
                                <option value="FOOD_COURT">Food Court</option>
                                <option value="OFFICE">Office</option>
                                <option value="ENTERTAINMENT">Entertainment</option>
                                <option value="SERVICES">Services</option>
                                <option value="PARKING">Parking</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Size (sq ft) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.sizeSqft}
                                onChange={(e) => setFormData({ ...formData, sizeSqft: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Price (₹/month) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.priceMonthly}
                                onChange={(e) => setFormData({ ...formData, priceMonthly: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Availability Status *</label>
                            <select
                                value={formData.availabilityStatus}
                                onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                                required
                            >
                                <option value="PREMIUM">Premium</option>
                                <option value="AVAILABLE">Available</option>
                                <option value="OCCUPIED">Occupied</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="RESERVED">Reserved</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="form-modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel action-btn">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-submit action-btn">
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SpaceForm;

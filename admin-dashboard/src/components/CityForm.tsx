import React, { useState, useEffect } from 'react';
import api from '../config/axios';

interface CityFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingCity: any | null;
}

const CityForm: React.FC<CityFormProps> = ({ isOpen, onClose, onSuccess, editingCity }) => {
    const [formData, setFormData] = useState({
        name: '',
        state: '',
        country: 'India'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingCity) {
            setFormData({
                name: editingCity.name,
                state: editingCity.state,
                country: editingCity.country || 'India'
            });
        } else {
            setFormData({ name: '', state: '', country: 'India' });
        }
    }, [editingCity]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingCity) {
                await api.put(`/api/cities/${editingCity.id}`, formData);
            } else {
                await api.post('/api/cities', formData);
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to save city');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="form-modal-header">
                    <h3>{editingCity ? 'Edit City' : 'Add City'}</h3>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-modal-body">
                        <div className="form-group">
                            <label>City Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>State *</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Country</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
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

export default CityForm;

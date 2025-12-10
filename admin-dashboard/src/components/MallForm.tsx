import React, { useState, useEffect } from 'react';
import api from '../config/axios';

interface MallFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingMall: any | null;
    cities: any[];
    sectors: any[];
}

const MallForm: React.FC<MallFormProps> = ({ isOpen, onClose, onSuccess, editingMall, cities, sectors }) => {
    const [formData, setFormData] = useState({
        name: '',
        cityId: '',
        sectorId: '',
        address: '',
        managerId: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingMall) {
            setFormData({
                name: editingMall.name,
                cityId: editingMall.city?.id || '',
                sectorId: editingMall.sector?.id || '',
                address: editingMall.address,
                managerId: editingMall.managerId || ''
            });
        } else {
            setFormData({ name: '', cityId: '', sectorId: '', address: '', managerId: '' });
        }
    }, [editingMall]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                managerId: formData.managerId || undefined
            };

            if (editingMall) {
                await api.put(`/api/malls/${editingMall.id}`, payload);
            } else {
                await api.post('/api/malls', payload);
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to save mall');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="form-modal-header">
                    <h3>{editingMall ? 'Edit Mall' : 'Add Mall'}</h3>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-modal-body">
                        <div className="form-group">
                            <label>Mall Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>City *</label>
                            <select
                                value={formData.cityId}
                                onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                                required
                            >
                                <option value="">Select City</option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.id}>{city.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Sector *</label>
                            <select
                                value={formData.sectorId}
                                onChange={(e) => setFormData({ ...formData, sectorId: e.target.value })}
                                required
                            >
                                <option value="">Select Sector</option>
                                {sectors.map(sector => (
                                    <option key={sector.id} value={sector.id}>{sector.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Address *</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                required
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

export default MallForm;

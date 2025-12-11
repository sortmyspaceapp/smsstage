import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Notification from './Notification';
import FloorMap from './FloorMap';

// Fix for React 19 type compatibility
const EyeIcon = FaEye as any;
const EyeSlashIcon = FaEyeSlash as any;

interface User {
    id: string;
    email: string;
    role: string;
    profile?: {
        firstName: string;
        lastName: string;
        phone: string;
    };
}

interface CustomerDashboardProps {
    user: User;
    onLogout: () => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('spaces');
    const [spaces, setSpaces] = useState<any[]>([]);
    const [malls, setMalls] = useState<any[]>([]);
    const [interestedSpaces, setInterestedSpaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedMall, setSelectedMall] = useState<any>(null);
    const [showMapModal, setShowMapModal] = useState(false);
    const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
    const [selectedSpace, setSelectedSpace] = useState<any>(null);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [spacesRes, mallsRes, interestedRes] = await Promise.all([
                api.get('/api/spaces/search'),
                api.get('/api/malls'),
                api.get('/api/user/interested')
            ]);

            setSpaces(spacesRes.data.data.spaces || []);
            setMalls(mallsRes.data.data.malls || []);
            setInterestedSpaces(interestedRes.data.data.interestedSpaces || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkInterested = async (spaceId: string) => {
        try {
            await api.post('/api/user/interested', { spaceId, interestLevel: 'MEDIUM' });
            fetchData();
        } catch (error) {
            console.error('Failed to mark as interested:', error);
        }
    };

    const handleRemoveInterested = async (spaceId: string) => {
        try {
            await api.delete(`/api/user/interested/${spaceId}`);
            fetchData();
        } catch (error) {
            console.error('Failed to remove interest:', error);
        }
    };

    const handleViewMap = async (mallId: string) => {
        try {
            const response = await api.get(`/api/malls/${mallId}`);
            const mallData = response.data.data.mall;
            setSelectedMall(mallData);
            // Filter out any undefined/null floors and set the first valid floor as active
            const validFloors = (mallData.floors || []).filter((floor: any) => floor && floor.id);
            if (validFloors.length > 0) {
                setActiveFloorId(validFloors[0].id);
            } else {
                setActiveFloorId(null);
            }
            setShowMapModal(true);
        } catch (error) {
            console.error('Failed to fetch mall details:', error);
            setNotification({ message: 'Failed to load mall details', type: 'error' });
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setNotification({ message: "New passwords don't match", type: 'error' });
            return;
        }
        try {
            await api.put('/api/user/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            setNotification({ message: 'Password changed successfully', type: 'success' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            setNotification({
                message: error.response?.data?.error || 'Failed to change password',
                type: 'error'
            });
        }
    };

    const handleSpaceClick = async (spaceData: any) => {
        try {
            // Fetch full space details including contact info
            const response = await api.get(`/api/spaces/${spaceData.id}`);
            if (response.data.success) {
                const space = response.data.data.space;
                // Normalize the availability field - API returns 'availability' but we use 'availabilityStatus'
                if (space.availability && !space.availabilityStatus) {
                    space.availabilityStatus = space.availability;
                }
                // Also normalize size and price field names if needed
                if (space.size && !space.sizeSqft) {
                    space.sizeSqft = space.size;
                }
                if (space.price && !space.priceMonthly) {
                    space.priceMonthly = space.price;
                }
                setSelectedSpace(space);
            }
        } catch (error) {
            console.error('Error fetching space details:', error);
            // Fallback to basic data if fetch fails
            // Normalize field names for consistency
            const normalizedSpace = { ...spaceData };
            if (spaceData.availability && !spaceData.availabilityStatus) {
                normalizedSpace.availabilityStatus = spaceData.availability;
            }
            setSelectedSpace(normalizedSpace);
        }
    };

    return (
        <div className="dashboard">
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
            <header className="dashboard-header">
                <h1>SpaceFinder - Customer Portal</h1>
                <div className="header-actions">
                    <div className="user-info">
                        <span>Welcome, {user.profile?.firstName || user.email}</span>
                        <button onClick={onLogout}>Logout</button>
                    </div>
                </div>
            </header>

            <div className="dashboard-layout">
                <aside className="dashboard-sidebar">
                    <nav className="sidebar-nav">
                        <button
                            className={activeTab === 'spaces' ? 'active' : ''}
                            onClick={() => setActiveTab('spaces')}
                        >
                            <span className="nav-icon">🏢</span>
                            <span className="nav-label">Browse Spaces</span>
                        </button>
                        <button
                            className={activeTab === 'malls' ? 'active' : ''}
                            onClick={() => setActiveTab('malls')}
                        >
                            <span className="nav-icon">🏬</span>
                            <span className="nav-label">Browse Malls</span>
                        </button>
                        <button
                            className={activeTab === 'interested' ? 'active' : ''}
                            onClick={() => setActiveTab('interested')}
                        >
                            <span className="nav-icon">⭐</span>
                            <span className="nav-label">My Interests</span>
                        </button>
                        <button
                            className={activeTab === 'profile' ? 'active' : ''}
                            onClick={() => setActiveTab('profile')}
                        >
                            <span className="nav-icon">👤</span>
                            <span className="nav-label">My Profile</span>
                        </button>
                    </nav>
                </aside>

                <main className="dashboard-content">
                    {loading && <div>Loading...</div>}

                    {activeTab === 'spaces' && (
                        <div className="spaces-section">
                            <h2>Available Spaces</h2>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Type</th>
                                            <th>Size (sq ft)</th>
                                            <th>Price (₹/month)</th>
                                            <th>Mall</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {spaces.map(space => (
                                            <tr key={space.id}>
                                                <td>{space.name}</td>
                                                <td>{space.type}</td>
                                                <td>{space.size}</td>
                                                <td>₹{space.price?.toLocaleString()}</td>
                                                <td>{space.mall?.name}</td>
                                                <td>
                                                    <span className={`status ${space.availability?.toLowerCase()}`}>
                                                        {space.availability}
                                                    </span>
                                                </td>
                                                <td>
                                                    {space.availability === 'AVAILABLE' && (
                                                        <button
                                                            onClick={() => handleMarkInterested(space.id)}
                                                            className="action-btn"
                                                            style={{ background: '#28a745', color: 'white' }}
                                                        >
                                                            Mark Interested
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'malls' && (
                        <div className="malls-section">
                            <h2>Shopping Malls</h2>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Address</th>
                                            <th>City</th>
                                            <th>Rating</th>
                                            <th>Floors</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {malls.map(mall => (
                                            <tr key={mall.id}>
                                                <td>{mall.name}</td>
                                                <td>{mall.address}</td>
                                                <td>{mall.city?.name}, {mall.city?.state}</td>
                                                <td>{mall.rating}/5</td>
                                                <td>{mall.floors?.length || 0}</td>
                                                <td>
                                                    <button
                                                        onClick={() => handleViewMap(mall.id)}
                                                        className="action-btn"
                                                        style={{ background: '#007bff', color: 'white' }}
                                                    >
                                                        View Map
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'interested' && (
                        <div className="interested-section">
                            <h2>My Interested Spaces</h2>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Space Name</th>
                                            <th>Building</th>
                                            <th>Size (sq ft)</th>
                                            <th>Price (₹/month)</th>
                                            <th>Interest Level</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {interestedSpaces.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.spaceName}</td>
                                                <td>{item.buildingName}</td>
                                                <td>{item.size}</td>
                                                <td>₹{item.price?.toLocaleString()}</td>
                                                <td>
                                                    <span className={`badge ${item.interestLevel?.toLowerCase()}`}>
                                                        {item.interestLevel}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => handleRemoveInterested(item.spaceId)}
                                                        className="action-btn delete-btn"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {interestedSpaces.length === 0 && (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                                    No interested spaces yet. Browse spaces to mark your interests!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="profile-section">
                            <h2>My Profile</h2>
                            <div className="profile-card">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="text" value={user.email} disabled />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <input
                                            type="text"
                                            value={user.profile?.firstName || ''}
                                            placeholder="First Name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input
                                            type="text"
                                            value={user.profile?.lastName || ''}
                                            placeholder="Last Name"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        value={user.profile?.phone || ''}
                                        placeholder="+91-XXXXXXXXXX"
                                    />
                                </div>
                                <div className="form-actions">
                                    <button className="btn-submit action-btn">
                                        Update Profile
                                    </button>
                                </div>
                            </div>

                            <div className="profile-card" style={{ marginTop: '2rem' }}>
                                <h3>Change Password</h3>
                                <form onSubmit={handlePasswordChange}>
                                    <div className="form-group">
                                        <label>Current Password</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showCurrentPassword ? "text" : "password"}
                                                value={passwordForm.currentPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle-btn"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            >
                                                {showCurrentPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                value={passwordForm.newPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                required
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle-btn"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm New Password</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={passwordForm.confirmPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                required
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle-btn"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-actions">
                                        <button type="submit" className="btn-submit action-btn" style={{ background: '#dc3545' }}>
                                            Change Password
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {showMapModal && selectedMall && (
                <div className="form-modal-overlay" onClick={() => setShowMapModal(false)}>
                    <div className="form-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%' }}>
                        <div className="form-header">
                            <h2>{selectedMall.name} - Maps</h2>
                            <button className="close-btn" onClick={() => setShowMapModal(false)}>×</button>
                        </div>
                        {/* Floor Tabs */}
                        <div className="floor-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                            {selectedMall.floors?.filter((floor: any) => floor && floor.id).map((floor: any) => (
                                <button
                                    key={floor.id}
                                    className={`floor-tab-btn ${activeFloorId === floor.id ? 'active' : ''}`}
                                    onClick={() => setActiveFloorId(floor.id)}
                                >
                                    {floor.name} (Floor {floor.floorNumber})
                                </button>
                            ))}
                        </div>

                        {/* Active Floor Map */}
                        {selectedMall.floors?.filter((floor: any) => floor && floor.id).map((floor: any) => (
                            floor.id === activeFloorId && (
                                <div key={floor.id} className="floor-map-section">
                                    <div className="map-container" style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', position: 'relative' }}>
                                        <FloorMap
                                            floorId={floor.id}
                                            floorName={floor.name}
                                            onSpaceClick={handleSpaceClick}
                                        />

                                        {/* Space Details Popover */}
                                        {selectedSpace && (
                                            <div className="space-details-popover" style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                background: 'white',
                                                padding: '1.5rem',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                                                zIndex: 100,
                                                minWidth: '300px',
                                                border: '1px solid #e5e7eb'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1f2937' }}>
                                                        {selectedSpace.name || 'Space Details'}
                                                    </h3>
                                                    <button
                                                        onClick={() => setSelectedSpace(null)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#9ca3af', padding: 0, lineHeight: 1 }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>

                                                <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#6b7280' }}>Type:</span>
                                                        <span style={{ fontWeight: 500 }}>{selectedSpace.type || 'N/A'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#6b7280' }}>Size:</span>
                                                        <span style={{ fontWeight: 500 }}>
                                                            {selectedSpace.sizeSqft ? `${selectedSpace.sizeSqft} sq.ft` : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#6b7280' }}>Price:</span>
                                                        <span style={{ fontWeight: 500 }}>
                                                            {selectedSpace.priceMonthly ? `₹${selectedSpace.priceMonthly.toLocaleString()}/mo` : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ color: '#6b7280' }}>Status:</span>
                                                        {(() => {
                                                            const status = selectedSpace.availabilityStatus || 'AVAILABLE';
                                                            let statusColor = '#059669'; // Green default
                                                            switch (status.toUpperCase()) {
                                                                case 'AVAILABLE':
                                                                    statusColor = '#059669'; // Green
                                                                    break;
                                                                case 'OCCUPIED':
                                                                    statusColor = '#dc2626'; // Red
                                                                    break;
                                                                case 'RESERVED':
                                                                    statusColor = '#d97706'; // Amber
                                                                    break;
                                                                case 'MAINTENANCE':
                                                                    statusColor = '#4b5563'; // Gray
                                                                    break;
                                                                case 'PREMIUM':
                                                                    statusColor = '#d97706'; // Gold
                                                                    break;
                                                            }
                                                            return (
                                                                <span 
                                                                    className={`status-badge ${status.toLowerCase()}`}
                                                                    style={{ 
                                                                        padding: '0.25rem 0.75rem', 
                                                                        borderRadius: '9999px', 
                                                                        fontSize: '0.875rem', 
                                                                        fontWeight: 500,
                                                                        color: statusColor,
                                                                        backgroundColor: statusColor === '#059669' ? '#d1fae5' : 
                                                                                        statusColor === '#dc2626' ? '#fee2e2' :
                                                                                        statusColor === '#d97706' ? '#fef3c7' :
                                                                                        '#f3f4f6',
                                                                        border: `1px solid ${statusColor}`
                                                                    }}
                                                                >
                                                                    {status}
                                                        </span>
                                                            );
                                                        })()}
                                                    </div>
                                                    {selectedSpace.contactDetails && (
                                                        <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '6px' }}>
                                                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#374151' }}>Contact Details</h4>
                                                            {selectedSpace.contactDetails.email && (
                                                                <div style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.25rem' }}>
                                                                    📧 {selectedSpace.contactDetails.email}
                                                                </div>
                                                            )}
                                                            {selectedSpace.contactDetails.phone && (
                                                                <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                                                                    📞 {selectedSpace.contactDetails.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="action-btn"
                                                        onClick={() => {
                                                            handleMarkInterested(selectedSpace.id);
                                                            setNotification({ message: 'Added to My Interests', type: 'success' });
                                                            setSelectedSpace(null);
                                                        }}
                                                        disabled={interestedSpaces.some(s => s?.space?.id === selectedSpace?.id)}
                                                        style={{
                                                            flex: 1,
                                                            background: interestedSpaces.some(s => s?.space?.id === selectedSpace?.id) ? '#9ca3af' : '#3B82F6',
                                                            color: 'white',
                                                            padding: '0.75rem',
                                                            borderRadius: '6px',
                                                            border: 'none',
                                                            cursor: interestedSpaces.some(s => s?.space?.id === selectedSpace?.id) ? 'not-allowed' : 'pointer',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {interestedSpaces.some(s => s?.space?.id === selectedSpace?.id) ? 'Already Interested' : "I'm Interested"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        ))}

                        {(!selectedMall.floors || selectedMall.floors.length === 0) && (
                            <p>No floors found for this mall.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;

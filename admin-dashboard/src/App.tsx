import React, { useState, useEffect, useCallback } from 'react';
import SvgEditor from './components/SvgEditor';
import SvgUpload from './components/SvgUpload';
import UserManagement from './components/UserManagement';
import Analytics from './components/Analytics';
import Leads from './components/Leads';
import CustomerDashboard from './components/CustomerDashboard';
import FloorSelectionModal from './components/FloorSelectionModal';
import FloorManagementModal from './components/FloorManagementModal';
import ConfirmDialog from './components/ConfirmDialog';
import CityForm from './components/CityForm';
import MallForm from './components/MallForm';
import SpaceForm from './components/SpaceForm';
import QRLogin from './components/QRLogin';
import './App.css';
import api from './config/axios';

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

interface Space {
  id: string;
  name: string;
  type: string;
  size: number;
  price: number;
  availability: string;
  mall: {
    name: string;
    city: string;
    sector: string;
  };
}

interface City {
  id: string;
  name: string;
  state: string;
  buildingsCount: number;
}

interface Mall {
  id: string;
  name: string;
  address: string;
  rating: number;
  city: {
    name: string;
    state: string;
  };
  sector: {
    name: string;
  };
  manager?: {
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
  floors: Array<{
    id: string;
    floorNumber: number;
    name: string;
    spaces: Array<{
      id: string;
      availabilityStatus: string;
    }>;
  }>;
}

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loginMode, setLoginMode] = useState<'password' | 'qr'>('password');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // SVG components state
  const [showSvgEditor, setShowSvgEditor] = useState(false);
  const [showSvgUpload, setShowSvgUpload] = useState(false);
  const [selectedMallId, setSelectedMallId] = useState<string | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [svgRefreshTrigger, setSvgRefreshTrigger] = useState(0);
  const [showFloorSelection, setShowFloorSelection] = useState(false);
  const [showFloorManagement, setShowFloorManagement] = useState(false);
  const [selectedMallForFloors, setSelectedMallForFloors] = useState<Mall | null>(null);
  const [selectedAction, setSelectedAction] = useState<'upload' | 'edit'>('upload');

  // CRUD state management
  const [showCityForm, setShowCityForm] = useState(false);
  const [showMallForm, setShowMallForm] = useState(false);
  const [showSpaceForm, setShowSpaceForm] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editingMall, setEditingMall] = useState<Mall | null>(null);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => { });
  const [confirmMessage, setConfirmMessage] = useState({ title: '', message: '' });
  const [sectors, setSectors] = useState<any[]>([]);




  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationRefreshing, setNotificationRefreshing] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    emailOrUsername: 'admin@spacefinder.com',
    password: 'admin123'
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/user/profile');
      setUser(response.data.data.user);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem('token');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/auth/login', loginForm);
      const { token, user } = response.data.data;

      localStorage.setItem('token', token);

      setUser(user);
      setIsLoggedIn(true);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQRLoginSuccess = (user: User, token: string, refreshToken: string) => {
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    setUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    setSpaces([]);
    setMalls([]);
    setCities([]);
  };

  const fetchSpaces = async () => {
    try {
      const response = await api.get('/api/spaces/search');
      setSpaces(response.data.data.spaces);
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
    }
  };

  const fetchMalls = async () => {
    try {
      const response = await api.get('/api/malls');
      setMalls(response.data.data.malls);
    } catch (error) {
      console.error('Failed to fetch malls:', error);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await api.get('/api/cities');
      setCities(response.data.data.cities);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const fetchDashboardData = async () => {
    await Promise.all([fetchSpaces(), fetchMalls(), fetchCities()]);
    // Fetch sectors separately - don't block if endpoint doesn't exist
    fetchSectors().catch(() => console.log('Sectors endpoint not available'));
  };

  const fetchSectors = async () => {
    try {
      const response = await api.get('/api/sectors');
      setSectors(response.data.data.sectors);
    } catch (error) {
      console.error('Failed to fetch sectors:', error);
    }
  };

  // CRUD Handlers for Cities
  const handleDeleteCity = (city: City) => {
    setConfirmMessage({
      title: 'Delete City',
      message: `Are you sure you want to delete "${city.name}"? This action cannot be undone.`
    });
    setConfirmAction(() => async () => {
      try {
        await api.delete(`/api/cities/${city.id}`);
        await fetchCities();
        setShowConfirmDialog(false);
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to delete city');
      }
    });
    setShowConfirmDialog(true);
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setShowCityForm(true);
  };

  const handleAddCity = () => {
    setEditingCity(null);
    setShowCityForm(true);
  };

  // CRUD Handlers for Malls
  const handleDeleteMall = (mall: Mall) => {
    setConfirmMessage({
      title: 'Delete Mall',
      message: `Are you sure you want to delete "${mall.name}"? This will also delete all associated floors and spaces.`
    });
    setConfirmAction(() => async () => {
      try {
        await api.delete(`/api/malls/${mall.id}`);
        await fetchMalls();
        setShowConfirmDialog(false);
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to delete mall');
      }
    });
    setShowConfirmDialog(true);
  };

  const handleEditMall = (mall: Mall) => {
    setEditingMall(mall);
    setShowMallForm(true);
  };

  const handleAddMall = () => {
    setEditingMall(null);
    setShowMallForm(true);
  };

  // CRUD Handlers for Spaces
  const handleDeleteSpace = (space: Space) => {
    setConfirmMessage({
      title: 'Delete Space',
      message: `Are you sure you want to delete "${space.name}"? This action cannot be undone.`
    });
    setConfirmAction(() => async () => {
      try {
        await api.delete(`/api/spaces/${space.id}`);
        await fetchSpaces();
        setShowConfirmDialog(false);
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to delete space');
      }
    });
    setShowConfirmDialog(true);
  };

  const handleEditSpace = (space: Space) => {
    setEditingSpace(space);
    setShowSpaceForm(true);
  };


  // Notification functions
  const fetchNotificationCount = async () => {
    try {
      setNotificationRefreshing(true);
      const response = await api.get('/api/notifications/count?unreadOnly=true');
      setUnreadCount(response.data.data.count);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    } finally {
      setNotificationRefreshing(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationRefreshing(true);
      const response = await api.get('/api/notifications');
      setNotifications(response.data.data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setNotificationRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(notification =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      ));
      fetchNotificationCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Force refresh notifications - can be called from anywhere
  const forceRefreshNotifications = () => {
    fetchNotificationCount();
    fetchNotifications();
  };

  // Make forceRefreshNotifications available globally
  (window as any).forceRefreshNotifications = forceRefreshNotifications;

  // SVG operations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSvgUpload = useCallback((mallId: string, floorId: string) => {
    setSelectedMallId(mallId);
    setSelectedFloorId(floorId);
    setShowSvgUpload(true);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSvgEdit = useCallback((mallId: string, floorId: string) => {
    setSelectedMallId(mallId);
    setSelectedFloorId(floorId);
    setShowSvgEditor(true);
  }, []);

  // Floor selection for SVG operations
  const handleFloorSelection = (mall: Mall, action: 'upload' | 'edit') => {
    setSelectedMallForFloors(mall);
    setSelectedAction(action);
    setShowFloorSelection(true);
  };

  const handleFloorSelect = (floorId: string, action: 'upload' | 'edit') => {
    if (!selectedMallForFloors) return;

    setSelectedMallId(selectedMallForFloors.id);
    setSelectedFloorId(floorId);

    if (action === 'upload') {
      setShowSvgUpload(true);
    } else {
      setShowSvgEditor(true);
    }
  };

  // Floor management
  const handleFloorManagement = (mall: Mall) => {
    setSelectedMallForFloors(mall);
    setShowFloorManagement(true);
  };

  const handleFloorsUpdate = () => {
    fetchMalls(); // Refresh malls data
  };

  const handleSvgUploadSuccess = () => {
    fetchDashboardData(); // Refresh data
    setSvgRefreshTrigger(prev => prev + 1); // Trigger SVG editor refresh
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboardData();
      fetchNotificationCount();
      fetchNotifications();
    }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for new notifications every 5 seconds for real-time updates
  useEffect(() => {
    if (isLoggedIn) {
      const interval = setInterval(() => {
        fetchNotificationCount();
        fetchNotifications();
      }, 30000); // Check every 30 seconds to avoid rate limiting

      return () => clearInterval(interval);
    }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show customer dashboard for customer users
  if (isLoggedIn && user?.role === 'CUSTOMER') {
    return <CustomerDashboard user={user} onLogout={handleLogout} />;
  }

  if (!isLoggedIn) {
    // Show QR login for customers, password login for others
    if (loginMode === 'qr') {
      return (
        <QRLogin
          onLoginSuccess={handleQRLoginSuccess}
          onSwitchToPassword={() => setLoginMode('password')}
        />
      );
    }

    return (
      <div className="login-container">
        <div className="login-card">
          <h1>SpaceFinder Admin Dashboard</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email or Username:</label>
              <input
                type="text"
                value={loginForm.emailOrUsername}
                onChange={(e) => setLoginForm({ ...loginForm, emailOrUsername: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <div className="password-input-wrapper">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="login-info">
            <h3>Test Credentials:</h3>
            <p><strong>Admin:</strong> admin@spacefinder.com / admin123</p>
            <p><strong>Customer:</strong> customer@spacefinder.com / customer123</p>
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <button
              type="button"
              onClick={() => setLoginMode('qr')}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.875rem',
              }}
            >
              Login with QR Code instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>SpaceFinder Admin Dashboard</h1>
        <div className="header-actions">
          <div className="notification-container">
            <button
              className={`notification-bell ${notificationRefreshing ? 'refreshing' : ''}`}
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  fetchNotifications();
                }
              }}
            >
              {notificationRefreshing ? '🔄' : '🔔'}
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            {/* Notifications Popup */}
            {showNotifications && (
              <div className="notifications-popup">
                <div className="notifications-header">
                  <h3>Recent Notifications</h3>
                  <div className="notification-actions">
                    <button onClick={markAllAsRead} className="mark-all-read-btn">
                      Mark All Read
                    </button>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="close-notifications-btn"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="notifications-list">
                  {notifications.length === 0 ? (
                    <p className="no-notifications">No notifications</p>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                        onClick={() => !notification.isRead && markAsRead(notification.id)}
                      >
                        <div className="notification-content">
                          <p className="notification-title">{notification.title}</p>
                          <p className="notification-message">{notification.message}</p>
                          <p className="notification-time">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.isRead && <div className="unread-indicator"></div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="user-info">
            <span>Welcome, {user?.profile?.firstName || user?.email}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <button
              className={activeTab === 'dashboard' ? 'active' : ''}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-label">Dashboard</span>
            </button>
            <button
              className={activeTab === 'spaces' ? 'active' : ''}
              onClick={() => setActiveTab('spaces')}
            >
              <span className="nav-icon">🏢</span>
              <span className="nav-label">Spaces</span>
            </button>
            <button
              className={activeTab === 'malls' ? 'active' : ''}
              onClick={() => setActiveTab('malls')}
            >
              <span className="nav-icon">🏬</span>
              <span className="nav-label">Malls</span>
            </button>
            <button
              className={activeTab === 'cities' ? 'active' : ''}
              onClick={() => setActiveTab('cities')}
            >
              <span className="nav-icon">🌆</span>
              <span className="nav-label">Cities</span>
            </button>
            <button
              className={activeTab === 'users' ? 'active' : ''}
              onClick={() => setActiveTab('users')}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-label">Users</span>
            </button>
            <button
              className={activeTab === 'analytics' ? 'active' : ''}
              onClick={() => setActiveTab('analytics')}
            >
              <span className="nav-icon">📈</span>
              <span className="nav-label">Analytics</span>
            </button>
            <button
              className={activeTab === 'leads' ? 'active' : ''}
              onClick={() => setActiveTab('leads')}
            >
              <span className="nav-icon">🎯</span>
              <span className="nav-label">Leads</span>
            </button>
          </nav>
        </aside>

        <main className="dashboard-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-overview">
              <h2>Dashboard Overview</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Spaces</h3>
                  <p className="stat-number">{spaces.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Available Spaces</h3>
                  <p className="stat-number">
                    {spaces.filter(space => space.availability === 'AVAILABLE').length}
                  </p>
                </div>
                <div className="stat-card">
                  <h3>Total Cities</h3>
                  <p className="stat-number">{cities.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Malls</h3>
                  <p className="stat-number">{malls.length}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'spaces' && (
            <div className="spaces-section">
              <h2>Spaces Management</h2>
              <button onClick={fetchSpaces} className="refresh-btn">Refresh Data</button>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Size (sq ft)</th>
                      <th>Price (₹/month)</th>
                      <th>Availability</th>
                      <th>Mall</th>
                      <th>City</th>
                      {(user?.role === 'ADMIN' || user?.role === 'MALL_MANAGER') && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {spaces.map(space => (
                      <tr key={space.id}>
                        <td>{space.name}</td>
                        <td>{space.type}</td>
                        <td>{space.size}</td>
                        <td>₹{space.price.toLocaleString()}</td>
                        <td>
                          <span className={`status ${space.availability.toLowerCase()}`}>
                            {space.availability}
                          </span>
                        </td>
                        <td>{space.mall.name}</td>
                        <td>{space.mall.city}</td>
                        {(user?.role === 'ADMIN' || user?.role === 'MALL_MANAGER') && (
                          <td>
                            <div className="action-buttons">
                              <button onClick={() => handleEditSpace(space)} className="edit-btn action-btn">Edit</button>
                              <button onClick={() => handleDeleteSpace(space)} className="delete-btn action-btn">Delete</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'malls' && (
            <div className="malls-section">
              <h2>Malls Management</h2>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                {user?.role === 'ADMIN' && (
                  <button onClick={handleAddMall} className="add-btn action-btn">+ Add Mall</button>
                )}
                <button onClick={fetchMalls} className="refresh-btn">Refresh Data</button>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Address</th>
                      <th>City</th>
                      <th>Sector</th>
                      <th>Rating</th>
                      <th>Floors</th>
                      <th>Manager</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {malls.map(mall => {
                      console.log('Mall data:', mall.name, 'Floors:', mall.floors);
                      return (
                        <tr key={mall.id}>
                          <td>{mall.name}</td>
                          <td>{mall.address}</td>
                          <td>{mall.city.name}, {mall.city.state}</td>
                          <td>{mall.sector.name}</td>
                          <td>{mall.rating}/5</td>
                          <td>{mall.floors.length}</td>
                          <td>
                            {mall.manager ? (
                              `${mall.manager.profile?.firstName || ''} ${mall.manager.profile?.lastName || ''}`.trim() || mall.manager.email
                            ) : (
                              'No Manager'
                            )}
                          </td>
                          <td>
                            <div className="action-buttons">
                              {(user?.role === 'ADMIN' || user?.role === 'MALL_MANAGER') && (
                                <>
                                  <button onClick={() => handleEditMall(mall)} className="edit-btn action-btn">Edit</button>
                                  {user?.role === 'ADMIN' && (
                                    <button onClick={() => handleDeleteMall(mall)} className="delete-btn action-btn">Delete</button>
                                  )}
                                </>
                              )}
                              <button
                                onClick={() => handleFloorSelection(mall, 'upload')}
                                className="action-btn upload-btn"
                              >
                                Upload SVG
                              </button>
                              <button
                                onClick={() => handleFloorSelection(mall, 'edit')}
                                className="action-btn edit-btn"
                              >
                                Edit SVG
                              </button>
                              <button
                                onClick={() => handleFloorManagement(mall)}
                                className="action-btn manage-btn"
                              >
                                Manage Floors
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'cities' && (
            <div className="cities-section">
              <h2>Cities Management</h2>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                {user?.role === 'ADMIN' && (
                  <button onClick={handleAddCity} className="add-btn action-btn">+ Add City</button>
                )}
                <button onClick={fetchCities} className="refresh-btn">Refresh Data</button>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>State</th>
                      <th>Malls Count</th>
                      {user?.role === 'ADMIN' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {cities.map(city => (
                      <tr key={city.id}>
                        <td>{city.name}</td>
                        <td>{city.state}</td>
                        <td>{city.buildingsCount}</td>
                        {user?.role === 'ADMIN' && (
                          <td>
                            <div className="action-buttons">
                              <button onClick={() => handleEditCity(city)} className="edit-btn action-btn">Edit</button>
                              <button onClick={() => handleDeleteCity(city)} className="delete-btn action-btn">Delete</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-section">
              <UserManagement onClose={() => { }} />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-section">
              <Analytics onClose={() => { }} />
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="leads-section">
              <Leads onClose={() => { }} />
            </div>
          )}
        </main>
      </div>

      {/* SVG Components */}
      {showSvgUpload && selectedMallId && selectedFloorId && (
        <SvgUpload
          mallId={selectedMallId}
          floorId={selectedFloorId}
          onUploadSuccess={handleSvgUploadSuccess}
          onClose={() => {
            setShowSvgUpload(false);
            setSelectedMallId(null);
            setSelectedFloorId(null);
          }}
        />
      )}

      {showSvgEditor && selectedMallId && selectedFloorId && (
        <SvgEditor
          mallId={selectedMallId}
          floorId={selectedFloorId}
          refreshTrigger={svgRefreshTrigger}
          onClose={() => {
            setShowSvgEditor(false);
            setSelectedMallId(null);
            setSelectedFloorId(null);
          }}
        />
      )}


      {/* Floor Selection Modal */}
      {showFloorSelection && selectedMallForFloors && (
        <FloorSelectionModal
          isOpen={showFloorSelection}
          onClose={() => {
            setShowFloorSelection(false);
            setSelectedMallForFloors(null);
          }}
          floors={selectedMallForFloors.floors}
          mallName={selectedMallForFloors.name}
          action={selectedAction}
          onFloorSelect={handleFloorSelect}
        />
      )}

      {/* Floor Management Modal */}
      {showFloorManagement && selectedMallForFloors && (
        <FloorManagementModal
          isOpen={showFloorManagement}
          onClose={() => {
            setShowFloorManagement(false);
            setSelectedMallForFloors(null);
          }}
          mallId={selectedMallForFloors.id}
          mallName={selectedMallForFloors.name}
          floors={selectedMallForFloors.floors}
          onFloorsUpdate={handleFloorsUpdate}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title={confirmMessage.title}
        message={confirmMessage.message}
        onConfirm={confirmAction}
        onCancel={() => setShowConfirmDialog(false)}
        confirmText="Delete"
      />

      {/* City Form Modal */}
      <CityForm
        isOpen={showCityForm}
        onClose={() => {
          setShowCityForm(false);
          setEditingCity(null);
        }}
        onSuccess={fetchCities}
        editingCity={editingCity}
      />

      {/* Mall Form Modal */}
      <MallForm
        isOpen={showMallForm}
        onClose={() => {
          setShowMallForm(false);
          setEditingMall(null);
        }}
        onSuccess={fetchMalls}
        editingMall={editingMall}
        cities={cities}
        sectors={sectors}
      />

      {/* Space Form Modal */}
      <SpaceForm
        isOpen={showSpaceForm}
        onClose={() => {
          setShowSpaceForm(false);
          setEditingSpace(null);
        }}
        onSuccess={fetchSpaces}
        editingSpace={editingSpace}
      />
    </div>
  );
};

export default App;
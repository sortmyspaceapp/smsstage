import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SvgEditor from './components/SvgEditor';
import SvgUpload from './components/SvgUpload';
import UserManagement from './components/UserManagement';
import Analytics from './components/Analytics';
import Leads from './components/Leads';
import FloorSelectionModal from './components/FloorSelectionModal';
import FloorManagementModal from './components/FloorManagementModal';
import './App.css';

// Configure axios base URL
axios.defaults.baseURL = 'http://127.0.0.1:3000';

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
  
  // User management state
  const [showUserManagement, setShowUserManagement] = useState(false);
  
  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Leads state
  const [showLeads, setShowLeads] = useState(false);
  
  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationRefreshing, setNotificationRefreshing] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: 'admin@spacefinder.com',
    password: 'admin123'
  });

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/user/profile');
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
      const response = await axios.post('/api/auth/login', loginForm);
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setIsLoggedIn(true);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsLoggedIn(false);
    setUser(null);
    setSpaces([]);
    setMalls([]);
    setCities([]);
  };

  const fetchSpaces = async () => {
    try {
      const response = await axios.get('/api/spaces/search');
      setSpaces(response.data.data.spaces);
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
    }
  };

  const fetchMalls = async () => {
    try {
      const response = await axios.get('/api/malls');
      setMalls(response.data.data.malls);
    } catch (error) {
      console.error('Failed to fetch malls:', error);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await axios.get('/api/cities');
      setCities(response.data.data.cities);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const fetchDashboardData = async () => {
    await Promise.all([fetchSpaces(), fetchMalls(), fetchCities()]);
  };

  // Notification functions
  const fetchNotificationCount = async () => {
    try {
      setNotificationRefreshing(true);
      const response = await axios.get('/api/notifications/count?unreadOnly=true');
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
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setNotificationRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await axios.patch(`/api/notifications/${notificationId}/read`);
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
      await axios.patch('/api/notifications/read-all');
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
  const handleSvgUpload = (mallId: string, floorId: string) => {
    setSelectedMallId(mallId);
    setSelectedFloorId(floorId);
    setShowSvgUpload(true);
  };

  const handleSvgEdit = (mallId: string, floorId: string) => {
    setSelectedMallId(mallId);
    setSelectedFloorId(floorId);
    setShowSvgEditor(true);
  };

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
      }, 5000); // Check every 5 seconds for faster updates

      return () => clearInterval(interval);
    }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>SpaceFinder Admin Dashboard</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
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

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'spaces' ? 'active' : ''}
          onClick={() => setActiveTab('spaces')}
        >
          Spaces
        </button>
        <button 
          className={activeTab === 'malls' ? 'active' : ''}
          onClick={() => setActiveTab('malls')}
        >
          Malls
        </button>
        <button 
          className={activeTab === 'cities' ? 'active' : ''}
          onClick={() => setActiveTab('cities')}
        >
          Cities
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={activeTab === 'leads' ? 'active' : ''}
          onClick={() => setActiveTab('leads')}
        >
          Leads
        </button>
      </nav>

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
            <button onClick={fetchMalls} className="refresh-btn">Refresh Data</button>
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
            <button onClick={fetchCities} className="refresh-btn">Refresh Data</button>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>State</th>
                    <th>Malls Count</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.map(city => (
                    <tr key={city.id}>
                      <td>{city.name}</td>
                      <td>{city.state}</td>
                      <td>{city.buildingsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <h2>User Management</h2>
            <div className="user-actions">
              <button 
                onClick={() => setShowUserManagement(true)}
                className="manage-users-btn"
              >
                Manage All Users
              </button>
            </div>
            
            <div className="user-profile">
              <h3>Current User Profile</h3>
              <div className="profile-info">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> {user?.role}</p>
                {user?.profile && (
                  <>
                    <p><strong>Name:</strong> {user.profile.firstName} {user.profile.lastName}</p>
                    <p><strong>Phone:</strong> {user.profile.phone}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <h2>Analytics Dashboard</h2>
            <button 
              onClick={() => setShowAnalytics(true)}
              className="view-analytics-btn"
            >
              View Detailed Analytics
            </button>
            <div className="analytics-preview">
              <p>View comprehensive analytics including:</p>
              <ul>
                <li>Daily activity trends</li>
                <li>Top performing spaces</li>
                <li>User engagement metrics</li>
                <li>Conversion rates</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="leads-section">
            <h2>Leads Management</h2>
            <button 
              onClick={() => setShowLeads(true)}
              className="view-leads-btn"
            >
              View All Leads
            </button>
            <div className="leads-preview">
              <p>Manage user interests and leads including:</p>
              <ul>
                <li>User interest tracking</li>
                <li>Space inquiry management</li>
                <li>Real-time notifications</li>
                <li>Lead conversion tracking</li>
              </ul>
            </div>
          </div>
        )}
      </main>

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

      {/* User Management Component */}
      {showUserManagement && (
        <UserManagement
          onClose={() => setShowUserManagement(false)}
        />
      )}

      {/* Analytics Component */}
      {showAnalytics && (
        <Analytics
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Leads Component */}
      {showLeads && (
        <Leads
          onClose={() => setShowLeads(false)}
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
    </div>
  );
};

export default App;
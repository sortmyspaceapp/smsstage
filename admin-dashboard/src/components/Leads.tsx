import React, { useState, useEffect, useCallback } from 'react';
import api from '../config/axios';
import './Leads.css';

interface Lead {
  id: string;
  spaceId: string;
  spaceName: string;
  mallName: string;
  city: string;
  sector: string;
  spacePrice: number;
  spaceSize: number;
  spaceFloor: number;
  interestedUserId: string;
  interestedUserName: string;
  interestedUserEmail: string;
  interestLevel: string;
  notes?: string;
  createdAt: string;
  isRead: boolean;
  notificationSent: boolean;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

const Leads: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high_interest'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'interest' | 'space'>('date');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNewLeadAlert, setShowNewLeadAlert] = useState(false);
  const [newLeadData, setNewLeadData] = useState<Lead | null>(null);
  const [previousLeadCount, setPreviousLeadCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/notifications?type=SPACE_INTEREST');
      setNotifications(response.data.data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  const fetchNotificationCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/count?unreadOnly=true&type=SPACE_INTEREST');
      setUnreadCount(response.data.data.count);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  }, []);

  const fetchLeads = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await api.get(`/leads?page=1&limit=100&filter=${filter}&sortBy=${sortBy}`);
      const newLeads = response.data.data.leads;
      
      // Check for new leads
      if (previousLeadCount > 0 && newLeads.length > previousLeadCount) {
        const newLead = newLeads[0]; // Most recent lead
        setNewLeadData(newLead);
        setShowNewLeadAlert(true);
        
        // Play notification sound
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU5k9n1unEiBS13yO/eizEIHWq+8+OWT');
          audio.play().catch(() => {}); // Ignore errors if audio fails
        } catch (e) {
          // Ignore audio errors
        }
        
        // Immediately refresh notification count when new lead is detected
        fetchNotificationCount();
        fetchNotifications();
        
        // Also trigger global notification refresh
        if ((window as any).forceRefreshNotifications) {
          (window as any).forceRefreshNotifications();
        }
        
        // Auto-hide alert after 5 seconds
        setTimeout(() => {
          setShowNewLeadAlert(false);
        }, 5000);
      }
      
      setPreviousLeadCount(newLeads.length);
      setLeads(newLeads);
      
      // Mark initial load as complete
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      setError('Failed to fetch leads data');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [filter, sortBy, previousLeadCount, isInitialLoad, fetchNotificationCount, fetchNotifications]);

  useEffect(() => {
    fetchLeads();
    fetchNotifications();
    fetchNotificationCount();
  }, [fetchLeads, fetchNotifications, fetchNotificationCount]);

  // Set up polling for new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotificationCount();
      // Only fetch notifications if the popup is open to reduce unnecessary API calls
      if (showNotifications) {
        fetchNotifications();
      }
    }, 5000); // Check every 5 seconds for updates

    return () => clearInterval(interval);
  }, [showNotifications, fetchNotificationCount, fetchNotifications]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Poll for new leads every 5 seconds for real-time detection (reduced frequency)
  useEffect(() => {
    const leadsInterval = setInterval(() => {
      setIsPolling(true);
      fetchLeads(false); // Don't show loading on polling
      setTimeout(() => setIsPolling(false), 1000); // Reset polling state after 1 second
    }, 5000); // Check every 5 seconds for new leads

    return () => clearInterval(leadsInterval);
  }, [filter, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add escape key and click outside to close notifications
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showNotifications) {
        setShowNotifications(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showNotifications && !target.closest('.notifications-popup') && !target.closest('.notification-bell')) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);


  const markAsRead = async (leadId: string) => {
    try {
      await api.patch(`/leads/${leadId}/read`);
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, isRead: true } : lead
      ));
      fetchNotificationCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/leads/read-all');
      setLeads(prev => prev.map(lead => ({ ...lead, isRead: true })));
      setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    switch (filter) {
      case 'unread':
        return !lead.isRead;
      case 'high_interest':
        return lead.interestLevel === 'HIGH';
      default:
        return true;
    }
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    switch (sortBy) {
      case 'interest':
        const interestOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return (interestOrder[b.interestLevel as keyof typeof interestOrder] || 0) - 
               (interestOrder[a.interestLevel as keyof typeof interestOrder] || 0);
      case 'space':
        return a.spaceName.localeCompare(b.spaceName);
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const getInterestLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH': return '#e74c3c';
      case 'MEDIUM': return '#f39c12';
      case 'LOW': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="leads-modal">
        <div className="leads-content">
          <div className="loading">Loading leads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="leads-modal">
      <div className="leads-content">
        <div className="leads-header">
          <h2>Leads Management {isPolling && <span className="polling-indicator">⟳</span>}</h2>
          <div className="header-actions">
            <button 
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
        </div>

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
                  title="Close notifications"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="notifications-list">
              {notifications.slice(0, 10).map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                >
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <button 
                      onClick={() => markAsRead(notification.id)}
                      className="mark-read-btn"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Lead Alert Popup */}
        {showNewLeadAlert && newLeadData && (
          <div className="new-lead-alert">
            <div className="alert-content">
              <div className="alert-header">
                <h3>🎉 New Lead Alert!</h3>
                <button 
                  onClick={() => setShowNewLeadAlert(false)} 
                  className="close-alert-btn"
                >
                  ×
                </button>
              </div>
              <div className="alert-body">
                <p><strong>{newLeadData.interestedUserName}</strong> is interested in:</p>
                <p><strong>{newLeadData.spaceName}</strong> in {newLeadData.mallName}</p>
                <p>Location: {newLeadData.city}, {newLeadData.sector}</p>
                <p>Size: {newLeadData.spaceSize} sq ft | Price: ₹{newLeadData.spacePrice.toLocaleString()}</p>
                <p>Contact: {newLeadData.interestedUserEmail}</p>
              </div>
              <div className="alert-actions">
                <button 
                  onClick={() => {
                    setShowNewLeadAlert(false);
                    setShowNotifications(true);
                  }}
                  className="view-notifications-btn"
                >
                  View All Notifications
                </button>
                <button 
                  onClick={() => setShowNewLeadAlert(false)}
                  className="dismiss-btn"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="leads-controls">
          <div className="filters">
            <label>Filter:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">All Leads</option>
              <option value="unread">Unread Only</option>
              <option value="high_interest">High Interest</option>
            </select>
          </div>
          
          <div className="sort">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="date">Date</option>
              <option value="interest">Interest Level</option>
              <option value="space">Space Name</option>
            </select>
          </div>

          <button onClick={() => fetchLeads(true)} className="refresh-btn">
            Refresh
          </button>
        </div>

        {/* Leads Table */}
        <div className="leads-table-container">
          {error && <div className="error-message">{error}</div>}
          
          {sortedLeads.length === 0 ? (
            <div className="no-leads">No leads found</div>
          ) : (
            <table className="leads-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Space Details</th>
                  <th>Interest Level</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedLeads.map(lead => (
                  <tr key={lead.id} className={!lead.isRead ? 'unread-lead' : ''}>
                    <td className="user-details">
                      <div className="user-info">
                        <strong>{lead.interestedUserName || 'Unknown User'}</strong>
                        <div className="user-email">{lead.interestedUserEmail}</div>
                        <div className="user-id">ID: {lead.interestedUserId}</div>
                      </div>
                    </td>
                    <td className="space-details">
                      <div className="space-info">
                        <strong>{lead.spaceName}</strong>
                        <div className="space-location">
                          {lead.mallName}, {lead.city}
                        </div>
                        <div className="space-specs">
                          Floor {lead.spaceFloor} • {lead.spaceSize} sq ft • {formatPrice(lead.spacePrice)}/month
                        </div>
                        <div className="space-sector">{lead.sector}</div>
                      </div>
                    </td>
                    <td className="interest-level">
                      <span 
                        className="interest-badge"
                        style={{ backgroundColor: getInterestLevelColor(lead.interestLevel) }}
                      >
                        {lead.interestLevel}
                      </span>
                    </td>
                    <td className="date">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="status">
                      <span className={`status-badge ${lead.isRead ? 'read' : 'unread'}`}>
                        {lead.isRead ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td className="actions">
                      <button 
                        onClick={() => markAsRead(lead.id)}
                        className="action-btn mark-read"
                        disabled={lead.isRead}
                      >
                        {lead.isRead ? 'Read' : 'Mark Read'}
                      </button>
                      <button 
                        className="action-btn contact"
                        onClick={() => window.open(`mailto:${lead.interestedUserEmail}`)}
                      >
                        Contact
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary Stats */}
        <div className="leads-summary">
          <div className="summary-stat">
            <span className="stat-label">Total Leads:</span>
            <span className="stat-value">{leads.length}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Unread:</span>
            <span className="stat-value">{leads.filter(l => !l.isRead).length}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">High Interest:</span>
            <span className="stat-value">{leads.filter(l => l.interestLevel === 'HIGH').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leads;

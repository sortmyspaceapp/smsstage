import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface DailyStat {
  date: string;
  totalViews: number;
  totalClicks: number;
  totalInquiries: number;
  malls: string[];
}

interface TopSpace {
  spaceId: string;
  viewCount: number;
  space: {
    id: string;
    name: string;
    type: string;
    floor: {
      name: string;
      mall: {
        name: string;
        city: {
          name: string;
          state: string;
        };
      };
    };
  };
}

interface AnalyticsSummary {
  totalDays: number;
  totalViews: number;
  totalClicks: number;
  totalInquiries: number;
  totalLogins?: number;
  totalFailedLogins?: number;
  uniqueUsers?: number;
}

interface LoginStat {
  date: string;
  totalLogins: number;
  totalFailedLogins: number;
  uniqueUsers: number;
}

interface AnalyticsProps {
  onClose: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ onClose }) => {
  const [analytics, setAnalytics] = useState<{
    dailyStats: DailyStat[];
    topSpaces: TopSpace[];
    summary: AnalyticsSummary;
    loginStats: LoginStat[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/activity/analytics?days=${selectedDays}`);
      setAnalytics(response.data.data);
    } catch (error) {
      setError('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [selectedDays]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="analytics-overlay">
        <div className="analytics-modal">
          <div className="loading">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-overlay">
      <div className="analytics-modal">
        <div className="analytics-header">
          <h2>Analytics Dashboard</h2>
          <div className="header-controls">
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              className="days-selector"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
        </div>

        <div className="analytics-content">
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {analytics && (
            <>
              {/* Summary Cards */}
              <div className="summary-cards">
                <div className="summary-card">
                  <h3>Total Views</h3>
                  <div className="summary-number">{formatNumber(analytics.summary.totalViews)}</div>
                </div>
                <div className="summary-card">
                  <h3>Total Clicks</h3>
                  <div className="summary-number">{formatNumber(analytics.summary.totalClicks)}</div>
                </div>
                <div className="summary-card">
                  <h3>Total Inquiries</h3>
                  <div className="summary-number">{formatNumber(analytics.summary.totalInquiries)}</div>
                </div>
                <div className="summary-card">
                  <h3>Conversion Rate</h3>
                  <div className="summary-number">
                    {analytics.summary.totalViews > 0 
                      ? ((analytics.summary.totalClicks / analytics.summary.totalViews) * 100).toFixed(1) + '%'
                      : '0%'
                    }
                  </div>
                </div>
                <div className="summary-card">
                  <h3>Total Logins</h3>
                  <div className="summary-number">{formatNumber(analytics.summary.totalLogins || 0)}</div>
                </div>
                <div className="summary-card">
                  <h3>Unique Users</h3>
                  <div className="summary-number">{formatNumber(analytics.summary.uniqueUsers || 0)}</div>
                </div>
                <div className="summary-card">
                  <h3>Failed Logins</h3>
                  <div className="summary-number">{formatNumber(analytics.summary.totalFailedLogins || 0)}</div>
                </div>
              </div>

              {/* Daily Stats Chart */}
              <div className="chart-section">
                <h3>Daily Activity</h3>
                <div className="chart-container">
                  <div className="chart-bars">
                    {analytics.dailyStats.slice(0, 14).map((stat, index) => (
                      <div key={stat.date} className="chart-bar">
                        <div className="bar-container">
                          <div 
                            className="bar views-bar"
                            style={{ 
                              height: `${Math.max(5, (stat.totalViews / Math.max(...analytics.dailyStats.map(s => s.totalViews))) * 100)}%` 
                            }}
                            title={`Views: ${stat.totalViews}`}
                          ></div>
                          <div 
                            className="bar clicks-bar"
                            style={{ 
                              height: `${Math.max(5, (stat.totalClicks / Math.max(...analytics.dailyStats.map(s => s.totalClicks))) * 100)}%` 
                            }}
                            title={`Clicks: ${stat.totalClicks}`}
                          ></div>
                          <div 
                            className="bar inquiries-bar"
                            style={{ 
                              height: `${Math.max(5, (stat.totalInquiries / Math.max(...analytics.dailyStats.map(s => s.totalInquiries))) * 100)}%` 
                            }}
                            title={`Inquiries: ${stat.totalInquiries}`}
                          ></div>
                        </div>
                        <div className="bar-label">{formatDate(stat.date)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <span className="legend-color views"></span>
                      Views
                    </div>
                    <div className="legend-item">
                      <span className="legend-color clicks"></span>
                      Clicks
                    </div>
                    <div className="legend-item">
                      <span className="legend-color inquiries"></span>
                      Inquiries
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Statistics Chart */}
              {analytics.loginStats && analytics.loginStats.length > 0 && (
                <div className="chart-section">
                  <h3>Daily Login Activity</h3>
                  <div className="chart-container">
                    <div className="chart-bars">
                      {analytics.loginStats.slice(0, 14).map((stat, index) => (
                        <div key={stat.date} className="chart-bar">
                          <div className="bar-container">
                            <div 
                              className="bar logins-bar"
                              style={{ 
                                height: `${Math.max(5, (stat.totalLogins / Math.max(...analytics.loginStats.map(s => s.totalLogins))) * 100)}%` 
                              }}
                              title={`Logins: ${stat.totalLogins}`}
                            ></div>
                            <div 
                              className="bar failed-logins-bar"
                              style={{ 
                                height: `${Math.max(5, (stat.totalFailedLogins / Math.max(...analytics.loginStats.map(s => s.totalFailedLogins))) * 100)}%` 
                              }}
                              title={`Failed Logins: ${stat.totalFailedLogins}`}
                            ></div>
                            <div 
                              className="bar unique-users-bar"
                              style={{ 
                                height: `${Math.max(5, (stat.uniqueUsers / Math.max(...analytics.loginStats.map(s => s.uniqueUsers))) * 100)}%` 
                              }}
                              title={`Unique Users: ${stat.uniqueUsers}`}
                            ></div>
                          </div>
                          <div className="bar-label">{formatDate(stat.date)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="chart-legend">
                      <div className="legend-item">
                        <span className="legend-color logins"></span>
                        Logins
                      </div>
                      <div className="legend-item">
                        <span className="legend-color failed-logins"></span>
                        Failed Logins
                      </div>
                      <div className="legend-item">
                        <span className="legend-color unique-users"></span>
                        Unique Users
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Spaces */}
              <div className="top-spaces-section">
                <h3>Top Performing Spaces</h3>
                <div className="top-spaces-list">
                  {analytics.topSpaces.map((item, index) => (
                    <div key={item.spaceId} className="top-space-item">
                      <div className="rank">#{index + 1}</div>
                      <div className="space-info">
                        <div className="space-name">{item.space.name}</div>
                        <div className="space-location">
                          {item.space.floor.mall.name} - {item.space.floor.mall.city.name}
                        </div>
                        <div className="space-type">{item.space.type}</div>
                      </div>
                      <div className="view-count">{formatNumber(item.viewCount)} views</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;

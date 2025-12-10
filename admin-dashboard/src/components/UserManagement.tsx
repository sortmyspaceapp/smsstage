import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import PasswordResetModal from './PasswordResetModal';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'MALL_MANAGER' | 'CUSTOMER';
  isActive: boolean;
  profile?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  createdAt: string;
  lastLoginAt?: string;
}

interface UserManagementProps {
  onClose: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'CUSTOMER' as 'ADMIN' | 'MALL_MANAGER' | 'CUSTOMER',
    firstName: '',
    lastName: '',
    phone: '',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user/all');
      setUsers(response.data.data.users);
    } catch (error) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (editingUser) {
        // Update user
        await api.put(`/api/user/${editingUser.id}`, {
          email: formData.email,
          role: formData.role,
          profile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone
          },
          isActive: formData.isActive
        });
      } else {
        // Create user
        await api.post('/api/user', {
          email: formData.email,
          password: formData.password,
          role: formData.role,
          profile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone
          }
        });
      }

      await fetchUsers();
      resetForm();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      role: user.role,
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      phone: user.profile?.phone || '',
      isActive: user.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      setLoading(true);
      await api.delete(`/api/user/${userId}`);
      await fetchUsers();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (user: User) => {
    setResetPasswordUser(user);
    setShowPasswordReset(true);
  };

  const handlePasswordResetSuccess = () => {
    setError(null);
    alert('Password reset successfully!');
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      role: 'CUSTOMER',
      firstName: '',
      lastName: '',
      phone: '',
      isActive: true
    });
    setEditingUser(null);
    setShowForm(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return '#dc3545';
      case 'MALL_MANAGER': return '#007bff';
      case 'CUSTOMER': return '#28a745';
      default: return '#6c757d';
    }
  };

  return (
    <div className="user-management-content" style={{ padding: '2rem', background: 'white', borderRadius: '8px' }}>
      <div className="user-management-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>User Management</h2>
        <div className="header-actions">
          <button
            onClick={() => setShowForm(true)}
            className="add-user-btn action-btn add-btn"
          >
            Add User
          </button>
        </div>
      </div>
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showForm && (
        <div className="user-form-section">
          <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  required
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="MALL_MANAGER">Mall Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            {!editingUser && (
              <div className="form-group">
                <label>Password *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Active User
              </label>
            </div>

            <div className="form-actions">
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-table-section">
        <h3>All Users ({users.length})</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    {user.profile ?
                      `${user.profile.firstName} ${user.profile.lastName}`.trim() || 'N/A' :
                      'N/A'
                    }
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className="role-badge"
                      style={{ backgroundColor: getRoleColor(user.role) }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {user.lastLoginAt ?
                      new Date(user.lastLoginAt).toLocaleDateString() :
                      'Never'
                    }
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(user)}
                        className="action-btn edit-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="action-btn"
                        style={{ background: '#ff9800', color: 'white' }}
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="action-btn delete-btn"
                        disabled={user.role === 'ADMIN'}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PasswordResetModal
        isOpen={showPasswordReset}
        onClose={() => setShowPasswordReset(false)}
        onSuccess={handlePasswordResetSuccess}
        user={resetPasswordUser}
      />
    </div>
  );
};

export default UserManagement;

import React, { useState } from 'react';
import axios from 'axios';

interface Floor {
  id: string;
  floorNumber: number;
  name: string;
}

interface FloorManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  mallId: string;
  mallName: string;
  floors: Floor[];
  onFloorsUpdate: () => void;
}

const FloorManagementModal: React.FC<FloorManagementModalProps> = ({
  isOpen,
  onClose,
  mallId,
  mallName,
  floors,
  onFloorsUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newFloor, setNewFloor] = useState({
    floorNumber: floors.length + 1,
    name: ''
  });

  if (!isOpen) return null;

  const handleAddFloor = async () => {
    if (!newFloor.name.trim()) {
      setError('Floor name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/floors', {
        mallId,
        floorNumber: newFloor.floorNumber,
        name: newFloor.name.trim()
      });

      if (response.data.success) {
        setSuccess('Floor added successfully!');
        setNewFloor({
          floorNumber: floors.length + 2,
          name: ''
        });
        onFloorsUpdate();
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(response.data.error || 'Failed to add floor');
      }
    } catch (error: any) {
      console.error('Error adding floor:', error);
      setError(error.response?.data?.error || 'Failed to add floor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFloor = async (floorId: string, floorName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${floorName}"? This will also delete all spaces on this floor.`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.delete(`/api/floors/${floorId}`);

      if (response.data.success) {
        setSuccess('Floor deleted successfully!');
        onFloorsUpdate();
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(response.data.error || 'Failed to delete floor');
      }
    } catch (error: any) {
      console.error('Error deleting floor:', error);
      setError(error.response?.data?.error || 'Failed to delete floor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal large">
        <div className="modal-header">
          <h2>Manage Floors - {mallName}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          {/* Add New Floor */}
          <div className="add-floor-section">
            <h3>Add New Floor</h3>
            <div className="form-group">
              <label>Floor Number:</label>
              <input
                type="number"
                value={newFloor.floorNumber}
                onChange={(e) => setNewFloor({ ...newFloor, floorNumber: Number(e.target.value) })}
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Floor Name: <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                value={newFloor.name}
                onChange={(e) => setNewFloor({ ...newFloor, name: e.target.value })}
                placeholder="e.g., Ground Floor, First Floor, Basement"
                required
              />
              {!newFloor.name.trim() && (
                <small style={{color: '#dc3545', fontSize: '0.8rem'}}>
                  Floor name is required to add a floor
                </small>
              )}
            </div>
            <button 
              onClick={handleAddFloor} 
              disabled={loading || !newFloor.name.trim()}
              className="add-btn"
            >
              {loading ? 'Adding...' : 'Add Floor'}
            </button>
          </div>

          {/* Existing Floors */}
          <div className="existing-floors-section">
            <h3>Existing Floors ({floors.length})</h3>
            {floors.length === 0 ? (
              <p className="no-floors">No floors available. Add a floor above.</p>
            ) : (
              <div className="floors-list">
                {floors.map(floor => (
                  <div key={floor.id} className="floor-item">
                    <div className="floor-info">
                      <div className="floor-number">Floor {floor.floorNumber}</div>
                      <div className="floor-name">{floor.name}</div>
                    </div>
                    <div className="floor-actions">
                      <button 
                        onClick={() => handleDeleteFloor(floor.id, floor.name)}
                        disabled={loading}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn">Close</button>
        </div>
      </div>
    </div>
  );
};

export default FloorManagementModal;

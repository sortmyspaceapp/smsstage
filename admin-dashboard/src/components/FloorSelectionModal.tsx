import React, { useState } from 'react';

interface Floor {
  id: string;
  floorNumber: number;
  name: string;
}

interface FloorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  floors: Floor[];
  mallName: string;
  action: 'upload' | 'edit';
  onFloorSelect: (floorId: string, action: 'upload' | 'edit') => void;
}

const FloorSelectionModal: React.FC<FloorSelectionModalProps> = ({
  isOpen,
  onClose,
  floors,
  mallName,
  action,
  onFloorSelect
}) => {
  const [selectedAction, setSelectedAction] = useState<'upload' | 'edit'>(action);

  if (!isOpen) return null;

  const handleFloorClick = (floorId: string) => {
    onFloorSelect(floorId, selectedAction);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Select Floor - {mallName}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-content">
          <div className="action-selector">
            <label>Action:</label>
            <div className="action-buttons">
              <button 
                className={`action-btn ${selectedAction === 'upload' ? 'active' : ''}`}
                onClick={() => setSelectedAction('upload')}
              >
                Upload SVG
              </button>
              <button 
                className={`action-btn ${selectedAction === 'edit' ? 'active' : ''}`}
                onClick={() => setSelectedAction('edit')}
              >
                Edit SVG
              </button>
            </div>
          </div>

          <div className="floors-list">
            <h3>Available Floors ({floors.length})</h3>
            {floors.length === 0 ? (
              <div className="no-floors">
                <p>No floors available for this mall.</p>
                <p>Please use "Manage Floors" to add floors first.</p>
              </div>
            ) : (
              <div className="floors-grid">
                {floors.map(floor => (
                  <div 
                    key={floor.id} 
                    className="floor-item"
                    onClick={() => handleFloorClick(floor.id)}
                  >
                    <div className="floor-number">Floor {floor.floorNumber}</div>
                    <div className="floor-name">{floor.name}</div>
                    <div className="floor-action">
                      {selectedAction === 'upload' ? '📤 Upload' : '✏️ Edit'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default FloorSelectionModal;

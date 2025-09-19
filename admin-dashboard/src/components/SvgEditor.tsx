import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Space {
  id: string;
  svgElementId: string;
  name: string;
  availabilityStatus: string;
  type: string;
  sizeSqft: number;
  priceMonthly: number;
}

interface Floor {
  id: string;
  name: string;
  floorNumber: number;
  svgVersion: number;
}

interface SvgEditorProps {
  mallId: string;
  floorId: string;
  onClose: () => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

const SvgEditor: React.FC<SvgEditorProps> = ({ mallId, floorId, onClose, refreshTrigger }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [floor, setFloor] = useState<Floor | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  // Space form state
  const [spaceForm, setSpaceForm] = useState({
    name: '',
    type: 'RETAIL',
    sizeSqft: 100,
    priceMonthly: 10000,
    availabilityStatus: 'AVAILABLE',
    description: ''
  });

  const loadSvgData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading SVG data for floor:', floorId);
      const response = await axios.get(`/svg/floor/${floorId}`);
      console.log('SVG data response:', response.data);
      setSvgContent(response.data.data.svgContent);
      setSpaces(response.data.data.spaces);
      setFloor(response.data.data.floor);
    } catch (error) {
      setError('Failed to load SVG data');
      console.error('Error loading SVG data:', error);
    } finally {
      setLoading(false);
    }
  }, [floorId]);

  useEffect(() => {
    loadSvgData();
  }, [loadSvgData]);

  // Refresh data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadSvgData();
    }
  }, [refreshTrigger, loadSvgData]);

  const handleRefreshData = async () => {
    try {
      setRefreshLoading(true);
      setRefreshSuccess(false);
      await loadSvgData();
      setRefreshSuccess(true);
      // Hide success message after 2 seconds
      setTimeout(() => setRefreshSuccess(false), 2000);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshLoading(false);
    }
  };

  // Extract all clickable elements from SVG content (only map_ elements)
  const getClickableElements = () => {
    if (!svgContent) return [];
    
    const elementIds: string[] = [];
    const idRegex = /id="([^"]+)"/g;
    let match;
    
    while ((match = idRegex.exec(svgContent)) !== null) {
      const id = match[1];
      // Only include map_ elements (store areas)
      if (id !== 'outline' && id.startsWith('map_')) {
        elementIds.push(id);
      }
    }
    
    return elementIds.sort();
  };

  // Handle clicking on an element from the list
  const handleElementClick = (elementId: string) => {
    setSelectedElement(elementId);
    const space = spaces.find(s => s.svgElementId === elementId);
    setSelectedSpace(space || null);
    
    if (space) {
      setSpaceForm({
        name: space.name,
        type: space.type,
        sizeSqft: space.sizeSqft,
        priceMonthly: space.priceMonthly,
        availabilityStatus: space.availabilityStatus,
        description: ''
      });
    } else {
      // Generate a descriptive default name from the element ID
      let defaultName = elementId;
      
      // Handle map_ prefix
      if (elementId.startsWith('map_')) {
        defaultName = elementId.replace('map_', '');
      }
      
      // Convert underscores to spaces and capitalize words
      defaultName = defaultName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      setSpaceForm({
        name: defaultName,
        type: 'RETAIL',
        sizeSqft: 100,
        priceMonthly: 10000,
        availabilityStatus: 'AVAILABLE',
        description: ''
      });
    }
  };

  const handleSvgClick = (event: React.MouseEvent<HTMLDivElement>) => {
    console.log('SVG clicked!', event.target);
    const target = event.target as SVGElement;
    const elementId = target.getAttribute('id');
    console.log('Element ID:', elementId);
    console.log('Target tag name:', target.tagName);
    console.log('Target class name:', target.className);
    
    // If the clicked element doesn't have an ID, try to find the parent element with an ID
    let clickableElement: Element | null = target;
    while (clickableElement && !clickableElement.getAttribute('id') && clickableElement.parentElement) {
      clickableElement = clickableElement.parentElement;
    }
    
    const finalElementId = clickableElement.getAttribute('id');
    if (finalElementId !== elementId) {
      console.log('Found parent element with ID:', finalElementId);
    }
    
    // Helper function to check if an element should be clickable
    const isClickableElement = (id: string) => {
      // Only exclude the outline element
      if (id === 'outline') {
        console.log('Element is outline - not clickable');
        return false;
      }
      
      // ONLY map_ elements are clickable (store areas)
      if (id.startsWith('map_')) {
        console.log('Element is map_ - clickable:', id);
        return true;
      }
      
      console.log('Element is not map_ - not clickable:', id);
      return false;
    };
    
    const idToUse = finalElementId || elementId;
    if (idToUse && isClickableElement(idToUse)) {
      console.log('Setting selected element:', idToUse);
      setSelectedElement(idToUse);
      const space = spaces.find(s => s.svgElementId === idToUse);
      setSelectedSpace(space || null);
      
      if (space) {
        console.log('Found existing space:', space);
        setSpaceForm({
          name: space.name,
          type: space.type,
          sizeSqft: space.sizeSqft,
          priceMonthly: space.priceMonthly,
          availabilityStatus: space.availabilityStatus,
          description: ''
        });
      } else {
        console.log('Creating new space for:', idToUse);
        // Generate a descriptive default name from the element ID
        let defaultName = idToUse;
        
        // Handle map_ prefix
        if (idToUse.startsWith('map_')) {
          defaultName = idToUse.replace('map_', '');
        }
        
        // Convert underscores to spaces and capitalize words
        defaultName = defaultName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        setSpaceForm({
          name: defaultName,
          type: 'RETAIL',
          sizeSqft: 100,
          priceMonthly: 10000,
          availabilityStatus: 'AVAILABLE',
          description: ''
        });
      }
    } else {
      console.log('Element not clickable or no ID');
    }
  };

  const handleSaveSpace = async () => {
    if (!selectedElement) return;

    try {
      setLoading(true);
      
      if (selectedSpace) {
        // Update existing space
        await axios.put(`/svg/space/${selectedSpace.id}/assignment`, {
          svgElementId: selectedElement,
          ...spaceForm
        });
      } else {
        // Create new space
        await axios.post('/spaces', {
          floorId,
          svgElementId: selectedElement,
          ...spaceForm
        });
      }
      
      await loadSvgData(); // Reload data
      setSelectedSpace(null);
      setSelectedElement(null);
    } catch (error) {
      setError('Failed to save space');
      console.error('Error saving space:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpace = async () => {
    if (!selectedSpace) return;

    try {
      setLoading(true);
      await axios.delete(`/spaces/${selectedSpace.id}`);
      await loadSvgData(); // Reload data
      setSelectedSpace(null);
      setSelectedElement(null);
    } catch (error) {
      setError('Failed to delete space');
      console.error('Error deleting space:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'PREMIUM': return '#FFD700';
      case 'AVAILABLE': return '#4CAF50';
      case 'OCCUPIED': return '#F44336';
      case 'MAINTENANCE': return '#FF9800';
      case 'RESERVED': return '#9C27B0';
      default: return '#E0E0E0';
    }
  };

  const highlightSvgElements = (svg: string) => {
    let highlightedSvg = svg;
    console.log('Highlighting SVG elements...');
    console.log('Spaces count:', spaces.length);
    console.log('Selected element:', selectedElement);
    
    // First, make the outline non-clickable
    highlightedSvg = highlightedSvg.replace(
      /id="outline"/g,
      'id="outline" style="fill:none;stroke:#000;stroke-width:2;pointer-events:none;"'
    );
    
    // Find all elements with IDs
    const idRegex = /id="([^"]+)"/g;
    let match;
    const elementIds: string[] = [];
    
    while ((match = idRegex.exec(svg)) !== null) {
      elementIds.push(match[1]);
    }
    
    console.log('Found elements with IDs:', elementIds);
    
    // Process each element - ONLY MAP_ ELEMENTS
    elementIds.forEach(id => {
      // Skip outline element
      if (id === 'outline') return;
      
      // ONLY process elements with map_ prefix (store areas)
      if (!id.startsWith('map_')) return;
      
      console.log('Processing map element:', id);
      
      // Check if this element has an existing space
      const existingSpace = spaces.find(space => space.svgElementId === id);
      
      // Determine colors
      let fillColor, strokeColor;
      
      if (existingSpace) {
        fillColor = getAvailabilityColor(existingSpace.availabilityStatus);
        strokeColor = fillColor;
        console.log('Existing space:', id, 'color:', fillColor);
      } else {
        fillColor = '#E0E0E0';
        strokeColor = '#CCCCCC';
        console.log('New space:', id, 'color:', fillColor);
      }
      
      // Simple style application
      const newStyle = `fill:${fillColor};fill-opacity:0.6;stroke:${strokeColor};stroke-width:2;cursor:pointer;pointer-events:all;`;
      
      // Add style to element
      highlightedSvg = highlightedSvg.replace(
        new RegExp(`id="${id}"`, 'g'),
        `id="${id}" style="${newStyle}"`
      );
    });

    // Add selected class to the currently selected element
    if (selectedElement) {
      highlightedSvg = highlightedSvg.replace(
        new RegExp(`id="${selectedElement}"`, 'g'),
        `id="${selectedElement}" class="selected"`
      );
    }

    console.log('SVG processing complete');
    return highlightedSvg;
  };

  // After rendering the SVG, normalize geometry of map_ paths so fill covers full area
  useEffect(() => {
    try {
      const svgEl = document.querySelector('.svg-wrapper svg');
      if (!svgEl) return;
      const mapPaths = svgEl.querySelectorAll('path[id^="map_"]');
      mapPaths.forEach((el) => {
        const pathEl = el as SVGPathElement;
        const d = pathEl.getAttribute('d');
        if (!d) return;
        // Many provided paths encode an outer and inner contour to draw a frame.
        // Trim to the first closed subpath so the interior is filled and clickable.
        const firstCloseIdx = d.search(/[Zz]/);
        if (firstCloseIdx > -1 && firstCloseIdx < d.length - 1) {
          const trimmed = d.slice(0, firstCloseIdx + 1);
          if (trimmed && trimmed.length > 1) {
            pathEl.setAttribute('d', trimmed);
          }
        }
        // Ensure proper fill handling and pointer events
        pathEl.setAttribute('fill-rule', 'nonzero');
        pathEl.style.pointerEvents = 'all';
      });
    } catch (_) {
      // no-op
    }
  }, [svgContent, spaces, selectedElement]);

  if (loading && !svgContent) {
    return (
      <div className="svg-editor-overlay">
        <div className="svg-editor">
          <div className="loading">Loading SVG data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="svg-editor-overlay">
        <div className="svg-editor">
          <div className="error">{error}</div>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="svg-editor-overlay">
      <div className="svg-editor">
        <div className="svg-editor-header">
          <h2>SVG Editor - {floor?.name}</h2>
          <div className="header-actions">
            <button 
              onClick={handleRefreshData} 
              disabled={refreshLoading || loading}
              className="refresh-btn"
              title="Refresh data"
            >
              {refreshLoading ? '⟳' : '↻'}
            </button>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
        </div>

        <div className="svg-editor-content">
          <div className="svg-container">
            <div 
              className="svg-wrapper"
              dangerouslySetInnerHTML={{ 
                __html: highlightSvgElements(svgContent) 
              }}
              onClick={handleSvgClick}
            />
          </div>

          <div className="space-panel">
            {/* Refresh Success Message */}
            {refreshSuccess && (
              <div className="success-message">
                ✓ Data refreshed successfully!
              </div>
            )}

            {/* Paths List Section */}
            <div className="paths-list-section">
              <h3>Available Paths ({getClickableElements().length})</h3>
              <div className="paths-list">
                {getClickableElements().map((elementId) => {
                  const space = spaces.find(s => s.svgElementId === elementId);
                  const isSelected = selectedElement === elementId;
                  
                  return (
                    <div
                      key={elementId}
                      className={`path-item ${isSelected ? 'selected' : ''} ${space ? 'has-space' : 'no-space'}`}
                      onClick={() => handleElementClick(elementId)}
                    >
                      <div className="path-info">
                        <div className="path-name">{elementId}</div>
                        {space && (
                          <div className="path-space-info">
                            <span className="space-name">{space.name}</span>
                            <span className={`space-status ${space.availabilityStatus.toLowerCase()}`}>
                              {space.availabilityStatus}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="path-indicator">
                        {space ? (
                          <span 
                            className="status-dot" 
                            style={{ backgroundColor: getAvailabilityColor(space.availabilityStatus) }}
                          ></span>
                        ) : (
                          <span className="status-dot unassigned"></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Space Form Section */}
            {selectedElement ? (
              <div className="space-form">
                <h3>Space Details - {selectedElement}</h3>
                
                <div className="form-group">
                  <label>Space Name:</label>
                  <input
                    type="text"
                    value={spaceForm.name}
                    onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Type:</label>
                  <select
                    value={spaceForm.type}
                    onChange={(e) => setSpaceForm({ ...spaceForm, type: e.target.value })}
                  >
                    <option value="RETAIL">Retail</option>
                    <option value="FOOD_COURT">Food Court</option>
                    <option value="OFFICE">Office</option>
                    <option value="ENTERTAINMENT">Entertainment</option>
                    <option value="SERVICES">Services</option>
                    <option value="PARKING">Parking</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Size (sq ft):</label>
                  <input
                    type="number"
                    value={spaceForm.sizeSqft}
                    onChange={(e) => setSpaceForm({ ...spaceForm, sizeSqft: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Price (₹/month):</label>
                  <input
                    type="number"
                    value={spaceForm.priceMonthly}
                    onChange={(e) => setSpaceForm({ ...spaceForm, priceMonthly: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Availability:</label>
                  <select
                    value={spaceForm.availabilityStatus}
                    onChange={(e) => setSpaceForm({ ...spaceForm, availabilityStatus: e.target.value })}
                  >
                    <option value="PREMIUM">Premium</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="MAINTENANCE">Under Maintenance</option>
                    <option value="RESERVED">Reserved</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    value={spaceForm.description}
                    onChange={(e) => setSpaceForm({ ...spaceForm, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="form-actions">
                  <button onClick={handleSaveSpace} disabled={loading}>
                    {selectedSpace ? 'Update Space' : 'Create Space'}
                  </button>
                  {selectedSpace && (
                    <button onClick={handleDeleteSpace} disabled={loading} className="delete-btn">
                      Delete Space
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-info">
                <h3>Select a path to edit or create a space</h3>
                <div className="legend">
                  <h4>Availability Legend:</h4>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#FFD700' }}></span>
                    Premium
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
                    Available
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#F44336' }}></span>
                    Occupied
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#FF9800' }}></span>
                    Under Maintenance
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#9C27B0' }}></span>
                    Reserved
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#E0E0E0' }}></span>
                    Unassigned (Click to create space)
                  </div>
                </div>
                <div className="instructions">
                  <p><strong>Instructions:</strong></p>
                  <ul>
                    <li>Click on any path in the list above to edit or create a space</li>
                    <li>You can also click directly on the SVG image</li>
                    <li>Gray dots indicate unassigned paths</li>
                    <li>Colored dots show assigned spaces with their status</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SvgEditor;

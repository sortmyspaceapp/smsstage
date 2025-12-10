import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../config/axios';

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
  const svgWrapperRef = useRef<HTMLDivElement>(null);

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
      const response = await api.get(`/api/svg/floor/${floorId}`);
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

  // Extract all clickable elements from SVG content (map_ and shop_ elements)
  const getClickableElements = () => {
    if (!svgContent) return [];
    
    const elementIds: string[] = [];
    const idRegex = /id="([^"]+)"/g;
    let match;
    
    // Exclude non-clickable elements
    const excludedIds = ['outline', 'background_fill', 'image', 'staircase', 'staircase_2', 'circular_staircase_1', 'circular_staircase_2', 'circular_staircase_3', 'circular_staircase_4', 'lines_corridar', 'corridor', 'Open_Patio', 'entrance_door-2'];
    
    while ((match = idRegex.exec(svgContent)) !== null) {
      const id = match[1];
      // Include map_ and shop_ elements (store areas), but exclude non-clickable elements
      if (!excludedIds.includes(id) && (id.startsWith('map_') || id.startsWith('shop_'))) {
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
      
      // Handle map_ and shop_ prefixes
      if (elementId.startsWith('map_')) {
        defaultName = elementId.replace('map_', '');
      } else if (elementId.startsWith('shop_')) {
        defaultName = elementId.replace('shop_', 'Shop ');
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
    let target = event.target as SVGElement;
    
    // Ignore clicks on background images, text, and other non-interactive elements
    if (target.tagName === 'image' || target.tagName === 'text' || target.tagName === 'tspan') {
      // Check if it's inside a clickable group
      let parent = target.parentElement;
      let foundClickableParent = false;
      while (parent && parent !== event.currentTarget) {
        const parentId = parent.getAttribute('id');
        if (parentId && (parentId.startsWith('map_') || parentId.startsWith('shop_'))) {
          // Found a clickable parent, use that
          target = parent as unknown as SVGElement;
          foundClickableParent = true;
          break;
        }
        if (parent.tagName === 'svg' || parent.classList.contains('svg-wrapper')) {
          return; // Reached the wrapper, no clickable element found
        }
        parent = parent.parentElement;
      }
      if (!foundClickableParent) {
        return; // No clickable parent found
      }
    }
    
    let elementId = target.getAttribute('id');
    
    // Helper function to check if an element should be clickable
    const isClickableElement = (id: string | null): boolean => {
      if (!id) return false;
      
      // Exclude non-clickable elements
      const excludedIds = ['outline', 'background_fill', 'image', 'staircase', 'staircase_2', 'circular_staircase_1', 'circular_staircase_2', 'circular_staircase_3', 'circular_staircase_4', 'lines_corridar', 'corridor', 'Open_Patio', 'entrance_door-2'];
      if (excludedIds.includes(id)) {
        return false;
      }
      
      // map_ and shop_ elements are clickable (store areas)
      return id.startsWith('map_') || id.startsWith('shop_');
    };
    
    // If the clicked element doesn't have a clickable ID, traverse up to find parent with clickable ID
    let clickableElement: Element | null = target;
    let foundId: string | null = null;
    
    // First check if current element is clickable
    if (elementId && isClickableElement(elementId)) {
      foundId = elementId;
    } else {
      // Traverse up the DOM tree to find a clickable parent
      while (clickableElement && clickableElement.parentElement) {
        clickableElement = clickableElement.parentElement;
        const parentId = clickableElement.getAttribute('id');
        
        if (parentId && isClickableElement(parentId)) {
          foundId = parentId;
          break;
        }
        
        // Stop if we've reached the SVG wrapper
        if (clickableElement.tagName === 'svg' || clickableElement.classList.contains('svg-wrapper')) {
          break;
        }
      }
    }
    
    if (foundId) {
      console.log('Setting selected element:', foundId);
      setSelectedElement(foundId);
      const space = spaces.find(s => s.svgElementId === foundId);
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
        console.log('Creating new space for:', foundId);
        // Generate a descriptive default name from the element ID
        let defaultName = foundId;
        
        // Handle map_ and shop_ prefixes
        if (foundId.startsWith('map_')) {
          defaultName = foundId.replace('map_', '');
        } else if (foundId.startsWith('shop_')) {
          defaultName = foundId.replace('shop_', 'Shop ');
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
      console.log('Element not clickable or no ID found');
    }
  };

  const handleSaveSpace = async () => {
    if (!selectedElement) return;

    try {
      setLoading(true);
      
      if (selectedSpace) {
        // Update existing space
        await api.put(`/api/svg/space/${selectedSpace.id}/assignment`, {
          svgElementId: selectedElement,
          ...spaceForm
        });
      } else {
        // Create new space
        await api.post('/api/spaces', {
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
      await api.delete(`/api/spaces/${selectedSpace.id}`);
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

  // Function to highlight SVG elements
  const highlightSvgElements = useCallback((svg: string) => {
    if (!svg) return '';
    
    // Use DOM parser for better manipulation
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');
    
    if (!svgElement) return svg;
    
    // Exclude non-clickable elements
    const excludedIds = ['outline', 'background_fill', 'image', 'staircase', 'staircase_2', 'circular_staircase_1', 'circular_staircase_2', 'circular_staircase_3', 'circular_staircase_4', 'lines_corridar', 'corridor', 'Open_Patio', 'entrance_door-2'];
    
    // Get all clickable element IDs (map_ and shop_)
    const allElementIds: string[] = [];
    const idRegex = /id="([^"]+)"/g;
    let match;
    while ((match = idRegex.exec(svg)) !== null) {
      const id = match[1];
      if (!excludedIds.includes(id) && (id.startsWith('map_') || id.startsWith('shop_'))) {
        allElementIds.push(id);
      }
    }
    
    // Process each clickable element
    allElementIds.forEach(id => {
      const element = doc.getElementById(id);
      if (!element) return;
      
      // Check if this element has an existing space
      const existingSpace = spaces.find(space => space.svgElementId === id);
      
      // Determine colors based on availability status
      let fillColor: string;
      let strokeColor: string;
      
      if (existingSpace) {
        fillColor = getAvailabilityColor(existingSpace.availabilityStatus);
        strokeColor = fillColor;
      } else {
        fillColor = '#E0E0E0';
        strokeColor = '#CCCCCC';
      }
      
      // Style the element directly (SVG is normalized, no <g> groups to handle)
      // Set attributes - these will be preserved in the serialized SVG
      element.setAttribute('fill', fillColor);
      element.setAttribute('fill-opacity', '0.6');
      element.setAttribute('stroke', strokeColor);
      element.setAttribute('stroke-width', '2');
      element.setAttribute('fill-rule', 'nonzero');
      element.setAttribute('class', 'interactive-space');
      
      // Set inline styles as a string in the style attribute (this gets serialized properly)
      let styleString = `fill: ${fillColor} !important; fill-opacity: 0.6 !important; stroke: ${strokeColor} !important; stroke-width: 2px !important; cursor: pointer !important; pointer-events: all !important;`;
      
      // Highlight selected element
      if (selectedElement === id) {
        element.setAttribute('class', 'interactive-space selected');
        element.setAttribute('stroke-width', '4');
        element.setAttribute('stroke', '#FFD700');
        styleString = `fill: ${fillColor} !important; fill-opacity: 0.6 !important; stroke: #FFD700 !important; stroke-width: 4px !important; cursor: pointer !important; pointer-events: all !important;`;
      }
      
      element.setAttribute('style', styleString);
    });
    
    // Make outline non-clickable
    const outlineElement = doc.getElementById('outline');
    if (outlineElement) {
      outlineElement.setAttribute('style', 'fill:none;stroke:#000;stroke-width:2;pointer-events:none;');
    }
    
    return new XMLSerializer().serializeToString(doc);
  }, [spaces, selectedElement]);

  // Memoize the highlighted SVG to prevent unnecessary re-renders when hovering over list
  const highlightedSvg = useMemo(() => {
    if (!svgContent) return '';
    return highlightSvgElements(svgContent);
  }, [svgContent, highlightSvgElements]);

  // Apply styles directly to DOM after render - this persists even when React re-renders
  useEffect(() => {
    if (!svgWrapperRef.current) return;
    
    try {
      const svgEl = svgWrapperRef.current.querySelector('svg') as SVGSVGElement;
      if (!svgEl) return;
      
      // Handle direct path elements with map_ or shop_ IDs
      const clickablePaths = svgEl.querySelectorAll('path[id^="map_"], path[id^="shop_"]');
      clickablePaths.forEach((el) => {
        const pathEl = el as SVGPathElement;
        const elementId = pathEl.getAttribute('id');
        if (!elementId) return;

        // Normalize path geometry (only once)
        const d = pathEl.getAttribute('d');
        if (d && !pathEl.hasAttribute('data-normalized')) {
          // Many provided paths encode an outer and inner contour to draw a frame.
          // Trim to the first closed subpath so the interior is filled and clickable.
          const firstCloseIdx = d.search(/[Zz]/);
          if (firstCloseIdx > -1 && firstCloseIdx < d.length - 1) {
            const trimmed = d.slice(0, firstCloseIdx + 1);
            if (trimmed && trimmed.length > 1) {
              pathEl.setAttribute('d', trimmed);
              pathEl.setAttribute('data-normalized', 'true');
            }
          }
        }

        // Ensure proper fill handling and pointer events
        pathEl.setAttribute('fill-rule', 'nonzero');
        pathEl.style.pointerEvents = 'all';
        pathEl.style.cursor = 'pointer';

        // Apply colors based on space availability status
        const existingSpace = spaces.find(space => space.svgElementId === elementId);
        
        let fillColor: string;
        let strokeColor: string;
        
        if (existingSpace) {
          fillColor = getAvailabilityColor(existingSpace.availabilityStatus);
          strokeColor = fillColor;
        } else {
          fillColor = '#E0E0E0';
          strokeColor = '#CCCCCC';
        }

        // Set fill and stroke with !important to ensure they persist
        pathEl.style.setProperty('fill', fillColor, 'important');
        pathEl.style.setProperty('fill-opacity', '0.6', 'important');
        pathEl.style.setProperty('stroke', strokeColor, 'important');
        pathEl.style.setProperty('stroke-width', '2', 'important');
        
        // Also set as attributes as backup
        pathEl.setAttribute('fill', fillColor);
        pathEl.setAttribute('fill-opacity', '0.6');
        pathEl.setAttribute('stroke', strokeColor);
        pathEl.setAttribute('stroke-width', '2');

        // Highlight selected element
        if (selectedElement === elementId) {
          pathEl.style.setProperty('stroke-width', '4', 'important');
          pathEl.style.setProperty('stroke', '#FFD700', 'important');
          pathEl.setAttribute('stroke-width', '4');
          pathEl.setAttribute('stroke', '#FFD700');
          pathEl.setAttribute('class', 'interactive-space selected');
        } else {
          pathEl.setAttribute('class', 'interactive-space');
        }
      });
    } catch (error) {
      console.error('Error processing SVG paths:', error);
    }
  }, [highlightedSvg, spaces, selectedElement]);

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
              ref={svgWrapperRef}
              className="svg-wrapper"
              dangerouslySetInnerHTML={{ 
                __html: highlightedSvg
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

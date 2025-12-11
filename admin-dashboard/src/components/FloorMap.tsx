import React, { useEffect, useState } from 'react';
import axios from '../config/axios';

interface FloorMapProps {
    floorId: string;
    floorName: string;
    onSpaceClick?: (space: SpaceData) => void;
}

interface SpaceData {
    id: string;
    svgElementId: string;
    name: string;
    availabilityStatus: string;
    type: string;
    sizeSqft: number;
    priceMonthly: number;
    description?: string;
    contactDetails?: any;
}

interface SvgResponse {
    svgContent: string;
    spaces: SpaceData[];
    floor: {
        id: string;
        name: string;
        floorNumber: number;
        svgVersion: number;
    };
}

const FloorMap: React.FC<FloorMapProps> = ({ floorId, floorName, onSpaceClick }) => {
    const [svgContent, setSvgContent] = useState<string | null>(null);
    const [spaces, setSpaces] = useState<SpaceData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSvg = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get(`/api/svg/floor/${floorId}`);
                if (response.data.success) {
                    setSvgContent(response.data.data.svgContent);
                    setSpaces(response.data.data.spaces);
                } else {
                    setError('Failed to load map data');
                }
            } catch (err) {
                console.error('Error fetching SVG:', err);
                setError('Error loading map. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (floorId) {
            fetchSvg();
        }
    }, [floorId]);

    // Apply styles directly to DOM after render to ensure fills persist
    useEffect(() => {
        if (!svgContent || !spaces.length) return;
        
        // Use multiple attempts with increasing delays to ensure SVG is rendered (especially in modals)
        const attemptApplyStyles = (attempt: number = 0) => {
            if (attempt > 5) return; // Max 5 attempts
            
            const svgWrapper = document.querySelector('.floor-map-container .svg-wrapper');
            if (!svgWrapper) {
                // If wrapper not found, try again with longer delay
                setTimeout(() => attemptApplyStyles(attempt + 1), 100 * (attempt + 1));
                return;
            }
            
            const svgEl = svgWrapper.querySelector('svg') as SVGSVGElement;
            if (!svgEl) {
                // If SVG not found, try again
                setTimeout(() => attemptApplyStyles(attempt + 1), 100 * (attempt + 1));
                return;
            }
            
            // Re-apply styles to all clickable paths to ensure fills persist
            let foundCount = 0;
            spaces.forEach(space => {
                if (space.svgElementId) {
                    // Try multiple methods to find the element
                    let pathEl: SVGPathElement | null = null;
                    
                    // Method 1: querySelector with escaped ID
                    try {
                        const escapedId = space.svgElementId.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&');
                        pathEl = svgEl.querySelector(`#${escapedId}`) as SVGPathElement;
                    } catch (e) {
                        // Ignore
                    }
                    
                    // Method 2: querySelector without escaping
                    if (!pathEl) {
                        try {
                            pathEl = svgEl.querySelector(`#${space.svgElementId}`) as SVGPathElement;
                        } catch (e) {
                            // Ignore
                        }
                    }
                    
                    // Method 3: Try getElementById on the SVG element itself
                    if (!pathEl) {
                        pathEl = svgEl.getElementById(space.svgElementId) as SVGPathElement;
                    }
                    
                    if (pathEl) {
                        foundCount++;
                        
                        // Normalize path geometry if it's a path element (remove inner contours that create holes)
                        if (pathEl.tagName === 'path' || pathEl.tagName === 'PATH') {
                            const d = pathEl.getAttribute('d');
                            if (d && !pathEl.hasAttribute('data-normalized')) {
                                // Many SVG paths encode an outer and inner contour to draw a frame.
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
                        }
                        
                        let fillColor = '#E0E0E0'; // Default gray
                        let strokeColor = '#9E9E9E';

                        // Use the same colors as SvgEditor for consistency
                        switch (space.availabilityStatus?.toUpperCase()) {
                            case 'AVAILABLE':
                                fillColor = '#4CAF50'; // Green
                                strokeColor = '#2E7D32';
                                break;
                            case 'OCCUPIED':
                                fillColor = '#F44336'; // Red
                                strokeColor = '#C62828';
                                break;
                            case 'RESERVED':
                                fillColor = '#9C27B0'; // Purple
                                strokeColor = '#6A1B9A';
                                break;
                            case 'MAINTENANCE':
                                fillColor = '#FF9800'; // Orange
                                strokeColor = '#E65100';
                                break;
                            case 'PREMIUM':
                                fillColor = '#FFD700'; // Gold
                                strokeColor = '#FF8F00';
                                break;
                        }

                        // Remove any existing fill="none" or fill attributes that might prevent filling
                        if (pathEl.getAttribute('fill') === 'none') {
                            pathEl.removeAttribute('fill');
                        }

                        // Force apply styles with !important - ensure fill covers entire area
                        // Use lower opacity for better visibility (matching SvgEditor)
                        pathEl.style.setProperty('fill', fillColor, 'important');
                        pathEl.style.setProperty('fill-opacity', '0.7', 'important');
                        pathEl.style.setProperty('stroke', strokeColor, 'important');
                        pathEl.style.setProperty('stroke-width', '2px', 'important');
                        pathEl.style.setProperty('cursor', 'pointer', 'important');
                        pathEl.style.setProperty('pointer-events', 'all', 'important');
                        
                        // Also set as attributes - these are more reliable for SVG
                        pathEl.setAttribute('fill', fillColor);
                        pathEl.setAttribute('fill-opacity', '0.7');
                        pathEl.setAttribute('stroke', strokeColor);
                        pathEl.setAttribute('stroke-width', '2');
                        pathEl.setAttribute('fill-rule', 'nonzero');
                        pathEl.setAttribute('class', 'interactive-space');
                        
                        // Remove any stroke-dasharray or other attributes that might interfere
                        pathEl.removeAttribute('stroke-dasharray');
                    }
                }
            });
            
            // If we didn't find all elements and haven't exceeded attempts, try again
            if (foundCount < spaces.length && attempt < 4) {
                setTimeout(() => attemptApplyStyles(attempt + 1), 150);
            }
        };
        
        // Start with initial delay
        const timer = setTimeout(() => attemptApplyStyles(0), 100);
        
        return () => clearTimeout(timer);
    }, [svgContent, spaces]);

    // Handle click on SVG container to delegate to specific elements
    const handleSvgClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!onSpaceClick) return;

        e.stopPropagation(); // Prevent event bubbling

        let target = e.target as Element | null;
        
        // Exclude non-clickable elements
        const excludedIds = ['outline', 'background_fill', 'image', 'staircase', 'staircase_2', 
                             'circular_staircase_1', 'circular_staircase_2', 'circular_staircase_3', 
                             'circular_staircase_4', 'lines_corridar', 'corridor', 'Open_Patio', 
                             'entrance_door-2'];

        // Ignore clicks on background images, text, and other non-interactive elements
        if (target && (target.tagName === 'image' || target.tagName === 'text' || target.tagName === 'tspan' || target.tagName === 'title')) {
            // Check if it's inside a clickable group
            let parent = target.parentElement;
            let foundClickableParent = false;
            while (parent && parent !== e.currentTarget) {
                const parentId = parent.id || parent.getAttribute('id');
                if (parentId && !excludedIds.includes(parentId) && 
                    (parentId.startsWith('map_') || parentId.startsWith('shop_'))) {
                    target = parent;
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

        // Traverse up the tree to find an element with an ID that matches a space
        while (target && target !== e.currentTarget) {
            const elementId = target.id || target.getAttribute('id');
            if (elementId && !excludedIds.includes(elementId)) {
                // Only check for map_ and shop_ elements
                if (elementId.startsWith('map_') || elementId.startsWith('shop_')) {
                const space = spaces.find(s => s.svgElementId === elementId);
                if (space) {
                        e.preventDefault();
                        e.stopPropagation();
                    onSpaceClick(space);
                    return;
                    }
                }
            }
            if (!target.parentElement || target.parentElement === e.currentTarget) {
                break;
            }
            target = target.parentElement;
        }
    };

    // Function to inject spaces data into SVG (simple color coding for now)
    const processSvgContent = (content: string) => {
        if (!content) return '';

        // Create a temporary DOM element to parse and manipulate SVG
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'image/svg+xml');
        const svg = doc.querySelector('svg');

        if (!svg) return content;

        // Calculate appropriate maxHeight based on SVG viewBox dimensions
        // Extract viewBox or use width/height attributes
        let viewBox = svg.getAttribute('viewBox');
        let svgWidth = 0;
        let svgHeight = 0;
        let aspectRatio = 1;

        if (viewBox) {
            const vbValues = viewBox.split(/\s+/).map(Number);
            if (vbValues.length === 4) {
                svgWidth = vbValues[2];
                svgHeight = vbValues[3];
            }
        } else {
            // Fallback to width/height attributes
            const width = svg.getAttribute('width');
            const height = svg.getAttribute('height');
            if (width && height) {
                svgWidth = parseFloat(width);
                svgHeight = parseFloat(height);
            }
        }

        if (svgWidth > 0 && svgHeight > 0) {
            aspectRatio = svgHeight / svgWidth;
        }

        // Calculate maxHeight based on aspect ratio and a standard container width
        // For wider SVGs (like old maps ~1.5:1), use smaller maxHeight
        // For square/taller SVGs (like new maps ~1:1), use larger maxHeight
        // Target: fit well in containers that are typically 600-900px wide
        const baseContainerWidth = 800; // Approximate container width
        let calculatedMaxHeight = 600; // Default

        if (aspectRatio > 0.8) {
            // Square or taller SVGs (like Safina Plaza ~1:1)
            // Allow more height since width is constrained
            calculatedMaxHeight = Math.min(800, baseContainerWidth * aspectRatio);
        } else {
            // Wider SVGs (like old maps ~0.67:1)
            // Use standard height since they scale well
            calculatedMaxHeight = 600;
        }

        // Ensure minimum and maximum bounds
        calculatedMaxHeight = Math.max(400, Math.min(900, calculatedMaxHeight));

        // Make SVG responsive
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', 'auto');
        svg.style.maxHeight = `${calculatedMaxHeight}px`;

        // Exclude non-clickable elements from styling
        const excludedIds = ['outline', 'background_fill', 'image', 'staircase', 'staircase_2', 
                             'circular_staircase_1', 'circular_staircase_2', 'circular_staircase_3', 
                             'circular_staircase_4', 'lines_corridar', 'corridor', 'Open_Patio', 
                             'entrance_door-2'];

        // Color code spaces based on status
        spaces.forEach(space => {
            if (space.svgElementId && !excludedIds.includes(space.svgElementId)) {
                const element = doc.getElementById(space.svgElementId);
                if (element) {
                    // Normalize path geometry if it's a path element (remove inner contours that create holes)
                    if (element.tagName === 'path' || element.tagName === 'PATH') {
                        const d = element.getAttribute('d');
                        if (d && !element.hasAttribute('data-normalized')) {
                            // Many SVG paths encode an outer and inner contour to draw a frame.
                            // Trim to the first closed subpath so the interior is filled and clickable.
                            const firstCloseIdx = d.search(/[Zz]/);
                            if (firstCloseIdx > -1 && firstCloseIdx < d.length - 1) {
                                const trimmed = d.slice(0, firstCloseIdx + 1);
                                if (trimmed && trimmed.length > 1) {
                                    element.setAttribute('d', trimmed);
                                    element.setAttribute('data-normalized', 'true');
                                }
                            }
                        }
                    }
                    
                    // Remove any existing fill="none" that might prevent filling
                    if (element.getAttribute('fill') === 'none') {
                        element.removeAttribute('fill');
                    }
                    
                    // Set fill color based on status - use same colors as SvgEditor
                    let fillColor = '#E0E0E0'; // Default gray
                    let strokeColor = '#9E9E9E';

                    switch (space.availabilityStatus?.toUpperCase()) {
                        case 'AVAILABLE':
                            fillColor = '#4CAF50'; // Green
                            strokeColor = '#2E7D32';
                            break;
                        case 'OCCUPIED':
                            fillColor = '#F44336'; // Red
                            strokeColor = '#C62828';
                            break;
                        case 'RESERVED':
                            fillColor = '#9C27B0'; // Purple
                            strokeColor = '#6A1B9A';
                            break;
                        case 'MAINTENANCE':
                            fillColor = '#FF9800'; // Orange
                            strokeColor = '#E65100';
                            break;
                        case 'PREMIUM':
                            fillColor = '#FFD700'; // Gold
                            strokeColor = '#FF8F00';
                            break;
                    }

                    // Style the element directly (SVG is normalized during upload, no <g> groups)
                    // Set attributes - use better opacity and stroke width for visibility
                    element.setAttribute('fill', fillColor);
                    element.setAttribute('fill-opacity', '0.7');
                    element.setAttribute('stroke', strokeColor);
                    element.setAttribute('stroke-width', '2');
                    element.setAttribute('fill-rule', 'nonzero');
                    element.setAttribute('class', 'interactive-space');
                    
                    // Remove any stroke-dasharray or other attributes that might interfere
                    element.removeAttribute('stroke-dasharray');
                    
                    // Set inline styles with !important to ensure they persist
                    const styleString = `fill: ${fillColor} !important; fill-opacity: 0.7 !important; stroke: ${strokeColor} !important; stroke-width: 2px !important; cursor: pointer !important; pointer-events: all !important; transition: all 0.2s ease !important;`;
                    element.setAttribute('style', styleString);

                    // Add simple title for tooltip
                    const title = doc.createElementNS('http://www.w3.org/2000/svg', 'title');
                    title.textContent = `${space.name} (${space.type}) - ${space.availabilityStatus}`;
                    element.appendChild(title);
                }
            }
        });

        return new XMLSerializer().serializeToString(doc);
    };

    if (loading) {
        return <div className="map-loading">Loading map...</div>;
    }

    if (error) {
        return <div className="map-error">{error}</div>;
    }

    return (
        <div className="floor-map-container">
            {svgContent ? (
                <div
                    className="svg-wrapper"
                    dangerouslySetInnerHTML={{ __html: processSvgContent(svgContent) }}
                    onClick={handleSvgClick}
                />
            ) : (
                <div className="no-map">No map available for this floor.</div>
            )}
            <div className="map-legend" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', background: '#d1fae5', border: '1px solid #059669', display: 'block' }}></span>
                    Available
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', background: '#fee2e2', border: '1px solid #dc2626', display: 'block' }}></span>
                    Occupied
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', background: '#fef3c7', border: '1px solid #d97706', display: 'block' }}></span>
                    Reserved
                </div>
            </div>
        </div>
    );
};

export default FloorMap;

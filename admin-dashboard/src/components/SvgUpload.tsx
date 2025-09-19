import React, { useState } from 'react';
import axios from 'axios';

interface SvgUploadProps {
  mallId: string;
  floorId: string;
  onUploadSuccess: () => void;
  onClose: () => void;
}

const SvgUpload: React.FC<SvgUploadProps> = ({ mallId, floorId, onUploadSuccess, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type === 'image/svg+xml' || selectedFile.name.endsWith('.svg')) {
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    } else {
      setError('Please select a valid SVG file');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('svg', file);
      formData.append('mallId', mallId);
      formData.append('floorId', floorId);

      const response = await axios.post('/svg/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response:', response.data);

      if (response.data.success) {
        setSuccess('SVG uploaded successfully! Spaces have been created.');
        setTimeout(() => {
          onUploadSuccess();
          onClose();
        }, 1500);
      } else {
        setError(response.data.error || 'Upload failed');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Upload failed');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="svg-upload-overlay">
      <div className="svg-upload-modal">
        <div className="svg-upload-header">
          <h2>Upload SVG Floor Plan</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="svg-upload-content">
          <div className="upload-instructions">
            <h3>Instructions:</h3>
            <ul>
              <li>Upload an SVG file containing your floor plan</li>
              <li>SVG elements with <code>id</code> attributes will be automatically detected</li>
              <li>Spaces will be created for each detected element</li>
              <li>You can edit space details after upload</li>
            </ul>
          </div>

          <div 
            className={`upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="file-selected">
                <div className="file-info">
                  <strong>Selected File:</strong> {file.name}
                  <br />
                  <small>Size: {(file.size / 1024).toFixed(1)} KB</small>
                </div>
                <button onClick={() => setFile(null)} className="remove-file">
                  Remove
                </button>
              </div>
            ) : (
              <div className="upload-prompt">
                <div className="upload-icon">📁</div>
                <p>Drag and drop your SVG file here, or</p>
                <label className="file-input-label">
                  <input
                    type="file"
                    accept=".svg,image/svg+xml"
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                  />
                  <span className="file-input-button">Choose File</span>
                </label>
                <p className="file-types">SVG files only</p>
              </div>
            )}
          </div>

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

          <div className="upload-actions">
            <button onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button 
              onClick={handleUpload} 
              disabled={!file || loading}
              className="upload-btn"
            >
              {loading ? 'Uploading...' : 'Upload SVG'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SvgUpload;

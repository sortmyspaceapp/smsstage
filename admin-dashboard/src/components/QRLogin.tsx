import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api, { API_BASE_URL } from '../config/axios';
import './QRLogin.css';

interface QRLoginProps {
  onLoginSuccess: (user: any, token: string, refreshToken: string) => void;
  onSwitchToPassword: () => void;
}

const QRLogin: React.FC<QRLoginProps> = ({ onLoginSuccess, onSwitchToPassword }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'scanned' | 'approved' | 'rejected' | 'expired' | 'error'>('idle');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Update ref when sessionId changes
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Handle status updates - memoized (declared first as it's used by others)
  const handleStatusUpdate = useCallback(async (data: any) => {
    setStatus(data.status.toLowerCase());
    
    if (data.status === 'APPROVED' && data.user) {
      // Complete the login
      try {
        const currentSessionId = sessionIdRef.current;
        if (!currentSessionId) {
          setError('Session ID not found');
          return;
        }
        const response = await api.post('/api/qr-auth/complete', { sessionId: currentSessionId });
        if (response.data.success) {
          const { user, token, refreshToken } = response.data.data;
          onLoginSuccess(user, token, refreshToken);
        } else {
          setError('Failed to complete login');
          setStatus('error');
        }
      } catch (err: any) {
        console.error('Error completing login:', err);
        setError(err.response?.data?.error || 'Failed to complete login');
        setStatus('error');
      }
    } else if (data.status === 'REJECTED') {
      setError('Login was rejected. Please try again.');
    } else if (data.status === 'EXPIRED') {
      setError('QR code has expired. Please generate a new one.');
      // Clean up
      cleanup();
    }
  }, [onLoginSuccess, cleanup]);

  // Start Server-Sent Events connection - memoized (depends on handleStatusUpdate)
  const startSSE = useCallback((sessionId: string) => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create SSE connection - use same base URL as axios
    const eventSource = new EventSource(`${API_BASE_URL}/api/qr-auth/stream/${sessionId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleStatusUpdate(data);
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      // SSE connection failed, continue with polling
      eventSource.close();
    };
  }, [handleStatusUpdate]);

  // Start polling as fallback - memoized (depends on handleStatusUpdate)
  const startPolling = useCallback((sessionId: string) => {
    // Clear existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Poll every 2 seconds
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await api.get(`/api/qr-auth/status/${sessionId}`);
        if (response.data.success) {
          handleStatusUpdate(response.data.data);
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 2000);
  }, [handleStatusUpdate]);

  // Generate QR code - memoized (depends on startSSE and startPolling)
  const generateQR = useCallback(async () => {
    try {
      setError(null);
      setStatus('idle');
      
      const response = await api.post('/api/qr-auth/generate');
      
      if (response.data.success) {
        const { sessionId, qrToken, qrDataUrl, expiresAt } = response.data.data;
        setSessionId(sessionId);
        setQrToken(qrToken);
        setQrDataUrl(qrDataUrl);
        setExpiresAt(new Date(expiresAt));
        setStatus('pending');
        
        // Start SSE connection for real-time updates (only if sessionId is new)
        if (sessionId) {
          startSSE(sessionId);
          // Start polling as fallback
          startPolling(sessionId);
        }
      } else {
        setError('Failed to generate QR code');
        setStatus('error');
      }
    } catch (err: any) {
      console.error('Error generating QR:', err);
      setError(err.response?.data?.error || 'Failed to generate QR code');
      setStatus('error');
    }
  }, [startSSE, startPolling]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt || status !== 'pending') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0 && status === 'pending') {
        setStatus('expired');
        setError('QR code has expired. Please generate a new one.');
        cleanup();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [expiresAt, status, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate QR on mount - only once
  useEffect(() => {
    // Only generate if we don't have a sessionId yet
    if (!sessionId && status === 'idle') {
      generateQR();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  return (
    <div className="qr-login-container">
      <div className="qr-login-card">
        <h1>QR Code Login</h1>
        <p className="qr-login-description">
          Scan this QR code with your mobile app to log in
        </p>

        {error && (
          <div className="qr-error-message">
            {error}
          </div>
        )}

        {status === 'idle' && (
          <div className="qr-loading">
            <div className="spinner"></div>
            <p>Generating QR code...</p>
          </div>
        )}

        {status === 'pending' && qrDataUrl && (
          <div className="qr-code-section">
            <div className="qr-code-wrapper">
              {qrToken && sessionId && (
                <QRCodeSVG
                  value={JSON.stringify({
                    type: 'SPACEFINDER_LOGIN',
                    token: qrToken,
                    sessionId,
                  })}
                  size={300}
                  level="M"
                  includeMargin={true}
                />
              )}
            </div>
            {timeRemaining > 0 && (
              <div className="qr-timer">
                <span>Expires in: {formatTime(timeRemaining)}</span>
              </div>
            )}
            <p className="qr-instructions">
              Open your mobile app and scan this QR code
            </p>
          </div>
        )}

        {status === 'scanned' && (
          <div className="qr-status-message">
            <div className="qr-status-icon">✓</div>
            <h3>QR Code Scanned</h3>
            <p>Please approve the login on your mobile device</p>
          </div>
        )}

        {status === 'approved' && (
          <div className="qr-status-message">
            <div className="qr-status-icon">✓</div>
            <h3>Login Approved</h3>
            <p>Completing login...</p>
          </div>
        )}

        {status === 'rejected' && (
          <div className="qr-status-message error">
            <div className="qr-status-icon">✗</div>
            <h3>Login Rejected</h3>
            <p>Please try again</p>
            <button onClick={generateQR} className="qr-retry-btn">
              Generate New QR Code
            </button>
          </div>
        )}

        {status === 'expired' && (
          <div className="qr-status-message error">
            <div className="qr-status-icon">⏱</div>
            <h3>QR Code Expired</h3>
            <p>The QR code has expired. Please generate a new one.</p>
            <button onClick={generateQR} className="qr-retry-btn">
              Generate New QR Code
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="qr-status-message error">
            <div className="qr-status-icon">⚠</div>
            <h3>Error</h3>
            <p>{error || 'An error occurred. Please try again.'}</p>
            <button onClick={generateQR} className="qr-retry-btn">
              Try Again
            </button>
          </div>
        )}

        <div className="qr-login-footer">
          <button
            type="button"
            onClick={onSwitchToPassword}
            className="qr-switch-link"
          >
            Use password instead
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRLogin;


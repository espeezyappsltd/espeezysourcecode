import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface LoadingContextType {
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  isLoading: boolean;
  message?: string;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useCentralLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useCentralLoading must be used within CentralLoadingProvider');
  return ctx;
};

export const CentralLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback((msg?: string) => {
    setMessage(msg);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsLoading(true), 150); // Prevents flash for fast nav
  }, []);

  const stopLoading = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsLoading(false);
    setMessage(undefined);
  }, []);

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, isLoading, message }}>
      {children}
      {isLoading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(30,30,40,0.18)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)', transition: 'opacity 0.2s',
        }}>
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin">
              <circle cx="24" cy="24" r="20" stroke="#6366f1" strokeWidth="4" strokeDasharray="100 40" />
            </svg>
            <div style={{ marginTop: 16, fontWeight: 700, color: '#6366f1', fontSize: 18 }}>{message || 'Loading...'}</div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

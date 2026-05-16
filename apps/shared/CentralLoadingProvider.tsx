'use client';
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface LoadingContextType {
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  isLoading: boolean;
  message?: string;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const CentralLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const startLoading = useCallback((msg?: string) => {
    setMessage(msg);
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setMessage(undefined);
  }, []);

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, isLoading, message }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) throw new Error('useLoading must be used within a CentralLoadingProvider');
  return context;
};

/** @deprecated Use `useLoading` */
export const useCentralLoading = useLoading;

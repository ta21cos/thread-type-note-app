import React, { createContext, useContext, useRef, useCallback, useState, ReactNode } from 'react';

interface FocusableElement {
  id: string;
  ref: React.RefObject<HTMLElement>;
  priority?: number;
}

interface FocusContextType {
  registerInput: (id: string, ref: React.RefObject<HTMLElement>, priority?: number) => void;
  unregisterInput: (id: string) => void;
  focusInput: (id: string) => void;
  getFocusedId: () => string | null;
  setFocusedId: (id: string | null) => void;
  restoreLastFocus: () => void;
  clearFocus: () => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within FocusProvider');
  }
  return context;
};

interface FocusProviderProps {
  children: ReactNode;
}

export const FocusProvider: React.FC<FocusProviderProps> = ({ children }) => {
  const inputsRef = useRef<Map<string, FocusableElement>>(new Map());
  const [currentFocusId, setCurrentFocusId] = useState<string | null>(null);
  const [lastFocusId, setLastFocusId] = useState<string | null>(null);

  const registerInput = useCallback(
    (id: string, ref: React.RefObject<HTMLElement>, priority = 0) => {
      inputsRef.current.set(id, { id, ref, priority });
    },
    []
  );

  const unregisterInput = useCallback(
    (id: string) => {
      inputsRef.current.delete(id);
      if (currentFocusId === id) {
        setCurrentFocusId(null);
      }
      if (lastFocusId === id) {
        setLastFocusId(null);
      }
    },
    [currentFocusId, lastFocusId]
  );

  const focusInput = useCallback(
    (id: string) => {
      const element = inputsRef.current.get(id);
      if (element?.ref.current) {
        element.ref.current.focus();
        setLastFocusId(currentFocusId);
        setCurrentFocusId(id);
      }
    },
    [currentFocusId]
  );

  const getFocusedId = useCallback(() => {
    return currentFocusId;
  }, [currentFocusId]);

  const setFocusedId = useCallback(
    (id: string | null) => {
      if (id !== null) {
        setLastFocusId(currentFocusId);
      }
      setCurrentFocusId(id);
    },
    [currentFocusId]
  );

  const restoreLastFocus = useCallback(() => {
    if (lastFocusId) {
      focusInput(lastFocusId);
    }
  }, [lastFocusId, focusInput]);

  const clearFocus = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setCurrentFocusId(null);
  }, []);

  const value: FocusContextType = {
    registerInput,
    unregisterInput,
    focusInput,
    getFocusedId,
    setFocusedId,
    restoreLastFocus,
    clearFocus,
  };

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
};

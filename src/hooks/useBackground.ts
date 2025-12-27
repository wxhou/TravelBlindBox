import { useState, useEffect } from 'react';

const BACKGROUND_STORAGE_KEY = 'wanderlust_background';
const DEFAULT_BACKGROUND = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

interface UseBackgroundReturn {
  currentBackground: string;
  setBackground: (background: string) => void;
  resetBackground: () => void;
  isCustomBackground: boolean;
}

export const useBackground = (): UseBackgroundReturn => {
  const [currentBackground, setCurrentBackground] = useState<string>(DEFAULT_BACKGROUND);

  useEffect(() => {
    const savedBackground = localStorage.getItem(BACKGROUND_STORAGE_KEY);
    if (savedBackground) {
      setCurrentBackground(savedBackground);
    } else {
      setCurrentBackground(DEFAULT_BACKGROUND);
    }
  }, []);

  const setBackground = (background: string) => {
    setCurrentBackground(background);
    localStorage.setItem(BACKGROUND_STORAGE_KEY, background);
  };

  const resetBackground = () => {
    setCurrentBackground(DEFAULT_BACKGROUND);
    localStorage.removeItem(BACKGROUND_STORAGE_KEY);
  };

  const isCustomBackground = currentBackground !== DEFAULT_BACKGROUND;

  return {
    currentBackground,
    setBackground,
    resetBackground,
    isCustomBackground
  };
};

export default useBackground;
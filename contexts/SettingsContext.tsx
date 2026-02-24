import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SortOption = 'data-asc' | 'data-desc' | 'nome-asc' | 'nome-desc';

interface SettingsContextData {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  sortBy: SortOption;
  setSortBy: (val: SortOption) => void;
}

const SettingsContext = createContext<SettingsContextData>({} as SettingsContextData);

export const SettingsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('data-asc');

  // Carregar preferências ao iniciar
  useEffect(() => {
    AsyncStorage.getItem('@prefs').then(data => {
      if (data) {
        const { dark, sort } = JSON.parse(data);
        setIsDarkMode(dark);
        setSortBy(sort);
      }
    });
  }, []);

  // Salvar preferências quando mudar
  useEffect(() => {
    AsyncStorage.setItem('@prefs', JSON.stringify({ dark: isDarkMode, sort: sortBy }));
  }, [isDarkMode, sortBy]);

  return (
    <SettingsContext.Provider value={{ isDarkMode, setIsDarkMode, sortBy, setSortBy }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
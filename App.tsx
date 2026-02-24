import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import { StatusBar } from 'expo-status-bar';

// Importamos os ícones aqui
import { Ionicons } from '@expo/vector-icons'; 

const Tab = createBottomTabNavigator();

function NavigationWrapper() {
  const { isDarkMode } = useSettings();

  return (
    <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Tab.Navigator 
        screenOptions={({ route }) => ({
          // Lógica para definir o ícone de cada aba
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any;

            if (route.name === 'Despensa') {
              iconName = focused ? 'basket' : 'basket-outline';
            } else if (route.name === 'Ajustes') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            // Retorna o componente de ícone
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerShown: true,
          // Ajuste visual para o dark mode no header
          headerStyle: {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
          },
          headerTintColor: isDarkMode ? '#fff' : '#000',
        })}
      >
        <Tab.Screen 
          name="Despensa" 
          component={HomeScreen} 
          options={{ title: 'Minha Despensa' }}
        />
        <Tab.Screen 
          name="Ajustes" 
          component={SettingsScreen} 
          options={{ title: 'Configurações' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <NavigationWrapper />
    </SettingsProvider>
  );
}
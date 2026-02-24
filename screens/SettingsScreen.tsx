import React from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';

export default function SettingsScreen() {
  const { isDarkMode, setIsDarkMode, sortBy, setSortBy } = useSettings();

  const themeStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <View style={[styles.container, themeStyles.container]}>
      <Text style={[styles.title, themeStyles.text]}>Configurações</Text>

      <View style={styles.section}>
        <Text style={themeStyles.text}>Tema Escuro</Text>
        <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
      </View>

      <Text style={[styles.subTitle, themeStyles.text]}>Ordenar por:</Text>
      
      {(['data-asc', 'data-desc', 'nome-asc', 'nome-desc'] as const).map((option) => (
        <TouchableOpacity 
          key={option} 
          style={[styles.sortBtn, sortBy === option && styles.activeBtn]}
          onPress={() => setSortBy(option)}
        >
          <Text style={sortBy === option ? styles.activeText : themeStyles.text}>
            {option === 'data-asc' && ' Vencimento (Próximo)'}
            {option === 'data-desc' && ' Vencimento (Longe)'}
            {option === 'nome-asc' && ' Nome (A-Z)'}
            {option === 'nome-desc' && ' Nome (Z-A)'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  subTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  sortBtn: { padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ccc' },
  activeBtn: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  activeText: { color: '#fff', fontWeight: 'bold' }
});

const lightStyles = { container: { backgroundColor: '#f5f5f5' }, text: { color: '#333' } };
const darkStyles = { container: { backgroundColor: '#121212' }, text: { color: '#fff' } };
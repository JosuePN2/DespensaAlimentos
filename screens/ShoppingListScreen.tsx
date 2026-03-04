import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  SafeAreaView, ActivityIndicator, Alert, RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { supabase } from '../supabase'; 
import { useSettings } from '../contexts/SettingsContext';

// 1. Definimos a interface para o TypeScript saber o que existe no item
interface ItemCompra {
  id: string;
  nome: string;
  quantidade: number;
  comprado: boolean;
}

export default function ShoppingListScreen() {
  // 2. Aplicamos a interface no useState para evitar o erro de "never"
  const [lista, setLista] = useState<ItemCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { isDarkMode } = useSettings();

  const fetchLista = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const { data, error } = await supabase
        .from('lista_compras')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLista(data || []);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLista();
  }, [fetchLista]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLista(true);
  };

  const alternarComprado = async (id: string, estadoAtual: boolean) => {
    const { error } = await supabase
      .from('lista_compras')
      .update({ comprado: !estadoAtual })
      .eq('id', id);

    if (!error) {
      fetchLista(true);
    } else {
      Alert.alert("Erro", "Não foi possível atualizar o status.");
    }
  };

  const removerDaLista = async (id: string) => {
    const { error } = await supabase
      .from('lista_compras')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchLista(true);
    } else {
      Alert.alert("Erro", "Não foi possível remover o item.");
    }
  };

  const themeContainer = isDarkMode ? styles.darkContainer : styles.lightContainer;
  const themeText = isDarkMode ? styles.darkText : styles.lightText;
  const themeCard = isDarkMode ? styles.darkCard : styles.lightCard;

  return (
    <SafeAreaView style={[styles.container, themeContainer]}>
      {/* <Text style={[styles.title, themeText]}>Lista de Compras</Text> */}

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
          }
          renderItem={({ item }) => (
            <View style={[styles.itemCard, themeCard]}>
              <TouchableOpacity 
                style={styles.checkArea} 
                onPress={() => alternarComprado(item.id, item.comprado)}
              >
                <Ionicons 
                  name={item.comprado ? "checkbox" : "square-outline"} 
                  size={26} 
                  color={item.comprado ? "#2ecc71" : "#888"} 
                />
                <Text style={[
                  styles.nomeItem, 
                  themeText, 
                  item.comprado && styles.itemCompradoText
                ]}>
                  {item.nome}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => removerDaLista(item.id)}>
                <Ionicons name="trash-outline" size={22} color="#ff4d4d" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Sua lista de compras está vazia.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  lightContainer: { backgroundColor: '#f8f9fa' },
  darkContainer: { backgroundColor: '#121212' },
  lightText: { color: '#333' },
  darkText: { color: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  itemCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10,
    elevation: 2
  },
  lightCard: { backgroundColor: '#fff' },
  darkCard: { backgroundColor: '#1e1e1e' },
  checkArea: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  nomeItem: { fontSize: 17, marginLeft: 12, fontWeight: '500' },
  itemCompradoText: { textDecorationLine: 'line-through', color: '#888' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});
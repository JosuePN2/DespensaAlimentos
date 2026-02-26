import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, SafeAreaView, 
  TextInput, TouchableOpacity, Keyboard, ActivityIndicator, Alert, ScrollView 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons'; 
import { supabase } from '../supabase'; 
import { useSettings } from '../contexts/SettingsContext';

interface ItemDespensa {
  id: string;
  nome: string;
  validade: string;
}

interface GrupoItem {
  nome: string;
  subItems: ItemDespensa[];
  dataMaisProxima: string;
}

export default function HomeScreen() {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [itens, setItens] = useState<ItemDespensa[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataValidade, setDataValidade] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const { sortBy, isDarkMode } = useSettings();

  const fetchItens = useCallback(async () => {
    try {
      setLoading(true);
      // Buscamos a lista bruta. O agrupamento será feito no frontend para flexibilidade.
      const { data, error } = await supabase.from('itens_despensa').select('*');
      if (error) throw error;
      setItens(data || []);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItens();
  }, [fetchItens]);

  // Lógica de Agrupamento e Ordenação dos Grupos
  const getItensAgrupados = () => {
    const grupos: { [key: string]: GrupoItem } = {};

    itens.forEach(item => {
      if (!grupos[item.nome]) {
        grupos[item.nome] = { nome: item.nome, subItems: [], dataMaisProxima: item.validade };
      }
      grupos[item.nome].subItems.push(item);
      
      // Atualiza a data mais próxima do grupo
      if (item.validade < grupos[item.nome].dataMaisProxima) {
        grupos[item.nome].dataMaisProxima = item.validade;
      }
    });

    const listaGrupos = Object.values(grupos);

    // Ordenação dos grupos baseada na preferência do usuário
    return listaGrupos.sort((a, b) => {
      if (sortBy === 'data-asc') return a.dataMaisProxima.localeCompare(b.dataMaisProxima);
      if (sortBy === 'data-desc') return b.dataMaisProxima.localeCompare(a.dataMaisProxima);
      if (sortBy === 'nome-asc') return a.nome.localeCompare(b.nome);
      if (sortBy === 'nome-desc') return b.nome.localeCompare(a.nome);
      return 0;
    });
  };

  const adicionarItem = async () => {
    if (nome.trim() === '') return;
    try {
      // Criamos um array de objetos para inserção múltipla (Bulk Insert)
      const novosItens = Array.from({ length: quantidade }).map(() => ({
        nome: nome.trim(),
        validade: dataValidade.toISOString().split('T')[0]
      }));

      const { error } = await supabase.from('itens_despensa').insert(novosItens);
      if (error) throw error;

      setNome('');
      setQuantidade(1);
      setDataValidade(new Date());
      fetchItens();
      Keyboard.dismiss();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  };

  const excluirUmItem = async (id: string) => {
    const { error } = await supabase.from('itens_despensa').delete().eq('id', id);
    if (!error) fetchItens();
    else Alert.alert("Erro", "Não foi possível excluir o item.");
  };

  const toggleExpand = (nome: string) => {
    setExpandedItems(prev => 
      prev.includes(nome) ? prev.filter(n => n !== nome) : [...prev, nome]
    );
  };

  const getStatusColor = (validadeStr: string) => {
    const diff = Math.ceil((new Date(validadeStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return '#8e44ad' 
    if (diff <= 3) return '#ff4d4d';
    if (diff <= 7) return '#ffa500';
    return '#2ecc71';
  };

  const themeContainer = isDarkMode ? styles.darkContainer : styles.lightContainer;
  const themeText = isDarkMode ? styles.darkText : styles.lightText;
  const themeCard = isDarkMode ? styles.darkCard : styles.lightCard;

  return (
    <SafeAreaView style={[styles.container, themeContainer]}>
      <View style={[styles.form, isDarkMode && { backgroundColor: '#1e1e1e' }]}>
        <TextInput 
          style={[styles.input, themeText]}
          placeholder="Nome do produto"
          placeholderTextColor={isDarkMode ? '#888' : '#999'}
          value={nome}
          onChangeText={setNome}
        />

        <View style={styles.row}>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>Validade: {dataValidade.toLocaleDateString('pt-BR')}</Text>
          </TouchableOpacity>

          <View style={styles.quantityContainer}>
            <TouchableOpacity onPress={() => setQuantidade(Math.max(1, quantidade - 1))} style={styles.qtyBtn}>
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.qtyText, themeText]}>{quantidade}</Text>
            <TouchableOpacity onPress={() => setQuantidade(quantidade + 1)} style={styles.qtyBtn}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dataValidade}
            mode="date"
            onChange={(e, date) => { setShowDatePicker(false); if(date) setDataValidade(date); }}
          />
        )}

        <TouchableOpacity style={styles.addButton} onPress={adicionarItem}>
          <Text style={styles.addButtonText}>Adicionar à Despensa</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={getItensAgrupados()}
          keyExtractor={(item) => item.nome}
          renderItem={({ item: grupo }) => {
            const isExpanded = expandedItems.includes(grupo.nome);
            return (
              <View style={[styles.card, themeCard]}>
                <TouchableOpacity 
                  style={styles.cardHeader} 
                  onPress={() => toggleExpand(grupo.nome)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, themeText]}>
                      {grupo.nome} ({grupo.subItems.length})
                    </Text>
                    <Text style={styles.itemDate}>
                      Mais próximo: {new Date(grupo.dataMaisProxima).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(grupo.dataMaisProxima), marginRight: 10 }]} />
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={isDarkMode ? "#fff" : "#333"} 
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {grupo.subItems.map((sub) => (
                      <View key={sub.id} style={styles.subItemRow}>
                        <Text style={[styles.subItemText, themeText]}>
                          Vence em {new Date(sub.validade).toLocaleDateString('pt-BR')}
                        </Text>
                        <TouchableOpacity onPress={() => excluirUmItem(sub.id)}>
                          <Ionicons name="trash-outline" size={18} color="#ff4d4d" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>Sua despensa está vazia.</Text>}
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
  form: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 20, elevation: 4 },
  input: { borderBottomWidth: 1, borderColor: '#eee', padding: 10, marginBottom: 15, fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  dateButton: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, flex: 1, marginRight: 10, alignItems: 'center' },
  dateButtonText: { fontSize: 14, color: '#444' },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 5 },
  qtyBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 20, fontWeight: 'bold', color: '#007AFF' },
  qtyText: { marginHorizontal: 10, fontSize: 16, fontWeight: 'bold' },
  addButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  card: { padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  lightCard: { backgroundColor: '#fff' },
  darkCard: { backgroundColor: '#1e1e1e' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 18, fontWeight: '600' },
  itemDate: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { width: 10, height: 10, borderRadius: 5 },
  expandedContent: { marginTop: 10, borderTopWidth: 0.5, borderColor: '#eee', paddingTop: 5 },
  subItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.2, borderColor: '#ccc' },
  subItemText: { fontSize: 14 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});
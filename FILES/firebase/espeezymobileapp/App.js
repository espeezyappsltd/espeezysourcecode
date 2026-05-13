import 'react-native-url-polyfill/auto'
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';

// Firebase configuration from the main project
const firebaseConfig = {
  apiKey: "AIzaSyA90GDtsLFRPAHr01DDhIm0QZGJMO1DSzU",
  authDomain: "espeezylearning.firebaseapp.com",
  projectId: "espeezylearning",
  storageBucket: "espeezylearning.firebasestorage.app",
  messagingSenderId: "521867130243",
  appId: "1:521867130243:web:eb09572762faeccee832b6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLUMNS = ['To Do', 'In Progress', 'In Review', 'Done'];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [activeColumn, setActiveColumn] = useState('To Do');

  const syncTasks = async () => {
    try {
      // Attempt Firestore Fetch
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Update State & Cache
      setTasks(data);
      setIsOffline(false);
      await AsyncStorage.setItem('OFFLINE_TASKS', JSON.stringify(data));
      
    } catch (err) {
      console.error('Firebase Sync Error:', err);
      // Network Failed -> Boot from Cache
      setIsOffline(true);
      const cached = await AsyncStorage.getItem('OFFLINE_TASKS');
      if (cached) setTasks(JSON.parse(cached));
    }
  };

  useEffect(() => {
    syncTasks();
  }, []);

  const advanceTask = async (task) => {
    const currentIndex = COLUMNS.indexOf(task.status);
    if (currentIndex >= COLUMNS.length - 1) return;
    
    const newStatus = COLUMNS[currentIndex + 1];
    
    // Optimistic UI update
    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);
    await AsyncStorage.setItem('OFFLINE_TASKS', JSON.stringify(updatedTasks));

    if (!isOffline) {
       // Attempt to sync to Firestore
       try {
         const taskRef = doc(db, 'tasks', task.id);
         await updateDoc(taskRef, { status: newStatus, updated_at: new Date().toISOString() });
       } catch (err) {
         console.error('Firebase Update Error:', err);
         Alert.alert('Update Failed', 'Could not sync change to Firebase.');
       }
    } else {
       Alert.alert('Offline Mode', 'Task advanced locally. Will synchronize with Espeezy cloud when connection is restored.');
    }
  };

  const visibleTasks = tasks.filter(t => t.status === activeColumn);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Espeezy Sprint</Text>
        <Text style={[styles.statusBadge, isOffline ? styles.bgDanger : styles.bgSuccess]}>
          {isOffline ? 'OFFLINE (Cached)' : 'ONLINE'}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        {COLUMNS.map(col => (
          <TouchableOpacity 
            key={col} 
            style={[styles.tab, activeColumn === col && styles.activeTab]}
            onPress={() => setActiveColumn(col)}
          >
            <Text style={[styles.tabText, activeColumn === col && styles.activeTabText]}>
              {col}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.board}>
        {visibleTasks.length === 0 ? (
           <Text style={styles.emptyText}>No tasks in this column.</Text>
        ) : (
          visibleTasks.map(task => (
            <TouchableOpacity 
              key={task.id} 
              style={styles.card}
              onPress={() => advanceTask(task)}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>{task.title}</Text>
              <View style={styles.cardFooter}>
                <View style={styles.cardBadge}>
                  <Text style={styles.badgeText}>{task.is_coding_task ? 'Code' : 'Design'}</Text>
                </View>
                <Text style={styles.swipeHint}>
                  {task.status !== 'Done' ? 'Tap to advance →' : 'Completed ✓'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#1e293b' },
  headerTitle: { color: '#38bdf8', fontSize: 20, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 10, color: 'white', overflow: 'hidden' },
  bgSuccess: { backgroundColor: '#10b981' },
  bgDanger: { backgroundColor: '#ef4444' },
  tabContainer: { maxHeight: 60, borderBottomWidth: 1, borderColor: '#1e293b' },
  tab: { paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderColor: '#38bdf8' },
  tabText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#38bdf8' },
  board: { flex: 1, padding: 20 },
  card: { backgroundColor: '#1e293b', borderLeftWidth: 4, borderColor: '#38bdf8', padding: 16, borderRadius: 8, marginBottom: 16 },
  cardTitle: { color: 'white', fontSize: 16, fontWeight: '500', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBadge: { backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { color: '#38bdf8', fontSize: 12, fontWeight: 'bold' },
  swipeHint: { color: '#64748b', fontSize: 12 },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 40 }
});

import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

type Producto = { id: string; nombre: string; cantidad: string };
type ProductoSQLite = { id: number; nombre: string; cantidad: number };

const STORAGE_KEY = 'productos';
const dbPromise = SQLite.openDatabaseAsync('productos.db');

export default function Index() {
  // ASYNCSTORAGE
  const [productos, setProductos] = useState<Producto[]>([]);
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // SQLITE
  const [productosSQLite, setProductosSQLite] = useState<ProductoSQLite[]>([]);
  const [nombreSQLite, setNombreSQLite] = useState('');
  const [cantidadSQLite, setCantidadSQLite] = useState('');
  const [editandoSQLiteId, setEditandoSQLiteId] = useState<number | null>(null);

  useEffect(() => {
    cargarProductos();
    inicializarSQLite();
  }, []);

  // ==================== ASYNCSTORAGE ====================

  const cargarProductos = async () => {
    try {
      const datos = await AsyncStorage.getItem(STORAGE_KEY);
      if (datos) setProductos(JSON.parse(datos));
    } catch (error) {
      console.log('Error al cargar productos:', error);
    }
  };

  const guardarProductos = async (lista: Producto[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
      setProductos(lista);
    } catch (error) {
      console.log('Error al guardar productos:', error);
    }
  };

  const agregarProducto = async () => {
    if (!nombre.trim() || !cantidad.trim()) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    const nuevo: Producto = {
      id: Date.now().toString(),
      nombre: nombre.trim(),
      cantidad: cantidad.trim()
    };

    await guardarProductos([...productos, nuevo]);
    setNombre('');
    setCantidad('');
  };

  const iniciarEdicion = (producto: Producto) => {
    setEditandoId(producto.id);
    setNombre(producto.nombre);
    setCantidad(producto.cantidad);
  };

  const actualizarProducto = async () => {
    if (!editandoId) return;

    if (!nombre.trim() || !cantidad.trim()) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    const lista = productos.map(producto =>
      producto.id === editandoId
        ? { ...producto, nombre: nombre.trim(), cantidad: cantidad.trim() }
        : producto
    );

    await guardarProductos(lista);
    setNombre('');
    setCantidad('');
    setEditandoId(null);
  };

  const eliminarProducto = async (id: string) => {
    await guardarProductos(productos.filter(producto => producto.id !== id));
  };

  // ==================== SQLITE ====================

  const inicializarSQLite = async () => {
    try {
      const db = await dbPromise;

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS productos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          cantidad INTEGER NOT NULL
        );
      `);

      await cargarProductosSQLite();
    } catch (error) {
      console.log('Error inicializando SQLite:', error);
    }
  };

  const cargarProductosSQLite = async () => {
    try {
      const db = await dbPromise;

      const resultados = await db.getAllAsync<ProductoSQLite>(
        'SELECT * FROM productos ORDER BY id DESC'
      );

      setProductosSQLite(resultados);
    } catch (error) {
      console.log('Error cargando SQLite:', error);
    }
  };

  const agregarProductoSQLite = async () => {
    if (!nombreSQLite.trim() || !cantidadSQLite.trim()) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    const cantidadNumero = Number(cantidadSQLite);

    if (isNaN(cantidadNumero)) {
      Alert.alert('Error', 'La cantidad debe ser un número');
      return;
    }

    try {
      const db = await dbPromise;

      await db.runAsync(
        'INSERT INTO productos (nombre, cantidad) VALUES (?, ?)',
        nombreSQLite.trim(),
        cantidadNumero
      );

      setNombreSQLite('');
      setCantidadSQLite('');
      await cargarProductosSQLite();
    } catch (error) {
      console.log('Error agregando producto SQLite:', error);
    }
  };

  const iniciarEdicionSQLite = (producto: ProductoSQLite) => {
    setEditandoSQLiteId(producto.id);
    setNombreSQLite(producto.nombre);
    setCantidadSQLite(producto.cantidad.toString());
  };

  const actualizarProductoSQLite = async () => {
    if (editandoSQLiteId === null) return;

    if (!nombreSQLite.trim() || !cantidadSQLite.trim()) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    const cantidadNumero = Number(cantidadSQLite);

    if (isNaN(cantidadNumero)) {
      Alert.alert('Error', 'La cantidad debe ser un número');
      return;
    }

    try {
      const db = await dbPromise;

      await db.runAsync(
        'UPDATE productos SET nombre = ?, cantidad = ? WHERE id = ?',
        nombreSQLite.trim(),
        cantidadNumero,
        editandoSQLiteId
      );

      setNombreSQLite('');
      setCantidadSQLite('');
      setEditandoSQLiteId(null);
      await cargarProductosSQLite();
    } catch (error) {
      console.log('Error actualizando SQLite:', error);
    }
  };

  const eliminarProductoSQLite = async (id: number) => {
    try {
      const db = await dbPromise;

      await db.runAsync(
        'DELETE FROM productos WHERE id = ?',
        id
      );

      await cargarProductosSQLite();
    } catch (error) {
      console.log('Error eliminando SQLite:', error);
    }
  };

  // ==================== INTERFAZ ====================

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>CRUD Productos</Text>

      {/* ASYNCSTORAGE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💾 CRUD con AsyncStorage</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre del producto"
          value={nombre}
          onChangeText={setNombre}
        />

        <TextInput
          style={styles.input}
          placeholder="Cantidad"
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={editandoId ? actualizarProducto : agregarProducto}
        >
          <Text style={styles.buttonText}>
            {editandoId ? 'Actualizar' : 'Agregar'}
          </Text>
        </TouchableOpacity>

        {productos.map(producto => (
          <View key={producto.id} style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.productName}>{producto.nombre}</Text>
              <Text style={styles.productQuantity}>
                Cantidad: {producto.cantidad}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => iniciarEdicion(producto)}
              >
                <Text style={styles.buttonText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => eliminarProducto(producto.id)}
              >
                <Text style={styles.buttonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* SQLITE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗄️ CRUD con SQLite</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre del producto"
          value={nombreSQLite}
          onChangeText={setNombreSQLite}
        />

        <TextInput
          style={styles.input}
          placeholder="Cantidad"
          value={cantidadSQLite}
          onChangeText={setCantidadSQLite}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={
            editandoSQLiteId !== null
              ? actualizarProductoSQLite
              : agregarProductoSQLite
          }
        >
          <Text style={styles.buttonText}>
            {editandoSQLiteId !== null ? 'Actualizar' : 'Agregar'}
          </Text>
        </TouchableOpacity>

        {productosSQLite.map(producto => (
          <View key={producto.id} style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.productName}>{producto.nombre}</Text>
              <Text style={styles.productQuantity}>
                Cantidad: {producto.cantidad}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => iniciarEdicionSQLite(producto)}
              >
                <Text style={styles.buttonText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => eliminarProductoSQLite(producto.id)}
              >
                <Text style={styles.buttonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ======================================================
// ESTILOS
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },

  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 50,
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
  },

  section: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    fontSize: 16,
  },

  button: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },

  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#dddddd',
  },

  cardInfo: {
    marginBottom: 10,
  },

  productName: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  productQuantity: {
    fontSize: 15,
    color: '#555555',
    marginTop: 4,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
  },

  editButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },

  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
});
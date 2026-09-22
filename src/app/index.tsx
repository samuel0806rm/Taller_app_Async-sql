import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

type Producto = {
  id: string;
  nombre: string;
  cantidad: string;
};

// Dirección de nuestro servidor Express
const API_URL = 'http://localhost:3000/productos';

export default function Index() {

  // ========================================
  // ESTADOS ASYNCSTORAGE
  // ========================================

  const [nombreAsync, setNombreAsync] = useState('');
  const [cantidadAsync, setCantidadAsync] = useState('');

  const [productosAsync, setProductosAsync] =
    useState<Producto[]>([]);

  const [editandoAsync, setEditandoAsync] =
    useState<string | null>(null);


  // ========================================
  // ESTADOS MYSQL
  // ========================================

  const [nombreSQL, setNombreSQL] = useState('');
  const [cantidadSQL, setCantidadSQL] = useState('');

  const [productosSQL, setProductosSQL] =
    useState<Producto[]>([]);

  const [editandoSQL, setEditandoSQL] =
    useState<string | null>(null);


  // ========================================
  // CARGAR AL INICIAR
  // ========================================

  useEffect(() => {

    cargarProductosAsync();

    cargarProductosSQL();

  }, []);


  // ========================================
  // CRUD ASYNCSTORAGE
  // ========================================

  // READ
  const cargarProductosAsync = async () => {

    try {

      const datos =
        await AsyncStorage.getItem('productos');

      if (datos !== null) {

        setProductosAsync(
          JSON.parse(datos)
        );

      }

    } catch (error) {

      console.error(
        'Error al cargar AsyncStorage:',
        error
      );

    }
  };


  // CREATE / UPDATE
  const guardarProductoAsync = async () => {

    if (
      !nombreAsync.trim() ||
      !cantidadAsync.trim()
    ) {

      Alert.alert(
        'Error',
        'Completa todos los campos'
      );

      return;
    }


    let nuevosProductos: Producto[];


    // UPDATE
    if (editandoAsync !== null) {

      nuevosProductos =
        productosAsync.map(
          (producto) =>

            producto.id === editandoAsync
              ? {
                  ...producto,
                  nombre:
                    nombreAsync.trim(),
                  cantidad:
                    cantidadAsync.trim(),
                }
              : producto
        );

    }

    // CREATE
    else {

      const nuevoProducto: Producto = {

        id: Date.now().toString(),

        nombre:
          nombreAsync.trim(),

        cantidad:
          cantidadAsync.trim(),

      };


      nuevosProductos = [

        ...productosAsync,

        nuevoProducto,

      ];

    }


    try {

      await AsyncStorage.setItem(

        'productos',

        JSON.stringify(
          nuevosProductos
        )

      );


      setProductosAsync(
        nuevosProductos
      );


      setNombreAsync('');

      setCantidadAsync('');

      setEditandoAsync(null);

    } catch (error) {

      console.error(
        'Error al guardar AsyncStorage:',
        error
      );

    }

  };


  // UPDATE - preparar
  const editarProductoAsync = (
    producto: Producto
  ) => {

    setNombreAsync(
      producto.nombre
    );

    setCantidadAsync(
      producto.cantidad
    );

    setEditandoAsync(
      producto.id
    );

  };


  // DELETE
  const eliminarProductoAsync = async (
    id: string
  ) => {

    const nuevosProductos =
      productosAsync.filter(
        (producto) =>
          producto.id !== id
      );


    try {

      await AsyncStorage.setItem(

        'productos',

        JSON.stringify(
          nuevosProductos
        )

      );


      setProductosAsync(
        nuevosProductos
      );

    } catch (error) {

      console.error(
        'Error al eliminar AsyncStorage:',
        error
      );

    }

  };


  // ========================================
  // CRUD MYSQL
  // ========================================

  // READ
  const cargarProductosSQL = async () => {

    try {

      const respuesta =
        await fetch(API_URL);


      if (!respuesta.ok) {

        throw new Error(
          'Error al obtener productos'
        );

      }


      const datos =
        await respuesta.json();


      const productosConvertidos =
        datos.map(
          (producto: any) => ({

            id:
              producto.id.toString(),

            nombre:
              producto.nombre,

            cantidad:
              producto.cantidad.toString(),

          })
        );


      setProductosSQL(
        productosConvertidos
      );


    } catch (error) {

      console.error(
        'Error SQL:',
        error
      );

    }

  };


  // CREATE / UPDATE
  const guardarProductoSQL = async () => {

    if (
      !nombreSQL.trim() ||
      !cantidadSQL.trim()
    ) {

      Alert.alert(
        'Error',
        'Completa todos los campos'
      );

      return;
    }


    try {

      // UPDATE
      if (editandoSQL !== null) {

        const respuesta =
          await fetch(
            `${API_URL}/${editandoSQL}`,
            {

              method: 'PUT',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({

                nombre:
                  nombreSQL.trim(),

                cantidad:
                  Number(cantidadSQL),

              }),

            }
          );


        if (!respuesta.ok) {

          throw new Error(
            'No se pudo actualizar'
          );

        }


        Alert.alert(
          'Éxito',
          'Producto actualizado en MySQL'
        );

      }

      // CREATE
      else {

        const respuesta =
          await fetch(
            API_URL,
            {

              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({

                nombre:
                  nombreSQL.trim(),

                cantidad:
                  Number(cantidadSQL),

              }),

            }
          );


        if (!respuesta.ok) {

          throw new Error(
            'No se pudo crear'
          );

        }


        Alert.alert(
          'Éxito',
          'Producto guardado en MySQL'
        );

      }


      setNombreSQL('');

      setCantidadSQL('');

      setEditandoSQL(null);


      // Volver a consultar MySQL
      cargarProductosSQL();


    } catch (error) {

      console.error(
        'Error SQL:',
        error
      );


      Alert.alert(

        'Error',

        'No se pudo conectar con MySQL'

      );

    }

  };


  // UPDATE - preparar
  const editarProductoSQL = (
    producto: Producto
  ) => {

    setNombreSQL(
      producto.nombre
    );

    setCantidadSQL(
      producto.cantidad
    );

    setEditandoSQL(
      producto.id
    );

  };


  // DELETE
  const eliminarProductoSQL = async (
    id: string
  ) => {

    try {

      const respuesta =
        await fetch(
          `${API_URL}/${id}`,
          {
            method: 'DELETE',
          }
        );


      if (!respuesta.ok) {

        throw new Error(
          'No se pudo eliminar'
        );

      }


      Alert.alert(
        'Éxito',
        'Producto eliminado de MySQL'
      );


      cargarProductosSQL();


    } catch (error) {

      console.error(
        'Error SQL:',
        error
      );


      Alert.alert(
        'Error',
        'No se pudo eliminar'
      );

    }

  };


  // ========================================
  // INTERFAZ
  // ========================================

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >

      <Text style={styles.title}>
        CRUD de Productos
      </Text>


      {/* ================================= */}
      {/* ASYNCSTORAGE */}
      {/* ================================= */}

      <View style={styles.section}>

        <Text style={styles.sectionTitle}>
          💾 AsyncStorage
        </Text>


        <Text style={styles.description}>
          Almacenamiento local
        </Text>


        <TextInput
          style={styles.input}
          placeholder="Nombre del producto"
          value={nombreAsync}
          onChangeText={
            setNombreAsync
          }
        />


        <TextInput
          style={styles.input}
          placeholder="Cantidad"
          value={cantidadAsync}
          onChangeText={
            setCantidadAsync
          }
          keyboardType="numeric"
        />


        <TouchableOpacity
          style={styles.button}
          onPress={
            guardarProductoAsync
          }
        >

          <Text style={styles.buttonText}>

            {editandoAsync !== null
              ? 'Actualizar'
              : 'Guardar'}

          </Text>

        </TouchableOpacity>


        <Text style={styles.subtitle}>
          Productos locales
        </Text>


        <FlatList
          data={productosAsync}
          scrollEnabled={false}
          keyExtractor={(item) =>
            item.id
          }

          renderItem={({ item }) => (

            <View style={styles.product}>

              <View>

                <Text
                  style={
                    styles.productName
                  }
                >
                  {item.nombre}
                </Text>

                <Text>
                  Cantidad: {item.cantidad}
                </Text>

              </View>


              <View style={styles.actions}>

                <TouchableOpacity
                  onPress={() =>
                    editarProductoAsync(
                      item
                    )
                  }
                >

                  <Text style={styles.edit}>
                    Editar
                  </Text>

                </TouchableOpacity>


                <TouchableOpacity
                  onPress={() =>
                    eliminarProductoAsync(
                      item.id
                    )
                  }
                >

                  <Text style={styles.delete}>
                    Eliminar
                  </Text>

                </TouchableOpacity>

              </View>

            </View>

          )}

        />

      </View>


      {/* ================================= */}
      {/* MYSQL */}
      {/* ================================= */}

      <View style={styles.section}>

        <Text style={styles.sectionTitle}>
          🗄️ MySQL
        </Text>


        <Text style={styles.description}>
          Almacenamiento mediante Express
        </Text>


        <TextInput
          style={styles.input}
          placeholder="Nombre del producto"
          value={nombreSQL}
          onChangeText={
            setNombreSQL
          }
        />


        <TextInput
          style={styles.input}
          placeholder="Cantidad"
          value={cantidadSQL}
          onChangeText={
            setCantidadSQL
          }
          keyboardType="numeric"
        />


        <TouchableOpacity
          style={styles.button}
          onPress={
            guardarProductoSQL
          }
        >

          <Text style={styles.buttonText}>

            {editandoSQL !== null
              ? 'Actualizar SQL'
              : 'Guardar en SQL'}

          </Text>

        </TouchableOpacity>


        <Text style={styles.subtitle}>
          Productos de MySQL
        </Text>


        <FlatList
          data={productosSQL}
          scrollEnabled={false}
          keyExtractor={(item) =>
            item.id
          }

          renderItem={({ item }) => (

            <View style={styles.product}>

              <View>

                <Text
                  style={
                    styles.productName
                  }
                >
                  {item.nombre}
                </Text>

                <Text>
                  Cantidad: {item.cantidad}
                </Text>

              </View>


              <View style={styles.actions}>

                <TouchableOpacity
                  onPress={() =>
                    editarProductoSQL(
                      item
                    )
                  }
                >

                  <Text style={styles.edit}>
                    Editar
                  </Text>

                </TouchableOpacity>


                <TouchableOpacity
                  onPress={() =>
                    eliminarProductoSQL(
                      item.id
                    )
                  }
                >

                  <Text style={styles.delete}>
                    Eliminar
                  </Text>

                </TouchableOpacity>

              </View>

            </View>

          )}

        />

      </View>

    </ScrollView>

  );

}


// ========================================
// ESTILOS
// ========================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingTop: 60,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
  },

  section: {
    marginBottom: 30,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  description: {
    marginBottom: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: '#999',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },

  button: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },

  product: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },

  productName: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  actions: {
    gap: 8,
  },

  edit: {
    fontWeight: 'bold',
  },

  delete: {
    fontWeight: 'bold',
  },

});
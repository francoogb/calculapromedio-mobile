import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CabeceraCuenta } from '@/components/cuenta/campos';
import { Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { useSesion } from '@/context/sesion';
import { ApiError } from '@/lib/api';
import { degradadoAvatar, iniciales } from '@/lib/avatar';
import { getUserProfile, saveUserProfile } from '@/lib/user';

const colors = Colors.dark;

/** La API guarda un solo campo `nombre`: se separa en el primer espacio para mostrar nombre y apellido. */
function separarNombre(completo: string): [string, string] {
  const limpio = completo.trim();
  const i = limpio.indexOf(' ');
  if (i < 0) return [limpio, ''];
  return [limpio.slice(0, i), limpio.slice(i + 1).trim()];
}

/**
 * Edición del perfil. Con cuenta guarda en la API (PATCH /me); sin cuenta guarda
 * el nombre en el teléfono. El correo no se puede cambiar desde la app.
 */
export default function EditarPerfilScreen() {
  const { usuario, actualizarUsuario } = useSesion();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Valores iniciales: la cuenta manda; sin cuenta, el perfil local del teléfono
  useEffect(() => {
    let activo = true;
    (async () => {
      const completo = usuario ? usuario.nombre : (await getUserProfile()).nombre;
      if (!activo) return;
      const [n, a] = separarNombre(completo);
      setNombre(n);
      setApellido(a);
    })();
    return () => {
      activo = false;
    };
  }, [usuario]);

  const nombreCompleto = [nombre.trim(), apellido.trim()].filter(Boolean).join(' ');

  async function guardar() {
    if (guardando) return;
    if (!nombre.trim()) {
      Alert.alert('Falta tu nombre', 'Escribe tu nombre para guardar los cambios.');
      return;
    }

    setGuardando(true);
    try {
      if (usuario) {
        await actualizarUsuario({ nombre: nombreCompleto });
      } else {
        await saveUserProfile({ nombre: nombreCompleto });
      }
      router.back();
    } catch (e) {
      Alert.alert(
        'No se pudo guardar',
        e instanceof ApiError ? e.message : 'Inténtalo de nuevo más tarde.'
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: '#060919' }]}>
      <StatusBar style="light" />
      <CabeceraCuenta titulo="Editar perfil" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, ContenidoCentrado]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Avatar con iniciales */}
          <View style={styles.avatarBloque}>
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={degradadoAvatar(usuario?.email ?? nombreCompleto)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}>
                <Text style={styles.avatarIniciales}>{iniciales(nombreCompleto, usuario?.email)}</Text>
              </LinearGradient>
              <Pressable
                onPress={() => Alert.alert('Cambiar foto', 'Pronto podrás subir tu foto de perfil personalizada.')}
                hitSlop={6}
                style={styles.camaraBadge}>
                <Ionicons name="camera" size={15} color="#ffffff" />
              </Pressable>
            </View>
            <Pressable
              onPress={() => Alert.alert('Cambiar foto', 'Pronto podrás subir tu foto de perfil personalizada.')}
              hitSlop={8}>
              <Text style={styles.cambiarFoto}>Cambiar foto</Text>
            </Pressable>
          </View>

          {/* Nombre y apellido */}
          <View style={styles.tarjeta}>
            <View style={styles.fila}>
              <View style={[styles.icono, { backgroundColor: 'rgba(99, 102, 241, 0.22)' }]}>
                <Ionicons name="person-outline" size={20} color="#a5b4fc" />
              </View>
              <View style={styles.filaTexto}>
                <Text style={styles.etiqueta}>NOMBRE</Text>
                <TextInput
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Tu nombre"
                  placeholderTextColor="#64748b"
                  autoCapitalize="words"
                  autoComplete="name"
                  style={styles.valor}
                />
              </View>
            </View>
            <View style={styles.divisor} />
            <View style={styles.fila}>
              <View style={[styles.icono, { backgroundColor: 'rgba(34, 211, 238, 0.14)' }]}>
                <Ionicons name="people-outline" size={20} color="#22d3ee" />
              </View>
              <View style={styles.filaTexto}>
                <Text style={styles.etiqueta}>APELLIDO</Text>
                <TextInput
                  value={apellido}
                  onChangeText={setApellido}
                  placeholder="Tu apellido"
                  placeholderTextColor="#64748b"
                  autoCapitalize="words"
                  style={styles.valor}
                />
              </View>
            </View>
          </View>

          {/* Correo: solo con cuenta, y no se puede cambiar */}
          {usuario && (
            <>
              <View style={styles.tarjeta}>
                <View style={styles.fila}>
                  <View style={[styles.icono, { backgroundColor: 'rgba(34, 211, 238, 0.14)' }]}>
                    <Ionicons name="mail-outline" size={20} color="#22d3ee" />
                  </View>
                  <View style={styles.filaTexto}>
                    <Text style={styles.etiqueta}>EMAIL</Text>
                    <Text style={styles.valorBloqueado} numberOfLines={1}>
                      {usuario.email}
                    </Text>
                  </View>
                  <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                </View>
              </View>
              <Text style={styles.nota}>Tu email es el de tu cuenta y no se puede cambiar desde la app.</Text>
            </>
          )}

          <View style={styles.acciones}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.botonCancelar, { opacity: pressed ? 0.8 : 1 }]}>
              <Text style={styles.botonCancelarTexto}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={guardar}
              disabled={guardando}
              style={({ pressed }) => [
                styles.botonGuardar,
                { opacity: guardando ? 0.6 : pressed ? 0.85 : 1 },
              ]}>
              <Text style={styles.botonGuardarTexto}>{guardando ? 'Guardando…' : 'Guardar'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  avatarBloque: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIniciales: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 1,
  },
  camaraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    borderWidth: 2,
    borderColor: '#060919',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cambiarFoto: {
    color: '#818cf8',
    fontSize: 15,
    fontWeight: '700',
  },
  tarjeta: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 14,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaTexto: {
    flex: 1,
    gap: 2,
  },
  etiqueta: {
    color: '#8b9bd1',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  valor: {
    color: '#ffffff',
    fontSize: 18,
    paddingVertical: 2,
  },
  valorBloqueado: {
    color: '#cbd5e1',
    fontSize: 17,
  },
  divisor: {
    height: 1,
    marginLeft: 58,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  nota: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    marginTop: -4,
  },
  acciones: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.three,
  },
  botonCancelar: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCancelarTexto: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  botonGuardar: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonGuardarTexto: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

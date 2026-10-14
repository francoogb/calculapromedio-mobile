import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

/** Pantalla "Resolver con foto": captura o elige una foto del ejercicio.
 *  La resolución paso a paso requiere el servicio (API) que aún no está conectado. */
export default function ResolverFotoScreen() {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;
  const { width } = useWindowDimensions();

  const [imagen, setImagen] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function capturar(desdeCamara: boolean) {
    setMensaje(null);
    try {
      const permiso = desdeCamara
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        setMensaje(
          desdeCamara
            ? 'Necesitamos tu permiso para usar la cámara.'
            : 'Necesitamos tu permiso para acceder a la galería.'
        );
        return;
      }

      const opciones: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      };

      const resultado = desdeCamara
        ? await ImagePicker.launchCameraAsync(opciones)
        : await ImagePicker.launchImageLibraryAsync(opciones);

      if (!resultado.canceled && resultado.assets.length > 0) {
        setImagen(resultado.assets[0].uri);
      }
    } catch {
      setMensaje(
        desdeCamara
          ? 'No se pudo abrir la cámara. En Expo Go la cámara no está disponible; prueba con la galería.'
          : 'No se pudo abrir la galería.'
      );
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Resolver con foto</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {!imagen ? (
          <>
            <Text style={[styles.intro, { color: colors.textMuted }]}>
              Saca una foto a un ejercicio y obtén la solución paso a paso.
            </Text>

            <Pressable
              onPress={() => capturar(true)}
              style={({ pressed }) => [styles.optionCard, { opacity: pressed ? 0.9 : 1 }]}>
              <View style={[styles.optionIcon, { backgroundColor: '#3b82f62e', borderColor: '#3b82f659' }]}>
                <Ionicons name="camera" size={26} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Tomar foto</Text>
                <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                  Usa la cámara para fotografiar el ejercicio.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            <Pressable
              onPress={() => capturar(false)}
              style={({ pressed }) => [styles.optionCard, { opacity: pressed ? 0.9 : 1 }]}>
              <View style={[styles.optionIcon, { backgroundColor: '#8b5cf62e', borderColor: '#8b5cf659' }]}>
                <Ionicons name="images" size={26} color="#8b5cf6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Elegir de la galería</Text>
                <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                  Selecciona una imagen que ya tengas.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </>
        ) : (
          <>
            <Image
              source={{ uri: imagen }}
              style={[styles.preview, { width: width - Spacing.four * 2 }]}
              contentFit="contain"
              transition={150}
            />

            <View style={[styles.resultBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons name="sparkles" size={20} color="#a78bfa" />
              <Text style={[styles.resultText, { color: colors.textMuted }]}>
                La solución paso a paso aparecerá aquí. El servicio de resolución aún no está
                conectado.
              </Text>
            </View>

            <Pressable
              onPress={() => setMensaje('El solucionador paso a paso estará disponible próximamente.')}
              style={({ pressed }) => [styles.solveBtn, { opacity: pressed ? 0.92 : 1 }]}>
              <Ionicons name="camera" size={18} color="#ffffff" />
              <Text style={styles.solveBtnText}>Resolver ejercicio</Text>
            </Pressable>

            {mensaje && (
              <Text style={[styles.mensaje, { color: colors.textSecondary }]}>{mensaje}</Text>
            )}

            <Pressable onPress={() => setImagen(null)} hitSlop={10}>
              <Text style={[styles.otraFoto, { color: '#a78bfa' }]}>Usar otra foto</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    height: 84,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
  },
  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  preview: {
    height: 360,
    borderRadius: 16,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  resultText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  solveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 14,
  },
  solveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  mensaje: {
    fontSize: 12,
    textAlign: 'center',
  },
  otraFoto: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
});

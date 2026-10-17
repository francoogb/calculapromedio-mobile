import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CabeceraCuenta } from '@/components/cuenta/campos';
import { URL_PRIVACIDAD, URL_TERMINOS } from '@/components/cuenta/enlaces-legales';
import { Colors, ContenidoCentrado, Spacing } from '@/constants/theme';

const colors = Colors.dark;

type Documento = {
  titulo: string;
  descripcion: string;
  icono: keyof typeof Ionicons.glyphMap;
  color: string;
  fondo: string;
  url: string;
};

const DOCUMENTOS: Documento[] = [
  {
    titulo: 'Política de privacidad',
    descripcion: 'Qué datos recopilamos, cómo los usamos y cómo tratamos tu cámara y tus fotos.',
    icono: 'shield-checkmark',
    color: '#8b5cf6',
    fondo: 'rgba(139, 92, 246, 0.15)',
    url: URL_PRIVACIDAD,
  },
  {
    titulo: 'Términos y condiciones',
    descripcion: 'Reglas de uso, cuentas y límites de las soluciones generadas con inteligencia artificial.',
    icono: 'document-text',
    color: '#818cf8',
    fondo: 'rgba(99, 102, 241, 0.15)',
    url: URL_TERMINOS,
  },
];

/** Políticas y términos: los textos viven en la web y se abren en el navegador del teléfono. */
export default function PoliticasScreen() {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <CabeceraCuenta titulo="Políticas y términos" />

      <ScrollView
        contentContainerStyle={[styles.scroll, ContenidoCentrado]}
        showsVerticalScrollIndicator={false}>
        {DOCUMENTOS.map((doc) => (
          <Pressable
            key={doc.titulo}
            onPress={() => WebBrowser.openBrowserAsync(doc.url)}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}>
            <View style={[styles.icono, { backgroundColor: doc.fondo }]}>
              <Ionicons name={doc.icono} size={22} color={doc.color} />
            </View>
            <View style={styles.textos}>
              <Text style={styles.titulo}>{doc.titulo}</Text>
              <Text style={styles.descripcion}>{doc.descripcion}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#64748b" />
          </Pressable>
        ))}

        <Text style={styles.nota}>Se abren en el navegador de tu teléfono.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  icono: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    gap: 3,
  },
  titulo: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  descripcion: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  nota: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
});

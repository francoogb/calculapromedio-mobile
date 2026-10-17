import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';

const colors = Colors.dark;

/** Los textos legales viven en la web; la app los abre en el navegador para no duplicarlos. */
export const URL_PRIVACIDAD = 'https://calculapromedio.cl/politica-de-privacidad';
export const URL_TERMINOS = 'https://calculapromedio.cl/terminos-y-condiciones';

const abrirPrivacidad = () => WebBrowser.openBrowserAsync(URL_PRIVACIDAD);
const abrirTerminos = () => WebBrowser.openBrowserAsync(URL_TERMINOS);

/** Aviso de aceptación al crear una cuenta (registro). */
export function AceptacionLegal() {
  return (
    <Text style={styles.aceptacion}>
      Al crear tu cuenta aceptas los{' '}
      <Text style={styles.enlace} onPress={abrirTerminos}>
        Términos y condiciones
      </Text>{' '}
      y la{' '}
      <Text style={styles.enlace} onPress={abrirPrivacidad}>
        Política de privacidad
      </Text>
      .
    </Text>
  );
}

const styles = StyleSheet.create({
  enlace: {
    color: colors.textMuted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  aceptacion: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});

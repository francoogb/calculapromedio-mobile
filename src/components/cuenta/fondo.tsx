import { StyleSheet, View } from 'react-native';

/** Círculos decorativos del fondo de las pantallas de cuenta (login y registro). No interactivos. */
export function FondoDecorativo() {
  return (
    <>
      <View pointerEvents="none" style={styles.circuloIndigo} />
      <View pointerEvents="none" style={styles.circuloTeal} />
    </>
  );
}

const styles = StyleSheet.create({
  circuloIndigo: {
    position: 'absolute',
    bottom: -140,
    left: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(79,70,229,0.16)',
  },
  circuloTeal: {
    position: 'absolute',
    bottom: -170,
    right: -150,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(20,184,166,0.16)',
  },
});

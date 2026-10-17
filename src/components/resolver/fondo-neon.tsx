import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Fondo azul oscuro con manchas suaves, como en los diseños del flujo de Resolver con foto. */
export function FondoNeon({ children, style }: Props) {
  return (
    <LinearGradient
      colors={['#070B1A', '#0a1038', '#0c1a5a']}
      locations={[0, 0.55, 1]}
      style={[styles.fondo, style]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View
          style={[
            styles.mancha,
            { left: -150, top: '20%', width: 300, height: 300, backgroundColor: 'rgba(30,58,200,0.14)' },
          ]}
        />
        <View
          style={[
            styles.mancha,
            { right: -190, top: '38%', width: 380, height: 380, backgroundColor: 'rgba(37,99,235,0.12)' },
          ]}
        />
        <View
          style={[
            styles.mancha,
            { left: -130, bottom: -170, width: 420, height: 300, backgroundColor: 'rgba(37,99,235,0.2)' },
          ]}
        />
        <View
          style={[
            styles.mancha,
            { right: -150, bottom: -140, width: 380, height: 280, backgroundColor: 'rgba(79,70,229,0.22)' },
          ]}
        />
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
  },
  mancha: {
    position: 'absolute',
    borderRadius: 400,
  },
});

import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, router, ThemeProvider } from 'expo-router';
import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors, MaxContentWidth } from '@/constants/theme';
import { SesionProvider } from '@/context/sesion';

SplashScreen.preventAutoHideAsync();

/** Botón central flotante de la tab bar: abre "Resolver con foto". */
function CameraFabButton({ onPress }: { onPress?: (e: any) => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Resolver con foto"
      style={styles.fabSlot}>
      <LinearGradient
        colors={['#4f46e5', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fab}>
        <Ionicons name="camera" size={26} color="#ffffff" />
      </LinearGradient>
    </Pressable>
  );
}

function AppTabs() {
  const colors = Colors.dark;
  const insets = useSafeAreaInsets();

  const contentHeight = 60;
  const tabBarHeight = contentHeight + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#a78bfa',
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          alignSelf: 'center',
          width: '100%',
          maxWidth: MaxContentWidth,
          marginHorizontal: 'auto',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calculadoras"
        listeners={() => ({
          tabPress: (e) => {
            // El tab siempre lleva al listado completo, no a la última calculadora abierta
            e.preventDefault();
            router.navigate('/calculadoras');
          },
        })}
        options={{
          title: 'Calculadoras',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="resolver-foto"
        options={{
          title: '',
          tabBarButton: (props) => <CameraFabButton {...props} />,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
      {/* Pantallas de cuenta (login, registro): stack propio sin tab bar ni botón en la barra */}
      <Tabs.Screen
        name="(auth)"
        options={{
          headerShown: false,
          // href null: no aparece como sexto tab; display none: se oculta la barra al estar ahí
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      {/* Centro de notificaciones: se abre desde la campana, no es tab */}
      <Tabs.Screen
        name="notificaciones"
        options={{
          headerShown: false,
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginTop: -12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={DarkTheme}>
        <SesionProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
        </SesionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, ContenidoCentrado, MaxContentWidth, Spacing } from '@/constants/theme';
import { CampanaNotificaciones } from '@/components/notificaciones/campana';
import { useSesion } from '@/context/sesion';
import { ApiError } from '@/lib/api';
import { getFavoritos, getHistorial } from '@/lib/storage';
import { degradadoAvatar, iniciales } from '@/lib/avatar';
import {
  getDiasDeUso,
  getEjerciciosResueltosCount,
  getUserProfile,
  type UserProfile,
} from '@/lib/user';
const colors = Colors.dark;

const URL_CONTACTO = 'https://calculapromedio.cl/contacto';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const { usuario, cerrarSesion, eliminarCuenta } = useSesion();

  const [perfil, setPerfil] = useState<UserProfile>({
    nombre: 'Estudiante',
    email: '',
    avatarUrl: null,
    plan: 'gratis',
    fechaRegistro: new Date().toISOString(),
  });

  const [favoritosCount, setFavoritosCount] = useState(5);
  const [historialCount, setHistorialCount] = useState(12);
  const [ejerciciosCount, setEjerciciosCount] = useState(8);
  const [diasUso, setDiasUso] = useState(23);

  const cargarDatos = useCallback(async () => {
    const p = await getUserProfile();
    setPerfil(p);

    const favs = await getFavoritos();
    setFavoritosCount(favs.length > 0 ? favs.length : 5);

    const hist = await getHistorial();
    setHistorialCount(hist.length > 0 ? hist.length : 12);

    const ej = await getEjerciciosResueltosCount();
    setEjerciciosCount(ej);

    const d = await getDiasDeUso();
    setDiasUso(d);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cargarDatos])
  );

  const confirmarCerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar tu sesión en este dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await cerrarSesion();
            Alert.alert('Sesión cerrada', 'Has cerrado sesión con éxito.');
          },
        },
      ]
    );
  };

  /** Eliminar la cuenta es irreversible: se borra en el servidor (requisito de Google Play). */
  const confirmarEliminarCuenta = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción es definitiva: se eliminará tu cuenta de CalculaPromedio (web y app) y no podrás recuperarla.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar mi cuenta',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarCuenta();
              router.replace('/');
              Alert.alert('Cuenta eliminada', 'Tu cuenta fue eliminada con éxito.');
            } catch (e) {
              Alert.alert(
                'No se pudo eliminar',
                e instanceof ApiError ? e.message : 'Revisa tu conexión e inténtalo de nuevo.'
              );
            }
          },
        },
      ]
    );
  };

  // Datos mostrados: la sesión manda si existe; si no, el perfil local de invitado
  const nombreMostrado = usuario?.nombre ?? perfil.nombre;
  const emailMostrado = usuario?.email ?? perfil.email;
  const textoRacha = usuario
    ? usuario.racha > 0
      ? `Racha de ${usuario.racha} ${usuario.racha === 1 ? 'día' : 'días'}`
      : 'Empieza tu racha'
    : 'Invitado';

  /** Abre el menú de compartir del teléfono con un mensaje para invitar a un compañero. */
  const compartirApp = async () => {
    try {
      await Share.share({
        message:
          'Calcula tu promedio, tu NEM y tu puntaje PAES con CalculaPromedio: https://calculapromedio.cl',
      });
    } catch {
      // El usuario cerró el menú o el teléfono no pudo abrirlo: no hay nada que avisar
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#060919' }]}>
      <StatusBar style="light" />

      {/* TOP BAR: Logo + CalculaPromedio + Settings */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}>
        <View style={styles.topBarContenido}>
          <View style={styles.brandGroup}>
            <Image
              source={require('../../assets/images/icon1.png')}
              style={styles.logoMark}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>CalculaPromedio</Text>
          </View>

          <CampanaNotificaciones />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, ContenidoCentrado, { paddingBottom: Spacing.five }]}
        showsVerticalScrollIndicator={false}>
        {/* HERO CARD DE PERFIL */}
        <LinearGradient
          colors={['#101a45', '#0f1435', '#090d24']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}>
          <View style={styles.heroGlowEffect} />

          <View style={styles.heroContentRow}>
            {/* Avatar con botón de cámara */}
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={degradadoAvatar(usuario?.email ?? usuario?.nombre)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarCircle}>
                <Text style={styles.avatarIniciales}>{iniciales(usuario?.nombre, usuario?.email)}</Text>
              </LinearGradient>
              <Pressable
                onPress={() => Alert.alert('Cambiar foto', 'Pronto podrás subir tu foto de perfil personalizada.')}
                hitSlop={6}
                style={styles.cameraBadge}>
                <Ionicons name="camera" size={13} color="#ffffff" />
              </Pressable>
            </View>

            {/* Datos de usuario */}
            <View style={styles.userInfoCol}>
              <Pressable
                onPress={() => router.push('/editar-perfil')}
                style={styles.nameRow}>
                <Text style={styles.userName}>{nombreMostrado}</Text>
                <Ionicons name="pencil" size={14} color="#94a3b8" />
              </Pressable>

              {emailMostrado ? <Text style={styles.userEmail}>{emailMostrado}</Text> : null}

              {/* Insignia de racha (o "Invitado" sin cuenta) */}
              <View style={styles.rachaBadge}>
                <Ionicons name={usuario ? 'flame' : 'person-outline'} size={12} color="#fb923c" />
                <Text style={styles.rachaBadgeTexto}>{textoRacha}</Text>
              </View>
            </View>

            {/* Birrete 3D decorativo a la derecha */}
            <View style={styles.capDecorWrap} pointerEvents="none">
              <View style={styles.capGlow} />
              <Ionicons name="school" size={54} color="#6366f1" style={{ opacity: 0.85 }} />
            </View>
          </View>
        </LinearGradient>

        {/* 4 STATS CARDS EN GRILLA HORIZONTAL */}
        <View style={styles.statsRow}>
          {/* Card 1: Calculadoras utilizadas */}
          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
              <Ionicons name="calculator" size={18} color="#ec4899" />
            </View>
            <Text style={styles.statNumber}>{historialCount}</Text>
            <Text style={styles.statDesc}>Calculadoras{'\n'}utilizadas</Text>
          </View>

          {/* Card 2: Ejercicios resueltos */}
          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Ionicons name="camera" size={18} color="#06b6d4" />
            </View>
            <Text style={styles.statNumber}>{ejerciciosCount}</Text>
            <Text style={styles.statDesc}>Ejercicios{'\n'}resueltos</Text>
          </View>

          {/* Card 3: Favoritos guardados */}
          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
              <Ionicons name="heart" size={18} color="#f43f5e" />
            </View>
            <Text style={styles.statNumber}>{favoritosCount}</Text>
            <Text style={styles.statDesc}>Favoritos{'\n'}guardados</Text>
          </View>

          {/* Card 4: Días de uso */}
          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="bar-chart" size={18} color="#10b981" />
            </View>
            <Text style={styles.statNumber}>{diasUso}</Text>
            <Text style={styles.statDesc}>Días de{'\n'}uso</Text>
          </View>
        </View>

        {/* TARJETA: INVITAR A UN COMPAÑERO */}
        <LinearGradient
          colors={['#171c3d', '#111634']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compartirCard}>
          <View style={styles.compartirIcono}>
            <Ionicons name="share-social" size={24} color="#818cf8" />
          </View>

          <View style={styles.compartirTexto}>
            <Text style={styles.compartirTag}>COMPARTE</Text>
            <Text style={styles.compartirTitulo}>Invita a un compañero</Text>
            <Text style={styles.compartirSub}>Cuéntale a un amigo que usa CalculaPromedio.</Text>
          </View>

          <Pressable
            onPress={compartirApp}
            style={({ pressed }) => [
              styles.compartirBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}>
            <Text style={styles.compartirBtnTexto}>Compartir</Text>
            <Ionicons name="chevron-forward" size={13} color="#ffffff" />
          </Pressable>
        </LinearGradient>

        {/* SECCIÓN: MI CUENTA */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionHeaderTitle}>Mi cuenta</Text>

          <View style={styles.menuCard}>
            {/* 1. Mis favoritos */}
            <Pressable
              onPress={() => router.push('/favoritos')}
              style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.75 : 1 }]}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                <Ionicons name="heart" size={20} color="#f43f5e" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Mis favoritos</Text>
                <Text style={styles.menuDesc}>Ver calculadoras y ejercicios guardados</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </Pressable>

            {/* 2. Historial */}
            <Pressable
              onPress={() => router.push('/favoritos')}
              style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.75 : 1 }]}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                <Ionicons name="time" size={20} color="#818cf8" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Historial</Text>
                <Text style={styles.menuDesc}>Ver mis últimos cálculos y ejercicios</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </Pressable>

            {/* 3. Configuración */}
            <Pressable
              onPress={() => Alert.alert('Configuración', 'Opciones de tema, notificaciones y recordatorios diarios.')}
              style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.75 : 1 }]}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                <Ionicons name="settings" size={20} color="#06b6d4" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Configuración</Text>
                <Text style={styles.menuDesc}>Notificaciones, tema y más</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </Pressable>

            {/* 4. Ayuda y soporte */}
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync(URL_CONTACTO)}
              style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.75 : 1 }]}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(20, 184, 166, 0.15)' }]}>
                <Ionicons name="help-circle" size={20} color="#14b8a6" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Ayuda y soporte</Text>
                <Text style={styles.menuDesc}>Preguntas frecuentes y contacto</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </Pressable>
          </View>

          {/* Un solo botón de cuenta: cerrar sesión si hay sesión, crear cuenta si no */}
          {usuario ? (
            <>
              <Pressable
                onPress={confirmarCerrarSesion}
                style={({ pressed }) => [
                  styles.logoutCard,
                  { opacity: pressed ? 0.8 : 1 },
                ]}>
                <View style={styles.loginIconBoxCrear}>
                  <Ionicons name="log-out" size={20} color="#a78bfa" />
                </View>
                <Text style={styles.loginTextCrear}>Cerrar sesión</Text>
              </Pressable>

              {/* Botón Eliminar Cuenta */}
              <Pressable
                onPress={confirmarEliminarCuenta}
                style={({ pressed }) => [
                  styles.logoutCard,
                  { opacity: pressed ? 0.8 : 1 },
                ]}>
                <View style={styles.logoutIconBox}>
                  <Ionicons name="trash" size={20} color="#ef4444" />
                </View>
                <Text style={styles.logoutText}>Eliminar mi cuenta</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => router.push('/registro')}
              style={({ pressed }) => [
                styles.logoutCard,
                { opacity: pressed ? 0.8 : 1 },
              ]}>
              <View style={styles.loginIconBoxCrear}>
                <Ionicons name="person-add" size={20} color="#a78bfa" />
              </View>
              <Text style={styles.loginTextCrear}>Crear cuenta gratis</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingBottom: Spacing.two,
  },
  topBarContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  heroCard: {
    borderRadius: 22,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlowEffect: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#090d24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIniciales: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  userInfoCol: {
    flex: 1,
    marginLeft: 14,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  userEmail: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 4,
  },
  rachaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(251, 146, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.3)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  rachaBadgeTexto: {
    color: '#fb923c',
    fontSize: 11,
    fontWeight: '700',
  },
  capDecorWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  capGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 104,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  statDesc: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },
  compartirCard: {
    borderRadius: 18,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  compartirIcono: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compartirTexto: {
    flex: 1,
    gap: 2,
  },
  compartirTag: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  compartirTitulo: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  compartirSub: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 14,
  },
  compartirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#4f46e5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compartirBtnTexto: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  accountSection: {
    gap: 10,
    marginTop: 4,
  },
  sectionHeaderTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 2,
  },
  menuCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  menuDesc: {
    color: '#64748b',
    fontSize: 11,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    marginTop: 4,
  },
  logoutIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  loginIconBoxCrear: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginTextCrear: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '700',
  },
});

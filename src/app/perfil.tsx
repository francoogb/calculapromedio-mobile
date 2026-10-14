import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, ContenidoCentrado, MaxContentWidth, Spacing } from '@/constants/theme';
import { getFavoritos, getHistorial } from '@/lib/storage';
import {
  getDiasDeUso,
  getEjerciciosResueltosCount,
  getUserProfile,
  saveUserProfile,
  type UserProfile,
} from '@/lib/user';

const colors = Colors.dark;

const URL_CONTACTO = 'https://calculapromedio.cl/contacto';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();

  const [perfil, setPerfil] = useState<UserProfile>({
    nombre: 'Estudiante',
    email: 'estudiante@email.cl',
    avatarUrl: null,
    plan: 'gratis',
    fechaRegistro: new Date().toISOString(),
  });

  const [favoritosCount, setFavoritosCount] = useState(5);
  const [historialCount, setHistorialCount] = useState(12);
  const [ejerciciosCount, setEjerciciosCount] = useState(8);
  const [diasUso, setDiasUso] = useState(23);

  // Modales
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [modalPlanesVisible, setModalPlanesVisible] = useState(false);

  const cargarDatos = useCallback(async () => {
    const p = await getUserProfile();
    setPerfil(p);
    setNuevoNombre(p.nombre);

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

  const guardarNombre = async () => {
    if (!nuevoNombre.trim()) return;
    const actualizado = await saveUserProfile({ nombre: nuevoNombre.trim() });
    setPerfil(actualizado);
    setModalEditarVisible(false);
  };

  const confirmarCerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar tu sesión en este dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Sesión cerrada', 'Has cerrado sesión con éxito.');
          },
        },
      ]
    );
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

          <Pressable
            onPress={() => setModalPlanesVisible(true)}
            hitSlop={8}
            style={({ pressed }) => [styles.settingsBtn, { opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="settings-outline" size={22} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, ContenidoCentrado, { paddingBottom: 100 }]}
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
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={42} color="#c7d2fe" />
              </View>
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
                onPress={() => setModalEditarVisible(true)}
                style={styles.nameRow}>
                <Text style={styles.userName}>{perfil.nombre}</Text>
                <Ionicons name="pencil" size={14} color="#94a3b8" />
              </Pressable>

              <Text style={styles.userEmail}>{perfil.email}</Text>

              {/* Badge de Plan */}
              <View style={styles.planBadge}>
                <Ionicons name="sparkles" size={12} color="#facc15" />
                <Text style={styles.planBadgeText}>
                  {perfil.plan === 'premium' ? 'Plan Premium' : 'Plan Gratis'}
                </Text>
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

        {/* TARJETA DE PLAN ACTUAL */}
        <LinearGradient
          colors={['#171c3d', '#111634']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planCard}>
          <View style={styles.planIconSquare}>
            <Ionicons name="trophy" size={26} color="#fbbf24" />
          </View>

          <View style={styles.planTextCol}>
            <Text style={styles.planTag}>TU PLAN ACTUAL</Text>
            <Text style={styles.planTitle}>
              {perfil.plan === 'premium' ? 'Plan Premium Activo' : 'Plan Gratis'}
            </Text>
            <Text style={styles.planSub}>
              {perfil.plan === 'premium'
                ? 'Acceso total e ilimitado a todas las herramientas.'
                : 'Accede a funciones básicas de la app.'}
            </Text>
          </View>

          <Pressable
            onPress={() => setModalPlanesVisible(true)}
            style={({ pressed }) => [
              styles.verPlanesBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}>
            <Text style={styles.verPlanesText}>Ver planes</Text>
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

          {/* Botón Cerrar Sesión */}
          <Pressable
            onPress={confirmarCerrarSesion}
            style={({ pressed }) => [
              styles.logoutCard,
              { opacity: pressed ? 0.8 : 1 },
            ]}>
            <View style={styles.logoutIconBox}>
              <Ionicons name="log-out" size={20} color="#ef4444" />
            </View>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* MODAL: EDITAR NOMBRE */}
      <Modal visible={modalEditarVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar nombre</Text>
            <Text style={styles.modalSub}>¿Cómo quieres que te llamemos?</Text>

            <TextInput
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              placeholder="Tu nombre"
              placeholderTextColor="#64748b"
              style={styles.modalInput}
              autoFocus
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setModalEditarVisible(false)}
                style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={guardarNombre} style={styles.modalSaveBtn}>
                <Text style={styles.modalSaveText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: VER PLANES Y SUSCRIPCIÓN */}
      <Modal visible={modalPlanesVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Planes y Suscripción</Text>
              <Pressable onPress={() => setModalPlanesVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Plan Premium Card */}
              <LinearGradient
                colors={['#4338ca', '#6d28d9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumPromoCard}>
                <View style={styles.promoHeader}>
                  <Text style={styles.promoBadge}>RECOMENDADO</Text>
                  <Text style={styles.promoTitle}>Plan Premium PAES</Text>
                  <Text style={styles.promoPrice}>$3.990 <Text style={styles.promoPriceSub}>/mes</Text></Text>
                </View>

                <View style={styles.promoFeatures}>
                  <View style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#a7f3d0" />
                    <Text style={styles.featureText}>Resolución de ejercicios por foto ilimitada</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#a7f3d0" />
                    <Text style={styles.featureText}>Explicaciones paso a paso con Tutor IA</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#a7f3d0" />
                    <Text style={styles.featureText}>Banco de +240 ejercicios PAES M1 y M2</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#a7f3d0" />
                    <Text style={styles.featureText}>Simulacros y ensayos cronometrados</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => {
                    setModalPlanesVisible(false);
                    WebBrowser.openBrowserAsync('https://calculapromedio.cl/hazte-premium');
                  }}
                  style={styles.promoBtn}>
                  <Text style={styles.promoBtnText}>Hazte Premium con Flow.cl</Text>
                </Pressable>
              </LinearGradient>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  planBadgeText: {
    color: '#facc15',
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
  planCard: {
    borderRadius: 18,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  planIconSquare: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTextCol: {
    flex: 1,
    gap: 2,
  },
  planTag: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  planSub: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 14,
  },
  verPlanesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#4f46e5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  verPlanesText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    color: '#94a3b8',
    fontSize: 13,
  },
  modalInput: {
    height: 48,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#ffffff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalSaveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  premiumPromoCard: {
    borderRadius: 18,
    padding: Spacing.four,
    gap: Spacing.three,
    marginTop: 10,
  },
  promoHeader: {
    gap: 4,
  },
  promoBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  promoTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  promoPrice: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
  },
  promoPriceSub: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e0e7ff',
  },
  promoFeatures: {
    gap: 10,
    paddingVertical: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  promoBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  promoBtnText: {
    color: '#4338ca',
    fontSize: 14,
    fontWeight: '800',
  },
});

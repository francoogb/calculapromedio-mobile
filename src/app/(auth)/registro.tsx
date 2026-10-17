import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotonEnviar, BotonVolver, CampoTexto, EnlaceAlternativo, ErrorGeneral } from '@/components/cuenta/campos';
import { AceptacionLegal } from '@/components/cuenta/enlaces-legales';
import { FondoDecorativo } from '@/components/cuenta/fondo';
import { Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { useSesion } from '@/context/sesion';
import { ApiError, type ErroresValidacion } from '@/lib/api';
import { entrarAlInicio, salirDePantallasDeCuenta } from '@/lib/navegacion';
import { esCorreoValido, sugerirCorreo } from '@/lib/validacion';

const colors = Colors.dark;

export default function RegistroScreen() {
  const { crearCuenta } = useSesion();
  const insets = useSafeAreaInsets();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState<ErroresValidacion>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  /** Llama a la API con un correo ya validado. La API guarda un solo campo `nombre`. */
  async function enviarCorreo(correo: string) {
    if (cargando) return;
    setErrores({});
    setErrorGeneral(null);
    setCargando(true);
    try {
      await crearCuenta({
        nombre: `${nombre.trim()} ${apellido.trim()}`,
        email: correo,
        password,
        // La API exige confirmación; con el ojo para ver la contraseña no se pide escribirla dos veces
        password_confirmation: password,
      });
      entrarAlInicio();
    } catch (e) {
      if (e instanceof ApiError) {
        if (Object.keys(e.errores).length > 0) {
          setErrores(e.errores);
        } else {
          setErrorGeneral(e.message);
        }
      } else {
        setErrorGeneral('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  }

  async function enviar() {
    if (cargando) return;
    setErrores({});
    setErrorGeneral(null);

    const faltantes: ErroresValidacion = {};
    if (!nombre.trim()) faltantes.nombre = ['Ingresa tu nombre'];
    if (!apellido.trim()) faltantes.apellido = ['Ingresa tu apellido'];
    if (Object.keys(faltantes).length > 0) {
      setErrores(faltantes);
      return;
    }

    const correo = email.trim();
    if (!esCorreoValido(correo)) {
      const sugerencia = sugerirCorreo(correo);
      if (sugerencia) {
        // Dominio con typo probable (p. ej. gmail.comf): ofrecer la corrección
        Alert.alert('Revisa tu correo', `¿Quisiste decir ${sugerencia}?`, [
          {
            text: `Usar ${sugerencia}`,
            onPress: () => setEmail(sugerencia),
          },
          { text: 'Continuar igual', onPress: () => enviarCorreo(correo) },
        ]);
      } else {
        // Formato malo o TLD poco común sin corrección clara: advertir, pero dejar continuar
        Alert.alert(
          'Revisa tu correo',
          'La dirección de correo no parece válida (el dominio no es de uso común). ¿Está bien escrito?',
          [
            { text: 'Volver a revisar', style: 'cancel' },
            { text: 'Está bien, continuar', onPress: () => enviarCorreo(correo) },
          ]
        );
      }
      return;
    }
    await enviarCorreo(correo);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <FondoDecorativo />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, ContenidoCentrado, { paddingTop: insets.top + Spacing.three }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BotonVolver />
          <Text style={styles.titulo}>Crear una nueva cuenta</Text>
          <Text style={styles.subtitulo}>Crea tu cuenta y usa todo gratis hasta el 31 de diciembre.</Text>

          <View style={styles.formulario}>
            <CampoTexto
              label="Nombre"
              icono="person-outline"
              value={nombre}
              onChangeText={setNombre}
              placeholder="Tu nombre"
              autoComplete="name"
              autoFocus
              error={errores.nombre?.[0]}
            />
            <CampoTexto
              label="Apellido"
              icono="person-outline"
              value={apellido}
              onChangeText={setApellido}
              placeholder="Tu apellido"
              error={errores.apellido?.[0]}
            />
            <CampoTexto
              label="Correo electrónico"
              icono="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.cl"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errores.email?.[0]}
            />
            <CampoTexto
              label="Contraseña"
              icono="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              autoComplete="password"
              error={errores.password?.[0]}
              onSubmitEditing={enviar}
            />

            {errorGeneral && <ErrorGeneral mensaje={errorGeneral} />}

            <BotonEnviar label="Crear cuenta" onPress={enviar} cargando={cargando} />
            <AceptacionLegal />
          </View>

          <EnlaceAlternativo
            pregunta="¿Ya tienes una cuenta?"
            accion="Iniciar sesión"
            onPress={() => router.push('/login')}
          />

          <Pressable onPress={salirDePantallasDeCuenta} hitSlop={8} style={styles.sinCuenta}>
            <Text style={styles.sinCuentaTexto}>Continuar sin cuenta</Text>
          </Pressable>
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
  titulo: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitulo: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  formulario: {
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  sinCuenta: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  sinCuentaTexto: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});

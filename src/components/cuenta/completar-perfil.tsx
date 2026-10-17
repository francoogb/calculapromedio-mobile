import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useSesion } from '@/context/sesion';
import { ApiError } from '@/lib/api';

const colors = Colors.dark;

/** Prefijo fijo de Chile para celulares: +56 9. El usuario escribe los 8 dígitos que siguen. */
const PREFIJO_TELEFONO = '+569';
const DIGITOS_TELEFONO = 8;

/** Mismas opciones que el formulario de registro de la web. */
const OPCIONES_CONOCISTE = ['Instagram', 'TikTok', 'Mi profesor', 'Buscando en Google', 'Otro'];

/**
 * Formulario para completar los datos opcionales de la cuenta (teléfono y
 * "cómo nos conociste"), vía PATCH /me. Cada campo se oculta al completarse
 * y todo el formulario desaparece cuando no falta nada.
 * Se usa en el centro de notificaciones (campana).
 */
export function FormularioCompletarPerfil() {
  const { usuario, actualizarUsuario } = useSesion();
  const [digitos, setDigitos] = useState('');
  const [conociste, setConociste] = useState<string | null>(usuario?.como_nos_conociste ?? null);
  const [desplegableAbierto, setDesplegableAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  if (!usuario || (usuario.telefono && usuario.como_nos_conociste)) return null;

  const faltaTelefono = !usuario.telefono;
  const faltaConociste = !usuario.como_nos_conociste;

  async function guardar() {
    if (guardando) return;

    if (faltaTelefono && digitos.length > 0 && digitos.length !== DIGITOS_TELEFONO) {
      Alert.alert('Revisa tu teléfono', `Escribe los ${DIGITOS_TELEFONO} dígitos que siguen a ${PREFIJO_TELEFONO}.`);
      return;
    }

    setGuardando(true);
    try {
      await actualizarUsuario({
        telefono: faltaTelefono && digitos ? `${PREFIJO_TELEFONO}${digitos}` : null,
        como_nos_conociste: faltaConociste ? conociste : null,
      });
      Alert.alert('Listo', 'Tus datos fueron guardados.');
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
    <View style={styles.formulario}>
      {faltaTelefono && (
        <View style={styles.campoBloque}>
          <Text style={styles.label}>Teléfono celular</Text>
          <View style={styles.telefonoFila}>
            <View style={styles.prefijo}>
              <Text style={styles.prefijoTexto}>{PREFIJO_TELEFONO}</Text>
            </View>
            <TextInput
              value={digitos}
              onChangeText={(texto) => setDigitos(texto.replace(/\D/g, '').slice(0, DIGITOS_TELEFONO))}
              placeholder="12345678"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              maxLength={DIGITOS_TELEFONO}
              style={styles.campoTelefono}
            />
          </View>
          <Text style={styles.ayuda}>Solo los 8 dígitos después de {PREFIJO_TELEFONO}.</Text>
        </View>
      )}

      {faltaConociste && (
        <View style={styles.campoBloque}>
          <Text style={styles.label}>¿Cómo nos conociste?</Text>
          <Pressable
            onPress={() => setDesplegableAbierto((v) => !v)}
            style={({ pressed }) => [styles.selector, { opacity: pressed ? 0.85 : 1 }]}>
            <Text style={conociste ? styles.selectorValor : styles.selectorPlaceholder}>
              {conociste ?? 'Elige una opción'}
            </Text>
            <Ionicons
              name={desplegableAbierto ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#94a3b8"
            />
          </Pressable>

          {desplegableAbierto && (
            <View style={styles.opciones}>
              {OPCIONES_CONOCISTE.map((opcion) => {
                const activa = conociste === opcion;
                return (
                  <Pressable
                    key={opcion}
                    onPress={() => {
                      setConociste(opcion);
                      setDesplegableAbierto(false);
                    }}
                    style={({ pressed }) => [
                      styles.opcion,
                      activa && styles.opcionActiva,
                      { opacity: pressed ? 0.8 : 1 },
                    ]}>
                    <Text style={[styles.opcionTexto, activa && styles.opcionTextoActiva]}>{opcion}</Text>
                    {activa && <Ionicons name="checkmark" size={16} color="#a5b4fc" />}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      )}

      <Pressable
        onPress={guardar}
        disabled={guardando}
        style={({ pressed }) => [
          styles.guardarBtn,
          { opacity: guardando ? 0.6 : pressed ? 0.85 : 1 },
        ]}>
        {guardando ? (
          <Text style={styles.guardarBtnTexto}>Guardando…</Text>
        ) : (
          <>
            <Ionicons name="checkmark" size={18} color="#ffffff" />
            <Text style={styles.guardarBtnTexto}>Guardar datos</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  formulario: {
    gap: 14,
  },
  campoBloque: {
    gap: 6,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 2,
  },
  telefonoFila: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
  prefijo: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  prefijoTexto: {
    color: '#c4b5fd',
    fontSize: 15,
    fontWeight: '700',
  },
  campoTelefono: {
    flex: 1,
    paddingHorizontal: 14,
    color: '#ffffff',
    fontSize: 15,
    letterSpacing: 1,
  },
  ayuda: {
    color: '#64748b',
    fontSize: 12,
    marginLeft: 2,
  },
  selector: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorValor: {
    color: '#ffffff',
    fontSize: 15,
  },
  selectorPlaceholder: {
    color: '#64748b',
    fontSize: 15,
  },
  opciones: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    overflow: 'hidden',
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  opcionActiva: {
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  opcionTexto: {
    color: '#cbd5e1',
    fontSize: 15,
  },
  opcionTextoActiva: {
    color: '#ffffff',
    fontWeight: '700',
  },
  guardarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
  },
  guardarBtnTexto: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

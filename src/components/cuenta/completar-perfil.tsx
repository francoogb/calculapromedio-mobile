import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useSesion } from '@/context/sesion';
import { ApiError } from '@/lib/api';

const colors = Colors.dark;

/** Mismas opciones que el formulario de registro de la web. */
const OPCIONES_CONOCISTE = ['Instagram', 'TikTok', 'Mi profesor', 'Buscando en Google', 'Otro'];

/**
 * Formulario para completar los datos opcionales de la cuenta (teléfono y
 * "cómo nos conociste"), vía PATCH /me. Cada campo se oculta al completarse
 * y todo el formulario desaparece cuando no falta nada.
 * Se usa en el perfil y en el centro de notificaciones (campana).
 */
export function FormularioCompletarPerfil() {
  const { usuario, actualizarUsuario } = useSesion();
  const [telefono, setTelefono] = useState(usuario?.telefono ?? '');
  const [conociste, setConociste] = useState<string | null>(usuario?.como_nos_conociste ?? null);
  const [guardando, setGuardando] = useState(false);

  if (!usuario || (usuario.telefono && usuario.como_nos_conociste)) return null;

  async function guardar() {
    if (guardando) return;
    setGuardando(true);
    try {
      await actualizarUsuario({
        telefono: telefono.trim() || null,
        como_nos_conociste: conociste,
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
      {!usuario.telefono && (
        <TextInput
          value={telefono}
          onChangeText={setTelefono}
          placeholder="Teléfono"
          placeholderTextColor="#64748b"
          keyboardType="phone-pad"
          style={styles.campoPerfil}
        />
      )}

      {!usuario.como_nos_conociste && (
        <>
          <Text style={styles.labelConociste}>¿Cómo nos conociste?</Text>
          <View style={styles.chipsRow}>
            {OPCIONES_CONOCISTE.map((opcion) => {
              const activo = conociste === opcion;
              return (
                <Pressable
                  key={opcion}
                  onPress={() => setConociste(activo ? null : opcion)}
                  style={[styles.chip, activo && styles.chipActivo]}>
                  <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
                    {opcion}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
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
    gap: 10,
  },
  campoPerfil: {
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#ffffff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  labelConociste: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipActivo: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: '#6366f1',
  },
  chipTexto: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextoActivo: {
    color: '#ffffff',
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

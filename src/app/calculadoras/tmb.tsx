import React, { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Segmentado } from '@/components/calculadora/campos';
import { CamposCorporales, DATOS_EJEMPLO, DATOS_VACIOS, leerDatos } from '@/components/calculadora/datos-corporales';
import { PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { Colors } from '@/constants/theme';
import { fmtNumero } from '@/lib/matematica';
import { NIVELES_ACTIVIDAD, tmbMifflin, type NivelActividad } from '@/lib/salud';

const CALC_ID = 'tmb';
const colors = Colors.dark;

export default function TmbScreen() {
  const [datos, setDatos] = useState(DATOS_VACIOS);
  const [nivel, setNivel] = useState<NivelActividad>('1.55');
  const p = usePantallaCalculo(CALC_ID, [datos, nivel], (d: { datos: typeof datos; nivel: NivelActividad }) => { setDatos(d.datos); setNivel(d.nivel); });
  const d = leerDatos(datos);

  const calculo = useMemo(() => {
    if (!d.ok) return null;
    const tmb = tmbMifflin(d.sexo, d.peso, d.altura, d.edad);
    return { tmb, gasto: tmb * Number(nivel) };
  }, [d.ok, d.sexo, d.peso, d.altura, d.edad, nivel]);

  const detalleNivel = NIVELES_ACTIVIDAD.find((n) => n.id === nivel)!;

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setDatos(DATOS_VACIOS);
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(`${fmtNumero(calculo.tmb, 0)} kcal`, `TMB · gasto diario ${fmtNumero(calculo.gasto, 0)} kcal (${detalleNivel.texto})`, { datos, nivel })}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        La tasa metabólica basal son las calorías que tu cuerpo gasta en reposo total, solo para
        mantenerse funcionando (respirar, latir, regular la temperatura).
      </AvisoInfo>

      <Seccion
        titulo="Tus datos"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setDatos(DATOS_EJEMPLO);
              p.setCalculado(false);
            }}
          />
        }>
        <CamposCorporales datos={datos} onCambiar={setDatos} />
        <Segmentado label="Actividad física" opciones={NIVELES_ACTIVIDAD.map((n) => ({ id: n.id, texto: n.texto }))} valor={nivel} onCambiar={setNivel} />
        <Text style={[styles.ayuda, { color: colors.textMuted }]}>{detalleNivel.detalle}</Text>
      </Seccion>

      <BotonPrimario label="Calcular" icono="flame-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo="Tu metabolismo basal"
          valor={`${fmtNumero(calculo.tmb, 0)} kcal`}
          tono="info"
          badge="por día"
          descripcion={`Con actividad ${detalleNivel.texto.toLowerCase()} gastas unas ${fmtNumero(calculo.gasto, 0)} kcal al día`}
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              {
                key: 'tmb',
                label: `Mifflin-St Jeor (${d.sexo})`,
                operacion: `10·${fmtNumero(d.peso)} + 6,25·${fmtNumero(d.altura)} − 5·${fmtNumero(d.edad)} ${d.sexo === 'hombre' ? '+ 5' : '− 161'}`,
                valor: fmtNumero(calculo.tmb, 0),
              },
              { key: 'act', label: 'Factor de actividad', operacion: detalleNivel.detalle, valor: `× ${nivel.replace('.', ',')}` },
            ]}
            total={{ label: 'Gasto diario total', valor: `${fmtNumero(calculo.gasto, 0)} kcal` }}
            tonoTotal="info"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="TMB y gasto diario"
        texto="La TMB se multiplica por un factor según tu actividad física para estimar las calorías que gastas en un día normal. Comer esa cantidad mantiene el peso; menos lo baja y más lo sube."
        formula="Hombres: 10P + 6,25A − 5E + 5   ·   Mujeres: 10P + 6,25A − 5E − 161"
        tip="Es una estimación. Si quieres cambiar tu alimentación, la calculadora de Calorías y Macros te da un objetivo diario, pero lo ideal es consultar con un nutricionista."
      />
    </PantallaCalculadora>
  );
}

const styles = StyleSheet.create({
  ayuda: {
    fontSize: 12,
    marginTop: -8,
  },
});

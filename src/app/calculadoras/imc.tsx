import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CamposCorporales, DATOS_EJEMPLO, DATOS_VACIOS, leerDatos } from '@/components/calculadora/datos-corporales';
import { PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado, TONOS } from '@/components/calculadora/resultado';
import { Colors } from '@/constants/theme';
import { fmtNumero } from '@/lib/matematica';
import { categoriaImc, imc } from '@/lib/salud';

const CALC_ID = 'imc';
const colors = Colors.dark;

const TRAMOS = [
  { hasta: 18.5, texto: 'Bajo', tono: 'warning' as const },
  { hasta: 25, texto: 'Normal', tono: 'ok' as const },
  { hasta: 30, texto: 'Sobrepeso', tono: 'warning' as const },
  { hasta: 40, texto: 'Obesidad', tono: 'error' as const },
];

export default function ImcScreen() {
  const [datos, setDatos] = useState(DATOS_VACIOS);
  const p = usePantallaCalculo(CALC_ID, [datos]);
  const d = leerDatos(datos, false);

  const calculo = useMemo(() => {
    if (!d.ok) return null;
    const valor = imc(d.peso, d.altura);
    const m = d.altura / 100;
    return { valor, cat: categoriaImc(valor), min: 18.5 * m * m, max: 24.9 * m * m };
  }, [d.ok, d.peso, d.altura]);

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setDatos(DATOS_VACIOS);
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(fmtNumero(calculo.valor, 1), `${calculo.cat.texto} · ${d.peso} kg, ${d.altura} cm`)}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        El Índice de Masa Corporal relaciona peso y estatura. Es una referencia para adultos; en
        menores de 18 años se usan curvas de crecimiento por edad.
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
        <CamposCorporales datos={datos} onCambiar={setDatos} pedirSexo={false} pedirEdad={false} />
      </Seccion>

      <BotonPrimario label="Calcular IMC" icono="body-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo="Tu IMC es"
          valor={fmtNumero(calculo.valor, 1)}
          tono={calculo.cat.tono}
          badge={calculo.cat.texto}
          descripcion={`Rango de peso normal para ${d.altura} cm: ${fmtNumero(calculo.min, 1)} a ${fmtNumero(calculo.max, 1)} kg`}
          onLayout={p.onLayoutResultado}>
          <View style={styles.tramos}>
            {TRAMOS.map((t, i) => {
              const desde = i === 0 ? 0 : TRAMOS[i - 1].hasta;
              const esUltimo = i === TRAMOS.length - 1;
              const activo = calculo.valor >= desde && (calculo.valor < t.hasta || esUltimo);
              return (
                <View
                  key={t.texto}
                  style={[
                    styles.tramo,
                    { borderColor: activo ? TONOS[t.tono].borde : colors.border, backgroundColor: activo ? TONOS[t.tono].bg : 'transparent' },
                  ]}>
                  <Text style={[styles.tramoTexto, { color: activo ? TONOS[t.tono].texto : colors.textMuted }]}>{t.texto}</Text>
                  <Text style={[styles.tramoRango, { color: colors.textMuted }]}>{i === TRAMOS.length - 1 ? `≥ ${desde}` : `< ${t.hasta}`}</Text>
                </View>
              );
            })}
          </View>
          <DetalleCalculo
            filas={[
              { key: 'm', label: 'Estatura en metros', operacion: `${fmtNumero(d.altura)} ÷ 100`, valor: `${fmtNumero(d.altura / 100, 2)} m` },
              { key: 'imc', label: 'IMC = peso ÷ estatura²', operacion: `${fmtNumero(d.peso)} ÷ ${fmtNumero(d.altura / 100, 2)}²`, valor: fmtNumero(calculo.valor, 1) },
            ]}
            total={{ label: 'IMC', valor: fmtNumero(calculo.valor, 1) }}
            tonoTotal={calculo.cat.tono}
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="¿Qué mide el IMC?"
        texto="Es una estimación rápida basada solo en peso y estatura. No distingue músculo de grasa: una persona muy musculosa puede tener IMC alto estando sana. Para una evaluación real, consulta a un profesional de la salud."
        formula="IMC = peso (kg) ÷ estatura (m)²"
        tip="En la PAES este cálculo aparece como ejemplo de razón y de potencias: ojo con elevar al cuadrado la estatura en metros, no en centímetros."
      />
    </PantallaCalculadora>
  );
}

const styles = StyleSheet.create({
  tramos: {
    flexDirection: 'row',
    gap: 6,
  },
  tramo: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  tramoTexto: {
    fontSize: 11,
    fontWeight: '800',
  },
  tramoRango: {
    fontSize: 10,
  },
});

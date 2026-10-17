import React, { useMemo, useState } from 'react';

import { CampoFecha } from '@/components/calculadora/campo-fecha';
import { CampoNumero, ChipsRapidos, Segmentado } from '@/components/calculadora/campos';
import { PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { crearFecha, diasEntre, fechaATexto, fechaLarga, hoy, leerFecha, sumarDias } from '@/lib/fechas';
import { leerEntero } from '@/lib/matematica';

const CALC_ID = 'sumar-dias';

type Unidad = 'dias' | 'habiles' | 'semanas' | 'meses' | 'anios';
const NOMBRE: Record<Unidad, [string, string]> = {
  dias: ['día', 'días'],
  habiles: ['día hábil', 'días hábiles'],
  semanas: ['semana', 'semanas'],
  meses: ['mes', 'meses'],
  anios: ['año', 'años'],
};

/** Suma meses respetando fin de mes: 31-01 + 1 mes = 28/29-02 (no 3 de marzo). */
function sumarMeses(d: Date, meses: number): Date {
  const objetivo = crearFecha(d.getFullYear(), d.getMonth() + 1 + meses, 1);
  const ultimoDia = new Date(objetivo.getFullYear(), objetivo.getMonth() + 1, 0).getDate();
  return crearFecha(objetivo.getFullYear(), objetivo.getMonth() + 1, Math.min(d.getDate(), ultimoDia));
}

function sumarHabiles(d: Date, n: number): Date {
  const paso = n >= 0 ? 1 : -1;
  let restantes = Math.abs(n);
  let actual = d;
  while (restantes > 0) {
    actual = sumarDias(actual, paso);
    const dow = actual.getDay();
    if (dow !== 0 && dow !== 6) restantes--;
  }
  return actual;
}

export default function SumarDiasScreen() {
  const [base, setBase] = useState(fechaATexto(hoy()));
  const [operacion, setOperacion] = useState<'sumar' | 'restar'>('sumar');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState<Unidad>('dias');
  const p = usePantallaCalculo(CALC_ID, [base, operacion, cantidad, unidad], (d: { base: string; operacion: 'sumar' | 'restar'; cantidad: string; unidad: Unidad }) => { setBase(d.base); setOperacion(d.operacion); setCantidad(d.cantidad); setUnidad(d.unidad); });

  const d = leerFecha(base);
  const c = leerEntero(cantidad);
  const errorCant = cantidad.trim() !== '' && !(c >= 0 && c <= 36500) ? 'Entero entre 0 y 36.500' : null;

  const calculo = useMemo(() => {
    if (!d || !(c >= 0) || errorCant) return null;
    const n = operacion === 'sumar' ? c : -c;
    const resultado =
      unidad === 'dias' ? sumarDias(d, n)
      : unidad === 'habiles' ? sumarHabiles(d, n)
      : unidad === 'semanas' ? sumarDias(d, n * 7)
      : unidad === 'meses' ? sumarMeses(d, n)
      : sumarMeses(d, n * 12);
    return { resultado, corridos: diasEntre(d, resultado) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, operacion, cantidad, unidad, errorCant]);

  const etiqueta = `${c} ${NOMBRE[unidad][c === 1 ? 0 : 1]}`;

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setBase(fechaATexto(hoy()));
        setCantidad('');
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(fechaATexto(calculo.resultado), `${base} ${operacion === 'sumar' ? '+' : '−'} ${etiqueta}`, { base, operacion, cantidad, unidad })}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>Suma o resta días, semanas, meses o años a una fecha. Útil para plazos, entregas y vencimientos.</AvisoInfo>

      <Seccion
        titulo="Tu cálculo"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setBase(fechaATexto(hoy()));
              setOperacion('sumar');
              setCantidad('10');
              setUnidad('habiles');
              p.setCalculado(false);
            }}
          />
        }>
        <CampoFecha label="Fecha base" value={base} onChangeText={setBase} />
        <Segmentado
          opciones={[
            { id: 'sumar', texto: 'Sumar +' },
            { id: 'restar', texto: 'Restar −' },
          ]}
          valor={operacion}
          onCambiar={setOperacion}
        />
        <CampoNumero label="Cantidad" value={cantidad} onChangeText={setCantidad} placeholder="10" error={errorCant} maxLength={5} />
        <ChipsRapidos opciones={['7', '15', '30', '90']} valorActual={cantidad} onElegir={setCantidad} />
        <Segmentado
          label="Unidad"
          opciones={[
            { id: 'dias', texto: 'Días' },
            { id: 'habiles', texto: 'Hábiles' },
            { id: 'semanas', texto: 'Sem.' },
            { id: 'meses', texto: 'Meses' },
            { id: 'anios', texto: 'Años' },
          ]}
          valor={unidad}
          onCambiar={setUnidad}
        />
      </Seccion>

      <BotonPrimario label="Calcular fecha" icono="calendar-number-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && d && (
        <TarjetaResultado
          titulo="La fecha resultante es"
          valor={fechaATexto(calculo.resultado)}
          tono="info"
          badge={`${calculo.corridos >= 0 ? '+' : ''}${calculo.corridos} días`}
          descripcion={fechaLarga(calculo.resultado)}
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              { key: 'base', label: 'Fecha base', operacion: fechaLarga(d), valor: '' },
              { key: 'op', label: operacion === 'sumar' ? 'Se suman' : 'Se restan', valor: etiqueta },
              { key: 'corr', label: 'Equivale a días corridos', valor: String(Math.abs(calculo.corridos)) },
            ]}
            total={{ label: 'Resultado', valor: fechaATexto(calculo.resultado) }}
            tonoTotal="info"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="Meses y días hábiles"
        texto="Al sumar meses se respeta el fin de mes: 31 de enero más un mes es el último día de febrero. Los días hábiles saltan sábados y domingos, pero no descuentan feriados."
        formula="Fecha final = fecha base ± cantidad"
        tip="Muchos plazos legales y universitarios se cuentan en días hábiles. Revisa si en tu caso hay feriados en medio."
      />
    </PantallaCalculadora>
  );
}

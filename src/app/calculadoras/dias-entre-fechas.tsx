import React, { useMemo, useState } from 'react';

import { CampoFecha } from '@/components/calculadora/campo-fecha';
import { PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { diasEntre, diasHabilesEntre, diferenciaAMD, fechaATexto, fechaLarga, hoy, leerFecha, sumarDias } from '@/lib/fechas';
import { fmtNumero } from '@/lib/matematica';

const CALC_ID = 'dias-entre-fechas';

export default function DiasEntreFechasScreen() {
  const [inicio, setInicio] = useState(fechaATexto(hoy()));
  const [fin, setFin] = useState('');
  const p = usePantallaCalculo(CALC_ID, [inicio, fin], (d: { inicio: string; fin: string }) => { setInicio(d.inicio); setFin(d.fin); });

  const a = leerFecha(inicio);
  const b = leerFecha(fin);

  const calculo = useMemo(() => {
    if (!a || !b) return null;
    const [ini, fn] = b >= a ? [a, b] : [b, a];
    const dias = diasEntre(ini, fn);
    return {
      dias,
      invertidas: b < a,
      semanas: Math.floor(dias / 7),
      resto: dias % 7,
      amd: diferenciaAMD(ini, fn),
      habiles: diasHabilesEntre(ini, fn),
      ini,
      fn,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicio, fin]);

  const textoAMD = calculo
    ? [
        calculo.amd.anios && `${calculo.amd.anios} ${calculo.amd.anios === 1 ? 'año' : 'años'}`,
        calculo.amd.meses && `${calculo.amd.meses} ${calculo.amd.meses === 1 ? 'mes' : 'meses'}`,
        `${calculo.amd.dias} ${calculo.amd.dias === 1 ? 'día' : 'días'}`,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setInicio(fechaATexto(hoy()));
        setFin('');
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(`${fmtNumero(calculo.dias)} días`, `${fechaATexto(calculo.ini)} → ${fechaATexto(calculo.fn)}`, { inicio, fin })}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        Cuenta los días que hay entre dos fechas: ideal para saber cuánto falta para la PAES, un
        viaje o el fin de semestre.
      </AvisoInfo>

      <Seccion
        titulo="Tus fechas"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              const h = hoy();
              setInicio(fechaATexto(h));
              setFin(fechaATexto(sumarDias(h, 60)));
              p.setCalculado(false);
            }}
          />
        }>
        <CampoFecha label="Desde" value={inicio} onChangeText={setInicio} />
        <CampoFecha label="Hasta" value={fin} onChangeText={setFin} />
      </Seccion>

      <BotonPrimario label="Contar días" icono="calendar-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo="Entre ambas fechas hay"
          valor={`${fmtNumero(calculo.dias)} días`}
          tono="info"
          badge={`${fmtNumero(calculo.habiles)} hábiles`}
          descripcion={textoAMD}
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              { key: 'ini', label: 'Desde', valor: '', operacion: fechaLarga(calculo.ini) },
              { key: 'fin', label: 'Hasta', valor: '', operacion: fechaLarga(calculo.fn) },
              { key: 'sem', label: 'En semanas', valor: `${calculo.semanas} sem + ${calculo.resto} d` },
              { key: 'hab', label: 'Días hábiles (lunes a viernes)', operacion: 'No descuenta feriados', valor: fmtNumero(calculo.habiles) },
              { key: 'h', label: 'En horas', valor: fmtNumero(calculo.dias * 24) },
              ...(calculo.invertidas ? [{ key: 'inv', label: 'Las fechas estaban al revés', valor: 'Ordenadas', tono: 'warning' as const }] : []),
            ]}
            total={{ label: 'Días corridos', valor: fmtNumero(calculo.dias) }}
            tonoTotal="info"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="¿Cómo se cuenta?"
        texto="Se cuentan los días corridos desde la fecha inicial hasta la final, sin incluir el día de inicio. Los días hábiles son de lunes a viernes; los feriados no se descuentan."
        formula="Días = fecha final − fecha inicial"
        tip="Para saber cuántos días de estudio te quedan antes de la PAES, pon hoy como fecha de inicio y la fecha de tu prueba como final."
      />
    </PantallaCalculadora>
  );
}

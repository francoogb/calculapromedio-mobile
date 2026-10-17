import React, { useMemo, useState } from 'react';

import { CampoFecha } from '@/components/calculadora/campo-fecha';
import { CampoNumero, Segmentado } from '@/components/calculadora/campos';
import { Columna, FilaCampos, PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado, type Tono } from '@/components/calculadora/resultado';
import { diasEntre, diferenciaAMD, fechaATexto, hoy, leerFecha } from '@/lib/fechas';
import { fmtNumero, leerEntero } from '@/lib/matematica';

const CALC_ID = 'vacaciones';

type Zona = 'normal' | 'extrema';

export default function VacacionesScreen() {
  const [inicio, setInicio] = useState('');
  const [referencia, setReferencia] = useState(fechaATexto(hoy()));
  const [zona, setZona] = useState<Zona>('normal');
  const [previos, setPrevios] = useState('');
  const [tomados, setTomados] = useState('');
  const p = usePantallaCalculo(CALC_ID, [inicio, referencia, zona, previos, tomados], (d: { inicio: string; referencia: string; zona: Zona; previos: string; tomados: string }) => { setInicio(d.inicio); setReferencia(d.referencia); setZona(d.zona); setPrevios(d.previos); setTomados(d.tomados); });

  const dIni = leerFecha(inicio);
  const dRef = leerFecha(referencia);
  const nPrevios = previos.trim() === '' ? 0 : leerEntero(previos);
  const nTomados = tomados.trim() === '' ? 0 : leerEntero(tomados);
  const errorOrden = dIni && dRef && dRef <= dIni ? 'Debe ser posterior a la contratación' : null;

  const calculo = useMemo(() => {
    if (!dIni || !dRef || errorOrden || !(nPrevios >= 0) || !(nTomados >= 0)) return null;

    const t = diferenciaAMD(dIni, dRef);
    const base = zona === 'extrema' ? 20 : 15;
    const mesesTotal = t.anios * 12 + t.meses;

    // Feriado progresivo: tras 10 años de trabajo (máx. 10 con empleadores anteriores),
    // +1 día por cada 3 años nuevos con el empleador actual.
    const previosComputables = Math.min(nPrevios, 10);
    const aniosParaUmbral = Math.max(0, 10 - previosComputables);
    const excedente = Math.max(0, t.anios - aniosParaUmbral);
    const progresivo = Math.floor(excedente / 3);

    // Acumulado proporcional (mismo criterio que la web) + días progresivos ganados
    const acumulados = Math.floor(mesesTotal * (base / 12));
    const saldo = acumulados - nTomados;
    return {
      t,
      base,
      mesesTotal,
      progresivo,
      derechoAnual: base + progresivo,
      acumulados,
      saldo,
      corridos: Math.ceil((Math.max(saldo, 0) * 7) / 5),
      dias: diasEntre(dIni, dRef),
    };
  }, [dIni, dRef, errorOrden, zona, nPrevios, nTomados]);

  const tono: Tono = !calculo ? 'info' : calculo.saldo < 0 ? 'warning' : calculo.t.anios < 1 ? 'info' : 'ok';
  const tiempoTexto = calculo
    ? [calculo.t.anios && `${calculo.t.anios} ${calculo.t.anios === 1 ? 'año' : 'años'}`, calculo.t.meses && `${calculo.t.meses} ${calculo.t.meses === 1 ? 'mes' : 'meses'}`]
        .filter(Boolean)
        .join(' y ') || 'Menos de 1 mes'
    : '';

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setInicio('');
        setPrevios('');
        setTomados('');
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(`${calculo.saldo} días`, `Vacaciones · ${tiempoTexto} trabajado · ${calculo.derechoAnual} días/año`, { inicio, referencia, zona, previos, tomados })}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        En Chile, después de un año trabajando para el mismo empleador tienes derecho a 15 días
        hábiles de vacaciones pagadas al año (20 en zonas extremas).
      </AvisoInfo>

      <Seccion
        titulo="Tu contrato"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              const d = hoy();
              setInicio(fechaATexto(new Date(d.getFullYear() - 3, d.getMonth() - 4, d.getDate())));
              setReferencia(fechaATexto(d));
              setTomados('30');
              setPrevios('');
              p.setCalculado(false);
            }}
          />
        }>
        <CampoFecha label="Fecha de contratación" value={inicio} onChangeText={setInicio} conHoy={false} />
        <CampoFecha label="Calcular hasta" value={referencia} onChangeText={setReferencia} error={errorOrden} />
        <Segmentado
          label="Zona"
          opciones={[
            { id: 'normal', texto: 'Normal (15 días)' },
            { id: 'extrema', texto: 'Extrema (20 días)' },
          ]}
          valor={zona}
          onCambiar={setZona}
        />
        <FilaCampos>
          <Columna>
            <CampoNumero label="Días ya tomados" value={tomados} onChangeText={setTomados} placeholder="0" ayuda="Opcional" maxLength={3} />
          </Columna>
          <Columna>
            <CampoNumero label="Años con otros empleadores" value={previos} onChangeText={setPrevios} placeholder="0" ayuda="Para feriado progresivo" maxLength={2} />
          </Columna>
        </FilaCampos>
      </Seccion>

      <BotonPrimario label="Calcular vacaciones" icono="sunny-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo="Días hábiles disponibles"
          valor={String(calculo.saldo)}
          tono={tono}
          badge={`${calculo.derechoAnual} días/año`}
          descripcion={
            calculo.t.anios < 1
              ? 'Aún no cumples un año: tienes días proporcionales, pero para tomar vacaciones normalmente necesitas 1 año.'
              : `Equivalen a unos ${calculo.corridos} días corridos de descanso.`
          }
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              { key: 'tiempo', label: 'Tiempo trabajado', operacion: `${fmtNumero(calculo.dias)} días`, valor: tiempoTexto },
              { key: 'acum', label: 'Días acumulados', operacion: `${calculo.mesesTotal} meses × ${calculo.base} ÷ 12`, valor: String(calculo.acumulados) },
              ...(nTomados > 0 ? [{ key: 'tom', label: 'Días ya tomados', valor: `−${nTomados}` }] : []),
              {
                key: 'prog',
                label: 'Feriado progresivo',
                operacion: calculo.progresivo > 0 ? `+1 día cada 3 años sobre 10` : 'Requiere más de 10 años de trabajo',
                valor: `+${calculo.progresivo}/año`,
              },
            ]}
            total={{ label: 'Saldo de días hábiles', valor: String(calculo.saldo) }}
            tonoTotal={tono}
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="Vacaciones legales"
        texto="El feriado anual es de 15 días hábiles (los sábados no cuentan). En Magallanes, Aysén y Palena son 20. Con más de 10 años trabajados (hasta 10 con empleadores anteriores) se suma 1 día por cada 3 años nuevos con el empleador actual."
        formula="Días acumulados ≈ meses trabajados × 15 ÷ 12"
        tip="Al terminar el contrato, los días no tomados se pagan en el finiquito como feriado proporcional."
      />
    </PantallaCalculadora>
  );
}

import React, { useMemo, useState } from 'react';

import { CampoFecha } from '@/components/calculadora/campo-fecha';
import { PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { crearFecha, diasEntre, diferenciaAMD, fechaATexto, fechaLarga, hoy, leerFecha } from '@/lib/fechas';
import { fmtNumero } from '@/lib/matematica';

const CALC_ID = 'edad';

export default function EdadScreen() {
  const [nacimiento, setNacimiento] = useState('');
  const [medicion, setMedicion] = useState(fechaATexto(hoy()));
  const p = usePantallaCalculo(CALC_ID, [nacimiento, medicion], (d: { nacimiento: string; medicion: string }) => { setNacimiento(d.nacimiento); setMedicion(d.medicion); });

  const n = leerFecha(nacimiento);
  const m = leerFecha(medicion);
  const errorOrden = n && m && m < n ? 'Debe ser posterior al nacimiento' : null;

  const calculo = useMemo(() => {
    if (!n || !m || errorOrden) return null;
    const amd = diferenciaAMD(n, m);
    // Próximo cumpleaños (29-feb se celebra el 28-feb en años no bisiestos)
    let proximo = crearFecha(m.getFullYear(), n.getMonth() + 1, n.getDate());
    if (proximo.getMonth() !== n.getMonth()) proximo = crearFecha(m.getFullYear(), n.getMonth() + 1, 28);
    if (proximo <= m) {
      proximo = crearFecha(m.getFullYear() + 1, n.getMonth() + 1, n.getDate());
      if (proximo.getMonth() !== n.getMonth()) proximo = crearFecha(m.getFullYear() + 1, n.getMonth() + 1, 28);
    }
    const esHoy = amd.meses === 0 && amd.dias === 0;
    return { amd, dias: diasEntre(n, m), proximo, faltan: diasEntre(m, proximo), esHoy };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nacimiento, medicion, errorOrden]);

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setNacimiento('');
        setMedicion(fechaATexto(hoy()));
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(`${calculo.amd.anios} años`, `${calculo.amd.meses} meses y ${calculo.amd.dias} días · nacido el ${nacimiento}`, { nacimiento, medicion })}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>Calcula tu edad exacta en años, meses y días, y cuánto falta para tu próximo cumpleaños.</AvisoInfo>

      <Seccion
        titulo="Tus fechas"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setNacimiento('20-10-2008');
              setMedicion(fechaATexto(hoy()));
              p.setCalculado(false);
            }}
          />
        }>
        <CampoFecha label="Fecha de nacimiento" value={nacimiento} onChangeText={setNacimiento} conHoy={false} />
        <CampoFecha label="Edad a la fecha" value={medicion} onChangeText={setMedicion} error={errorOrden} />
      </Seccion>

      <BotonPrimario label="Calcular edad" icono="gift-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && n && (
        <TarjetaResultado
          titulo="Tienes"
          valor={`${calculo.amd.anios} años`}
          tono={calculo.esHoy ? 'ok' : 'info'}
          badge={calculo.esHoy ? '¡Feliz cumpleaños!' : `Faltan ${calculo.faltan} días`}
          descripcion={`${calculo.amd.anios} años, ${calculo.amd.meses} ${calculo.amd.meses === 1 ? 'mes' : 'meses'} y ${calculo.amd.dias} ${calculo.amd.dias === 1 ? 'día' : 'días'}`}
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              { key: 'nac', label: 'Naciste un', valor: '', operacion: fechaLarga(n) },
              { key: 'dias', label: 'Días vividos', valor: fmtNumero(calculo.dias) },
              { key: 'sem', label: 'Semanas vividas', valor: fmtNumero(Math.floor(calculo.dias / 7)) },
              { key: 'meses', label: 'Meses vividos', valor: fmtNumero(calculo.amd.anios * 12 + calculo.amd.meses) },
              { key: 'prox', label: 'Próximo cumpleaños', operacion: fechaLarga(calculo.proximo), valor: `${calculo.faltan} días` },
            ]}
            total={{ label: 'Edad', valor: `${calculo.amd.anios} años` }}
            tonoTotal={calculo.esHoy ? 'ok' : 'info'}
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="¿Cómo se calcula?"
        texto="Se restan años, meses y días por separado. Si los días o meses salen negativos, se pide prestado un mes o un año, igual que en una resta con reserva."
        formula="Edad = fecha actual − fecha de nacimiento"
        tip="Quienes nacen el 29 de febrero cumplen años legalmente el 28 de febrero en los años que no son bisiestos."
      />
    </PantallaCalculadora>
  );
}

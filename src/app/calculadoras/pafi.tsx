import React, { useMemo, useState } from 'react';

import { CampoNumero, ChipsRapidos } from '@/components/calculadora/campos';
import { Columna, FilaCampos, PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado, type Tono } from '@/components/calculadora/resultado';
import { fmtNumero, leerNumero } from '@/lib/matematica';

const CALC_ID = 'pafi';

/** Clasificación de Berlín (SDRA) según PaO2/FiO2. */
function clasificar(pafi: number): { texto: string; tono: Tono } {
  if (pafi > 300) return { texto: 'Normal', tono: 'ok' };
  if (pafi > 200) return { texto: 'SDRA leve', tono: 'warning' };
  if (pafi > 100) return { texto: 'SDRA moderado', tono: 'error' };
  return { texto: 'SDRA severo', tono: 'error' };
}

export default function PafiScreen() {
  const [pao2, setPao2] = useState('');
  const [fio2, setFio2] = useState('');
  const p = usePantallaCalculo(CALC_ID, [pao2, fio2]);

  const pa = leerNumero(pao2);
  const fi = leerNumero(fio2);
  const errorPa = pao2.trim() !== '' && !(pa > 0 && pa <= 800) ? 'Entre 1 y 800 mmHg' : null;
  const errorFi = fio2.trim() !== '' && !(fi >= 21 && fi <= 100) ? 'Entre 21 y 100%' : null;

  const calculo = useMemo(() => {
    if (!(pa > 0) || !(fi > 0) || errorPa || errorFi) return null;
    const valor = pa / (fi / 100);
    return { valor, ...clasificar(valor) };
  }, [pa, fi, errorPa, errorFi]);

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setPao2('');
        setFio2('');
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(fmtNumero(calculo.valor, 0), `${calculo.texto} · PaO₂ ${fmtNumero(pa)} / FiO₂ ${fmtNumero(fi)}%`)}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        Índice PaO₂/FiO₂ usado en medicina intensiva para evaluar la oxigenación. Herramienta de
        apoyo para estudiantes y profesionales de la salud; no reemplaza el juicio clínico.
      </AvisoInfo>

      <Seccion
        titulo="Gases arteriales"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setPao2('85');
              setFio2('40');
              p.setCalculado(false);
            }}
          />
        }>
        <FilaCampos>
          <Columna>
            <CampoNumero label="PaO₂" value={pao2} onChangeText={setPao2} placeholder="85" sufijo="mmHg" error={errorPa} maxLength={5} />
          </Columna>
          <Columna>
            <CampoNumero label="FiO₂" value={fio2} onChangeText={setFio2} placeholder="40" sufijo="%" error={errorFi} maxLength={5} />
          </Columna>
        </FilaCampos>
        <ChipsRapidos opciones={['21', '30', '40', '50', '100']} valorActual={fio2} onElegir={setFio2} />
      </Seccion>

      <BotonPrimario label="Calcular PaFi" icono="pulse-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo="Índice PaFi"
          valor={fmtNumero(calculo.valor, 0)}
          tono={calculo.tono}
          badge={calculo.texto}
          descripcion="Clasificación de Berlín para Síndrome de Distrés Respiratorio Agudo"
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              { key: 'fi', label: 'FiO₂ en decimal', operacion: `${fmtNumero(fi)} ÷ 100`, valor: fmtNumero(fi / 100, 2) },
              { key: 'pafi', label: 'PaFi = PaO₂ ÷ FiO₂', operacion: `${fmtNumero(pa)} ÷ ${fmtNumero(fi / 100, 2)}`, valor: fmtNumero(calculo.valor, 0) },
              { key: 'r', label: 'Rangos', operacion: '> 300 normal · 201–300 leve · 101–200 moderado · ≤ 100 severo', valor: '' },
            ]}
            total={{ label: 'PaFi', valor: fmtNumero(calculo.valor, 0) }}
            tonoTotal={calculo.tono}
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="¿Qué es la PaFi?"
        texto="Relaciona la presión parcial de oxígeno en sangre arterial (PaO₂) con la fracción de oxígeno inspirado (FiO₂). El aire ambiente tiene 21% de oxígeno."
        formula="PaFi = PaO₂ ÷ (FiO₂ / 100)"
        tip="Con aire ambiente (FiO₂ 21%) y PaO₂ normal de 95 mmHg, la PaFi es cerca de 450."
      />
    </PantallaCalculadora>
  );
}

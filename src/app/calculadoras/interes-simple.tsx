import React, { useMemo, useState } from 'react';

import { CampoNumero, Segmentado } from '@/components/calculadora/campos';
import { Columna, FilaCampos, PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { fmtNumero, fmtPesos, leerNumero, leerPesos } from '@/lib/matematica';

const CALC_ID = 'interes-simple';

type Unidad = 'anios' | 'meses' | 'dias';
const DIVISOR: Record<Unidad, number> = { anios: 1, meses: 12, dias: 365 };
const NOMBRE: Record<Unidad, string> = { anios: 'años', meses: 'meses', dias: 'días' };

export default function InteresSimpleScreen() {
  const [capital, setCapital] = useState('');
  const [tasa, setTasa] = useState('');
  const [tiempo, setTiempo] = useState('');
  const [unidad, setUnidad] = useState<Unidad>('anios');
  const p = usePantallaCalculo(CALC_ID, [capital, tasa, tiempo, unidad]);

  const C = leerPesos(capital);
  const r = leerNumero(tasa);
  const t = leerNumero(tiempo);
  const err = (txt: string, n: number) => (txt.trim() !== '' && !(n > 0) ? 'Debe ser mayor a 0' : null);

  const calculo = useMemo(() => {
    if (!(C > 0 && r > 0 && t > 0)) return null;
    const tAnios = t / DIVISOR[unidad];
    const I = C * (r / 100) * tAnios;
    return { tAnios, I, final: C + I };
  }, [C, r, t, unidad]);

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setCapital('');
        setTasa('');
        setTiempo('');
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(fmtPesos(calculo.final), `${fmtPesos(C)} al ${fmtNumero(r)}% anual · ${fmtNumero(t)} ${NOMBRE[unidad]}`)}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        En el interés simple los intereses se calculan siempre sobre el capital inicial: no se suman
        al capital para el periodo siguiente.
      </AvisoInfo>

      <Seccion
        titulo="Tus datos"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setCapital('1000000');
              setTasa('6');
              setTiempo('18');
              setUnidad('meses');
              p.setCalculado(false);
            }}
          />
        }>
        <CampoNumero label="Capital inicial" value={capital} onChangeText={setCapital} placeholder="1000000" sufijo="$" error={err(capital, C)} ayuda={C > 0 ? fmtPesos(C) : undefined} maxLength={12} />
        <FilaCampos>
          <Columna>
            <CampoNumero label="Tasa anual" value={tasa} onChangeText={setTasa} placeholder="6" sufijo="%" error={err(tasa, r)} />
          </Columna>
          <Columna>
            <CampoNumero label="Tiempo" value={tiempo} onChangeText={setTiempo} placeholder="18" error={err(tiempo, t)} />
          </Columna>
        </FilaCampos>
        <Segmentado
          label="El tiempo está en"
          opciones={[
            { id: 'anios', texto: 'Años' },
            { id: 'meses', texto: 'Meses' },
            { id: 'dias', texto: 'Días' },
          ]}
          valor={unidad}
          onCambiar={setUnidad}
        />
      </Seccion>

      <BotonPrimario label="Calcular" icono="cash-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo="Monto final"
          valor={fmtPesos(calculo.final)}
          tono="info"
          badge={`+${fmtPesos(calculo.I)}`}
          descripcion={`Ganas ${fmtPesos(calculo.I)} de interés en ${fmtNumero(t)} ${NOMBRE[unidad]}`}
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              ...(unidad !== 'anios'
                ? [{ key: 't', label: 'Tiempo en años', operacion: `${fmtNumero(t)} ÷ ${DIVISOR[unidad]}`, valor: fmtNumero(calculo.tAnios) }]
                : []),
              { key: 'i', label: 'Interés I = C · r · t', operacion: `${fmtPesos(C)} × ${fmtNumero(r)}% × ${fmtNumero(calculo.tAnios)}`, valor: fmtPesos(calculo.I) },
              { key: 'f', label: 'Monto final = C + I', operacion: `${fmtPesos(C)} + ${fmtPesos(calculo.I)}`, valor: fmtPesos(calculo.final) },
            ]}
            total={{ label: 'Monto final', valor: fmtPesos(calculo.final) }}
            tonoTotal="info"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="Interés simple"
        texto="El interés crece en línea recta: cada periodo se gana lo mismo. Es el modelo de algunos créditos de corto plazo y aparece en la PAES como función lineal."
        formula="I = C · r · t   ·   Cf = C · (1 + r · t)"
        tip="La tasa y el tiempo deben estar en la misma unidad: si la tasa es anual, el tiempo va en años (18 meses = 1,5 años)."
      />
    </PantallaCalculadora>
  );
}

import React, { useMemo, useState } from 'react';

import { CampoNumero, ChipsRapidos, Segmentado } from '@/components/calculadora/campos';
import { PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { fmtPesos, leerPesos } from '@/lib/matematica';

const CALC_ID = 'iva';
const TASA = 0.19;

type Modo = 'agregar' | 'quitar';

export default function IvaScreen() {
  const [modo, setModo] = useState<Modo>('agregar');
  const [monto, setMonto] = useState('');
  const p = usePantallaCalculo(CALC_ID, [modo, monto]);

  const m = leerPesos(monto);
  const error = monto.trim() !== '' && !(m > 0) ? 'Ingresa un monto mayor a 0' : null;

  const calculo = useMemo(() => {
    if (!(m > 0)) return null;
    if (modo === 'agregar') {
      const iva = m * TASA;
      return { neto: m, iva, bruto: m + iva };
    }
    const neto = m / (1 + TASA);
    return { neto, iva: m - neto, bruto: m };
  }, [m, modo]);

  const principal = calculo ? (modo === 'agregar' ? calculo.bruto : calculo.neto) : 0;

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setMonto('');
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(fmtPesos(principal), `${modo === 'agregar' ? 'Con IVA' : 'Sin IVA'} · IVA ${fmtPesos(calculo.iva)}`)}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <Segmentado
        opciones={[
          { id: 'agregar', texto: 'Agregar IVA' },
          { id: 'quitar', texto: 'Quitar IVA' },
        ]}
        valor={modo}
        onCambiar={(x) => {
          setModo(x);
          p.setCalculado(false);
        }}
      />

      <AvisoInfo>
        {modo === 'agregar'
          ? 'Tienes un precio neto (sin impuesto) y quieres saber cuánto queda con el IVA de 19%.'
          : 'Tienes un precio final con IVA y quieres saber cuánto es el neto y cuánto el impuesto.'}
      </AvisoInfo>

      <Seccion
        titulo="Monto"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setMonto(modo === 'agregar' ? '100000' : '119000');
              p.setCalculado(false);
            }}
          />
        }>
        <CampoNumero
          label={modo === 'agregar' ? 'Monto neto (sin IVA)' : 'Monto bruto (con IVA)'}
          value={monto}
          onChangeText={setMonto}
          placeholder="100000"
          sufijo="$"
          error={error}
          ayuda={m > 0 ? fmtPesos(m) : undefined}
          maxLength={12}
        />
        <ChipsRapidos opciones={['10000', '50000', '100000', '500000']} valorActual={monto} onElegir={setMonto} />
      </Seccion>

      <BotonPrimario label="Calcular" icono="receipt-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo={modo === 'agregar' ? 'Total con IVA' : 'Monto neto'}
          valor={fmtPesos(principal)}
          tono="info"
          badge="IVA 19%"
          descripcion={`El IVA es ${fmtPesos(calculo.iva)}`}
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={
              modo === 'agregar'
                ? [
                    { key: 'neto', label: 'Neto', valor: fmtPesos(calculo.neto) },
                    { key: 'iva', label: 'IVA', operacion: `${fmtPesos(calculo.neto)} × 19%`, valor: fmtPesos(calculo.iva) },
                  ]
                : [
                    { key: 'neto', label: 'Neto', operacion: `${fmtPesos(calculo.bruto)} ÷ 1,19`, valor: fmtPesos(calculo.neto) },
                    { key: 'iva', label: 'IVA', operacion: 'Bruto − neto', valor: fmtPesos(calculo.iva) },
                  ]
            }
            total={{ label: 'Bruto (con IVA)', valor: fmtPesos(calculo.bruto) }}
            tonoTotal="info"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="¿Cómo funciona el IVA?"
        texto="El Impuesto al Valor Agregado en Chile es 19% sobre el precio neto. Para sacarlo de un precio final, se divide por 1,19 (no se resta 19%)."
        formula="Bruto = Neto × 1,19   ·   Neto = Bruto ÷ 1,19"
        tip="Error común: a $119.000 restarle 19% da $96.390, pero el neto correcto es $100.000. Siempre divide por 1,19."
      />
    </PantallaCalculadora>
  );
}

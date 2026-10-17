import React, { useMemo, useState } from 'react';

import { CampoNumero, ChipsRapidos, Segmentado } from '@/components/calculadora/campos';
import { PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { fmtPesos, leerPesos } from '@/lib/matematica';

const CALC_ID = 'boleta-honorarios';

/** Retención de boletas de honorarios (Ley 21.133): sube 0,75 pts por año hasta 17% en 2028. */
const RETENCION: Record<string, number> = {
  '2028': 0.17,
  '2027': 0.16,
  '2026': 0.1525,
  '2025': 0.145,
  '2024': 0.1375,
  '2023': 0.13,
};

const ANIO_ACTUAL = String(Math.min(Math.max(new Date().getFullYear(), 2023), 2028));

type Tipo = 'bruto' | 'liquido';

const pct = (r: number) => `${String(parseFloat((r * 100).toFixed(2))).replace('.', ',')}%`;

export default function BoletaHonorariosScreen() {
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState<Tipo>('bruto');
  const [anio, setAnio] = useState(ANIO_ACTUAL);
  const p = usePantallaCalculo(CALC_ID, [monto, tipo, anio], (d: { monto: string; tipo: Tipo; anio: string }) => { setMonto(d.monto); setTipo(d.tipo); setAnio(d.anio); });

  const m = leerPesos(monto);
  const tasa = RETENCION[anio];
  const error = monto.trim() !== '' && !(m > 0) ? 'Ingresa un monto mayor a 0' : null;

  const calculo = useMemo(() => {
    if (!(m > 0)) return null;
    if (tipo === 'bruto') {
      const retencion = m * tasa;
      return { bruto: m, retencion, liquido: m - retencion };
    }
    const bruto = m / (1 - tasa);
    return { bruto, retencion: bruto - m, liquido: m };
  }, [m, tipo, tasa]);

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setMonto('');
        p.reiniciar();
      }}
      onGuardar={() =>
        calculo && p.guardar(tipo === 'bruto' ? fmtPesos(calculo.liquido) : fmtPesos(calculo.bruto), `${tipo === 'bruto' ? 'Líquido' : 'Bruto a emitir'} · retención ${pct(tasa)} (${anio})`, { monto, tipo, anio })
      }
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        Al emitir una boleta de honorarios se retiene un porcentaje para tus cotizaciones e impuestos.
        Calcula cuánto recibes o cuánto debes emitir para recibir un monto líquido.
      </AvisoInfo>

      <Seccion
        titulo="Tu boleta"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setMonto('500000');
              setTipo('liquido');
              p.setCalculado(false);
            }}
          />
        }>
        <Segmentado
          label="El monto que tienes es"
          opciones={[
            { id: 'bruto', texto: 'Bruto (boleta)' },
            { id: 'liquido', texto: 'Líquido (recibir)' },
          ]}
          valor={tipo}
          onCambiar={setTipo}
        />
        <CampoNumero
          label={tipo === 'bruto' ? 'Monto bruto de la boleta' : 'Monto líquido que quieres recibir'}
          value={monto}
          onChangeText={setMonto}
          placeholder="500000"
          sufijo="$"
          error={error}
          ayuda={m > 0 ? fmtPesos(m) : undefined}
          maxLength={12}
        />
        <ChipsRapidos opciones={['100000', '300000', '500000', '1000000']} valorActual={monto} onElegir={setMonto} />
        <Segmentado
          label="Año de emisión"
          opciones={['2024', '2025', '2026', '2027'].map((a) => ({ id: a, texto: a }))}
          valor={anio}
          onCambiar={setAnio}
        />
      </Seccion>

      <BotonPrimario label="Calcular" icono="document-text-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo={tipo === 'bruto' ? 'Recibes (líquido)' : 'Debes emitir (bruto)'}
          valor={fmtPesos(tipo === 'bruto' ? calculo.liquido : calculo.bruto)}
          tono="info"
          badge={`Retención ${pct(tasa)}`}
          descripcion={`Se retienen ${fmtPesos(calculo.retencion)} (año ${anio})`}
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={
              tipo === 'bruto'
                ? [
                    { key: 'b', label: 'Bruto', valor: fmtPesos(calculo.bruto) },
                    { key: 'r', label: `Retención ${pct(tasa)}`, operacion: `${fmtPesos(calculo.bruto)} × ${pct(tasa)}`, valor: `−${fmtPesos(calculo.retencion)}` },
                  ]
                : [
                    { key: 'b', label: 'Bruto a emitir', operacion: `${fmtPesos(calculo.liquido)} ÷ (1 − ${pct(tasa)})`, valor: fmtPesos(calculo.bruto) },
                    { key: 'r', label: `Retención ${pct(tasa)}`, operacion: 'Bruto − líquido', valor: `−${fmtPesos(calculo.retencion)}` },
                  ]
            }
            total={{ label: 'Líquido', valor: fmtPesos(calculo.liquido) }}
            tonoTotal="info"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="¿Por qué sube la retención cada año?"
        texto="La Ley 21.133 incorporó gradualmente a los trabajadores a honorarios al sistema de seguridad social. La retención sube 0,75 puntos por año: 13,75% (2024), 14,5% (2025), 15,25% (2026), 16% (2027) hasta llegar a 17% en 2028."
        formula="Líquido = Bruto × (1 − retención)   ·   Bruto = Líquido ÷ (1 − retención)"
        tip="Si acordaste recibir un monto «líquido», emite la boleta por el bruto que te da esta calculadora; si no, recibirás menos de lo acordado."
      />
    </PantallaCalculadora>
  );
}

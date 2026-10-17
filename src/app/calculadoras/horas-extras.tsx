import React, { useMemo, useState } from 'react';

import { CampoNumero, ChipsRapidos, Segmentado } from '@/components/calculadora/campos';
import { Columna, FilaCampos, PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { fmtNumero, fmtPesos, leerNumero, leerPesos } from '@/lib/matematica';

const CALC_ID = 'horas-extras';

type Jornada = '45' | '44' | '42' | '40';

/** Jornada máxima legal vigente (Ley 21.561 "40 horas"). */
function jornadaVigente(fecha = new Date()): Jornada {
  const t = fecha.getTime();
  if (t >= new Date(2028, 3, 26).getTime()) return '40';
  if (t >= new Date(2026, 3, 26).getTime()) return '42';
  if (t >= new Date(2024, 3, 26).getTime()) return '44';
  return '45';
}

const RECARGO = 0.5;

export default function HorasExtrasScreen() {
  const [sueldo, setSueldo] = useState('');
  const [horas, setHoras] = useState('');
  const [jornada, setJornada] = useState<Jornada>(jornadaVigente());
  const p = usePantallaCalculo(CALC_ID, [sueldo, horas, jornada], (d: { sueldo: string; horas: string; jornada: Jornada }) => { setSueldo(d.sueldo); setHoras(d.horas); setJornada(d.jornada); });

  const S = leerPesos(sueldo);
  const H = leerNumero(horas);
  const J = Number(jornada);

  const calculo = useMemo(() => {
    if (!(S > 0 && H >= 0 && Number.isFinite(H))) return null;
    // Art. 32 Código del Trabajo: valor hora = sueldo mensual × 28 ÷ (30 × 4 × jornada semanal)
    const valorHora = (S * 28) / (30 * 4 * J);
    const valorExtra = valorHora * (1 + RECARGO);
    const factor = (28 / (30 * 4 * J)) * (1 + RECARGO);
    return { valorHora, valorExtra, total: valorExtra * H, factor };
  }, [S, H, J]);

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setSueldo('');
        setHoras('');
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(fmtPesos(calculo.total), `${fmtNumero(H)} h extra · jornada ${J} h · hora extra ${fmtPesos(calculo.valorExtra)}`, { sueldo, horas, jornada })}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        Calcula cuánto te deben pagar por horas extras según el Código del Trabajo: el valor de la
        hora ordinaria con un recargo mínimo de 50%.
      </AvisoInfo>

      <Seccion
        titulo="Tu trabajo"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setSueldo('600000');
              setHoras('10');
              setJornada(jornadaVigente());
              p.setCalculado(false);
            }}
          />
        }>
        <FilaCampos>
          <Columna>
            <CampoNumero label="Sueldo base mensual" value={sueldo} onChangeText={setSueldo} placeholder="600000" sufijo="$" ayuda={S > 0 ? fmtPesos(S) : undefined} maxLength={10} />
          </Columna>
          <Columna>
            <CampoNumero label="Horas extra del mes" value={horas} onChangeText={setHoras} placeholder="10" sufijo="h" maxLength={5} />
          </Columna>
        </FilaCampos>
        <ChipsRapidos opciones={['5', '10', '15', '20']} valorActual={horas} onElegir={setHoras} />
        <Segmentado
          label="Jornada semanal (horas)"
          opciones={(['45', '44', '42', '40'] as Jornada[]).map((j) => ({ id: j, texto: j === jornadaVigente() ? `${j} · hoy` : j }))}
          valor={jornada}
          onCambiar={setJornada}
        />
      </Seccion>

      <BotonPrimario label="Calcular pago" icono="time-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo="Te deben pagar"
          valor={fmtPesos(calculo.total)}
          tono="ok"
          badge={`${fmtPesos(calculo.valorExtra)}/h`}
          descripcion={`Por ${fmtNumero(H)} horas extra con jornada de ${J} horas semanales`}
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              { key: 'vh', label: 'Valor hora ordinaria', operacion: `${fmtPesos(S)} × 28 ÷ (30 × 4 × ${J})`, valor: fmtPesos(calculo.valorHora) },
              { key: 've', label: 'Valor hora extra (+50%)', operacion: `${fmtPesos(calculo.valorHora)} × 1,5`, valor: fmtPesos(calculo.valorExtra) },
              { key: 'f', label: 'Factor sobre el sueldo', operacion: `para jornada de ${J} h`, valor: fmtNumero(calculo.factor, 7) },
              { key: 't', label: 'Total horas extra', operacion: `${fmtPesos(calculo.valorExtra)} × ${fmtNumero(H)}`, valor: fmtPesos(calculo.total) },
            ]}
            total={{ label: 'Pago por horas extra', valor: fmtPesos(calculo.total) }}
            tonoTotal="ok"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="¿Cómo se calcula?"
        texto="El sueldo mensual se lleva a semanal (× 28 ÷ 30) y se divide por las horas de la jornada semanal para obtener el valor hora. Las horas extra se pagan con al menos 50% de recargo. Con la ley de 40 horas la jornada baja gradualmente, por eso el valor hora sube."
        formula="Hora extra = Sueldo × 28 ÷ (30 × 4 × jornada) × 1,5"
        tip="Máximo 2 horas extra por día y deben pactarse por escrito. Si no hay pacto pero las trabajaste, igual se deben pagar con recargo."
      />
    </PantallaCalculadora>
  );
}

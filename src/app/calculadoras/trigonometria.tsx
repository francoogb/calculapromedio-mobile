import React, { useMemo, useState } from 'react';

import { CampoNumero, ChipsRapidos, Segmentado } from '@/components/calculadora/campos';
import { Columna, FilaCampos, PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { fmtNumero, leerNumero } from '@/lib/matematica';

const CALC_ID = 'trigonometria';
const f = (n: number, d = 4) => fmtNumero(n, d);
const rad = (g: number) => (g * Math.PI) / 180;

type Modo = 'razones' | 'triangulo';
type LadoConocido = 'opuesto' | 'adyacente' | 'hipotenusa';

/** Valores exactos de ángulos notables (los que se piden de memoria en la PAES). */
const NOTABLES: Record<number, { sen: string; cos: string; tan: string }> = {
  0: { sen: '0', cos: '1', tan: '0' },
  30: { sen: '1/2', cos: '√3/2', tan: '√3/3' },
  45: { sen: '√2/2', cos: '√2/2', tan: '1' },
  60: { sen: '√3/2', cos: '1/2', tan: '√3' },
  90: { sen: '1', cos: '0', tan: 'no definida' },
};

export default function TrigonometriaScreen() {
  const [modo, setModo] = useState<Modo>('triangulo');
  const [angulo, setAngulo] = useState('');
  const [lado, setLado] = useState('');
  const [conocido, setConocido] = useState<LadoConocido>('hipotenusa');
  const p = usePantallaCalculo(CALC_ID, [modo, angulo, lado, conocido], (d: { modo: Modo; angulo: string; lado: string; conocido: LadoConocido }) => { setModo(d.modo); setAngulo(d.angulo); setLado(d.lado); setConocido(d.conocido); });

  const a = leerNumero(angulo);
  const l = leerNumero(lado);
  const limiteAng = modo === 'triangulo' ? 'entre 0 y 90 (sin incluirlos)' : 'entre 0 y 360';
  const errorAng =
    angulo.trim() === '' ? null
    : modo === 'triangulo' ? (!(a > 0 && a < 90) ? `Debe estar ${limiteAng}` : null)
    : !(a >= 0 && a <= 360) ? `Debe estar ${limiteAng}` : null;
  const errorLado = lado.trim() !== '' && !(l > 0) ? 'Debe ser mayor a 0' : null;

  const razones = useMemo(() => {
    if (modo !== 'razones' || !Number.isFinite(a) || errorAng) return null;
    const s = Math.sin(rad(a));
    const c = Math.cos(rad(a));
    const tanIndefinida = Math.abs(c) < 1e-12;
    return { s, c, t: tanIndefinida ? null : s / c, notable: NOTABLES[a] };
  }, [modo, a, errorAng]);

  const triangulo = useMemo(() => {
    if (modo !== 'triangulo' || !Number.isFinite(a) || !(l > 0) || errorAng) return null;
    const s = Math.sin(rad(a));
    const c = Math.cos(rad(a));
    const t = Math.tan(rad(a));
    let op: number, ad: number, hip: number;
    let pasos: { key: string; label: string; operacion: string; valor: string }[];
    if (conocido === 'hipotenusa') {
      hip = l; op = l * s; ad = l * c;
      pasos = [
        { key: 'op', label: 'Opuesto = hip · sen α', operacion: `${f(l)} × sen ${f(a)}°`, valor: f(op) },
        { key: 'ad', label: 'Adyacente = hip · cos α', operacion: `${f(l)} × cos ${f(a)}°`, valor: f(ad) },
      ];
    } else if (conocido === 'opuesto') {
      op = l; hip = l / s; ad = l / t;
      pasos = [
        { key: 'hip', label: 'Hipotenusa = op ÷ sen α', operacion: `${f(l)} ÷ sen ${f(a)}°`, valor: f(hip) },
        { key: 'ad', label: 'Adyacente = op ÷ tan α', operacion: `${f(l)} ÷ tan ${f(a)}°`, valor: f(ad) },
      ];
    } else {
      ad = l; hip = l / c; op = l * t;
      pasos = [
        { key: 'hip', label: 'Hipotenusa = ady ÷ cos α', operacion: `${f(l)} ÷ cos ${f(a)}°`, valor: f(hip) },
        { key: 'op', label: 'Opuesto = ady · tan α', operacion: `${f(l)} × tan ${f(a)}°`, valor: f(op) },
      ];
    }
    return { op, ad, hip, beta: 90 - a, pasos, area: (op * ad) / 2 };
  }, [modo, a, l, conocido, errorAng]);

  const listo = modo === 'razones' ? razones !== null : triangulo !== null;

  const ejemplo = () => {
    if (modo === 'razones') setAngulo('30');
    else {
      setAngulo('35');
      setLado('10');
      setConocido('hipotenusa');
    }
    p.setCalculado(false);
  };

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setAngulo('');
        setLado('');
        p.reiniciar();
      }}
      onGuardar={() => {
        if (razones) p.guardar(`sen ${f(a)}° = ${f(razones.s)}`, `cos ${f(razones.c)} · tan ${razones.t === null ? '∞' : f(razones.t)}`, { modo, angulo, lado, conocido });
        else if (triangulo) p.guardar(`hip ${f(triangulo.hip, 2)}`, `α ${f(a)}° · op ${f(triangulo.op, 2)} · ady ${f(triangulo.ad, 2)}`, { modo, angulo, lado, conocido });
      }}
      puedeGuardar={p.calculado && listo}
      guardado={p.guardado}>
      <Segmentado
        opciones={[
          { id: 'triangulo', texto: 'Triángulo' },
          { id: 'razones', texto: 'sen · cos · tan' },
        ]}
        valor={modo}
        onCambiar={(m) => {
          setModo(m);
          setAngulo('');
          setLado('');
          p.setCalculado(false);
        }}
      />

      <AvisoInfo>
        {modo === 'triangulo'
          ? 'Con un ángulo agudo y un lado de un triángulo rectángulo, obtén los otros dos lados. Ángulo en grados.'
          : 'Calcula seno, coseno y tangente de un ángulo en grados. Para 0°, 30°, 45°, 60° y 90° verás también el valor exacto.'}
      </AvisoInfo>

      <Seccion titulo="Tus datos" accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={ejemplo} />}>
        {modo === 'triangulo' ? (
          <>
            <FilaCampos>
              <Columna>
                <CampoNumero label="Ángulo α" value={angulo} onChangeText={setAngulo} placeholder="35" sufijo="°" error={errorAng} />
              </Columna>
              <Columna>
                <CampoNumero label="Lado conocido" value={lado} onChangeText={setLado} placeholder="10" error={errorLado} maxLength={10} />
              </Columna>
            </FilaCampos>
            <Segmentado
              label="El lado conocido es el"
              opciones={[
                { id: 'opuesto', texto: 'Opuesto' },
                { id: 'adyacente', texto: 'Adyacente' },
                { id: 'hipotenusa', texto: 'Hipotenusa' },
              ]}
              valor={conocido}
              onCambiar={setConocido}
            />
          </>
        ) : (
          <>
            <CampoNumero label="Ángulo" value={angulo} onChangeText={setAngulo} placeholder="30" sufijo="°" error={errorAng} />
            <ChipsRapidos opciones={['30', '45', '60', '90']} valorActual={angulo} onElegir={setAngulo} />
          </>
        )}
      </Seccion>

      <BotonPrimario label="Calcular" icono="compass-outline" onPress={p.calcular} deshabilitado={!listo} />

      {p.calculado && triangulo && (
        <TarjetaResultado
          titulo="Lados del triángulo"
          valor={`${f(triangulo.op, 2)} · ${f(triangulo.ad, 2)} · ${f(triangulo.hip, 2)}`}
          tono="info"
          badge={`β = ${f(triangulo.beta)}°`}
          descripcion="Opuesto · Adyacente · Hipotenusa (respecto al ángulo α)"
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              ...triangulo.pasos,
              { key: 'beta', label: 'Otro ángulo agudo β', operacion: `90° − ${f(a)}°`, valor: `${f(triangulo.beta)}°` },
              { key: 'area', label: 'Área', operacion: 'op × ady ÷ 2', valor: f(triangulo.area, 2) },
            ]}
            total={{ label: 'Hipotenusa', valor: f(triangulo.hip, 2) }}
            tonoTotal="info"
          />
        </TarjetaResultado>
      )}

      {p.calculado && razones && (
        <TarjetaResultado
          titulo={`Razones de ${f(a)}°`}
          valor={`sen = ${razones.notable?.sen ?? f(razones.s)}`}
          tono="info"
          badge={razones.notable ? 'Ángulo notable' : `${f(rad(a))} rad`}
          descripcion={`cos = ${razones.notable?.cos ?? f(razones.c)} · tan = ${razones.notable?.tan ?? (razones.t === null ? 'no definida' : f(razones.t))}`}
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              { key: 's', label: 'Seno', operacion: 'opuesto ÷ hipotenusa', valor: f(razones.s) },
              { key: 'c', label: 'Coseno', operacion: 'adyacente ÷ hipotenusa', valor: f(razones.c) },
              { key: 't', label: 'Tangente', operacion: 'opuesto ÷ adyacente', valor: razones.t === null ? 'no definida' : f(razones.t) },
              { key: 'id', label: 'Comprobación: sen² + cos²', operacion: 'siempre da 1', valor: f(razones.s ** 2 + razones.c ** 2) },
            ]}
            total={{ label: 'Radianes', valor: f(rad(a)) }}
            tonoTotal="info"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="Razones trigonométricas"
        texto="En un triángulo rectángulo, cada razón compara dos lados respecto a un ángulo agudo α. El cateto opuesto está frente a α; el adyacente lo forma junto a la hipotenusa."
        formula="sen α = op/hip · cos α = ady/hip · tan α = op/ady"
        tip="Regla mnemotécnica: SOH-CAH-TOA (Seno = Opuesto/Hipotenusa, Coseno = Adyacente/Hipotenusa, Tangente = Opuesto/Adyacente)."
      />
    </PantallaCalculadora>
  );
}

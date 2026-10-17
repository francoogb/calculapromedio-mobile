import React, { useMemo, useState } from 'react';

import { CampoNumero, ChipsRapidos } from '@/components/calculadora/campos';
import { Columna, FilaCampos, PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado, type FilaDetalle } from '@/components/calculadora/resultado';
import { fmtNumero, leerNumero } from '@/lib/matematica';

const CALC_ID = 'volumen';
const f = (n: number) => fmtNumero(n);

type V = Record<string, number>;
type Cuerpo = {
  nombre: string;
  campos: { k: string; label: string }[];
  ejemplo: Record<string, string>;
  volumen: (v: V) => number;
  opVolumen: (v: V) => string;
  formulaVolumen: string;
  area: (v: V) => number;
  opArea: (v: V) => string;
  formulaArea: string;
  extra?: (v: V) => FilaDetalle[];
};

const CUERPOS: Cuerpo[] = [
  {
    nombre: 'Cubo',
    campos: [{ k: 'l', label: 'Arista (l)' }],
    ejemplo: { l: '4' },
    volumen: (v) => v.l ** 3,
    opVolumen: (v) => `${f(v.l)}³`,
    formulaVolumen: 'V = l³',
    area: (v) => 6 * v.l ** 2,
    opArea: (v) => `6 × ${f(v.l)}²`,
    formulaArea: 'A = 6 · l²',
  },
  {
    nombre: 'Prisma rectangular',
    campos: [{ k: 'a', label: 'Largo (a)' }, { k: 'b', label: 'Ancho (b)' }, { k: 'c', label: 'Alto (c)' }],
    ejemplo: { a: '5', b: '3', c: '2' },
    volumen: (v) => v.a * v.b * v.c,
    opVolumen: (v) => `${f(v.a)} × ${f(v.b)} × ${f(v.c)}`,
    formulaVolumen: 'V = a · b · c',
    area: (v) => 2 * (v.a * v.b + v.a * v.c + v.b * v.c),
    opArea: (v) => `2 × (${f(v.a * v.b)} + ${f(v.a * v.c)} + ${f(v.b * v.c)})`,
    formulaArea: 'A = 2 · (ab + ac + bc)',
  },
  {
    nombre: 'Cilindro',
    campos: [{ k: 'r', label: 'Radio (r)' }, { k: 'h', label: 'Altura (h)' }],
    ejemplo: { r: '3', h: '10' },
    volumen: (v) => Math.PI * v.r ** 2 * v.h,
    opVolumen: (v) => `π × ${f(v.r)}² × ${f(v.h)}`,
    formulaVolumen: 'V = π · r² · h',
    area: (v) => 2 * Math.PI * v.r * (v.r + v.h),
    opArea: (v) => `2π × ${f(v.r)} × (${f(v.r)} + ${f(v.h)})`,
    formulaArea: 'A = 2πr · (r + h)',
  },
  {
    nombre: 'Cono',
    campos: [{ k: 'r', label: 'Radio (r)' }, { k: 'h', label: 'Altura (h)' }],
    ejemplo: { r: '3', h: '4' },
    volumen: (v) => (Math.PI * v.r ** 2 * v.h) / 3,
    opVolumen: (v) => `π × ${f(v.r)}² × ${f(v.h)} ÷ 3`,
    formulaVolumen: 'V = π · r² · h ÷ 3',
    area: (v) => Math.PI * v.r * (v.r + Math.hypot(v.r, v.h)),
    opArea: (v) => `π × ${f(v.r)} × (${f(v.r)} + ${f(Math.hypot(v.r, v.h))})`,
    formulaArea: 'A = πr · (r + g)',
    extra: (v) => [
      { key: 'g', label: 'Generatriz g = √(r² + h²)', operacion: `√(${f(v.r)}² + ${f(v.h)}²)`, valor: f(Math.hypot(v.r, v.h)) },
    ],
  },
  {
    nombre: 'Esfera',
    campos: [{ k: 'r', label: 'Radio (r)' }],
    ejemplo: { r: '3' },
    volumen: (v) => (4 / 3) * Math.PI * v.r ** 3,
    opVolumen: (v) => `4/3 × π × ${f(v.r)}³`,
    formulaVolumen: 'V = 4/3 · π · r³',
    area: (v) => 4 * Math.PI * v.r ** 2,
    opArea: (v) => `4 × π × ${f(v.r)}²`,
    formulaArea: 'A = 4 · π · r²',
  },
  {
    nombre: 'Pirámide cuadrada',
    campos: [{ k: 'l', label: 'Lado de la base (l)' }, { k: 'h', label: 'Altura (h)' }],
    ejemplo: { l: '6', h: '4' },
    volumen: (v) => (v.l ** 2 * v.h) / 3,
    opVolumen: (v) => `${f(v.l)}² × ${f(v.h)} ÷ 3`,
    formulaVolumen: 'V = l² · h ÷ 3',
    area: (v) => v.l ** 2 + 2 * v.l * Math.hypot(v.h, v.l / 2),
    opArea: (v) => `${f(v.l)}² + 2 × ${f(v.l)} × ${f(Math.hypot(v.h, v.l / 2))}`,
    formulaArea: 'A = l² + 2 · l · ap',
    extra: (v) => [
      { key: 'ap', label: 'Apotema lateral ap = √(h² + (l/2)²)', operacion: `√(${f(v.h)}² + ${f(v.l / 2)}²)`, valor: f(Math.hypot(v.h, v.l / 2)) },
    ],
  },
];

export default function VolumenScreen() {
  const [nombre, setNombre] = useState('Cilindro');
  const [valores, setValores] = useState<Record<string, string>>({});
  const cuerpo = CUERPOS.find((c) => c.nombre === nombre)!;
  const p = usePantallaCalculo(CALC_ID, [nombre, valores], (d: { nombre: string; valores: Record<string, string> }) => { setNombre(d.nombre); setValores(d.valores); });

  const v: V = {};
  for (const c of cuerpo.campos) v[c.k] = leerNumero(valores[c.k] ?? '');
  const errorDe = (k: string) => ((valores[k] ?? '').trim() !== '' && !(v[k] > 0) ? 'Debe ser mayor a 0' : null);

  const calculo = useMemo(() => {
    if (!cuerpo.campos.every((c) => v[c.k] > 0)) return null;
    return { volumen: cuerpo.volumen(v), area: cuerpo.area(v) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre, valores]);

  const elegir = (n: string) => {
    setNombre(n);
    setValores({});
    p.setCalculado(false);
  };

  const campos = cuerpo.campos;
  const filas = Array.from({ length: Math.ceil(campos.length / 2) }, (_, i) => campos.slice(i * 2, i * 2 + 2));

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setValores({});
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(`V = ${fmtNumero(calculo.volumen, 2)}`, `${cuerpo.nombre} · área ${fmtNumero(calculo.area, 2)}`, { nombre, valores })}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        Calcula el volumen (cuánto cabe dentro) y el área total (cuánta superficie lo cubre) de los
        cuerpos geométricos más usados.
      </AvisoInfo>

      <Seccion
        titulo="Tu cuerpo"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setValores(cuerpo.ejemplo);
              p.setCalculado(false);
            }}
          />
        }>
        <ChipsRapidos opciones={CUERPOS.map((c) => c.nombre)} valorActual={nombre} onElegir={elegir} />
        {filas.map((par, i) => (
          <FilaCampos key={`${nombre}-${i}`}>
            {par.map((c) => (
              <Columna key={c.k}>
                <CampoNumero
                  label={c.label}
                  value={valores[c.k] ?? ''}
                  onChangeText={(t) => setValores((prev) => ({ ...prev, [c.k]: t }))}
                  placeholder="—"
                  error={errorDe(c.k)}
                  maxLength={10}
                />
              </Columna>
            ))}
            {par.length === 1 && campos.length > 1 && <Columna>{null}</Columna>}
          </FilaCampos>
        ))}
      </Seccion>

      <BotonPrimario label="Calcular" icono="cube-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo={`Volumen del ${cuerpo.nombre.toLowerCase()}`}
          valor={fmtNumero(calculo.volumen, 2)}
          tono="info"
          badge="unidades³"
          descripcion={`Área total: ${fmtNumero(calculo.area, 2)} unidades²`}
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              ...(cuerpo.extra?.(v) ?? []),
              { key: 'vol', label: `Volumen · ${cuerpo.formulaVolumen}`, operacion: cuerpo.opVolumen(v), valor: fmtNumero(calculo.volumen, 2) },
              { key: 'area', label: `Área total · ${cuerpo.formulaArea}`, operacion: cuerpo.opArea(v), valor: fmtNumero(calculo.area, 2) },
            ]}
            total={{ label: 'Volumen', valor: fmtNumero(calculo.volumen, 2) }}
            tonoTotal="info"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="Relación entre cuerpos"
        texto="Un cono tiene exactamente 1/3 del volumen de un cilindro de igual base y altura. Lo mismo ocurre entre una pirámide y un prisma. Por eso sus fórmulas se dividen por 3."
        formula={cuerpo.formulaVolumen}
        tip="Si duplicas el radio de una esfera o cilindro, el volumen no se duplica: se multiplica por 8 en la esfera (2³) y por 4 en el cilindro (2²)."
      />
    </PantallaCalculadora>
  );
}

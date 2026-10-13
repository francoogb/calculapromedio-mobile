import React, { useMemo, useState } from 'react';

import { CampoNumero, ChipsRapidos } from '@/components/calculadora/campos';
import { Columna, FilaCampos, PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { fmtNumero, leerNumero } from '@/lib/matematica';

const CALC_ID = 'area-perimetro';

type Campo = { k: string; label: string; opcional?: boolean };
type V = Record<string, number>;

type Figura = {
  nombre: string;
  campos: Campo[];
  ejemplo: Record<string, string>;
  area: (v: V) => number;
  opArea: (v: V) => string;
  formulaArea: string;
  perimetro: (v: V) => number | null;
  opPerimetro: (v: V) => string;
  formulaPerimetro: string;
  validar?: (v: V) => string | null;
};

const f = (n: number) => fmtNumero(n);

const FIGURAS: Figura[] = [
  {
    nombre: 'Círculo',
    campos: [{ k: 'r', label: 'Radio (r)' }],
    ejemplo: { r: '5' },
    area: (v) => Math.PI * v.r ** 2,
    opArea: (v) => `π × ${f(v.r)}²`,
    formulaArea: 'A = π · r²',
    perimetro: (v) => 2 * Math.PI * v.r,
    opPerimetro: (v) => `2 × π × ${f(v.r)}`,
    formulaPerimetro: 'P = 2 · π · r',
  },
  {
    nombre: 'Cuadrado',
    campos: [{ k: 'l', label: 'Lado (l)' }],
    ejemplo: { l: '6' },
    area: (v) => v.l ** 2,
    opArea: (v) => `${f(v.l)}²`,
    formulaArea: 'A = l²',
    perimetro: (v) => 4 * v.l,
    opPerimetro: (v) => `4 × ${f(v.l)}`,
    formulaPerimetro: 'P = 4 · l',
  },
  {
    nombre: 'Rectángulo',
    campos: [{ k: 'b', label: 'Base (b)' }, { k: 'h', label: 'Altura (h)' }],
    ejemplo: { b: '8', h: '5' },
    area: (v) => v.b * v.h,
    opArea: (v) => `${f(v.b)} × ${f(v.h)}`,
    formulaArea: 'A = b · h',
    perimetro: (v) => 2 * (v.b + v.h),
    opPerimetro: (v) => `2 × (${f(v.b)} + ${f(v.h)})`,
    formulaPerimetro: 'P = 2 · (b + h)',
  },
  {
    nombre: 'Triángulo',
    campos: [
      { k: 'b', label: 'Base (b)' },
      { k: 'h', label: 'Altura (h)' },
      { k: 'l2', label: 'Lado 2', opcional: true },
      { k: 'l3', label: 'Lado 3', opcional: true },
    ],
    ejemplo: { b: '6', h: '4', l2: '5', l3: '5' },
    area: (v) => (v.b * v.h) / 2,
    opArea: (v) => `(${f(v.b)} × ${f(v.h)}) ÷ 2`,
    formulaArea: 'A = (b · h) ÷ 2',
    perimetro: (v) => (v.l2 > 0 && v.l3 > 0 ? v.b + v.l2 + v.l3 : null),
    opPerimetro: (v) => `${f(v.b)} + ${f(v.l2)} + ${f(v.l3)}`,
    formulaPerimetro: 'P = suma de los 3 lados',
    validar: (v) =>
      v.l2 > 0 && v.l3 > 0 && (v.b >= v.l2 + v.l3 || v.l2 >= v.b + v.l3 || v.l3 >= v.b + v.l2)
        ? 'Esos 3 lados no forman un triángulo (desigualdad triangular).'
        : null,
  },
  {
    nombre: 'Trapecio',
    campos: [
      { k: 'B', label: 'Base mayor (B)' },
      { k: 'b', label: 'Base menor (b)' },
      { k: 'h', label: 'Altura (h)' },
      { k: 'l', label: 'Lados no paralelos (c/u)', opcional: true },
    ],
    ejemplo: { B: '10', b: '6', h: '4', l: '5' },
    area: (v) => ((v.B + v.b) * v.h) / 2,
    opArea: (v) => `(${f(v.B)} + ${f(v.b)}) × ${f(v.h)} ÷ 2`,
    formulaArea: 'A = (B + b) · h ÷ 2',
    perimetro: (v) => (v.l > 0 ? v.B + v.b + 2 * v.l : null),
    opPerimetro: (v) => `${f(v.B)} + ${f(v.b)} + 2 × ${f(v.l)}`,
    formulaPerimetro: 'P = B + b + 2 · lado (trapecio isósceles)',
  },
  {
    nombre: 'Paralelogramo',
    campos: [
      { k: 'b', label: 'Base (b)' },
      { k: 'h', label: 'Altura (h)' },
      { k: 'l', label: 'Lado inclinado', opcional: true },
    ],
    ejemplo: { b: '9', h: '4', l: '5' },
    area: (v) => v.b * v.h,
    opArea: (v) => `${f(v.b)} × ${f(v.h)}`,
    formulaArea: 'A = b · h',
    perimetro: (v) => (v.l > 0 ? 2 * (v.b + v.l) : null),
    opPerimetro: (v) => `2 × (${f(v.b)} + ${f(v.l)})`,
    formulaPerimetro: 'P = 2 · (b + lado)',
  },
  {
    nombre: 'Rombo',
    campos: [
      { k: 'D', label: 'Diagonal mayor (D)' },
      { k: 'd', label: 'Diagonal menor (d)' },
    ],
    ejemplo: { D: '8', d: '6' },
    area: (v) => (v.D * v.d) / 2,
    opArea: (v) => `(${f(v.D)} × ${f(v.d)}) ÷ 2`,
    formulaArea: 'A = (D · d) ÷ 2',
    // Lado por Pitágoras con las semidiagonales
    perimetro: (v) => 4 * Math.sqrt((v.D / 2) ** 2 + (v.d / 2) ** 2),
    opPerimetro: (v) => `4 × √(${f(v.D / 2)}² + ${f(v.d / 2)}²)`,
    formulaPerimetro: 'P = 4 · √((D/2)² + (d/2)²)',
  },
];

export default function AreaPerimetroScreen() {
  const [figuraNombre, setFiguraNombre] = useState('Rectángulo');
  const [valores, setValores] = useState<Record<string, string>>({});
  const figura = FIGURAS.find((x) => x.nombre === figuraNombre)!;
  const p = usePantallaCalculo(CALC_ID, [figuraNombre, valores]);

  const v: V = {};
  for (const c of figura.campos) v[c.k] = leerNumero(valores[c.k] ?? '');

  const errores: Record<string, string | null> = {};
  for (const c of figura.campos) {
    const t = valores[c.k] ?? '';
    errores[c.k] = t.trim() !== '' && !(v[c.k] > 0) ? 'Debe ser mayor a 0' : null;
  }

  const calculo = useMemo(() => {
    const obligatoriosOk = figura.campos.filter((c) => !c.opcional).every((c) => v[c.k] > 0);
    if (!obligatoriosOk || Object.values(errores).some(Boolean)) return null;
    const errorFigura = figura.validar?.(v) ?? null;
    if (errorFigura) return { error: errorFigura };
    return { area: figura.area(v), perimetro: figura.perimetro(v) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [figuraNombre, valores]);

  const valido = calculo !== null && !('error' in calculo);

  const elegirFigura = (nombre: string) => {
    setFiguraNombre(nombre);
    setValores({});
    p.setCalculado(false);
  };

  const limpiar = () => {
    setValores({});
    p.reiniciar();
  };

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={limpiar}
      onGuardar={() =>
        calculo && !('error' in calculo) &&
        p.guardar(`A = ${fmtNumero(calculo.area, 2)}`, `${figura.nombre}${calculo.perimetro !== null ? ` · P = ${fmtNumero(calculo.perimetro, 2)}` : ''}`)
      }
      puedeGuardar={p.calculado && valido}
      guardado={p.guardado}>
      <AvisoInfo>
        Elige la figura e ingresa sus medidas (todas en la misma unidad). El área queda en unidades
        cuadradas y el perímetro en unidades lineales.
      </AvisoInfo>

      <Seccion
        titulo="Tu figura"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setValores(figura.ejemplo);
              p.setCalculado(false);
            }}
          />
        }>
        <ChipsRapidos opciones={FIGURAS.map((x) => x.nombre)} valorActual={figuraNombre} onElegir={elegirFigura} />

        {/* Campos de a dos por fila */}
        {Array.from({ length: Math.ceil(figura.campos.length / 2) }, (_, i) => figura.campos.slice(i * 2, i * 2 + 2)).map(
          (par, i) => (
            <FilaCampos key={`${figura.nombre}-${i}`}>
              {par.map((c) => (
                <Columna key={c.k}>
                  <CampoNumero
                    label={c.opcional ? `${c.label} (opc.)` : c.label}
                    value={valores[c.k] ?? ''}
                    onChangeText={(t) => setValores((prev) => ({ ...prev, [c.k]: t }))}
                    placeholder="—"
                    error={errores[c.k]}
                    maxLength={10}
                  />
                </Columna>
              ))}
              {par.length === 1 && figura.campos.length > 1 && <Columna>{null}</Columna>}
            </FilaCampos>
          )
        )}
      </Seccion>

      {calculo && 'error' in calculo && <AvisoInfo>{calculo.error}</AvisoInfo>}

      <BotonPrimario label="Calcular" icono="shapes-outline" onPress={p.calcular} deshabilitado={!valido} />

      {p.calculado && calculo && !('error' in calculo) && (
        <TarjetaResultado
          titulo={`Área del ${figura.nombre.toLowerCase()}`}
          valor={fmtNumero(calculo.area, 2)}
          tono="info"
          badge="unidades²"
          descripcion={
            calculo.perimetro !== null
              ? `Perímetro: ${fmtNumero(calculo.perimetro, 2)} unidades`
              : 'Para el perímetro ingresa también los lados opcionales.'
          }
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              { key: 'area', label: `Área · ${figura.formulaArea}`, operacion: figura.opArea(v), valor: fmtNumero(calculo.area, 2) },
              ...(calculo.perimetro !== null
                ? [{ key: 'per', label: `Perímetro · ${figura.formulaPerimetro}`, operacion: figura.opPerimetro(v), valor: fmtNumero(calculo.perimetro, 2) }]
                : []),
            ]}
            total={{ label: 'Área', valor: fmtNumero(calculo.area, 2) }}
            tonoTotal="info"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="Área vs. perímetro"
        texto="El área mide la superficie que cubre la figura (cuántos cuadraditos caben). El perímetro mide el borde (cuánta cerca necesitarías para rodearla)."
        formula={`${figura.formulaArea}   ·   ${figura.formulaPerimetro}`}
        tip="Ojo con la altura: siempre es perpendicular a la base. En un triángulo o paralelogramo, el lado inclinado NO es la altura."
      />
    </PantallaCalculadora>
  );
}

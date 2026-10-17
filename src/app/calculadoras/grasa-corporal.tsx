import React, { useMemo, useState } from 'react';

import { CamposCorporales, DATOS_EJEMPLO, DATOS_VACIOS, leerDatos } from '@/components/calculadora/datos-corporales';
import { PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { fmtNumero } from '@/lib/matematica';
import { categoriaGrasa, grasaDeurenberg, imc } from '@/lib/salud';

const CALC_ID = 'grasa-corporal';

export default function GrasaCorporalScreen() {
  const [datos, setDatos] = useState(DATOS_VACIOS);
  const p = usePantallaCalculo(CALC_ID, [datos], (d: { datos: typeof datos }) => { setDatos(d.datos); });
  const d = leerDatos(datos);

  const calculo = useMemo(() => {
    if (!d.ok) return null;
    const valorImc = imc(d.peso, d.altura);
    const pct = Math.max(0, grasaDeurenberg(d.sexo, valorImc, d.edad));
    const kgGrasa = (d.peso * pct) / 100;
    return { valorImc, pct, kgGrasa, kgMagra: d.peso - kgGrasa, cat: categoriaGrasa(d.sexo, pct) };
  }, [d.ok, d.sexo, d.peso, d.altura, d.edad]);

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setDatos(DATOS_VACIOS);
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(`${fmtNumero(calculo.pct, 1)}%`, `Grasa corporal · ${calculo.cat.texto}`, { datos })}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        Estimación del porcentaje de grasa corporal con la fórmula de Deurenberg, a partir de tu IMC,
        edad y sexo. Es aproximada: no reemplaza una medición con bioimpedancia o pliegues.
      </AvisoInfo>

      <Seccion
        titulo="Tus datos"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setDatos(DATOS_EJEMPLO);
              p.setCalculado(false);
            }}
          />
        }>
        <CamposCorporales datos={datos} onCambiar={setDatos} />
      </Seccion>

      <BotonPrimario label="Calcular" icono="fitness-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo="Grasa corporal estimada"
          valor={`${fmtNumero(calculo.pct, 1)}%`}
          tono={calculo.cat.tono}
          badge={calculo.cat.texto}
          descripcion={`${fmtNumero(calculo.kgGrasa, 1)} kg de grasa y ${fmtNumero(calculo.kgMagra, 1)} kg de masa magra`}
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              { key: 'imc', label: 'IMC', operacion: `${fmtNumero(d.peso)} ÷ ${fmtNumero(d.altura / 100, 2)}²`, valor: fmtNumero(calculo.valorImc, 1) },
              {
                key: 'gr',
                label: `Deurenberg (${d.sexo})`,
                operacion: `1,2·${fmtNumero(calculo.valorImc, 1)} + 0,23·${fmtNumero(d.edad)} − ${d.sexo === 'hombre' ? '16,2' : '5,4'}`,
                valor: `${fmtNumero(calculo.pct, 1)}%`,
              },
              { key: 'kg', label: 'Kilos de grasa', operacion: `${fmtNumero(d.peso)} × ${fmtNumero(calculo.pct, 1)}%`, valor: `${fmtNumero(calculo.kgGrasa, 1)} kg` },
            ]}
            total={{ label: '% de grasa', valor: `${fmtNumero(calculo.pct, 1)}%` }}
            tonoTotal={calculo.cat.tono}
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="¿Cómo se estima?"
        texto="La fórmula de Deurenberg usa el IMC y la edad, y resta un valor distinto según el sexo porque las mujeres tienen naturalmente más grasa esencial. Al no medir músculo, sobreestima la grasa en personas muy musculosas."
        formula="% grasa = 1,2·IMC + 0,23·edad − 16,2 (H) / − 5,4 (M)"
        tip="La fórmula fue diseñada para adultos; en adolescentes el resultado es solo referencial."
      />
    </PantallaCalculadora>
  );
}

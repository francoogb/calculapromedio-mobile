import React, { useMemo, useState } from 'react';

import { CampoNumero, ChipsRapidos, Segmentado } from '@/components/calculadora/campos';
import { Columna, FilaCampos, PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { fmtNumero, fmtPesos, leerNumero, leerPesos } from '@/lib/matematica';

const CALC_ID = 'gasto-bencina';

type Unidad = 'kml' | 'lkm';

export default function GastoBencinaScreen() {
  const [distancia, setDistancia] = useState('');
  const [consumo, setConsumo] = useState('');
  const [unidad, setUnidad] = useState<Unidad>('kml');
  const [precio, setPrecio] = useState('');
  const [personas, setPersonas] = useState('1');
  const [idaVuelta, setIdaVuelta] = useState<'no' | 'si'>('no');
  const p = usePantallaCalculo(CALC_ID, [distancia, consumo, unidad, precio, personas, idaVuelta], (d: { distancia: string; consumo: string; unidad: Unidad; precio: string; personas: string; idaVuelta: 'no' | 'si' }) => { setDistancia(d.distancia); setConsumo(d.consumo); setUnidad(d.unidad); setPrecio(d.precio); setPersonas(d.personas); setIdaVuelta(d.idaVuelta); });

  const d = leerNumero(distancia);
  const c = leerNumero(consumo);
  const pr = leerPesos(precio);
  const n = Math.max(1, Math.floor(leerNumero(personas) || 1));

  const calculo = useMemo(() => {
    if (!(d > 0 && c > 0 && pr > 0)) return null;
    const km = idaVuelta === 'si' ? d * 2 : d;
    const litrosCada100 = unidad === 'lkm' ? c : 100 / c;
    const litros = (km / 100) * litrosCada100;
    const costo = litros * pr;
    return { km, litros, costo, porPersona: costo / n, porKm: costo / km };
  }, [d, c, pr, unidad, idaVuelta, n]);

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setDistancia('');
        setConsumo('');
        setPrecio('');
        setPersonas('1');
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(fmtPesos(calculo.costo), `${fmtNumero(calculo.km)} km · ${fmtNumero(calculo.litros, 1)} L`, { distancia, consumo, unidad, precio, personas, idaVuelta })}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        Estima cuánto gastarás en combustible en un viaje y cuánto le toca a cada uno si lo
        comparten.
      </AvisoInfo>

      <Seccion
        titulo="Tu viaje"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setDistancia('460');
              setConsumo('12');
              setUnidad('kml');
              setPrecio('1300');
              setPersonas('3');
              setIdaVuelta('si');
              p.setCalculado(false);
            }}
          />
        }>
        <FilaCampos>
          <Columna>
            <CampoNumero label="Distancia" value={distancia} onChangeText={setDistancia} placeholder="460" sufijo="km" maxLength={6} />
          </Columna>
          <Columna>
            <CampoNumero label="Precio por litro" value={precio} onChangeText={setPrecio} placeholder="1300" sufijo="$" maxLength={5} />
          </Columna>
        </FilaCampos>
        <Segmentado
          label="Ida y vuelta"
          opciones={[
            { id: 'no', texto: 'Solo ida' },
            { id: 'si', texto: 'Ida y vuelta' },
          ]}
          valor={idaVuelta}
          onCambiar={setIdaVuelta}
        />
        <FilaCampos>
          <Columna>
            <CampoNumero label="Rendimiento" value={consumo} onChangeText={setConsumo} placeholder="12" sufijo={unidad === 'kml' ? 'km/L' : 'L/100'} maxLength={5} />
          </Columna>
          <Columna>
            <CampoNumero label="Personas" value={personas} onChangeText={setPersonas} placeholder="1" maxLength={2} />
          </Columna>
        </FilaCampos>
        <Segmentado
          label="El rendimiento está en"
          opciones={[
            { id: 'kml', texto: 'km por litro' },
            { id: 'lkm', texto: 'L cada 100 km' },
          ]}
          valor={unidad}
          onCambiar={setUnidad}
        />
        <ChipsRapidos opciones={['8', '10', '12', '15']} valorActual={consumo} onElegir={setConsumo} />
      </Seccion>

      <BotonPrimario label="Calcular gasto" icono="car-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo="Gasto en combustible"
          valor={fmtPesos(calculo.costo)}
          tono="info"
          badge={`${fmtNumero(calculo.litros, 1)} litros`}
          descripcion={n > 1 ? `${fmtPesos(calculo.porPersona)} por persona (${n} personas)` : `${fmtPesos(calculo.porKm)} por kilómetro`}
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              { key: 'km', label: 'Kilómetros totales', operacion: idaVuelta === 'si' ? `${fmtNumero(d)} × 2` : undefined, valor: `${fmtNumero(calculo.km)} km` },
              {
                key: 'l',
                label: 'Litros necesarios',
                operacion: unidad === 'kml' ? `${fmtNumero(calculo.km)} ÷ ${fmtNumero(c)} km/L` : `${fmtNumero(calculo.km)} ÷ 100 × ${fmtNumero(c)}`,
                valor: `${fmtNumero(calculo.litros, 2)} L`,
              },
              { key: 'c', label: 'Costo', operacion: `${fmtNumero(calculo.litros, 2)} L × ${fmtPesos(pr)}`, valor: fmtPesos(calculo.costo) },
              ...(n > 1 ? [{ key: 'pp', label: 'Por persona', operacion: `÷ ${n}`, valor: fmtPesos(calculo.porPersona) }] : []),
            ]}
            total={{ label: 'Total', valor: fmtPesos(calculo.costo) }}
            tonoTotal="info"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="¿Cómo se calcula?"
        texto="Con el rendimiento del auto se obtienen los litros que gastarás en la distancia, y se multiplican por el precio del litro. El rendimiento real baja con aire acondicionado, carga y velocidad alta."
        formula="Costo = (km ÷ rendimiento) × precio por litro"
        tip="En carretera los autos suelen rendir más que en ciudad. Si no conoces tu rendimiento, 10 a 12 km/L es un valor típico para un auto mediano."
      />
    </PantallaCalculadora>
  );
}

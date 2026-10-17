import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Segmentado } from '@/components/calculadora/campos';
import { CamposCorporales, DATOS_EJEMPLO, DATOS_VACIOS, leerDatos } from '@/components/calculadora/datos-corporales';
import { PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { Acento, Colors } from '@/constants/theme';
import { fmtNumero } from '@/lib/matematica';
import { NIVELES_ACTIVIDAD, tmbMifflin, type NivelActividad } from '@/lib/salud';

const CALC_ID = 'calorias';
const colors = Colors.dark;

type Objetivo = 'bajar' | 'mantener' | 'subir';
const AJUSTE: Record<Objetivo, number> = { bajar: 0.85, mantener: 1, subir: 1.15 };
const PROTEINA_G_KG = 1.8; // igual que la web
const GRASA_PCT = 0.25;

export default function CaloriasScreen() {
  const [datos, setDatos] = useState(DATOS_VACIOS);
  const [nivel, setNivel] = useState<NivelActividad>('1.55');
  const [objetivo, setObjetivo] = useState<Objetivo>('mantener');
  const p = usePantallaCalculo(CALC_ID, [datos, nivel, objetivo], (d: { datos: typeof datos; nivel: NivelActividad; objetivo: Objetivo }) => { setDatos(d.datos); setNivel(d.nivel); setObjetivo(d.objetivo); });
  const d = leerDatos(datos);

  const calculo = useMemo(() => {
    if (!d.ok) return null;
    const tmb = tmbMifflin(d.sexo, d.peso, d.altura, d.edad);
    const gasto = tmb * Number(nivel);
    const kcal = gasto * AJUSTE[objetivo];
    const proteina = d.peso * PROTEINA_G_KG;
    const grasa = (kcal * GRASA_PCT) / 9;
    const carbos = Math.max(0, (kcal - proteina * 4 - grasa * 9) / 4);
    return { tmb, gasto, kcal, proteina, grasa, carbos };
  }, [d.ok, d.sexo, d.peso, d.altura, d.edad, nivel, objetivo]);

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setDatos(DATOS_VACIOS);
        p.reiniciar();
      }}
      onGuardar={() =>
        calculo && p.guardar(`${fmtNumero(calculo.kcal, 0)} kcal`, `${objetivo} · P ${fmtNumero(calculo.proteina, 0)} g · G ${fmtNumero(calculo.grasa, 0)} g · C ${fmtNumero(calculo.carbos, 0)} g`, { datos, nivel, objetivo })
      }
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        Estima cuántas calorías comer al día según tu objetivo y cómo repartirlas en proteínas,
        grasas y carbohidratos. Es una guía general, no reemplaza a un nutricionista.
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
        <Segmentado label="Actividad física" opciones={NIVELES_ACTIVIDAD.map((n) => ({ id: n.id, texto: n.texto }))} valor={nivel} onCambiar={setNivel} />
        <Segmentado
          label="Objetivo"
          opciones={[
            { id: 'bajar', texto: 'Bajar (−15%)' },
            { id: 'mantener', texto: 'Mantener' },
            { id: 'subir', texto: 'Subir (+15%)' },
          ]}
          valor={objetivo}
          onCambiar={setObjetivo}
        />
      </Seccion>

      <BotonPrimario label="Calcular" icono="nutrition-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo="Calorías diarias"
          valor={`${fmtNumero(calculo.kcal, 0)} kcal`}
          tono="info"
          badge={objetivo === 'bajar' ? 'Déficit' : objetivo === 'subir' ? 'Superávit' : 'Mantención'}
          descripcion={`Tu gasto diario estimado es ${fmtNumero(calculo.gasto, 0)} kcal`}
          onLayout={p.onLayoutResultado}>
          <View style={styles.macros}>
            <Macro nombre="Proteínas" gramos={calculo.proteina} kcal={calculo.proteina * 4} total={calculo.kcal} />
            <Macro nombre="Grasas" gramos={calculo.grasa} kcal={calculo.grasa * 9} total={calculo.kcal} />
            <Macro nombre="Carbohidratos" gramos={calculo.carbos} kcal={calculo.carbos * 4} total={calculo.kcal} />
          </View>
          <DetalleCalculo
            filas={[
              { key: 'tmb', label: 'Metabolismo basal', operacion: 'Mifflin-St Jeor', valor: `${fmtNumero(calculo.tmb, 0)} kcal` },
              { key: 'g', label: 'Gasto diario', operacion: `TMB × ${nivel.replace('.', ',')}`, valor: `${fmtNumero(calculo.gasto, 0)} kcal` },
              { key: 'p', label: 'Proteína', operacion: `${fmtNumero(d.peso)} kg × ${String(PROTEINA_G_KG).replace('.', ',')} g/kg`, valor: `${fmtNumero(calculo.proteina, 0)} g` },
              { key: 'gr', label: 'Grasa (25% de las kcal)', operacion: 'kcal × 25% ÷ 9', valor: `${fmtNumero(calculo.grasa, 0)} g` },
              { key: 'c', label: 'Carbohidratos (el resto)', operacion: '(kcal − P·4 − G·9) ÷ 4', valor: `${fmtNumero(calculo.carbos, 0)} g` },
            ]}
            total={{ label: 'Objetivo diario', valor: `${fmtNumero(calculo.kcal, 0)} kcal` }}
            tonoTotal="info"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="¿Cómo se reparte?"
        texto="Cada gramo de proteína y de carbohidrato aporta 4 kcal y cada gramo de grasa 9 kcal. Primero se fija la proteína según tu peso, luego la grasa como 25% de las calorías, y el resto son carbohidratos."
        formula="kcal = Gasto diario × ajuste según objetivo"
        tip="En adolescentes en crecimiento no se recomiendan déficits calóricos sin supervisión profesional."
      />
    </PantallaCalculadora>
  );
}

function Macro({ nombre, gramos, kcal, total }: { nombre: string; gramos: number; kcal: number; total: number }) {
  const pct = total > 0 ? (kcal / total) * 100 : 0;
  return (
    <View style={styles.macro}>
      <Text style={styles.macroNombre}>{nombre.toUpperCase()}</Text>
      <Text style={styles.macroGramos}>{fmtNumero(gramos, 0)} g</Text>
      <Text style={[styles.macroPct, { color: colors.textMuted }]}>{fmtNumero(pct, 0)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  macros: {
    flexDirection: 'row',
    gap: 8,
  },
  macro: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Acento.borde,
    backgroundColor: Acento.fondo,
  },
  macroNombre: {
    color: Acento.claro,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  macroGramos: {
    color: '#e0e7ff',
    fontSize: 18,
    fontWeight: '800',
  },
  macroPct: {
    fontSize: 11,
    fontWeight: '600',
  },
});

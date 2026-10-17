import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CampoNumero, Segmentado } from '@/components/calculadora/campos';
import { Columna, FilaCampos, PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { Acento, Colors } from '@/constants/theme';
import { fmtNumero, fmtPesos, leerEntero, leerNumero, leerPesos } from '@/lib/matematica';

const CALC_ID = 'interes-compuesto';
const colors = Colors.dark;

type Frecuencia = '1' | '2' | '4' | '12';
const FRECUENCIAS: { id: Frecuencia; texto: string }[] = [
  { id: '12', texto: 'Mensual' },
  { id: '4', texto: 'Trim.' },
  { id: '2', texto: 'Semest.' },
  { id: '1', texto: 'Anual' },
];

export default function InteresCompuestoScreen() {
  const [capital, setCapital] = useState('');
  const [aporte, setAporte] = useState('');
  const [tasa, setTasa] = useState('');
  const [anios, setAnios] = useState('');
  const [frec, setFrec] = useState<Frecuencia>('12');
  const p = usePantallaCalculo(CALC_ID, [capital, aporte, tasa, anios, frec], (d: { capital: string; aporte: string; tasa: string; anios: string; frec: Frecuencia }) => { setCapital(d.capital); setAporte(d.aporte); setTasa(d.tasa); setAnios(d.anios); setFrec(d.frec); });

  const P = leerPesos(capital);
  const A = aporte.trim() === '' ? 0 : leerPesos(aporte);
  const r = leerNumero(tasa);
  const t = leerEntero(anios);
  const n = Number(frec);

  const calculo = useMemo(() => {
    if (!(P > 0 && r > 0 && t > 0 && t <= 60 && A >= 0)) return null;
    const i = r / 100 / n;
    // Misma fórmula que la web: aportes al inicio de cada periodo de capitalización
    const filas = Array.from({ length: t }, (_, k) => {
      const anio = k + 1;
      const m = n * anio;
      const capitalFinal = P * Math.pow(1 + i, m);
      const valorAportes = A > 0 ? A * ((Math.pow(1 + i, m) - 1) / i) * (1 + i) : 0;
      const total = capitalFinal + valorAportes;
      const aportado = P + A * n * anio;
      return { anio, total, aportado, interes: total - aportado };
    });
    const ultimo = filas[filas.length - 1];
    return { filas, ...ultimo, rendimiento: (ultimo.total / ultimo.aportado - 1) * 100 };
  }, [P, A, r, t, n]);

  // En la tabla se muestran como máximo ~10 hitos para no alargar la pantalla
  const hitos = calculo
    ? calculo.filas.filter((fila, idx, arr) => arr.length <= 10 || fila.anio % Math.ceil(arr.length / 10) === 0 || idx === arr.length - 1)
    : [];

  const frecTexto = FRECUENCIAS.find((x) => x.id === frec)!.texto.toLowerCase();

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setCapital('');
        setAporte('');
        setTasa('');
        setAnios('');
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(fmtPesos(calculo.total), `${t} años al ${fmtNumero(r)}% · interés ${fmtPesos(calculo.interes)}`, { capital, aporte, tasa, anios, frec })}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        En el interés compuesto los intereses se suman al capital y luego también generan intereses.
        Simula tu ahorro con un monto inicial y aportes periódicos opcionales.
      </AvisoInfo>

      <Seccion
        titulo="Tu ahorro"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setCapital('500000');
              setAporte('50000');
              setTasa('7');
              setAnios('10');
              setFrec('12');
              p.setCalculado(false);
            }}
          />
        }>
        <FilaCampos>
          <Columna>
            <CampoNumero label="Monto inicial" value={capital} onChangeText={setCapital} placeholder="500000" sufijo="$" ayuda={P > 0 ? fmtPesos(P) : undefined} maxLength={12} />
          </Columna>
          <Columna>
            <CampoNumero label="Aporte (opc.)" value={aporte} onChangeText={setAporte} placeholder="0" sufijo="$" ayuda={A > 0 ? `${fmtPesos(A)} c/periodo` : 'Por periodo'} maxLength={12} />
          </Columna>
        </FilaCampos>
        <FilaCampos>
          <Columna>
            <CampoNumero label="Tasa anual" value={tasa} onChangeText={setTasa} placeholder="7" sufijo="%" />
          </Columna>
          <Columna>
            <CampoNumero
              label="Plazo"
              value={anios}
              onChangeText={setAnios}
              placeholder="10"
              sufijo="años"
              error={anios.trim() !== '' && !(t > 0 && t <= 60) ? 'Entero entre 1 y 60' : null}
              maxLength={2}
            />
          </Columna>
        </FilaCampos>
        <Segmentado label="Capitalización y aportes" opciones={FRECUENCIAS} valor={frec} onCambiar={setFrec} />
      </Seccion>

      <BotonPrimario label="Simular" icono="trending-up-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo={`En ${t} ${t === 1 ? 'año' : 'años'} tendrás`}
          valor={fmtPesos(calculo.total)}
          tono="ok"
          badge={`+${fmtNumero(calculo.rendimiento, 1)}%`}
          descripcion={`Aportaste ${fmtPesos(calculo.aportado)} y ganaste ${fmtPesos(calculo.interes)} en intereses`}
          onLayout={p.onLayoutResultado}>
          <View style={[styles.tabla, { borderColor: colors.border }]}>
            <View style={[styles.fila, styles.head]}>
              <Text style={[styles.celda, styles.headTexto, { flex: 0.6 }]}>Año</Text>
              <Text style={[styles.celda, styles.headTexto]}>Aportado</Text>
              <Text style={[styles.celda, styles.headTexto]}>Total</Text>
            </View>
            {hitos.map((fila) => (
              <View key={fila.anio} style={[styles.fila, { borderTopColor: colors.border }]}>
                <Text style={[styles.celda, { flex: 0.6, color: colors.textSecondary }]}>{fila.anio}</Text>
                <Text style={[styles.celda, { color: colors.textSecondary }]}>{fmtPesos(fila.aportado)}</Text>
                <Text style={[styles.celda, { color: colors.text, fontWeight: '700' }]}>{fmtPesos(fila.total)}</Text>
              </View>
            ))}
          </View>

          <DetalleCalculo
            filas={[
              { key: 'tasa', label: `Tasa por periodo (${frecTexto})`, operacion: `${fmtNumero(r)}% ÷ ${n}`, valor: `${fmtNumero(r / n, 4)}%` },
              { key: 'per', label: 'Periodos totales', operacion: `${n} × ${t}`, valor: String(n * t) },
              { key: 'cap', label: 'Monto inicial capitalizado', operacion: `${fmtPesos(P)} × (1 + i)^${n * t}`, valor: fmtPesos(P * Math.pow(1 + r / 100 / n, n * t)) },
              { key: 'int', label: 'Intereses ganados', valor: fmtPesos(calculo.interes) },
            ]}
            total={{ label: 'Total acumulado', valor: fmtPesos(calculo.total) }}
            tonoTotal="ok"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="Interés compuesto"
        texto="Cada periodo, el interés se calcula sobre el capital más los intereses anteriores. Por eso el ahorro crece cada vez más rápido: es una función exponencial."
        formula="Cf = C · (1 + r/n)^(n·t)"
        tip="Regla del 72: divide 72 por la tasa anual y obtendrás aproximadamente en cuántos años se duplica tu dinero (al 6%, unos 12 años)."
      />
    </PantallaCalculadora>
  );
}

const styles = StyleSheet.create({
  tabla: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  head: {
    borderTopWidth: 0,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  headTexto: {
    color: Acento.claro,
    fontWeight: '700',
    fontSize: 12,
  },
  celda: {
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
  },
});

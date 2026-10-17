import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';

import { getEntradaHistorial } from '@/lib/storage';

/**
 * Si la calculadora se abrió desde "Cálculos guardados" (`?entrada=<id>`), lee los datos
 * que se guardaron en ese cálculo y se los entrega a `aplicar` una sola vez, para que la
 * calculadora llene sus campos. Las entradas antiguas sin datos no hacen nada.
 */
export function useRestaurarEntrada<T>(aplicar: (datos: T) => void) {
  const { entrada } = useLocalSearchParams<{ entrada?: string }>();
  const restaurada = useRef<string | null>(null);
  const aplicarRef = useRef(aplicar);

  // Siempre la última versión de `aplicar`, sin volver a disparar la lectura de la entrada
  useEffect(() => {
    aplicarRef.current = aplicar;
  });

  useEffect(() => {
    if (!entrada || restaurada.current === entrada) return;
    restaurada.current = entrada;
    let activo = true;
    getEntradaHistorial(entrada).then((e) => {
      if (activo && e?.datos) aplicarRef.current(e.datos as T);
    });
    return () => {
      activo = false;
    };
  }, [entrada]);
}

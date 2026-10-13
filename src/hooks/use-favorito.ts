import { useCallback, useEffect, useState } from 'react';

import { getFavoritos, toggleFavorito } from '@/lib/storage';

/** Estado de favorito de una calculadora, persistido en AsyncStorage. */
export function useFavorito(calculadoraId: string) {
  const [esFavorito, setEsFavorito] = useState(false);

  useEffect(() => {
    let activo = true;
    getFavoritos().then((ids) => {
      if (activo) setEsFavorito(ids.includes(calculadoraId));
    });
    return () => {
      activo = false;
    };
  }, [calculadoraId]);

  const alternar = useCallback(async () => {
    setEsFavorito((prev) => !prev); // respuesta inmediata en UI
    const nuevo = await toggleFavorito(calculadoraId);
    setEsFavorito(nuevo);
  }, [calculadoraId]);

  return { esFavorito, alternar };
}

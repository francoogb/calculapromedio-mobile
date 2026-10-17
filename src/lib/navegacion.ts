import { router } from 'expo-router';

/**
 * Salidas de las pantallas de cuenta (login, registro).
 * `dismissAll` solo funciona si hay pantallas apiladas debajo; si la pantalla de
 * cuenta se abrió sin nada debajo, expo-router avisa "POP_TO_TOP no fue manejada".
 */

/** "Continuar sin cuenta": cierra las pantallas de cuenta y vuelve a donde estaba el usuario. */
export function salirDePantallasDeCuenta(): void {
  if (router.canDismiss()) router.dismissAll();
  else router.replace('/');
}

/** Tras iniciar sesión o crear la cuenta: cierra las pantallas de cuenta y deja el inicio. */
export function entrarAlInicio(): void {
  if (router.canDismiss()) router.dismissAll();
  router.replace('/');
}

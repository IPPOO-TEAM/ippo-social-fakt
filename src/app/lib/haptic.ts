/** Léger haptic-feedback mobile via la Vibration API.
 *  Sans effet sur iOS (Safari ne supporte pas) et silencieux ailleurs. */
export function haptic(pattern: number | number[] = 8) {
  if (typeof navigator === 'undefined') return;
  if (!('vibrate' in navigator)) return;
  try { navigator.vibrate(pattern); } catch {}
}

export const tap = () => haptic(8);
export const select = () => haptic(12);
export const success = () => haptic([10, 30, 10]);
export const warn = () => haptic([20, 40, 20]);

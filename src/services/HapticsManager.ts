/**
 * Super Pixel World - Gamepad Haptic Vibration Manager
 * Uses the HTML5 Gamepad API vibrationActuator ("dual-rumble") for tactile feedback.
 */

let isHapticsSuspended = false;

/**
 * Set whether haptic vibrations are currently paused/suspended (e.g., during game pause).
 */
export function setHapticsSuspended(suspended: boolean): void {
  isHapticsSuspended = suspended;
}

/**
 * Check whether haptics are suspended.
 */
export function isHapticsSuspendedState(): boolean {
  return isHapticsSuspended;
}

/**
 * Triggers haptic vibration feedback on the first connected gamepad.
 *
 * @param durationMs Duration of vibration in milliseconds (default: 200ms)
 * @param strongMagnitude Low-frequency rumble intensity (0.0 - 1.0, default: 1.0)
 * @param weakMagnitude High-frequency rumble intensity (0.0 - 1.0, default: 0.8)
 */
export function triggerVibration(
  durationMs: number = 200,
  strongMagnitude: number = 1.0,
  weakMagnitude: number = 0.8
): void {
  if (isHapticsSuspended) {
    return;
  }

  try {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
      return;
    }

    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp || !gp.connected) continue;

      // Check if vibrationActuator exists
      const actuator = (gp as any).vibrationActuator;
      if (actuator && typeof actuator.playEffect === 'function') {
        actuator
          .playEffect('dual-rumble', {
            startDelay: 0,
            duration: Math.max(10, Math.round(durationMs)),
            strongMagnitude: Math.min(1.0, Math.max(0.0, strongMagnitude)),
            weakMagnitude: Math.min(1.0, Math.max(0.0, weakMagnitude)),
          })
          .catch(() => {
            // Silently ignore browser permission or effect rejection
          });

        // Trigger on the primary connected gamepad and break
        break;
      }
    }
  } catch (_err) {
    // Fail silently without interrupting gameplay or physics
  }
}

export default {
  triggerVibration,
  setHapticsSuspended,
  isHapticsSuspendedState,
};

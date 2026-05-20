// Match the on-device firmware in hardware/Vehicle_BlackBox/Core/Src/main.c
// where `STATUS: UNSAFE` is set when `Gforce > 1.50f`.

export const G_FORCE = {
  safe: 1.20,
  caution: 1.40,
  warning: 1.50, // hardware threshold for UNSAFE
  critical: 2.00,
} as const;

export const SPEED = {
  maxDisplay: 220,
  urbanLimit: 50,
  highwayLimit: 120,
} as const;

export const CRASH = {
  autoCallCountdownSec: 30,
  defaultSensitivityG: 1.5,
} as const;

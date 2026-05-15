export const G_FORCE = {
  safe: 1.5,
  caution: 2.5,
  warning: 3.5,
  critical: 5.0,
} as const;

export const SPEED = {
  maxDisplay: 220,
  urbanLimit: 50,
  highwayLimit: 120,
} as const;

export const CRASH = {
  autoCallCountdownSec: 30,
  defaultSensitivityG: 3.5,
} as const;

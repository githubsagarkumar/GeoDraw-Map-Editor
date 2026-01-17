/**
 * Configuration file for shape limits.
 * Adjust these values to control the maximum number of shapes per type.
 */
export const SHAPE_LIMITS = {
  polygon: 10,
  circle: 5,
  rectangle: 10,
  lineString: 20, // LineStrings are not subject to overlap rules
} as const;

export type ShapeType = keyof typeof SHAPE_LIMITS;

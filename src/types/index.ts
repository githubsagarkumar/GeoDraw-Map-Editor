import { Feature, Geometry } from 'geojson';
import { ShapeType } from '../config/shapeLimits';

/**
 * Extended GeoJSON Feature with application-specific properties
 */
export interface MapFeature extends Feature {
  id: string;
  properties: {
    shapeType: ShapeType;
    createdAt: string;
    [key: string]: unknown;
  };
  geometry: Geometry;
}

/**
 * Drawing state for the map
 */
export interface DrawingState {
  isDrawing: boolean;
  currentShapeType: ShapeType | null;
}

/**
 * Application state interface
 */
export interface AppState {
  features: MapFeature[];
  drawingState: DrawingState;
  error: string | null;
}

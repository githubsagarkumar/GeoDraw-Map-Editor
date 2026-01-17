import { useDrawing } from '../hooks/useDrawing';
import { useMapStore } from '../store/useMapStore';

/**
 * Component that handles drawing functionality.
 * Must be placed inside MapContainer to use useMap() hook.
 */
export function MapDrawingHandler() {
  const { drawingState } = useMapStore();
  useDrawing(drawingState.currentShapeType);
  return null;
}

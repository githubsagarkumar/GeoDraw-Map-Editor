import { useMapStore } from '../store/useMapStore';
import { ShapeType } from '../config/shapeLimits';
import { SHAPE_LIMITS } from '../config/shapeLimits';
import './Toolbar.css';

/**
 * Side toolbar component for drawing tools.
 * Provides buttons for Circle, Rectangle, Polygon, and LineString.
 */
export function Toolbar() {
  const { drawingState, setDrawingState, getFeaturesByType } = useMapStore();

  const handleShapeSelect = (shapeType: ShapeType) => {
    const featuresOfType = getFeaturesByType(shapeType);
    
    // Check limit
    if (featuresOfType.length >= SHAPE_LIMITS[shapeType]) {
      useMapStore.getState().setError(
        `Maximum limit of ${SHAPE_LIMITS[shapeType]} ${shapeType}s reached.`
      );
      return;
    }

    // Toggle: if already selected, deselect
    if (drawingState.currentShapeType === shapeType) {
      setDrawingState({ isDrawing: false, currentShapeType: null });
    } else {
      setDrawingState({ isDrawing: false, currentShapeType: shapeType });
    }
  };

  const getRemainingCount = (shapeType: ShapeType): number => {
    const featuresOfType = getFeaturesByType(shapeType);
    return SHAPE_LIMITS[shapeType] - featuresOfType.length;
  };

  return (
    <div className="toolbar">
      <div className="toolbar-header">
        <h2>Drawing Tools</h2>
      </div>
      
      <div className="toolbar-buttons">
        <button
          className={`toolbar-button ${drawingState.currentShapeType === 'circle' ? 'active' : ''}`}
          onClick={() => handleShapeSelect('circle')}
          disabled={getRemainingCount('circle') === 0}
          title={`Draw Circle (${getRemainingCount('circle')} remaining)`}
        >
          <span className="button-icon">⭕</span>
          <span>Circle</span>
          <span className="button-count">{getRemainingCount('circle')}/{SHAPE_LIMITS.circle}</span>
        </button>

        <button
          className={`toolbar-button ${drawingState.currentShapeType === 'rectangle' ? 'active' : ''}`}
          onClick={() => handleShapeSelect('rectangle')}
          disabled={getRemainingCount('rectangle') === 0}
          title={`Draw Rectangle (${getRemainingCount('rectangle')} remaining)`}
        >
          <span className="button-icon">▭</span>
          <span>Rectangle</span>
          <span className="button-count">{getRemainingCount('rectangle')}/{SHAPE_LIMITS.rectangle}</span>
        </button>

        <button
          className={`toolbar-button ${drawingState.currentShapeType === 'polygon' ? 'active' : ''}`}
          onClick={() => handleShapeSelect('polygon')}
          disabled={getRemainingCount('polygon') === 0}
          title={`Draw Polygon (${getRemainingCount('polygon')} remaining)`}
        >
          <span className="button-icon">⬟</span>
          <span>Polygon</span>
          <span className="button-count">{getRemainingCount('polygon')}/{SHAPE_LIMITS.polygon}</span>
        </button>

        <button
          className={`toolbar-button ${drawingState.currentShapeType === 'lineString' ? 'active' : ''}`}
          onClick={() => handleShapeSelect('lineString')}
          disabled={getRemainingCount('lineString') === 0}
          title={`Draw Line (${getRemainingCount('lineString')} remaining)`}
        >
          <span className="button-icon">📏</span>
          <span>Line String</span>
          <span className="button-count">{getRemainingCount('lineString')}/{SHAPE_LIMITS.lineString}</span>
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import { useMapStore } from '../store/useMapStore';
import { MapFeature } from '../types';
import { ShapeType } from '../config/shapeLimits';
import { processPolygonalShape, isPolygonalShape } from '../utils/overlapDetection';
import { SHAPE_LIMITS } from '../config/shapeLimits';

/**
 * Custom hook to handle drawing functionality on the map.
 * Manages Leaflet Draw controls and handles shape creation.
 */
export function useDrawing(shapeType: ShapeType | null) {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const { addFeature, setDrawingState, setError, getFeaturesByType } = useMapStore();

  useEffect(() => {
    if (!shapeType) {
      // Remove draw control if no shape type is selected
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
      return;
    }

    // Check shape limit
    const featuresOfType = getFeaturesByType(shapeType);
    if (featuresOfType.length >= SHAPE_LIMITS[shapeType]) {
      setError(`Maximum limit of ${SHAPE_LIMITS[shapeType]} ${shapeType}s reached.`);
      setDrawingState({ isDrawing: false, currentShapeType: null });
      return;
    }

    // Configure draw options based on shape type
    const drawOptions: L.Control.DrawConstructorOptions = {
      draw: {
        polygon: shapeType === 'polygon' ? {} : false,
        // Fix for Vite/leaflet-draw rectangle bug: disable showArea
        rectangle: shapeType === 'rectangle' ? { showArea: false } : false,
        circle: shapeType === 'circle' ? {} : false,
        polyline: shapeType === 'lineString' ? {} : false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: new L.FeatureGroup(),
        remove: false,
      },
    };

    // Remove existing control if any
    if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
    }

    // Create and add new draw control
    const drawControl = new L.Control.Draw(drawOptions);
    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    // Programmatically start drawing for the selected shape type
    // This allows direct click-and-drag without needing to click the toolbar button
    setTimeout(() => {
      try {
        if (shapeType === 'rectangle') {
          const rectangleHandler = new L.Draw.Rectangle(map as any, drawOptions.draw?.rectangle as L.DrawOptions.RectangleOptions);
          rectangleHandler.enable();
        } else if (shapeType === 'circle') {
          const circleHandler = new L.Draw.Circle(map as any, drawOptions.draw?.circle as L.DrawOptions.CircleOptions);
          circleHandler.enable();
        } else if (shapeType === 'polygon') {
          const polygonHandler = new L.Draw.Polygon(map as any, drawOptions.draw?.polygon as L.DrawOptions.PolygonOptions);
          polygonHandler.enable();
        } else if (shapeType === 'lineString') {
          const polylineHandler = new L.Draw.Polyline(map as any, drawOptions.draw?.polyline as L.DrawOptions.PolylineOptions);
          polylineHandler.enable();
        }
      } catch (error) {
        console.warn('Failed to programmatically start drawing:', error);
      }
    }, 100);

    // Handle draw start
    const onDrawStart = () => {
      setDrawingState({ isDrawing: true, currentShapeType: shapeType });
      setError(null);
    };

    // Handle draw created
    const onDrawCreated = (e: L.LeafletEvent) => {
      const drawEvent = e as unknown as L.DrawEvents.Created;
      const { layer } = drawEvent;
      const geoJSON = layer.toGeoJSON() as MapFeature;

      // Generate unique ID
      const id = `feature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Extract radius for circles (Leaflet circles store radius in the layer, not GeoJSON)
      const baseProperties = geoJSON.properties || {};
      const properties: MapFeature['properties'] = {
        ...baseProperties,
        shapeType,
        createdAt: new Date().toISOString(),
      };

      if (shapeType === 'circle' && layer instanceof L.Circle) {
        properties.radius = layer.getRadius();
      }

      // Create feature with metadata
      const feature: MapFeature = {
        ...geoJSON,
        id,
        properties,
      };

      // Process polygonal shapes for overlap detection
      if (isPolygonalShape(shapeType)) {
        const existingFeatures = useMapStore.getState().features;
        const processedGeometry = processPolygonalShape(feature, existingFeatures);

        if (!processedGeometry) {
          // Shape was rejected (fully encloses existing shape)
          setError(
            `Cannot create ${shapeType}: it fully encloses an existing shape.`
          );
          map.removeLayer(layer);
          setDrawingState({ isDrawing: false, currentShapeType: null });
          return;
        }

        // Check if geometry was actually modified (trimmed)
        // Compare coordinates to determine if geometry changed
        const originalGeometry = feature.geometry;
        let geometryChanged = false;
        
        if (originalGeometry.type === 'Polygon' && processedGeometry.type === 'Polygon') {
          // Compare coordinate arrays - check if they have the same number of points
          const originalCoords = originalGeometry.coordinates[0];
          const processedCoords = processedGeometry.coordinates[0];
          
          // If coordinate count differs, geometry was modified
          if (originalCoords.length !== processedCoords.length) {
            geometryChanged = true;
          } else {
            // Compare coordinates with tolerance for floating point differences
            for (let i = 0; i < originalCoords.length; i++) {
              const orig = originalCoords[i];
              const proc = processedCoords[i];
              if (Math.abs(orig[0] - proc[0]) > 0.000001 || Math.abs(orig[1] - proc[1]) > 0.000001) {
                geometryChanged = true;
                break;
              }
            }
          }
        } else {
          // Different geometry types means it was modified
          geometryChanged = true;
        }

        if (geometryChanged) {
          // Geometry was trimmed, replace the layer
          feature.geometry = processedGeometry;
          map.removeLayer(layer);

          // Create new layer from processed geometry
          const processedLayer = L.geoJSON(processedGeometry, {
            style: {
              color: '#3388ff',
              weight: 2,
              fillColor: '#3388ff',
              fillOpacity: 0.2,
            },
          });

          // Add processed layer to map
          processedLayer.addTo(map);
        } else {
          // No changes, keep original layer (just style it if needed)
          if (layer instanceof L.Rectangle || layer instanceof L.Polygon || layer instanceof L.Circle) {
            layer.setStyle({
              color: '#3388ff',
              weight: 2,
              fillColor: '#3388ff',
              fillOpacity: 0.2,
            });
          }
        }

        // Store the feature (with processed geometry if trimmed, original if not)
        addFeature(feature);
      } else {
        // LineString: no overlap checking, add directly
        // Style the line
        if (layer instanceof L.Polyline) {
          layer.setStyle({
            color: '#3388ff',
            weight: 2,
          });
        }
        addFeature(feature);
      }

      // Reset drawing state
      setDrawingState({ isDrawing: false, currentShapeType: null });

      // Remove draw control after drawing
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
    };

    // Handle draw cancel/stop
    const onDrawCancel = () => {
      setDrawingState({ isDrawing: false, currentShapeType: null });
      setError(null);
    };

    // Attach event listeners - use string literals for event names
    const drawStartEvent = 'draw:drawstart' as const;
    const drawCreatedEvent = 'draw:created' as const;
    const drawStopEvent = 'draw:drawstop' as const;
    
    map.on(drawStartEvent, onDrawStart);
    map.on(drawCreatedEvent, onDrawCreated);
    map.on(drawStopEvent, onDrawCancel);

    // Cleanup
    return () => {
      map.off(drawStartEvent, onDrawStart);
      map.off(drawCreatedEvent, onDrawCreated);
      map.off(drawStopEvent, onDrawCancel);
      
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
    };
  }, [map, shapeType, addFeature, setDrawingState, setError, getFeaturesByType]);

  return null;
}

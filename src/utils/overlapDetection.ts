// @ts-expect-error - Turf.js types have module resolution issues with package.json exports
import * as turf from '@turf/turf';
import { Feature, Polygon, MultiPolygon } from 'geojson';
import { MapFeature } from '../types';
import { ShapeType } from '../config/shapeLimits';

/**
 * Checks if a geometry is a polygonal shape (Circle, Rectangle, or Polygon)
 */
export function isPolygonalShape(shapeType: ShapeType): boolean {
  return shapeType === 'polygon' || shapeType === 'circle' || shapeType === 'rectangle';
}

/**
 * Converts a circle feature to a polygon for spatial operations.
 * Leaflet circles are stored as Point features with a radius property.
 */
function circleToPolygon(circleFeature: Feature): Polygon {
  let center: [number, number] = [0, 0];
  if (circleFeature.geometry.type === 'Point') {
    const coords = circleFeature.geometry.coordinates;
    if (coords.length >= 2) {
      center = [coords[0], coords[1]];
    }
  }
  
  // Get radius from properties (in meters)
  const radius = (circleFeature.properties as { radius?: number })?.radius || 1000;
  
  // Create a circular polygon using Turf.js
  const circle = turf.circle(center, radius, { units: 'meters', steps: 64 });
  return circle.geometry as Polygon;
}

/**
 * Converts a rectangle feature to a polygon.
 * Leaflet rectangles are stored as Polygon features, but we ensure it's valid.
 */
function rectangleToPolygon(rectangleFeature: Feature): Polygon {
  if (rectangleFeature.geometry.type === 'Polygon') {
    return rectangleFeature.geometry;
  }
  throw new Error('Invalid rectangle geometry');
}

/**
 * Normalizes any polygonal shape to a Polygon for spatial operations.
 */
function normalizeToPolygon(feature: MapFeature): Polygon {
  const shapeType = feature.properties.shapeType;
  
  if (shapeType === 'circle') {
    return circleToPolygon(feature);
  } else if (shapeType === 'rectangle') {
    return rectangleToPolygon(feature);
  } else if (shapeType === 'polygon' && feature.geometry.type === 'Polygon') {
    return feature.geometry;
  } else if (shapeType === 'polygon' && feature.geometry.type === 'MultiPolygon') {
    // Convert MultiPolygon to Polygon (take first polygon)
    const multiPoly = feature.geometry as MultiPolygon;
    return multiPoly.coordinates.length > 0 
      ? { type: 'Polygon', coordinates: multiPoly.coordinates[0] }
      : { type: 'Polygon', coordinates: [] };
  }
  
  throw new Error(`Cannot normalize shape type: ${shapeType}`);
}

/**
 * Checks if a new polygon fully encloses any existing polygon.
 * Returns true if the new shape completely contains an existing shape.
 */
function isFullyEnclosing(
  newPolygon: Polygon,
  existingPolygons: Polygon[]
): boolean {
  for (const existingPoly of existingPolygons) {
    // Check if new polygon contains existing polygon
    const newPolyFeature = turf.polygon(newPolygon.coordinates);
    const existingPolyFeature = turf.polygon(existingPoly.coordinates);
    
    // Check if new polygon fully contains existing polygon
    const contains = turf.booleanContains(newPolyFeature, existingPolyFeature);
    
    if (contains) {
      return true;
    }
  }
  return false;
}

/**
 * Trims a new polygon by removing overlapping areas with existing polygons.
 * Uses Turf.js difference operation to subtract overlapping regions.
 */
function trimOverlapping(
  newPolygon: Polygon,
  existingPolygons: Polygon[]
): Polygon | null {
  let result: Feature<Polygon> | null = turf.polygon(newPolygon.coordinates);
  
  for (const existingPoly of existingPolygons) {
    const existingPolyFeature = turf.polygon(existingPoly.coordinates);
    
    // Calculate difference: newPolygon - existingPolygon
    try {
      const difference = turf.difference(result, existingPolyFeature);
      
      if (!difference) {
        // New polygon is completely covered by existing polygon
        return null;
      }
      
      // Handle MultiPolygon result (take largest polygon)
      if (difference.geometry.type === 'MultiPolygon') {
        // Find the largest polygon in the MultiPolygon
        let largestArea = 0;
        let largestPoly: number[][][] | null = null;
        
        for (const poly of difference.geometry.coordinates) {
          const polyFeature = turf.polygon(poly);
          const area = turf.area(polyFeature);
          if (area > largestArea) {
            largestArea = area;
            largestPoly = poly;
          }
        }
        
        if (largestPoly) {
          result = turf.polygon(largestPoly);
        } else {
          return null;
        }
      } else if (difference.geometry.type === 'Polygon') {
        result = difference as Feature<Polygon>;
      } else {
        return null;
      }
    } catch (error) {
      // If difference operation fails, return null
      console.warn('Difference operation failed:', error);
      return null;
    }
  }
  
  return result ? result.geometry : null;
}

/**
 * Main function to validate and process a new polygonal shape against existing shapes.
 * 
 * Rules:
 * 1. If new shape fully encloses an existing shape → reject (return null)
 * 2. If new shape partially overlaps existing shapes → trim (return trimmed polygon)
 * 3. If no overlap or valid after trimming → return processed polygon
 * 
 * @param newFeature - The newly drawn feature to validate
 * @param existingFeatures - Array of existing features on the map
 * @returns Processed polygon geometry or null if should be rejected
 */
export function processPolygonalShape(
  newFeature: MapFeature,
  existingFeatures: MapFeature[]
): Polygon | null {
  // Filter only polygonal shapes from existing features
  const existingPolygonalFeatures = existingFeatures.filter((f) =>
    isPolygonalShape(f.properties.shapeType)
  );
  
  if (existingPolygonalFeatures.length === 0) {
    // No existing polygons, no need to check
    // For rectangles and polygons, return as-is (they're already polygons)
    if (newFeature.geometry.type === 'Polygon') {
      return newFeature.geometry;
    }
    if (newFeature.geometry.type === 'MultiPolygon') {
      // Take first polygon from MultiPolygon
      const multiPoly = newFeature.geometry;
      return multiPoly.coordinates.length > 0 
        ? { type: 'Polygon', coordinates: multiPoly.coordinates[0] }
        : null;
    }
    // Convert circle to polygon (circles are stored as Point with radius)
    if (newFeature.properties.shapeType === 'circle') {
      return normalizeToPolygon(newFeature);
    }
    // For rectangles, they should already be polygons in GeoJSON, but handle edge case
    return null;
  }
  
  // Normalize new feature to polygon
  let newPolygon: Polygon;
  try {
    newPolygon = normalizeToPolygon(newFeature);
  } catch (error) {
    console.error('Failed to normalize new feature:', error);
    return null;
  }
  
  // Normalize all existing polygons
  const existingPolygons: Polygon[] = [];
  for (const feature of existingPolygonalFeatures) {
    try {
      const poly = normalizeToPolygon(feature);
      existingPolygons.push(poly);
    } catch (error) {
      console.warn('Failed to normalize existing feature:', error);
      // Skip invalid features
    }
  }
  
  // Check if new polygon fully encloses any existing polygon
  if (isFullyEnclosing(newPolygon, existingPolygons)) {
    return null; // Reject: fully encloses existing shape
  }
  
  // Check for overlaps and trim if necessary
  // First, check if there's any intersection
  const newPolyFeature = turf.polygon(newPolygon.coordinates);
  let hasOverlap = false;
  
  for (const existingPoly of existingPolygons) {
    const existingPolyFeature = turf.polygon(existingPoly.coordinates);
    const intersects = turf.booleanIntersects(newPolyFeature, existingPolyFeature);
    
    if (intersects) {
      hasOverlap = true;
      break;
    }
  }
  
  if (!hasOverlap) {
    // No overlap, return original polygon
    return newPolygon;
  }
  
      // Has overlap, trim the new polygon
      const trimmedPolygon = trimOverlapping(newPolygon, existingPolygons);
      return trimmedPolygon || null;
}

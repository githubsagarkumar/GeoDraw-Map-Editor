import { FeatureCollection } from 'geojson';
import { MapFeature } from '../types';

/**
 * Exports all map features as a GeoJSON FeatureCollection.
 * Includes geometry and properties (shapeType, id, createdAt).
 */
export function exportToGeoJSON(features: MapFeature[]): FeatureCollection {
  const featureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: features.map((feature) => ({
      type: 'Feature',
      geometry: feature.geometry,
      properties: {
        shapeType: feature.properties.shapeType,
        id: feature.id,
        createdAt: feature.properties.createdAt,
      },
    })),
  };
  
  return featureCollection;
}

/**
 * Downloads the GeoJSON as a file.
 */
export function downloadGeoJSON(featureCollection: FeatureCollection, filename = 'map-features.geojson'): void {
  const jsonString = JSON.stringify(featureCollection, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

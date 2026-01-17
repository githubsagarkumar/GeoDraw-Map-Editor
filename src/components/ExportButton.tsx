import { useMapStore } from '../store/useMapStore';
import { exportToGeoJSON, downloadGeoJSON } from '../services/geojsonExport';
import './ExportButton.css';

/**
 * Export button component that exports all features as GeoJSON.
 */
export function ExportButton() {
  const { features } = useMapStore();

  const handleExport = () => {
    if (features.length === 0) {
      useMapStore.getState().setError('No features to export.');
      return;
    }

    const featureCollection = exportToGeoJSON(features);
    downloadGeoJSON(featureCollection);
  };

  return (
    <button className="export-button" onClick={handleExport} title="Export to GeoJSON">
      <span className="export-icon">💾</span>
      <span>Export GeoJSON</span>
    </button>
  );
}

import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useMapStore } from '../store/useMapStore';
import { MapDrawingHandler } from './MapDrawingHandler';

// Fix for default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

/**
 * Main Map component that renders OpenStreetMap tiles and handles drawing.
 */
export function Map() {
  const { features } = useMapStore();

  // Default center: London, UK (can be changed)
  const defaultCenter: [number, number] = [51.505, -0.09];
  const defaultZoom = 13;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100vh', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Drawing handler - must be inside MapContainer */}
      <MapDrawingHandler />
      
      {/* Render all features on the map */}
      {features.map((feature) => (
        <GeoJSON
          key={feature.id}
          data={feature}
          style={{
            color: '#3388ff',
            weight: 2,
            fillColor: '#3388ff',
            fillOpacity: 0.2,
          }}
        />
      ))}
    </MapContainer>
  );
}

# OpenStreetMap Drawing Application

A complete React.js + TypeScript frontend application that renders OpenStreetMap tiles and allows users to draw and manage geometrical features on the map with intelligent overlap handling.
Live link - https://geodrawmap.netlify.app/
## Features

- 🗺️ **OpenStreetMap Integration**: Renders free OSM tiles with smooth zooming and panning
- ✏️ **Drawing Tools**: Draw Circle, Rectangle, Polygon, and LineString shapes
- 🔄 **Smart Overlap Handling**: Automatic trimming of overlapping polygonal shapes
- 📊 **Shape Limits**: Configurable maximum number of shapes per type
- 💾 **GeoJSON Export**: Export all features as valid GeoJSON FeatureCollection
- 🎨 **Clean UI**: Modern, intuitive interface with visual feedback

## Tech Stack

- **React.js** 18.2.0
- **TypeScript** (strict mode)
- **Leaflet** + **React-Leaflet** for map rendering
- **leaflet-draw** for drawing tools
- **Turf.js** for spatial operations (overlap detection, trimming)
- **Zustand** for state management
- **Vite** as build tool

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

## Project Structure

```
src/
├── components/          # React components
│   ├── Map.tsx         # Main map component with OSM tiles
│   ├── Toolbar.tsx     # Side toolbar with drawing tools
│   ├── ErrorToast.tsx  # Error message display
│   └── ExportButton.tsx # GeoJSON export button
├── hooks/              # Custom React hooks
│   └── useDrawing.ts   # Drawing functionality hook
├── utils/              # Utility functions
│   └── overlapDetection.ts  # Polygon overlap & trimming logic
├── services/           # Service functions
│   └── geojsonExport.ts     # GeoJSON export service
├── store/              # State management
│   └── useMapStore.ts  # Zustand store for map state
├── config/             # Configuration files
│   └── shapeLimits.ts  # Shape limits configuration
└── types/              # TypeScript type definitions
    └── index.ts        # Shared types
```

## Polygon Overlap Handling

The application implements intelligent overlap detection and trimming for **polygonal shapes only** (Circle, Rectangle, Polygon). LineStrings are excluded from overlap rules and may cross anything freely.

### Rules

1. **Partial Overlap**: If a newly drawn polygonal shape partially overlaps an existing polygon:
   - The new shape is automatically trimmed using Turf.js `difference` operation
   - Only the non-overlapping portion is kept and added to the map

2. **Full Enclosure**: If a newly drawn polygon fully encloses an existing polygon:
   - Creation is blocked
   - A user-friendly error message is displayed

3. **No Modification of Existing Shapes**: Existing shapes are never modified—only the newly drawn shape may be trimmed or rejected.

### Implementation Details

The overlap detection logic is implemented in `src/utils/overlapDetection.ts`:

- **`isPolygonalShape()`**: Checks if a shape type is polygonal
- **`normalizeToPolygon()`**: Converts circles and rectangles to polygons for spatial operations
- **`isFullyEnclosing()`**: Checks if a new polygon fully contains an existing one
- **`trimOverlapping()`**: Uses Turf.js to subtract overlapping regions
- **`processPolygonalShape()`**: Main function that orchestrates the validation and trimming

The algorithm:
1. Normalizes all shapes to polygons (circles → polygons, rectangles → polygons)
2. Checks for full enclosure (reject if true)
3. Checks for intersections
4. If intersections exist, trims the new shape using `turf.difference()`
5. Handles MultiPolygon results by selecting the largest remaining polygon

## Shape Limits Configuration

Shape limits are configured in `src/config/shapeLimits.ts`:

```typescript
export const SHAPE_LIMITS = {
  polygon: 10,
  circle: 5,
  rectangle: 10,
  lineString: 20,
} as const;
```

To adjust limits, simply modify the values in this file. The UI will automatically reflect the changes and disable buttons when limits are reached.

## GeoJSON Export

The export functionality generates a valid GeoJSON FeatureCollection with the following structure:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[...]]
      },
      "properties": {
        "shapeType": "polygon",
        "id": "feature-1234567890-abc123",
        "createdAt": "2024-01-01T12:00:00.000Z"
      }
    }
  ]
}
```

### Sample GeoJSON Export

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-0.1, 51.5],
          [-0.08, 51.5],
          [-0.08, 51.52],
          [-0.1, 51.52],
          [-0.1, 51.5]
        ]]
      },
      "properties": {
        "shapeType": "rectangle",
        "id": "feature-1704110400000-xyz789",
        "createdAt": "2024-01-01T12:00:00.000Z"
      }
    }
  ]
}
```

## Usage

1. **Select a drawing tool** from the left sidebar (Circle, Rectangle, Polygon, or LineString)
2. **Click and drag** on the map to draw the shape
3. **For polygons and polylines**: Click to add vertices, double-click to finish
4. **For circles and rectangles**: Click and drag to define the shape
5. **Overlap handling**: Polygonal shapes will be automatically trimmed if they overlap existing shapes
6. **Export**: Click the "Export GeoJSON" button to download all features

## TypeScript Types

All map features use strict TypeScript typing:

- `MapFeature`: Extended GeoJSON Feature with `id` and `properties.shapeType`
- `ShapeType`: Union type of allowed shape types
- `DrawingState`: State for drawing operations
- `AppState`: Complete application state interface

## Development Notes

- The map is centered on London, UK by default (coordinates: `[51.505, -0.09]`)
- Default zoom level is 13
- Leaflet Draw controls are dynamically added/removed based on selected tool
- Error messages auto-dismiss after 5 seconds
- All spatial operations use Turf.js for accuracy and reliability

## License

This project is open source and available for use.

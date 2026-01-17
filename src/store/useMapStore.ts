import { create } from 'zustand';
import { MapFeature, DrawingState } from '../types';
import { ShapeType } from '../config/shapeLimits';

interface MapStore {
  features: MapFeature[];
  drawingState: DrawingState;
  error: string | null;
  
  // Actions
  addFeature: (feature: MapFeature) => void;
  removeFeature: (id: string) => void;
  setDrawingState: (state: DrawingState) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  getFeaturesByType: (type: ShapeType) => MapFeature[];
}

export const useMapStore = create<MapStore>((set, get) => ({
  features: [],
  drawingState: {
    isDrawing: false,
    currentShapeType: null,
  },
  error: null,

  addFeature: (feature) => {
    set((state) => ({
      features: [...state.features, feature],
    }));
  },

  removeFeature: (id) => {
    set((state) => ({
      features: state.features.filter((f) => f.id !== id),
    }));
  },

  setDrawingState: (drawingState) => {
    set({ drawingState });
  },

  setError: (error) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  getFeaturesByType: (type) => {
    return get().features.filter((f) => f.properties.shapeType === type);
  },
}));

'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token
if (typeof window !== 'undefined') {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
}

export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  scientificName?: string;
  occurrenceCount?: number;
  habitat?: string;
  depth?: string;
  date?: string;
}

interface MapboxMapProps {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onPointClick?: (point: MapPoint) => void;
  clustered?: boolean;
  style?: string;
}

export default function MapboxMap({
  points,
  center = [72.8777, 19.0760], // Default to Mumbai coordinates
  zoom = 6,
  height = '400px',
  onPointClick,
  clustered = true,
  style = 'mapbox://styles/mapbox/satellite-streets-v12'
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Check if access token is available
    if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
      console.warn('Mapbox access token not found. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your environment variables.');
      return;
    }

    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: style,
        center: center,
        zoom: zoom,
        projection: 'mercator'
      });
    } catch (error) {
      console.error('Error initializing Mapbox:', error);
      setMapError('Failed to initialize map');
      return;
    }

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      setIsLoaded(true);
    });

    map.current.on('style.load', () => {
      setIsLoaded(true);
    });

    map.current.on('error', (e) => {
      console.error('Mapbox error:', e);
      setMapError('Map failed to load');
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom, style]);

  useEffect(() => {
    if (!map.current || !isLoaded || !points.length) return;

    // Wait for style to be fully loaded before adding sources
    const addSourcesWhenReady = () => {
      if (!map.current) return;

      if (!map.current.isStyleLoaded()) {
        // Wait for style to load
        setTimeout(addSourcesWhenReady, 100);
        return;
      }

      addMapSources();
    };

    addSourcesWhenReady();

    function addMapSources() {
      if (!map.current || !isLoaded || !map.current.isStyleLoaded()) return;

      try {
        // Remove existing layers and sources
        if (map.current.getLayer('points')) {
          map.current.removeLayer('points');
        }
        if (map.current.getLayer('clusters')) {
          map.current.removeLayer('clusters');
        }
        if (map.current.getLayer('cluster-count')) {
          map.current.removeLayer('cluster-count');
        }
        if (map.current.getSource('points')) {
          map.current.removeSource('points');
        }
      } catch (error) {
        console.warn('Error removing existing map layers/sources:', error);
      }

      // Create GeoJSON data
      const geojsonData = {
        type: 'FeatureCollection' as const,
        features: points.map(point => ({
          type: 'Feature' as const,
          properties: {
            id: point.id,
            title: point.title,
            description: point.description || '',
            scientificName: point.scientificName || '',
            occurrenceCount: point.occurrenceCount || 1,
            habitat: point.habitat || '',
            depth: point.depth || '',
            date: point.date || ''
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [point.longitude, point.latitude]
          }
        }))
      };

      try {
        // Add source
        map.current.addSource('points', {
          type: 'geojson',
          data: geojsonData,
          cluster: clustered,
          clusterMaxZoom: 14,
          clusterRadius: 50
        });
      } catch (error) {
        console.error('Error adding map source:', error);
        setMapError('Failed to add map data');
        return;
      }

      try {
        if (clustered) {
          // Add cluster circles
          map.current.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'points',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': [
                'step',
                ['get', 'point_count'],
                '#51bbd6',
                100,
                '#f1f075',
                750,
                '#f28cb1'
              ],
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                20,
                100,
                30,
                750,
                40
              ]
            }
          });

          // Add cluster count labels
          map.current.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'points',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': '{point_count_abbreviated}',
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12
            }
          });

          // Click event for clusters
          map.current.on('click', 'clusters', (e) => {
            const features = map.current!.queryRenderedFeatures(e.point, {
              layers: ['clusters']
            });

            const clusterId = features[0].properties!.cluster_id;
            (map.current!.getSource('points') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
              clusterId,
              (err, zoom) => {
                if (err) return;

                map.current!.easeTo({
                  center: (features[0].geometry as any).coordinates,
                  zoom: zoom ?? 14
                });
              }
            );
          });

          // Change cursor on hover
          map.current.on('mouseenter', 'clusters', () => {
            map.current!.getCanvas().style.cursor = 'pointer';
          });
          map.current.on('mouseleave', 'clusters', () => {
            map.current!.getCanvas().style.cursor = '';
          });
        }

        // Add individual points
        map.current.addLayer({
          id: 'points',
          type: 'circle',
          source: 'points',
          filter: clustered ? ['!', ['has', 'point_count']] : undefined,
          paint: {
            'circle-color': '#11b4da',
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff'
          }
        });

        // Click event for individual points
        map.current.on('click', 'points', (e) => {
          const feature = e.features![0];
          const coordinates = (feature.geometry as any).coordinates.slice();
          const properties = feature.properties!;

          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          // Create popup content
          const popupContent = `
        <div class="p-3">
          <h3 class="font-bold text-lg mb-2">${properties.title}</h3>
          ${properties.scientificName ? `<p class="text-sm italic mb-1">${properties.scientificName}</p>` : ''}
          ${properties.habitat ? `<p class="text-sm mb-1"><strong>Habitat:</strong> ${properties.habitat}</p>` : ''}
          ${properties.depth ? `<p class="text-sm mb-1"><strong>Depth:</strong> ${properties.depth}</p>` : ''}
          ${properties.date ? `<p class="text-sm mb-1"><strong>Date:</strong> ${properties.date}</p>` : ''}
          ${properties.occurrenceCount ? `<p class="text-sm mb-1"><strong>Occurrences:</strong> ${properties.occurrenceCount}</p>` : ''}
          ${properties.description ? `<p class="text-sm text-gray-600">${properties.description}</p>` : ''}
        </div>
      `;

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map.current!);

          // Call callback if provided
          if (onPointClick) {
            const point = points.find(p => p.id === properties.id);
            if (point) onPointClick(point);
          }
        });

        // Change cursor on hover
        map.current.on('mouseenter', 'points', () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', 'points', () => {
          map.current!.getCanvas().style.cursor = '';
        });

        // Fit map to points if there are any
        if (points.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          points.forEach(point => {
            bounds.extend([point.longitude, point.latitude]);
          });

          map.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 12
          });
        }
      } catch (error) {
        console.error('Error adding map layers:', error);
        setMapError('Failed to add map layers');
      }
    }

  }, [points, isLoaded, clustered, onPointClick]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"
        style={{ height }}
      >
        <div className="text-center p-6">
          <p className="text-gray-600 mb-2">Mapbox access token required</p>
          <p className="text-sm text-gray-500">
            Please add your Mapbox access token to display the map
          </p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div
        className="flex items-center justify-center bg-red-50 rounded-lg border-2 border-dashed border-red-300"
        style={{ height }}
      >
        <div className="text-center p-6">
          <p className="text-red-600 mb-2">Map Error</p>
          <p className="text-sm text-red-500">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className="w-full rounded-lg overflow-hidden border"
      style={{ height }}
    />
  );
}
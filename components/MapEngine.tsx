
import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DeliveryNote, Facility, DNStatus } from '../types';
import { Layers, Map as MapIcon, Globe, Loader2, Satellite, Mountain, Search, X, Navigation } from 'lucide-react';
import { telemetryService } from '../services/socket';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAppStore } from '../store';

interface MapEngineProps {
  dns: DeliveryNote[];
  facilities: Facility[];
  focusedDnId?: string;
  followDriver?: boolean;
  className?: string;
  showTraffic?: boolean;
}

type MapLayer = 'streets' | 'satellite' | 'terrain' | 'dark';

const MapConstructor = (maplibregl as any).Map || (maplibregl as any).default?.Map;
const PopupConstructor = (maplibregl as any).Popup || (maplibregl as any).default?.Popup;

const MapEngine: React.FC<MapEngineProps> = ({ 
  dns = [], 
  facilities = [], 
  focusedDnId, 
  followDriver = false, 
  className = '',
  showTraffic = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const isMounted = useRef(true);
  const styles: Record<MapLayer, string> = {
    streets: 'https://tiles.openfreemap.org/styles/liberty',
    satellite: 'https://tiles.openfreemap.org/styles/bright', // OpenFreeMap doesn't have native satellite, using bright as fallback
    terrain: 'https://tiles.openfreemap.org/styles/bright',
    dark: 'https://tiles.openfreemap.org/styles/dark'
  };

  const [isLoaded, setIsLoaded] = useState(false);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const lastStyleRef = useRef<string>(styles[activeLayer]);

  // Animation state for smooth vehicle movement
  const vehiclePositions = useRef<Record<string, { 
    current: [number, number], 
    target: [number, number],
    rotation: number,
    targetRotation: number,
    lastUpdate: number
  }>>({});

  const [trafficEnabled, setTrafficEnabled] = useState(showTraffic);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Geolocation tracking
  const { coords: userLocation, permission: locationPermission, requestLocation } = useGeolocation(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error("MapEngine: Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (result: any) => {
    const map = mapRef.current;
    if (!map) return;

    const lon = parseFloat(result.lon);
    const lat = parseFloat(result.lat);

    map.flyTo({
      center: [lon, lat],
      zoom: 15,
      essential: true,
      duration: 2000
    });

    setShowSearchResults(false);
    setSearchQuery(result.display_name);
  };

  const addSourcesAndLayers = (map: any) => {
    try {
      if (!map.getSource('hubs')) {
        map.addSource('hubs', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      }
      
      // Vehicles with Clustering Enabled
      if (!map.getSource('vehicles')) {
        map.addSource('vehicles', { 
          type: 'geojson', 
          data: { type: 'FeatureCollection', features: [] }, 
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50
        });
      }

      if (!map.getSource('routes-traveled')) {
        map.addSource('routes-traveled', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      }
      if (!map.getSource('routes-remaining')) {
        map.addSource('routes-remaining', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      }
      if (!map.getSource('heatmap-data')) {
        map.addSource('heatmap-data', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      }
      if (!map.getSource('user-location')) {
        map.addSource('user-location', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      }

      const style = map.getStyle();
      const layers = style.layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

      // Cluster Layers
      if (!map.getLayer('clusters')) {
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'vehicles',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#1F6AE1',
              5,
              '#F27D26',
              15,
              '#ef4444'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              25,
              5,
              35,
              15,
              45
            ],
            'circle-stroke-width': 4,
            'circle-stroke-color': 'rgba(255, 255, 255, 0.5)',
            'circle-opacity': 0.9
          }
        });
      }

      if (!map.getLayer('cluster-count')) {
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'vehicles',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Noto Sans Regular'],
            'text-size': 14,
            'text-allow-overlap': true
          },
          paint: {
            'text-color': '#ffffff'
          }
        });
      }

      // Load Vehicle Icon
      const vehicleSvg = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="#1F6AE1" stroke="white" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      `;
      const blob = new Blob([vehicleSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        if (map.listImages().indexOf('vehicle-icon') === -1) {
          map.addImage('vehicle-icon', img);
        }
      };
      img.src = url;

      // Unclustered Vehicle Layer
      if (!map.getLayer('vehicles-layer')) {
        map.addLayer({
          id: 'vehicles-layer',
          type: 'symbol',
          source: 'vehicles',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': 'vehicle-icon',
            'icon-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 0.6,
              15, 1.0
            ],
            'icon-rotate': ['get', 'rotation'],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-rotation-alignment': 'map'
          },
          paint: {
            'icon-opacity': [
              'case',
              ['boolean', ['feature-state', 'focused'], false],
              1,
              0.9
            ]
          }
        });
      }

      // 3D Buildings
      if (map.getSource('openmaptiles') && !map.getLayer('3d-buildings')) {
        try {
          map.addLayer(
            {
              'id': '3d-buildings',
              'source': 'openmaptiles',
              'source-layer': 'building',
              'type': 'fill-extrusion',
              'minzoom': 14,
              'paint': {
                'fill-extrusion-color': activeLayer === 'dark' ? '#242424' : '#aaa',
                'fill-extrusion-height': ['get', 'render_height'],
                'fill-extrusion-base': ['get', 'render_min_height'],
                'fill-extrusion-opacity': 0.6
              }
            },
            labelLayerId
          );
        } catch (e) {
          console.warn("MapEngine: Failed to add 3d-buildings layer", e);
        }
      }

      // Other layers (Heatmap, Hubs, Routes)
      if (!map.getLayer('delivery-heatmap')) {
        map.addLayer({
          id: 'delivery-heatmap',
          type: 'heatmap',
          source: 'heatmap-data',
          maxzoom: 15,
          paint: {
            'heatmap-weight': 1,
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(31, 106, 225, 0)',
              0.2, 'rgba(31, 106, 225, 0.2)',
              0.4, 'rgba(31, 106, 225, 0.4)',
              0.6, 'rgba(31, 182, 166, 0.6)',
              0.8, 'rgba(31, 182, 166, 0.8)',
              1, 'rgba(242, 125, 38, 0.9)'
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
            'heatmap-opacity': 0.4
          }
        });
      }

      if (!map.getLayer('hubs-layer')) {
        map.addLayer({
          id: 'hubs-layer',
          type: 'circle',
          source: 'hubs',
          paint: {
            'circle-radius': 10,
            'circle-color': '#1F6AE1',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-blur': 0.1
          }
        });
      }

      if (!map.getLayer('routes-traveled-layer')) {
        map.addLayer({
          id: 'routes-traveled-layer',
          type: 'line',
          source: 'routes-traveled',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': activeLayer === 'dark' ? '#1e293b' : '#cbd5e1',
            'line-width': 3,
            'line-opacity': 0.4
          }
        });
      }

      if (!map.getLayer('routes-remaining-glow')) {
        map.addLayer({
          id: 'routes-remaining-glow',
          type: 'line',
          source: 'routes-remaining',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'focused'], false],
              '#F27D26',
              '#1F6AE1'
            ],
            'line-width': 12,
            'line-blur': 8,
            'line-opacity': 0.3
          }
        });
      }

      if (!map.getLayer('routes-remaining-layer')) {
        map.addLayer({
          id: 'routes-remaining-layer',
          type: 'line',
          source: 'routes-remaining',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'focused'], false],
              '#F27D26',
              '#1F6AE1'
            ],
            'line-width': 5,
            'line-opacity': 1
          }
        });
      }

      if (!map.getLayer('user-location-layer')) {
        map.addLayer({
          id: 'user-location-layer',
          type: 'circle',
          source: 'user-location',
          paint: {
            'circle-radius': 8,
            'circle-color': '#1F6AE1',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff'
          }
        });
      }

      // Traffic Layer (Simulated via OSRM or public traffic tiles if available)
      try {
        if (!map.getSource('traffic')) {
          map.addSource('traffic', {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png' // Placeholder for traffic tiles
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          });
        }

        if (!map.getLayer('traffic-layer')) {
          map.addLayer({
            id: 'traffic-layer',
            type: 'raster',
            source: 'traffic',
            layout: {
              visibility: trafficEnabled ? 'visible' : 'none'
            },
            paint: {
              'raster-opacity': 0.4
            }
          }, labelLayerId);
        }
      } catch (e) {
        console.warn("MapEngine: Failed to add traffic layer", e);
      }
    } catch (err) {
      console.warn("MapEngine: Error adding sources/layers", err);
    }
  };

  // Animation Loop for Smooth Movement
  useEffect(() => {
    let animationFrame: number;
    
    const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
    const lerpAngle = (start: number, end: number, t: number) => {
      let diff = (end - start) % 360;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      return start + diff * t;
    };

    const animate = () => {
      const map = mapRef.current;
      if (!map || !isLoaded) return;

      const source = map.getSource('vehicles') as any;
      if (!source) return;

      let hasChanged = false;
      const features: any[] = [];

      dns.forEach(dn => {
        const pos = vehiclePositions.current[dn.id];
        if (pos) {
          // Realistic interpolation: use a smooth easing factor
          // We use 0.08 for position and 0.1 for rotation for a "heavy" but responsive feel
          const dx = pos.target[0] - pos.current[0];
          const dy = pos.target[1] - pos.current[1];
          
          if (Math.abs(dx) > 0.000001 || Math.abs(dy) > 0.000001) {
            pos.current[0] = lerp(pos.current[0], pos.target[0], 0.08);
            pos.current[1] = lerp(pos.current[1], pos.target[1], 0.08);
            hasChanged = true;
          }

          if (Math.abs(pos.targetRotation - pos.rotation) > 0.1) {
            pos.rotation = lerpAngle(pos.rotation, pos.targetRotation, 0.1);
            hasChanged = true;
          }

          features.push({
            type: 'Feature',
            id: dn.id,
            geometry: { type: 'Point', coordinates: [pos.current[0], pos.current[1]] },
            properties: { 
              id: dn.id, 
              focused: dn.id === focusedDnId,
              rotation: pos.rotation
            }
          });
        } else {
          // Initialize position
          const lastLng = dn.lastLng;
          const lastLat = dn.lastLat;
          const startPos: [number, number] = [
            (typeof lastLng === 'number' && !isNaN(lastLng)) ? lastLng : 36.8172, 
            (typeof lastLat === 'number' && !isNaN(lastLat)) ? lastLat : -1.2863
          ];
          vehiclePositions.current[dn.id] = { 
            current: [...startPos], 
            target: [...startPos],
            rotation: 0,
            targetRotation: 0,
            lastUpdate: Date.now()
          };
          features.push({
            type: 'Feature',
            id: dn.id,
            geometry: { type: 'Point', coordinates: startPos },
            properties: { 
              id: dn.id, 
              focused: dn.id === focusedDnId,
              rotation: 0
            }
          });
        }
      });

      if (hasChanged || features.length > 0) {
        source.setData({ type: 'FeatureCollection', features });
      }

      animationFrame = requestAnimationFrame(animate);
    };

    if (isLoaded) {
      animate();
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [isLoaded, dns, focusedDnId]);

  // Socket Telemetry Listener
  useEffect(() => {
    telemetryService.connect();
    
    telemetryService.onTelemetryUpdate((data) => {
      const { dnId, lat, lng, heading } = data;
      const pos = vehiclePositions.current[dnId];
      if (pos) {
        // Calculate target rotation if not provided
        if (heading !== undefined) {
          pos.targetRotation = heading;
        } else {
          const dx = lng - pos.target[0];
          const dy = lat - pos.target[1];
          if (Math.abs(dx) > 0.000001 || Math.abs(dy) > 0.000001) {
            // MapLibre rotation is degrees clockwise from north
            // atan2(x, y) gives angle from Y axis (North)
            pos.targetRotation = Math.atan2(dx, dy) * (180 / Math.PI);
          }
        }
        pos.target = [lng, lat];
        pos.lastUpdate = Date.now();
      } else {
        vehiclePositions.current[dnId] = { 
          current: [lng, lat], 
          target: [lng, lat],
          rotation: heading || 0,
          targetRotation: heading || 0,
          lastUpdate: Date.now()
        };
      }
    });

    return () => {
      // We don't necessarily want to disconnect the global service, 
      // but we could stop listening if needed.
    };
  }, []);

  useEffect(() => {
    isMounted.current = true;
    if (!containerRef.current || mapRef.current) {
      return;
    }

    try {
      // Standard MapLibre GL JS v5 robust initialization
      const map = new MapConstructor({
        container: containerRef.current,
        style: styles[activeLayer],
        center: [36.817223, -1.286389],
        zoom: 13,
        pitch: 45,
        bearing: -17,
        attributionControl: false
      });

    map.on('load', () => {
      if (!isMounted.current) return;
      addSourcesAndLayers(map);
      setIsLoaded(true);
      setIsMapReady(true);

      // Cluster Click Logic
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        const source = map.getSource('vehicles') as any;
        
        (source as any).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
          if (err) return;
          map.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom
          });
        });
      });

      map.on('mousemove', 'vehicles-layer', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer';
          const id = e.features[0].properties?.id;
          if (id) setHoveredId(id);
        }
      });

      map.on('mouseleave', 'vehicles-layer', () => {
        map.getCanvas().style.cursor = '';
        setHoveredId(null);
      });

      map.on('click', 'vehicles-layer', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          const coordinates = (e.features[0].geometry as any).coordinates;
          if (!coordinates) return;

          new PopupConstructor({ className: 'modern-popup', closeButton: false })
            .setLngLat(coordinates)
            .setHTML(`
              <div class="p-4 min-w-[200px]">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Mission</p>
                <p class="text-sm font-black text-slate-900 uppercase mb-3">${props?.id || 'Unknown'}</p>
                <div class="flex items-center justify-between">
                  <span class="text-[9px] font-bold text-slate-500 uppercase">Status</span>
                  <span class="px-2 py-0.5 bg-brand/5 text-brand rounded text-[9px] font-black uppercase">In Transit</span>
                </div>
              </div>
            `)
            .addTo(map);
        }
      });
    });

    map.on('style.load', () => {
      if (!isMounted.current) return;
      addSourcesAndLayers(map);
    });

    mapRef.current = map;
    } catch (err) {
      console.error("MapEngine: Failed to initialize map", err);
    }

      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          try {
            mapRef.current.resize();
          } catch (e) {
            // Ignore resize errors during unmount
          }
        }
      });
    resizeObserver.observe(containerRef.current);

    return () => {
      isMounted.current = false;
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    
    const newStyle = styles[activeLayer];
    if (lastStyleRef.current !== newStyle) {
      lastStyleRef.current = newStyle;
      map.setStyle(newStyle);
    }
  }, [activeLayer, isLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    if (map.getLayer('traffic-layer')) {
      map.setLayoutProperty('traffic-layer', 'visibility', trafficEnabled ? 'visible' : 'none');
    }
  }, [trafficEnabled, isLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || !map.isStyleLoaded()) return;

    const updateData = async () => {
      try {
        const hubSource = map.getSource('hubs') as any;
        if (hubSource) {
          const hubFeatures = facilities
            .filter(f => !isNaN(f.lng) && !isNaN(f.lat))
            .map(f => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [f.lng, f.lat] },
              properties: { id: f.id, name: f.name }
            }));
          hubSource.setData({
            type: 'FeatureCollection',
            features: hubFeatures as any
          });
        }

        const traveledRoutes: any[] = [];
        const remainingRoutes: any[] = [];

        for (const dn of dns) {
          const isFocused = dn.id === focusedDnId;
          const lastLng = dn.lastLng ?? 0;
          const lastLat = dn.lastLat ?? 0;
          
          if (isNaN(lastLng) || isNaN(lastLat)) continue;
          const pos: [number, number] = [lastLng, lastLat];

          if (map.getSource('vehicles')) {
            try {
              map.setFeatureState({ source: 'vehicles', id: dn.id }, { focused: isFocused });
            } catch (e) {
              // Ignore feature state errors
            }
          }

          if (dn.status === DNStatus.IN_TRANSIT && dn.lat && dn.lng && !isNaN(dn.lat) && !isNaN(dn.lng)) {
            try {
              const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${lastLng},${lastLat};${dn.lng},${dn.lat}?overview=full&geometries=geojson`
              );
              const data = await response.json();
              
              if (data.code === 'Ok' && data.routes?.[0]) {
                const route = data.routes[0].geometry.coordinates;

                let splitIndex = 0;
                let minDistance = Infinity;
                route.forEach((point: [number, number], index: number) => {
                  const dist = Math.sqrt(Math.pow(pos[0] - point[0], 2) + Math.pow(pos[1] - point[1], 2));
                  if (dist < minDistance) {
                    minDistance = dist;
                    splitIndex = index;
                  }
                });

                const traveledPath = route.slice(0, splitIndex + 1);
                const remainingPath = route.slice(splitIndex);

                traveledRoutes.push({
                  type: 'Feature',
                  geometry: { type: 'LineString', coordinates: traveledPath },
                  properties: { id: dn.id }
                });

                remainingRoutes.push({
                  type: 'Feature',
                  id: dn.id,
                  geometry: { type: 'LineString', coordinates: remainingPath },
                  properties: { id: dn.id, focused: isFocused }
                });
                
                if (map.getSource('routes-remaining')) {
                  try {
                    map.setFeatureState({ source: 'routes-remaining', id: dn.id }, { focused: isFocused });
                  } catch (e) {
                    // Ignore feature state errors
                  }
                }
              }
            } catch (err) {
              // Silent fail for routing
            }
          }
        }

        const traveledSource = map.getSource('routes-traveled') as any;
        if (traveledSource) {
          traveledSource.setData({ type: 'FeatureCollection', features: traveledRoutes });
        }

        const remainingSource = map.getSource('routes-remaining') as any;
        if (remainingSource) {
          remainingSource.setData({ type: 'FeatureCollection', features: remainingRoutes });
        }

        const heatmapSource = map.getSource('heatmap-data') as any;
        if (heatmapSource) {
          const heatmapFeatures = dns
            .filter(d => !isNaN(d.lng || d.lastLng || 0) && !isNaN(d.lat || d.lastLat || 0))
            .map(d => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [d.lng || d.lastLng || 0, d.lat || d.lastLat || 0] },
              properties: { weight: 1 }
            }));
          heatmapSource.setData({ type: 'FeatureCollection', features: heatmapFeatures as any });
        }

        const userLocationSource = map.getSource('user-location') as any;
        if (userLocationSource && userLocation) {
          userLocationSource.setData({
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [userLocation.lng, userLocation.lat] },
              properties: {}
            }]
          });
        }

        if (focusedDnId && followDriver) {
          const focusedDn = dns.find(d => d.id === focusedDnId);
          if (focusedDn?.lastLat && focusedDn?.lastLng && !isNaN(focusedDn.lastLat) && !isNaN(focusedDn.lastLng)) {
            map.flyTo({ 
              center: [focusedDn.lastLng, focusedDn.lastLat],
              zoom: 15,
              pitch: 60,
              bearing: 20,
              essential: true,
              duration: 2000
            });
          }
        }
      } catch (err) {
        console.warn("MapEngine: Error updating data", err);
      }
    };

    updateData();
  }, [dns, facilities, focusedDnId, followDriver, isLoaded]);

  return (
    <div className={`w-full h-full relative ${className} overflow-hidden rounded-2xl`}>
      <div ref={containerRef} className="w-full h-full bg-[#f8fafc]" />
      
      {/* Search Bar */}
      <div className="absolute top-6 left-6 z-[1000] w-full max-w-md px-4 sm:px-0">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader2 size={18} className="text-brand-accent animate-spin" />
            ) : (
              <Search size={18} className="text-slate-400 group-focus-within:text-brand-accent transition-colors" />
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setSearchResults.length > 0 && setShowSearchResults(true)}
            placeholder="Search addresses, hubs, or coordinates..."
            className="w-full bg-white/90 backdrop-blur-xl border-2 border-white/20 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-slate-900 shadow-2xl focus:border-brand-accent focus:bg-white outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </form>

        {showSearchResults && searchResults.length > 0 && (
          <div className="mt-2 bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="max-h-[300px] overflow-y-auto">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => selectLocation(result)}
                  className="w-full text-left px-6 py-4 hover:bg-brand/5 transition-colors border-b border-slate-100 last:border-0 flex flex-col gap-1"
                >
                  <span className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1">
                    {result.display_name.split(',')[0]}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1">
                    {result.display_name.split(',').slice(1).join(',').trim()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {locationPermission === 'denied' && (
        <div className="absolute bottom-6 left-6 z-[1000] bg-white/80 backdrop-blur-md border border-red-200 rounded-xl p-3 flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <Navigation size={16} className="text-red-500" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Location tracking unavailable</span>
        </div>
      )}

      {!isMapReady && (
        <div className="absolute inset-0 z-[2000] bg-slate-50 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-brand-accent" size={32} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initializing Vector Grid...</p>
        </div>
      )}

      <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-3">
        <button 
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className={`p-4 rounded-2xl shadow-2xl backdrop-blur-md transition-all border ${showLayerMenu ? 'bg-brand/90 text-white border-brand' : 'bg-white/80 text-slate-900 border-white/20'}`}
        >
          <Layers size={22} />
        </button>

        {showLayerMenu && (
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/20 p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <LayerButton 
              active={activeLayer === 'streets'} 
              onClick={() => setActiveLayer('streets')} 
              icon={<MapIcon size={16} />} 
              label="Vector Streets" 
            />
            <LayerButton 
              active={activeLayer === 'satellite'} 
              onClick={() => setActiveLayer('satellite')} 
              icon={<Satellite size={16} />} 
              label="Satellite View" 
            />
            <LayerButton 
              active={activeLayer === 'terrain'} 
              onClick={() => setActiveLayer('terrain')} 
              icon={<Mountain size={16} />} 
              label="Terrain Map" 
            />
            <LayerButton 
              active={activeLayer === 'dark'} 
              onClick={() => setActiveLayer('dark')} 
              icon={<Globe size={16} />} 
              label="Midnight Grid" 
            />
            <div className="h-px bg-slate-200/50 mx-2 my-1" />
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-1">Visual Overlays</p>
            <button 
              onClick={() => setTrafficEnabled(!trafficEnabled)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${trafficEnabled ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:bg-slate-100/50'}`}
            >
              <div className={`h-2 w-2 rounded-full ${trafficEnabled ? 'bg-orange-500 animate-pulse' : 'bg-slate-300'}`} />
              Traffic Conditions {trafficEnabled ? 'On' : 'Off'}
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100/50 transition-all">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Heatmap Active
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-10 right-6 z-[1000] flex flex-col gap-3">
        {userLocation ? (
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl flex flex-col items-center gap-1 animate-in fade-in slide-in-from-right-4">
            <div className={`h-2 w-2 rounded-full ${userLocation.accuracy && userLocation.accuracy < 20 ? 'bg-emerald-500' : 'bg-orange-500'} animate-pulse`} />
            <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest">
              {userLocation.accuracy ? `±${Math.round(userLocation.accuracy)}m` : 'GPS'}
            </span>
          </div>
        ) : (
          <button
            onClick={requestLocation}
            className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl flex items-center justify-center text-slate-900 uppercase tracking-widest text-[9px] font-black hover:bg-slate-100 transition-all"
          >
            Enable location
          </button>
        )}

        <button
          onClick={() => {
            if (userLocation && mapRef.current) {
              mapRef.current.flyTo({
                center: [userLocation.lng, userLocation.lat],
                zoom: 16,
                pitch: 45,
                essential: true,
                duration: 1500
              });
            }
          }}
          className="h-14 w-14 bg-white text-slate-900 rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-all border-2 border-white/20 hover:bg-slate-50"
        >
          <Navigation size={24} className="fill-current" />
        </button>
      </div>

      <div className="absolute bottom-2 left-2 z-[1000] bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
        © OpenMapTiles © OpenStreetMap contributors
      </div>
    </div>
  );
};

const LayerButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${active ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-600 hover:bg-white/50'}`}
  >
    {icon}
    {label}
  </button>
);

export default MapEngine;

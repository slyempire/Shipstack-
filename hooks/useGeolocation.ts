import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store';

export const useGeolocation = (shouldWatch: boolean = false, dnId?: string) => {
  const { 
    setUserLocation, 
    setLocationPermission, 
    addNotification 
  } = useAppStore();

  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      addNotification('Geolocation is not supported by your browser.', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newCoords = { lat: latitude, lng: longitude, accuracy };
        setCoords(newCoords);
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationPermission('granted');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationPermission('denied');
        addNotification('Location tracking is unavailable. Please enable location permissions.', 'info');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, [setUserLocation, setLocationPermission, addNotification]);

  useEffect(() => {
    // Initial request on mount if requested or if we should watch
    if (shouldWatch) {
      requestLocation();
    }
  }, [shouldWatch, requestLocation]);

  useEffect(() => {
    if (!shouldWatch || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newCoords = { lat: latitude, lng: longitude, accuracy };
        setCoords(newCoords);
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationPermission('granted');
      },
      (error) => {
        console.error('Geolocation watch error:', error);
        // We don't necessarily want to spam notifications on every watch error
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [shouldWatch, setUserLocation, setLocationPermission]);

  // Return coords directly to match previous usage in DriverPortal
  return coords;
};

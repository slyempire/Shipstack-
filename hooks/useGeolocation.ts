import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store';

export const useGeolocation = (shouldWatch: boolean = false, dnId?: string) => {
  const {
    setUserLocation,
    setLocationPermission,
    addNotification
  } = useAppStore();

  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      setPermission('denied');
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
        setPermission('granted');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationPermission('denied');
        setPermission('denied');
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
    let mounted = true;

    const checkPermission = async () => {
      if (!navigator.permissions) {
        if (shouldWatch) requestLocation();
        return;
      }

      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (!mounted) return;
        setPermission(status.state as 'granted' | 'denied' | 'prompt');
        setLocationPermission(status.state as 'granted' ? 'granted' : status.state === 'denied' ? 'denied' : 'prompt');

        status.onchange = () => {
          if (!mounted) return;
          setPermission(status.state as 'granted' | 'denied' | 'prompt');
          setLocationPermission(status.state as 'granted' ? 'granted' : status.state === 'denied' ? 'denied' : 'prompt');
        };

        if (shouldWatch && status.state === 'granted') {
          requestLocation();
        }
      } catch (err) {
        console.warn('Permission API unavailable for geolocation.', err);
        if (shouldWatch) requestLocation();
      }
    };

    if (shouldWatch) {
      checkPermission();
    }

    return () => { mounted = false; };
  }, [shouldWatch, requestLocation, setLocationPermission]);

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
        setLocationPermission('denied');
        setPermission('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [shouldWatch, setUserLocation, setLocationPermission]);

  return { coords, permission, requestLocation };
};

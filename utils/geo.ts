
import { LatLngTuple } from '../types';

/**
 * Calculate Haversine distance in meters
 */
export const calculateDistance = (p1: LatLngTuple, p2: LatLngTuple): number => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (p1[0] * Math.PI) / 180;
  const phi2 = (p2[0] * Math.PI) / 180;
  const deltaPhi = ((p2[0] - p1[0]) * Math.PI) / 180;
  const deltaLambda = ((p2[1] - p1[1]) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Finds the index of the point in the polyline nearest to the target point
 */
export const findNearestPointIndex = (target: LatLngTuple, polyline: LatLngTuple[]): number => {
  let minDistance = Infinity;
  let nearestIndex = 0;

  for (let i = 0; i < polyline.length; i++) {
    const d = calculateDistance(target, polyline[i]);
    if (d < minDistance) {
      minDistance = d;
      nearestIndex = i;
    }
  }

  return nearestIndex;
};

/**
 * Checks if the target point has deviated from the polyline by more than a threshold
 */
export const isDeviated = (target: LatLngTuple, polyline: LatLngTuple[], thresholdMeters: number = 200): boolean => {
  if (polyline.length === 0) return false;
  
  // A simple way: find distance to nearest point. 
  // More accurate would be distance to nearest segment, but for logistics this is usually sufficient.
  let minDistance = Infinity;
  for (const point of polyline) {
    const d = calculateDistance(target, point);
    if (d < minDistance) minDistance = d;
    if (d < thresholdMeters) return false; // Early exit
  }

  return minDistance > thresholdMeters;
};

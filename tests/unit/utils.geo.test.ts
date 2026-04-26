import { describe, it, expect } from 'vitest';
import { calculateDistance, findNearestPointIndex, isDeviated } from '../../utils/geo';
import type { LatLngTuple } from '../../types';

// Known distances for white-box validation
// Nairobi CBD ↔ JKIA: ~15.8 km
const NAIROBI_CBD: LatLngTuple = [-1.2864, 36.8172];
const JKIA: LatLngTuple = [-1.3192, 36.9275];
const MOMBASA: LatLngTuple = [-4.0435, 39.6682];

// ─── Unit Tests ────────────────────────────────────────────────────────────────

describe('calculateDistance', () => {
  it('returns 0 for the same point', () => {
    expect(calculateDistance(NAIROBI_CBD, NAIROBI_CBD)).toBe(0);
  });

  it('calculates distance between Nairobi CBD and JKIA (~12-13km)', () => {
    const dist = calculateDistance(NAIROBI_CBD, JKIA);
    expect(dist).toBeGreaterThan(11_000);
    expect(dist).toBeLessThan(14_000);
  });

  it('calculates distance between Nairobi and Mombasa (~440km)', () => {
    const dist = calculateDistance(NAIROBI_CBD, MOMBASA);
    expect(dist).toBeGreaterThan(430_000);
    expect(dist).toBeLessThan(460_000);
  });

  it('is symmetric (distance A→B equals B→A)', () => {
    const ab = calculateDistance(NAIROBI_CBD, JKIA);
    const ba = calculateDistance(JKIA, NAIROBI_CBD);
    expect(Math.abs(ab - ba)).toBeLessThan(0.001);
  });

  it('returns metres (not km)', () => {
    const dist = calculateDistance(NAIROBI_CBD, JKIA);
    // Should be ~15800 not ~15.8
    expect(dist).toBeGreaterThan(1000);
  });
});

// ─── White-box Tests ────────────────────────────────────────────────────────────

describe('findNearestPointIndex', () => {
  const polyline: LatLngTuple[] = [NAIROBI_CBD, JKIA, MOMBASA];

  it('returns 0 when target is closest to first point', () => {
    const nearCBD: LatLngTuple = [-1.287, 36.818];
    expect(findNearestPointIndex(nearCBD, polyline)).toBe(0);
  });

  it('returns 1 when target is closest to JKIA', () => {
    const nearJKIA: LatLngTuple = [-1.32, 36.93];
    expect(findNearestPointIndex(nearJKIA, polyline)).toBe(1);
  });

  it('returns 2 when target is closest to Mombasa', () => {
    const nearMombasa: LatLngTuple = [-4.05, 39.67];
    expect(findNearestPointIndex(nearMombasa, polyline)).toBe(2);
  });

  it('handles single-point polyline', () => {
    expect(findNearestPointIndex(NAIROBI_CBD, [JKIA])).toBe(0);
  });

  it('returns 0 for empty polyline (gracefully)', () => {
    expect(findNearestPointIndex(NAIROBI_CBD, [])).toBe(0);
  });
});

describe('isDeviated', () => {
  const straightRoad: LatLngTuple[] = [
    [-1.2864, 36.8172],
    [-1.2900, 36.8300],
    [-1.2950, 36.8400],
  ];

  it('returns false when on route (within 200m default threshold)', () => {
    const onRoute: LatLngTuple = [-1.2865, 36.8175];
    expect(isDeviated(onRoute, straightRoad)).toBe(false);
  });

  it('returns true when far off route (>200m)', () => {
    const farOff: LatLngTuple = [-1.32, 36.93]; // near JKIA, far from this route
    expect(isDeviated(farOff, straightRoad)).toBe(true);
  });

  it('respects custom threshold', () => {
    const nearby: LatLngTuple = [-1.2870, 36.8180];
    // With a very tight threshold of 10m, even a close point should deviate
    expect(isDeviated(nearby, straightRoad, 10)).toBe(true);
    // With a very loose threshold, it should not deviate
    expect(isDeviated(nearby, straightRoad, 10000)).toBe(false);
  });

  it('returns false for empty polyline', () => {
    expect(isDeviated(NAIROBI_CBD, [])).toBe(false);
  });

  it('returns false when exactly on a polyline point', () => {
    expect(isDeviated(NAIROBI_CBD, straightRoad)).toBe(false);
  });
});

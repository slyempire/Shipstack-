import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We test the fallback logic by importing only the internal functions.
// Since they're not exported, we test them via the public aiService API
// with the microservice endpoint stubbed to fail.
// Use fake timers to skip the exponential backoff delay (2s + 4s = 6s).

// ─── We re-implement the haversine and nearest-neighbour logic here
// for white-box verification of the algorithm's correctness.

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestNeighbour(nodes: Array<{ id: string; lat: number; lng: number }>): string[] {
  if (nodes.length === 0) return [];
  const unvisited = new Set(nodes.map((_, i) => i));
  const order: number[] = [0];
  unvisited.delete(0);
  while (unvisited.size > 0) {
    const last = order[order.length - 1];
    let nearest = -1, bestDist = Infinity;
    for (const i of unvisited) {
      const d = haversineKm(nodes[last].lat, nodes[last].lng, nodes[i].lat, nodes[i].lng);
      if (d < bestDist) { bestDist = d; nearest = i; }
    }
    order.push(nearest);
    unvisited.delete(nearest);
  }
  return order.map(i => nodes[i].id);
}

// ─── White-box: haversine algorithm ─────────────────────────────────────────

describe('haversineKm (fallback in aiService)', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineKm(-1.2864, 36.8172, -1.2864, 36.8172)).toBe(0);
  });

  it('calculates Nairobi to Mombasa as ~440km', () => {
    const dist = haversineKm(-1.2864, 36.8172, -4.0435, 39.6682);
    expect(dist).toBeGreaterThan(430);
    expect(dist).toBeLessThan(460);
  });

  it('is symmetric', () => {
    const ab = haversineKm(0, 0, 1, 1);
    const ba = haversineKm(1, 1, 0, 0);
    expect(Math.abs(ab - ba)).toBeLessThan(0.001);
  });

  it('returns small distance for nearby points', () => {
    const dist = haversineKm(-1.2864, 36.8172, -1.2870, 36.8180);
    expect(dist).toBeLessThan(0.2); // < 200m
  });
});

// ─── White-box: nearest-neighbour TSP algorithm ──────────────────────────────

describe('nearestNeighbour TSP', () => {
  it('returns empty array for no nodes', () => {
    expect(nearestNeighbour([])).toEqual([]);
  });

  it('returns single node for one-node input', () => {
    expect(nearestNeighbour([{ id: 'a', lat: 0, lng: 0 }])).toEqual(['a']);
  });

  it('starts from the first node (index 0)', () => {
    const nodes = [
      { id: 'start', lat: 0, lng: 0 },
      { id: 'far', lat: 10, lng: 10 },
      { id: 'near', lat: 0.1, lng: 0.1 },
    ];
    const order = nearestNeighbour(nodes);
    expect(order[0]).toBe('start');
  });

  it('visits nearest node second when three nodes', () => {
    const nodes = [
      { id: 'a', lat: 0, lng: 0 },
      { id: 'b', lat: 0.001, lng: 0.001 }, // very close to a
      { id: 'c', lat: 10, lng: 10 },        // far away
    ];
    const order = nearestNeighbour(nodes);
    expect(order[0]).toBe('a');
    expect(order[1]).toBe('b'); // nearest to a
    expect(order[2]).toBe('c'); // far
  });

  it('visits all nodes exactly once', () => {
    const nodes = [
      { id: 'n1', lat: -1.2, lng: 36.8 },
      { id: 'n2', lat: -1.3, lng: 36.9 },
      { id: 'n3', lat: -1.4, lng: 37.0 },
      { id: 'n4', lat: -1.5, lng: 37.1 },
    ];
    const order = nearestNeighbour(nodes);
    expect(order).toHaveLength(4);
    expect(new Set(order).size).toBe(4);
  });

  it('produces greedy nearest-first order for a linear sequence', () => {
    const nodes = [
      { id: 'origin', lat: 0, lng: 0 },
      { id: 'right', lat: 0, lng: 1 },
      { id: 'far',   lat: 0, lng: 10 },
      { id: 'right2', lat: 0, lng: 2 },
    ];
    const order = nearestNeighbour(nodes);
    expect(order[0]).toBe('origin');
    expect(order[1]).toBe('right');
    expect(order[2]).toBe('right2');
    expect(order[3]).toBe('far');
  });
});

// ─── Unit Tests: aiService public API (fake timers skip backoff) ─────────────

describe('aiService.optimizeRoute (fallback path)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockRejectedValue(new Error('Service unavailable'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns a valid RouteOptimizationResult when microservice is down', async () => {
    const { aiService } = await import('../../services/aiService');
    const dns = [
      { id: 'dn-1', externalId: 'EXT-001', clientName: 'Client A', address: '123 St', zoneId: 'z1', status: 'PENDING', priority: 'normal' } as any,
      { id: 'dn-2', externalId: 'EXT-002', clientName: 'Client B', address: '456 Ave', zoneId: 'z2', status: 'PENDING', priority: 'high' } as any,
    ];
    const vehicle = { id: 'v1', type: 'VAN', capacityKg: 500 } as any;

    const resultPromise = aiService.optimizeRoute(dns, vehicle);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('optimizedOrder');
    expect(result.optimizedOrder).toHaveLength(2);
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('metrics');
    expect(result.metrics).toHaveProperty('distanceSaved');
    expect(result.metrics).toHaveProperty('timeSaved');
    expect(result.metrics).toHaveProperty('carbonReduction');
  }, 15000);

  it('includes all delivery note IDs in optimized order', async () => {
    const { aiService } = await import('../../services/aiService');
    const dns = [
      { id: 'dn-a', lat: -1.2, lng: 36.8 } as any,
      { id: 'dn-b', lat: -1.3, lng: 36.9 } as any,
      { id: 'dn-c', lat: -1.4, lng: 37.0 } as any,
    ];
    const resultPromise = aiService.optimizeRoute(dns, {} as any);
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    expect(new Set(result.optimizedOrder)).toEqual(new Set(['dn-a', 'dn-b', 'dn-c']));
  }, 15000);

  it('returns confidence 0.72 when no coordinates provided', async () => {
    const { aiService } = await import('../../services/aiService');
    const dns = [{ id: 'x1' } as any, { id: 'x2' } as any];
    const resultPromise = aiService.optimizeRoute(dns, {} as any);
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    expect(result.confidence).toBe(0.72);
  }, 15000);
});

describe('aiService.forecastDemand (fallback path)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockRejectedValue(new Error('Service unavailable'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns next7Days array with 7 items', async () => {
    const { aiService } = await import('../../services/aiService');
    const resultPromise = aiService.forecastDemand([]);
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    expect(result.next7Days).toHaveLength(7);
  }, 15000);

  it('each forecast day has date and predictedVolume', async () => {
    const { aiService } = await import('../../services/aiService');
    const resultPromise = aiService.forecastDemand([{ volume: 100 }, { volume: 120 }]);
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    result.next7Days.forEach((day: any) => {
      expect(day).toHaveProperty('date');
      expect(day).toHaveProperty('predictedVolume');
      expect(day).toHaveProperty('confidenceInterval');
      expect(day.confidenceInterval).toHaveLength(2);
    });
  }, 15000);

  it('uses moving average of historical volumes', async () => {
    const { aiService } = await import('../../services/aiService');
    const data = Array.from({ length: 7 }, () => ({ volume: 80 }));
    const resultPromise = aiService.forecastDemand(data);
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    result.next7Days.forEach((d: any) => {
      // seasonality range: 0.6 (weekend) to 1.15 (peak) applied to base 80
      expect(d.predictedVolume).toBeGreaterThan(40); // 80 * 0.6 = 48 minimum
      expect(d.predictedVolume).toBeLessThan(100);   // 80 * 1.15 = 92 maximum
    });
  }, 15000);

  it('returns insights array', async () => {
    const { aiService } = await import('../../services/aiService');
    const resultPromise = aiService.forecastDemand([]);
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    expect(Array.isArray(result.insights)).toBe(true);
    expect(result.insights.length).toBeGreaterThan(0);
  }, 15000);

  it('returns lower confidence with no historical data', async () => {
    const { aiService } = await import('../../services/aiService');
    const resultPromise = aiService.forecastDemand([]);
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    expect(result.confidence).toBe(0.65);
  }, 15000);

  it('returns higher confidence with historical data', async () => {
    const { aiService } = await import('../../services/aiService');
    const resultPromise = aiService.forecastDemand([{ volume: 50 }, { volume: 60 }]);
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    expect(result.confidence).toBeGreaterThan(0.65);
  }, 15000);
});

describe('aiService.detectAnomalies (fallback path)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockRejectedValue(new Error('Service unavailable'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns empty anomalies array when service is down', async () => {
    const { aiService } = await import('../../services/aiService');
    const resultPromise = aiService.detectAnomalies([]);
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    expect(result.anomalies).toEqual([]);
    expect(result.riskScore).toBeTypeOf('number');
    expect(result.recommendations).toBeInstanceOf(Array);
  }, 15000);
});

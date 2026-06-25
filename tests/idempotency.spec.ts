import { test, expect } from '@playwright/test';

test.describe('API Idempotency & Dedup verification', () => {
  const baseURL = 'http://localhost:3000';

  test('POST /api/ingest is idempotent with Idempotency-Key', async ({ request }) => {
    const key = `test-key-${Date.now()}`;
    const payload = {
      externalId: `ext-${Date.now()}`,
      clientName: 'Naivas CBD',
      type: 'INBOUND',
      address: 'Nairobi',
      priority: 'HIGH'
    };

    // First request should succeed and return 201
    const res1 = await request.post(`${baseURL}/api/ingest`, {
      headers: {
        'Authorization': 'Bearer sk_live_test_key',
        'Idempotency-Key': key,
        'Content-Type': 'application/json'
      },
      data: payload
    });
    
    expect(res1.status()).toBe(201);
    const body1 = await res1.json();
    expect(body1.success).toBe(true);
    expect(body1.internalId).toBeDefined();

    // Second request should return 200 (cached) and have the same internalId
    const res2 = await request.post(`${baseURL}/api/ingest`, {
      headers: {
        'Authorization': 'Bearer sk_live_test_key',
        'Idempotency-Key': key,
        'Content-Type': 'application/json'
      },
      data: payload
    });

    expect(res2.status()).toBe(200);
    const body2 = await res2.json();
    expect(body2.success).toBe(true);
    expect(body2.internalId).toBe(body1.internalId);
  });

  test('POST /api/telemetry discards out-of-order telemetry coordinates', async ({ request }) => {
    const dnId = `dn-telemetry-test-${Date.now()}`;

    // 1. Initial telemetry ping (Time T1 = 12:00:00)
    const res1 = await request.post(`${baseURL}/api/telemetry`, {
      headers: {
        'Authorization': 'Bearer mock-session-token',
        'Content-Type': 'application/json'
      },
      data: {
        dnId,
        lat: -1.286,
        lng: 36.817,
        speed: 40,
        heading: 90,
        timestamp: new Date(2026, 5, 24, 12, 0, 0).toISOString() // 12:00:00
      }
    });
    expect(res1.status()).toBe(200);
    const body1 = await res1.json();
    expect(body1.success).toBe(true);
    expect(body1.discarded).toBeUndefined();

    // 2. Newer telemetry ping (Time T2 = 12:05:00)
    const res2 = await request.post(`${baseURL}/api/telemetry`, {
      headers: {
        'Authorization': 'Bearer mock-session-token',
        'Content-Type': 'application/json'
      },
      data: {
        dnId,
        lat: -1.290,
        lng: 36.820,
        speed: 45,
        heading: 95,
        timestamp: new Date(2026, 5, 24, 12, 5, 0).toISOString() // 12:05:00
      }
    });
    expect(res2.status()).toBe(200);
    const body2 = await res2.json();
    expect(body2.success).toBe(true);
    expect(body2.discarded).toBeUndefined();

    // 3. Stale/Out-of-order telemetry ping (Time T3 = 12:02:00) - Should be discarded
    const res3 = await request.post(`${baseURL}/api/telemetry`, {
      headers: {
        'Authorization': 'Bearer mock-session-token',
        'Content-Type': 'application/json'
      },
      data: {
        dnId,
        lat: -1.288,
        lng: 36.818,
        speed: 42,
        heading: 92,
        timestamp: new Date(2026, 5, 24, 12, 2, 0).toISOString() // 12:02:00
      }
    });
    expect(res3.status()).toBe(200);
    const body3 = await res3.json();
    expect(body3.success).toBe(true);
    expect(body3.discarded).toBe(true);
  });
});

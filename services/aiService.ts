
import { DeliveryNote, Vehicle, RouteOptimizationResult } from '../types';

/**
 * Cortex AI Service
 * Advanced ML-driven logistics optimization via microservices
 */

// Configuration for AI microservices
const getAiServiceBaseUrl = () => {
  if (import.meta.env.VITE_AI_SERVICE_URL) {
    return import.meta.env.VITE_AI_SERVICE_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    return `${window.location.protocol}//${host}:8000`;
  }

  return 'http://localhost:8000';
};

const AI_SERVICE_CONFIG = {
  baseUrl: getAiServiceBaseUrl(),
  timeout: 30000, // 30 seconds
  retries: 3
};

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = AI_SERVICE_CONFIG.timeout) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Generic API call helper with retry logic
 */
async function callAIService(endpoint: string, data: any, retries = AI_SERVICE_CONFIG.retries): Promise<any> {
  const url = `${AI_SERVICE_CONFIG.baseUrl}${endpoint}`;

  if (typeof window !== 'undefined' && !navigator.onLine) {
    console.warn('AI service request blocked because browser is offline. Using fallback.');
    return null;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      }, AI_SERVICE_CONFIG.timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`AI service call attempt ${attempt} failed:`, error);

      if (attempt === retries) {
        console.error('All AI service retries exhausted, falling back to simulation');
        return null;
      }

      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

/**
 * Fallback simulation for when AI services are unavailable
 */
function simulateRouteOptimization(dns: DeliveryNote[], vehicle: Vehicle): RouteOptimizationResult {
  console.log('Using simulated route optimization (AI service unavailable)');

  const startTime = Date.now();
  const totalDistance = dns.reduce((acc, dn) => acc + (Math.random() * 10 + 5), 0);
  const estimatedTime = totalDistance * 1.5;
  const optimizedDns = [...dns].sort(() => Math.random() - 0.5);

  return {
    id: `opt-sim-${Date.now()}`,
    optimizedOrder: optimizedDns.map(d => d.id),
    savings: totalDistance * 0.15 * 120,
    metrics: {
      distanceSaved: totalDistance * 0.15,
      timeSaved: estimatedTime * 0.2,
      carbonReduction: totalDistance * 0.05,
      fuelEfficiency: 92
    },
    confidence: 0.75, // Lower confidence for simulation
    processingTimeMs: Date.now() - startTime
  };
}

function simulateDemandForecast(historicalData: any[]): any {
  console.log('Using simulated demand forecast (AI service unavailable)');

  return {
    next7Days: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      predictedVolume: Math.floor(Math.random() * 100 + 50),
      confidenceInterval: [40, 110]
    })),
    insights: [
      "Demand forecasting service temporarily unavailable",
      "Using historical averages for predictions",
      "Consider checking AI service status"
    ],
    confidence: 0.6
  };
}

export const aiService = {
  /**
   * Route Optimization Engine
   * Uses Genetic Algorithm via Python microservice
   */
  optimizeRoute: async (dns: DeliveryNote[], vehicle: Vehicle): Promise<RouteOptimizationResult> => {
    try {
      const requestData = {
        deliveryNotes: dns.map(dn => ({
          id: dn.id,
          externalId: dn.externalId,
          clientName: dn.clientName,
          address: dn.address,
          zoneId: dn.zoneId,
          priority: dn.priority || 'normal',
          items: dn.items || [],
          totalAmount: dn.totalAmount || 0,
          currency: dn.currency || 'KES'
        })),
        vehicle: {
          id: vehicle.id,
          type: vehicle.type,
          capacity: vehicle.capacity || {},
          currentLocation: vehicle.currentLocation || { lat: -1.2864, lng: 36.8172 },
          fuelEfficiency: vehicle.fuelEfficiency || 12
        },
        constraints: {} // Can be extended for additional constraints
      };

      const result = await callAIService('/api/v1/route/optimize', requestData);

      if (result) {
        return {
          id: result.id,
          optimizedOrder: result.optimizedOrder,
          savings: result.savings,
          metrics: result.metrics,
          confidence: result.confidence,
          processingTimeMs: result.processingTimeMs
        };
      }
    } catch (error) {
      console.error('Route optimization service error:', error);
    }

    // Fallback to simulation
    return simulateRouteOptimization(dns, vehicle);
  },

  /**
   * Demand Forecasting Engine
   * Uses Prophet/LSTM ensemble via Python microservice
   */
  forecastDemand: async (historicalData: any[]): Promise<any> => {
    try {
      const requestData = {
        historicalData: historicalData,
        forecastHorizon: 7,
        productCategories: [] // Can be extended
      };

      const result = await callAIService('/api/v1/demand/forecast', requestData);

      if (result) {
        return {
          next7Days: result.next7Days,
          insights: result.insights,
          confidence: result.confidence
        };
      }
    } catch (error) {
      console.error('Demand forecasting service error:', error);
    }

    // Fallback to simulation
    return simulateDemandForecast(historicalData);
  },

  /**
   * Anomaly Detection Engine
   * Uses ML models to detect operational anomalies
   */
  detectAnomalies: async (data: any[], threshold: number = 0.95): Promise<any> => {
    try {
      const requestData = {
        data: data,
        threshold: threshold
      };

      const result = await callAIService('/api/v1/anomalies/detect', requestData);

      if (result) {
        return {
          anomalies: result.anomalies,
          riskScore: result.riskScore,
          recommendations: result.recommendations
        };
      }
    } catch (error) {
      console.error('Anomaly detection service error:', error);
    }

    // Fallback response
    return {
      anomalies: [],
      riskScore: 0.1,
      recommendations: ['Anomaly detection service temporarily unavailable']
    };
  }
};

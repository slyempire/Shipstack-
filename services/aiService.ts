
import { DeliveryNote, Vehicle, RouteOptimizationResult, Priority, LogisticsException } from '../types';

/**
 * Cortex AI Service
 * Advanced AI-driven orchestration for logistics
 */
export const aiService = {
  /**
   * Leverages Gemini (via backend proxy) to prioritize the shipment queue.
   */
  prioritizeShipmentQueue: async (dns: DeliveryNote[]): Promise<{ id: string, aiPriority: Priority, reason: string }[]> => {
    try {
      const response = await fetch('/api/ai/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dns })
      });
      
      if (!response.ok) throw new Error('AI prioritization request failed');
      const data = await response.json();
      
      if (data && data.jobId) {
        const { jobId } = data;
        let attempts = 0;
        const maxAttempts = 45; // Wait up to 45 seconds
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
          
          const jobResponse = await fetch(`/api/ai/prioritize/jobs/${jobId}`);
          if (!jobResponse.ok) throw new Error(`Failed to fetch AI job state for ${jobId}`);
          
          const jobState = await jobResponse.json();
          if (jobState.status === 'COMPLETED') {
            return jobState.result;
          } else if (jobState.status === 'FAILED') {
            throw new Error(jobState.error || 'AI prioritization job failed');
          }
        }
        throw new Error('AI prioritization job timed out');
      }
      
      return data;
    } catch (err) {
      console.error("AI prioritization failed:", err);
      // Fallback to basic logic
      return dns.map(dn => ({
        id: dn.id,
        aiPriority: dn.priority as Priority || 'MEDIUM',
        reason: "Local heuristic fallback"
      }));
    }
  },

  /**
   * Suggests efficient dispatch patterns by pairing vehicles and shipments.
   */
  suggestDispatchPatterns: async (dns: DeliveryNote[], vehicles: Vehicle[]): Promise<{ suggestions: { vehicleId: string, dnIds: string[], reason: string }[] }> => {
    try {
      const response = await fetch('/api/ai/suggest-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dns, vehicles })
      });
      
      if (!response.ok) throw new Error('AI dispatch suggestion request failed');
      return await response.json();
    } catch (err) {
      console.error("AI dispatch suggestion failed:", err);
      return { suggestions: [] };
    }
  },

  /**
   * Suggests resolution strategies for a logistics exception.
   */
  suggestResolution: async (exception: LogisticsException): Promise<{ recommendations: { action: string, explanation: string, impact: string }[] }> => {
    try {
      const response = await fetch('/api/ai/suggest-resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exception })
      });
      
      if (!response.ok) throw new Error('AI resolution suggestion request failed');
      return await response.json();
    } catch (err) {
      console.error("AI resolution suggestion failed:", err);
      return { recommendations: [] };
    }
  },

  /**
   * Simulates a Route Optimization Engine
   * Uses a simulated Genetic Algorithm to find the most efficient path
   */
  optimizeRoute: async (dns: DeliveryNote[], vehicle: Vehicle): Promise<RouteOptimizationResult> => {
    // ... rest of the existing simulation logic ...
    // Simulate API latency for "ML processing"
    await new Promise(resolve => setTimeout(resolve, 2000));

    const startTime = Date.now();
    
    // Simulated optimization logic
    // In a real app, this would call a Python/TensorFlow microservice
    const totalDistance = dns.reduce((acc, dn) => acc + (Math.random() * 10 + 5), 0);
    const estimatedTime = totalDistance * 1.5; // mins
    const fuelConsumption = totalDistance * 0.12; // liters
    
    // Sort DNS by "optimized" order (simulated)
    const optimizedDns = [...dns].sort(() => Math.random() - 0.5);

    return {
      id: `opt-${Date.now()}`,
      optimizedOrder: optimizedDns.map(d => d.id),
      savings: totalDistance * 0.15 * 120,
      metrics: {
        distanceSaved: totalDistance * 0.15,
        timeSaved: estimatedTime * 0.2,
        carbonReduction: totalDistance * 0.05,
        fuelEfficiency: 92
      },
      confidence: 0.94,
      processingTimeMs: Date.now() - startTime
    };
  },

  /**
   * Simulates Demand Forecasting
   * Uses simulated Time-Series analysis (Prophet/LSTM style)
   */
  forecastDemand: async (historicalData: any[]): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      next7Days: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        predictedVolume: Math.floor(Math.random() * 100 + 50),
        confidenceInterval: [40, 110]
      })),
      insights: [
        "Expected 15% surge in medical supplies demand in Nairobi West.",
        "Potential stockout risk for 'Amoxicillin' in 3 days.",
        "Optimal reorder point for 'Gloves' reached."
      ]
    };
  }
};

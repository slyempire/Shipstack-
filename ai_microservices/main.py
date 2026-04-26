"""
Cortex AI Microservices
Advanced ML-driven logistics optimization services
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import logging
import uvicorn

# Import our AI modules
from .route_optimizer import RouteOptimizer
from .demand_forecaster import DemandForecaster
from .anomaly_detector import AnomalyDetector

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Cortex AI Microservices",
    description="ML-powered logistics optimization services",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI services
route_optimizer = RouteOptimizer()
demand_forecaster = DemandForecaster()
anomaly_detector = AnomalyDetector()

# Pydantic models for request/response
class DeliveryNote(BaseModel):
    id: str
    externalId: str
    clientName: str
    address: str
    zoneId: str
    priority: str
    items: List[Dict[str, Any]]
    totalAmount: float
    currency: str

class Vehicle(BaseModel):
    id: str
    type: str
    capacity: Dict[str, float]
    currentLocation: Dict[str, float]
    fuelEfficiency: float

class RouteOptimizationRequest(BaseModel):
    deliveryNotes: List[DeliveryNote]
    vehicle: Vehicle
    constraints: Optional[Dict[str, Any]] = {}

class RouteOptimizationResponse(BaseModel):
    id: str
    optimizedOrder: List[str]
    savings: float
    metrics: Dict[str, float]
    confidence: float
    processingTimeMs: int

class DemandForecastRequest(BaseModel):
    historicalData: List[Dict[str, Any]]
    forecastHorizon: int = 7
    productCategories: Optional[List[str]] = None

class DemandForecastResponse(BaseModel):
    next7Days: List[Dict[str, Any]]
    insights: List[str]
    confidence: float

class AnomalyDetectionRequest(BaseModel):
    data: List[Dict[str, Any]]
    threshold: float = 0.95

class AnomalyDetectionResponse(BaseModel):
    anomalies: List[Dict[str, Any]]
    riskScore: float
    recommendations: List[str]

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/v1/route/optimize", response_model=RouteOptimizationResponse)
async def optimize_route(request: RouteOptimizationRequest):
    """
    Optimize delivery route using genetic algorithm and ML predictions
    """
    try:
        start_time = datetime.utcnow()

        # Convert request to internal format
        dns_data = [dn.dict() for dn in request.deliveryNotes]
        vehicle_data = request.vehicle.dict()

        # Run optimization
        result = await route_optimizer.optimize_route(dns_data, vehicle_data, request.constraints)

        processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        return RouteOptimizationResponse(
            id=f"opt-{datetime.utcnow().timestamp()}",
            optimizedOrder=result["optimized_order"],
            savings=result["savings"],
            metrics=result["metrics"],
            confidence=result["confidence"],
            processingTimeMs=processing_time
        )

    except Exception as e:
        logger.error(f"Route optimization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.post("/api/v1/demand/forecast", response_model=DemandForecastResponse)
async def forecast_demand(request: DemandForecastRequest):
    """
    Forecast demand using time-series analysis and ML models
    """
    try:
        # Run forecasting
        result = await demand_forecaster.forecast_demand(
            request.historicalData,
            request.forecastHorizon,
            request.productCategories
        )

        return DemandForecastResponse(
            next7Days=result["forecast"],
            insights=result["insights"],
            confidence=result["confidence"]
        )

    except Exception as e:
        logger.error(f"Demand forecasting failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Forecasting failed: {str(e)}")

@app.post("/api/v1/anomalies/detect", response_model=AnomalyDetectionResponse)
async def detect_anomalies(request: AnomalyDetectionRequest):
    """
    Detect anomalies in logistics operations using ML
    """
    try:
        result = await anomaly_detector.detect_anomalies(
            request.data,
            request.threshold
        )

        return AnomalyDetectionResponse(
            anomalies=result["anomalies"],
            riskScore=result["risk_score"],
            recommendations=result["recommendations"]
        )

    except Exception as e:
        logger.error(f"Anomaly detection failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Initialize AI models on startup"""
    logger.info("Initializing Cortex AI models...")
    await route_optimizer.initialize()
    await demand_forecaster.initialize()
    await anomaly_detector.initialize()
    logger.info("AI models initialized successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Cortex AI services...")
    await route_optimizer.cleanup()
    await demand_forecaster.cleanup()
    await anomaly_detector.cleanup()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
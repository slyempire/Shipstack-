# Cortex AI Microservices

Advanced machine learning services for logistics optimization in the Shipstack platform.

## Overview

Cortex AI provides three core microservices:

1. **Route Optimization** - Genetic algorithm-based delivery route optimization
2. **Demand Forecasting** - Time-series forecasting using Prophet and LSTM models
3. **Anomaly Detection** - ML-powered detection of operational anomalies

## Architecture

```
┌─────────────────┐    HTTP/REST    ┌──────────────────────┐
│   Shipstack     │◄───────────────►│  Cortex AI Services  │
│   Frontend      │                 │  (FastAPI)           │
│   (React/TypeScript) │             │                      │
└─────────────────┘                 │  • Route Optimizer   │
                                   │  • Demand Forecaster │
                                   │  • Anomaly Detector  │
                                   └──────────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.11+
- Docker (optional, for containerized deployment)

### Local Development

1. **Clone and setup:**
   ```bash
   cd ai_microservices
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Run the services:**
   ```bash
   python main.py
   ```

   The API will be available at `http://localhost:8000`

3. **Test the API:**
   ```bash
   curl http://localhost:8000/health
   ```

### Docker Deployment

1. **Build and run:**
   ```bash
   docker-compose up --build
   ```

2. **Access the service:**
   - API: `http://localhost:8000`
   - Health check: `http://localhost:8000/health`

## API Endpoints

### Route Optimization

**POST** `/api/v1/route/optimize`

Optimizes delivery routes using genetic algorithms.

**Request:**
```json
{
  "deliveryNotes": [
    {
      "id": "dn-1",
      "externalId": "ORD-001",
      "clientName": "Client A",
      "address": "Nairobi CBD",
      "zoneId": "z-1",
      "priority": "normal",
      "items": [{"name": "Item 1", "qty": 10}],
      "totalAmount": 5000,
      "currency": "KES"
    }
  ],
  "vehicle": {
    "id": "v-1",
    "type": "truck",
    "capacity": {"weight": 1000, "volume": 10},
    "currentLocation": {"lat": -1.2864, "lng": 36.8172},
    "fuelEfficiency": 12
  },
  "constraints": {}
}
```

**Response:**
```json
{
  "id": "opt-1234567890",
  "optimizedOrder": ["dn-1", "dn-2", "dn-3"],
  "savings": 2400,
  "metrics": {
    "distanceSaved": 20,
    "timeSaved": 15,
    "carbonReduction": 1.0,
    "fuelEfficiency": 92
  },
  "confidence": 0.94,
  "processingTimeMs": 1250
}
```

### Demand Forecasting

**POST** `/api/v1/demand/forecast`

Forecasts demand using ensemble of Prophet and LSTM models.

**Request:**
```json
{
  "historicalData": [
    {"date": "2024-01-01", "demand": 45},
    {"date": "2024-01-02", "demand": 52}
  ],
  "forecastHorizon": 7,
  "productCategories": ["medical", "food"]
}
```

**Response:**
```json
{
  "next7Days": [
    {
      "date": "2024-01-08",
      "predictedVolume": 67,
      "confidenceInterval": [55, 79]
    }
  ],
  "insights": [
    "Expected 15% surge in demand",
    "Peak demand on Wednesday"
  ],
  "confidence": 0.89
}
```

### Anomaly Detection

**POST** `/api/v1/anomalies/detect`

Detects operational anomalies using ML models.

**Request:**
```json
{
  "data": [
    {
      "id": "dn-1",
      "actualDeliveryTime": "2024-01-01T15:30:00Z",
      "estimatedDeliveryTime": "2024-01-01T14:00:00Z",
      "actualDistance": 25.5,
      "estimatedDistance": 22.0,
      "status": "DELIVERED"
    }
  ],
  "threshold": 0.95
}
```

**Response:**
```json
{
  "anomalies": [
    {
      "id": "dn-1",
      "type": "Logistics Delay",
      "severity": "high",
      "confidence": 0.87,
      "description": "Detected: 1.5 hour delay",
      "data": {...}
    }
  ],
  "riskScore": 0.65,
  "recommendations": [
    "Optimize routing algorithms",
    "Consider traffic-aware scheduling"
  ]
}
```

## Configuration

### Environment Variables

- `AI_SERVICE_URL`: Base URL for the AI service (default: `http://localhost:8000`)
- `ENVIRONMENT`: Environment mode (`development` or `production`)

### Service Configuration

The services can be configured by modifying the parameters in each module:

- **Route Optimizer**: Population size, generations, mutation rate
- **Demand Forecaster**: Forecast horizon, model parameters
- **Anomaly Detector**: Contamination rate, thresholds

## Development

### Project Structure

```
ai_microservices/
├── main.py                 # FastAPI application
├── route_optimizer.py      # Route optimization logic
├── demand_forecaster.py    # Demand forecasting logic
├── anomaly_detector.py     # Anomaly detection logic
├── requirements.txt        # Python dependencies
├── Dockerfile             # Container definition
├── docker-compose.yml     # Orchestration
└── README.md             # This file
```

### Adding New Models

1. Create a new module in the `ai_microservices/` directory
2. Implement the required methods (`initialize`, `cleanup`, main processing method)
3. Add the endpoint in `main.py`
4. Update the requirements.txt if new dependencies are needed

### Testing

Run the tests:

```bash
pytest tests/
```

## Deployment

### Production Deployment

1. **Build the Docker image:**
   ```bash
   docker build -t cortex-ai:latest .
   ```

2. **Deploy with docker-compose:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Scale the service:**
   ```bash
   docker-compose up -d --scale cortex-ai=3
   ```

### Kubernetes Deployment

Use the provided Kubernetes manifests in the `k8s/` directory:

```bash
kubectl apply -f k8s/
```

## Monitoring

The service includes built-in health checks and metrics:

- **Health Check**: `GET /health`
- **Metrics**: Prometheus metrics available at `/metrics` (if enabled)

## Troubleshooting

### Common Issues

1. **Service Unavailable**: Check if the Docker container is running
2. **High Latency**: Consider scaling the service or optimizing model parameters
3. **Memory Issues**: Monitor RAM usage, consider using model quantization

### Logs

View logs:
```bash
docker-compose logs cortex-ai
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
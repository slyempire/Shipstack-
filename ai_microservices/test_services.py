#!/usr/bin/env python3
"""
Test script for Cortex AI Microservices
"""

import requests
import json
import time
import numpy as np
from datetime import datetime, timedelta

def test_health_check():
    """Test the health check endpoint"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_route_optimization():
    """Test route optimization endpoint"""
    test_data = {
        "deliveryNotes": [
            {
                "id": "dn-1",
                "externalId": "ORD-001",
                "clientName": "Test Client",
                "address": "Nairobi CBD",
                "zoneId": "z-1",
                "priority": "normal",
                "items": [{"name": "Test Item", "qty": 5}],
                "totalAmount": 2500,
                "currency": "KES"
            },
            {
                "id": "dn-2",
                "externalId": "ORD-002",
                "clientName": "Test Client",
                "address": "Westlands, Nairobi",
                "zoneId": "z-2",
                "priority": "high",
                "items": [{"name": "Test Item 2", "qty": 3}],
                "totalAmount": 1500,
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

    try:
        start_time = time.time()
        response = requests.post(
            "http://localhost:8000/api/v1/route/optimize",
            json=test_data,
            timeout=30
        )
        end_time = time.time()

        if response.status_code == 200:
            result = response.json()
            print("✅ Route optimization passed"            print(f"   Processing time: {(end_time - start_time):.2f}s")
            print(f"   Optimized order: {result.get('optimizedOrder', [])}")
            print(f"   Confidence: {result.get('confidence', 0)}")
            return True
        else:
            print(f"❌ Route optimization failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Route optimization error: {e}")
        return False

def test_demand_forecast():
    """Test demand forecasting endpoint"""
    # Generate sample historical data
    historical_data = []
    base_date = datetime.now() - timedelta(days=30)

    for i in range(30):
        date = base_date + timedelta(days=i)
        # Simulate demand with weekly pattern and some noise
        base_demand = 50 + 20 * (i % 7 == 0)  # Higher on Sundays
        demand = int(base_demand + np.random.normal(0, 5))  # Add noise
        historical_data.append({
            "date": date.strftime("%Y-%m-%d"),
            "demand": max(0, demand)
        })

    test_data = {
        "historicalData": historical_data,
        "forecastHorizon": 7,
        "productCategories": ["general"]
    }

    try:
        start_time = time.time()
        response = requests.post(
            "http://localhost:8000/api/v1/demand/forecast",
            json=test_data,
            timeout=30
        )
        end_time = time.time()

        if response.status_code == 200:
            result = response.json()
            print("✅ Demand forecast passed"            print(f"   Processing time: {(end_time - start_time):.2f}s")
            print(f"   Forecast days: {len(result.get('next7Days', []))}")
            print(f"   Insights: {len(result.get('insights', []))}")
            print(f"   Confidence: {result.get('confidence', 0)}")
            return True
        else:
            print(f"❌ Demand forecast failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Demand forecast error: {e}")
        return False

def test_anomaly_detection():
    """Test anomaly detection endpoint"""
    # Generate sample operational data
    test_data = {
        "data": [
            {
                "id": "dn-1",
                "actualDeliveryTime": "2024-01-01T14:30:00Z",
                "estimatedDeliveryTime": "2024-01-01T14:00:00Z",
                "actualDistance": 22.5,
                "estimatedDistance": 20.0,
                "actualCost": 1200,
                "estimatedCost": 1000,
                "status": "DELIVERED",
                "vehicleCapacity": 1000,
                "actualLoad": 800
            },
            {
                "id": "dn-2",
                "actualDeliveryTime": "2024-01-01T16:00:00Z",  # 2 hour delay
                "estimatedDeliveryTime": "2024-01-01T14:00:00Z",
                "actualDistance": 35.0,
                "estimatedDistance": 25.0,
                "actualCost": 2000,
                "estimatedCost": 1500,
                "status": "DELIVERED",
                "vehicleCapacity": 1000,
                "actualLoad": 950
            }
        ],
        "threshold": 0.8
    }

    try:
        start_time = time.time()
        response = requests.post(
            "http://localhost:8000/api/v1/anomalies/detect",
            json=test_data,
            timeout=30
        )
        end_time = time.time()

        if response.status_code == 200:
            result = response.json()
            print("✅ Anomaly detection passed"            print(f"   Processing time: {(end_time - start_time):.2f}s")
            print(f"   Anomalies found: {len(result.get('anomalies', []))}")
            print(f"   Risk score: {result.get('riskScore', 0)}")
            print(f"   Recommendations: {len(result.get('recommendations', []))}")
            return True
        else:
            print(f"❌ Anomaly detection failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Anomaly detection error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Cortex AI Microservices")
    print("=" * 50)

    # Wait for service to be ready
    print("⏳ Waiting for service to be ready...")
    time.sleep(3)

    tests = [
        ("Health Check", test_health_check),
        ("Route Optimization", test_route_optimization),
        ("Demand Forecast", test_demand_forecast),
        ("Anomaly Detection", test_anomaly_detection)
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        if test_func():
            passed += 1
        print()

    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! Cortex AI is ready.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the service logs.")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
"""
Anomaly Detection Service
Uses Isolation Forest and Autoencoders for detecting operational anomalies
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import tensorflow as tf
from tensorflow import keras
import asyncio
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class AnomalyDetector:
    def __init__(self):
        self.isolation_forest = None
        self.autoencoder = None
        self.scaler = StandardScaler()
        self.initialized = False

    async def initialize(self):
        """Initialize anomaly detection models"""
        # Initialize models
        self.isolation_forest = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )

        # Simple autoencoder for reconstruction-based anomaly detection
        self.autoencoder = self._build_autoencoder()

        self.initialized = True
        logger.info("Anomaly detector initialized")

    async def cleanup(self):
        """Cleanup resources"""
        pass

    async def detect_anomalies(
        self,
        data: List[Dict[str, Any]],
        threshold: float = 0.95
    ) -> Dict[str, Any]:
        """
        Detect anomalies in logistics operations data
        """
        if not self.initialized:
            raise RuntimeError("Anomaly detector not initialized")

        try:
            # Prepare data
            df = self._prepare_anomaly_data(data)

            if df.empty or len(df) < 10:
                return self._generate_mock_anomalies()

            # Detect anomalies using ensemble approach
            isolation_anomalies = self._isolation_forest_detection(df)
            autoencoder_anomalies = self._autoencoder_detection(df)

            # Combine results
            combined_anomalies = self._combine_anomaly_results(
                isolation_anomalies,
                autoencoder_anomalies,
                threshold
            )

            # Calculate risk score
            risk_score = self._calculate_risk_score(combined_anomalies, len(df))

            # Generate recommendations
            recommendations = self._generate_recommendations(combined_anomalies, risk_score)

            return {
                "anomalies": combined_anomalies,
                "risk_score": risk_score,
                "recommendations": recommendations
            }

        except Exception as e:
            logger.error(f"Anomaly detection failed: {str(e)}")
            return self._generate_mock_anomalies()

    def _prepare_anomaly_data(self, data: List[Dict[str, Any]]) -> pd.DataFrame:
        """Prepare data for anomaly detection"""
        if not data:
            return pd.DataFrame()

        df = pd.DataFrame(data)

        # Extract relevant features for anomaly detection
        features = []

        for _, row in df.iterrows():
            feature_vector = []

            # Delivery time anomalies
            if 'actualDeliveryTime' in row and 'estimatedDeliveryTime' in row:
                delay = (pd.to_datetime(row['actualDeliveryTime']) -
                        pd.to_datetime(row['estimatedDeliveryTime'])).total_seconds() / 3600
                feature_vector.append(delay)
            else:
                feature_vector.append(0)

            # Distance anomalies
            if 'actualDistance' in row and 'estimatedDistance' in row:
                distance_diff = abs(row['actualDistance'] - row['estimatedDistance'])
                feature_vector.append(distance_diff)
            else:
                feature_vector.append(0)

            # Cost anomalies
            if 'actualCost' in row and 'estimatedCost' in row:
                cost_variance = (row['actualCost'] - row['estimatedCost']) / max(row['estimatedCost'], 1)
                feature_vector.append(cost_variance)
            else:
                feature_vector.append(0)

            # Status anomalies (late deliveries, cancellations)
            status_score = 0
            if row.get('status') == 'LATE':
                status_score = 2
            elif row.get('status') == 'CANCELLED':
                status_score = 3
            elif row.get('status') == 'DELIVERED' and row.get('onTime', True) == False:
                status_score = 1
            feature_vector.append(status_score)

            # Load factor anomalies
            if 'vehicleCapacity' in row and 'actualLoad' in row:
                load_factor = row['actualLoad'] / max(row['vehicleCapacity'], 1)
                feature_vector.append(load_factor)
            else:
                feature_vector.append(0.5)  # Assume 50% load

            features.append(feature_vector)

        # Create DataFrame with features
        columns = ['delay_hours', 'distance_variance', 'cost_variance', 'status_score', 'load_factor']
        feature_df = pd.DataFrame(features, columns=columns)

        # Add original data for reference
        feature_df['original_data'] = data

        return feature_df

    def _isolation_forest_detection(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect anomalies using Isolation Forest"""
        try:
            # Prepare features
            feature_cols = ['delay_hours', 'distance_variance', 'cost_variance', 'status_score', 'load_factor']
            X = df[feature_cols].values

            # Scale features
            X_scaled = self.scaler.fit_transform(X)

            # Fit and predict
            anomaly_scores = self.isolation_forest.fit_predict(X_scaled)

            # Get anomaly scores
            scores = self.isolation_forest.decision_function(X_scaled)
            scores = (scores - scores.min()) / (scores.max() - scores.min())  # Normalize to 0-1

            anomalies = []
            for i, (score, prediction) in enumerate(zip(scores, anomaly_scores)):
                if prediction == -1:  # Anomaly
                    anomaly_data = df.iloc[i]['original_data']
                    anomalies.append({
                        'id': anomaly_data.get('id', f'anomaly_{i}'),
                        'type': self._classify_anomaly(df.iloc[i]),
                        'severity': 'high' if score > 0.8 else 'medium' if score > 0.6 else 'low',
                        'confidence': float(score),
                        'description': self._describe_anomaly(df.iloc[i]),
                        'data': anomaly_data
                    })

            return anomalies

        except Exception as e:
            logger.warning(f"Isolation Forest detection failed: {str(e)}")
            return []

    def _build_autoencoder(self) -> keras.Model:
        """Build autoencoder for anomaly detection"""
        input_dim = 5  # Number of features

        # Encoder
        input_layer = keras.layers.Input(shape=(input_dim,))
        encoded = keras.layers.Dense(32, activation='relu')(input_layer)
        encoded = keras.layers.Dense(16, activation='relu')(encoded)
        encoded = keras.layers.Dense(8, activation='relu')(encoded)

        # Decoder
        decoded = keras.layers.Dense(16, activation='relu')(encoded)
        decoded = keras.layers.Dense(32, activation='relu')(decoded)
        decoded = keras.layers.Dense(input_dim, activation='linear')(decoded)

        autoencoder = keras.Model(input_layer, decoded)
        autoencoder.compile(optimizer='adam', loss='mse')

        return autoencoder

    def _autoencoder_detection(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect anomalies using autoencoder reconstruction error"""
        try:
            feature_cols = ['delay_hours', 'distance_variance', 'cost_variance', 'status_score', 'load_factor']
            X = df[feature_cols].values

            # Scale features
            X_scaled = self.scaler.fit_transform(X)

            # Train autoencoder (quick training)
            self.autoencoder.fit(X_scaled, X_scaled, epochs=20, batch_size=16, verbose=0)

            # Calculate reconstruction error
            reconstructed = self.autoencoder.predict(X_scaled, verbose=0)
            reconstruction_errors = np.mean(np.square(X_scaled - reconstructed), axis=1)

            # Normalize errors to 0-1
            errors_normalized = (reconstruction_errors - reconstruction_errors.min()) / \
                              (reconstruction_errors.max() - reconstruction_errors.min())

            anomalies = []
            threshold = np.percentile(errors_normalized, 90)  # Top 10% as anomalies

            for i, error in enumerate(errors_normalized):
                if error > threshold:
                    anomaly_data = df.iloc[i]['original_data']
                    anomalies.append({
                        'id': anomaly_data.get('id', f'anomaly_{i}'),
                        'type': 'reconstruction_anomaly',
                        'severity': 'high' if error > 0.8 else 'medium',
                        'confidence': float(error),
                        'description': f"High reconstruction error ({error:.3f}) indicates anomalous pattern",
                        'data': anomaly_data
                    })

            return anomalies

        except Exception as e:
            logger.warning(f"Autoencoder detection failed: {str(e)}")
            return []

    def _combine_anomaly_results(
        self,
        isolation_anomalies: List[Dict],
        autoencoder_anomalies: List[Dict],
        threshold: float
    ) -> List[Dict[str, Any]]:
        """Combine results from multiple anomaly detection methods"""
        combined = {}

        # Add isolation forest anomalies
        for anomaly in isolation_anomalies:
            if anomaly['confidence'] >= threshold:
                combined[anomaly['id']] = anomaly

        # Add autoencoder anomalies (avoid duplicates)
        for anomaly in autoencoder_anomalies:
            if anomaly['confidence'] >= threshold:
                if anomaly['id'] not in combined:
                    combined[anomaly['id']] = anomaly
                else:
                    # If both detect same anomaly, take higher confidence
                    if anomaly['confidence'] > combined[anomaly['id']]['confidence']:
                        combined[anomaly['id']] = anomaly

        return list(combined.values())

    def _classify_anomaly(self, anomaly_row: pd.Series) -> str:
        """Classify the type of anomaly"""
        delay = anomaly_row['delay_hours']
        cost_var = anomaly_row['cost_variance']
        status = anomaly_row['status_score']

        if status >= 2:
            return "Delivery Failure"
        elif delay > 2:
            return "Logistics Delay"
        elif abs(cost_var) > 0.3:
            return "Cost Variance"
        elif anomaly_row['distance_variance'] > 10:
            return "Route Deviation"
        else:
            return "Operational Anomaly"

    def _describe_anomaly(self, anomaly_row: pd.Series) -> str:
        """Generate description for anomaly"""
        descriptions = []

        if anomaly_row['delay_hours'] > 2:
            descriptions.append(f"{anomaly_row['delay_hours']:.1f} hour delay")
        if abs(anomaly_row['cost_variance']) > 0.3:
            pct = anomaly_row['cost_variance'] * 100
            descriptions.append(f"{pct:+.1f}% cost variance")
        if anomaly_row['status_score'] >= 2:
            descriptions.append("delivery failure")
        if anomaly_row['distance_variance'] > 10:
            descriptions.append(f"{anomaly_row['distance_variance']:.1f} km route deviation")

        if descriptions:
            return "Detected: " + ", ".join(descriptions)
        else:
            return "Unusual operational pattern detected"

    def _calculate_risk_score(self, anomalies: List[Dict], total_records: int) -> float:
        """Calculate overall risk score"""
        if total_records == 0:
            return 0.0

        anomaly_rate = len(anomalies) / total_records

        # Weight by severity
        weighted_score = 0
        for anomaly in anomalies:
            severity_weight = {'high': 1.0, 'medium': 0.6, 'low': 0.3}
            weighted_score += severity_weight.get(anomaly['severity'], 0.5) * anomaly['confidence']

        # Normalize to 0-1 scale
        risk_score = min(1.0, (anomaly_rate * 0.7) + (weighted_score / max(len(anomalies), 1) * 0.3))

        return round(risk_score, 2)

    def _generate_recommendations(self, anomalies: List[Dict], risk_score: float) -> List[str]:
        """Generate actionable recommendations based on anomalies"""
        recommendations = []

        if risk_score > 0.8:
            recommendations.append("CRITICAL: Immediate operational review required")
        elif risk_score > 0.6:
            recommendations.append("HIGH RISK: Enhanced monitoring recommended")
        elif risk_score > 0.4:
            recommendations.append("MEDIUM RISK: Monitor key performance indicators")

        # Anomaly-specific recommendations
        anomaly_types = {}
        for anomaly in anomalies:
            anomaly_types[anomaly['type']] = anomaly_types.get(anomaly['type'], 0) + 1

        if anomaly_types.get('Logistics Delay', 0) > 0:
            recommendations.append("Optimize routing algorithms and consider traffic-aware scheduling")

        if anomaly_types.get('Cost Variance', 0) > 0:
            recommendations.append("Review pricing models and supplier contracts")

        if anomaly_types.get('Delivery Failure', 0) > 0:
            recommendations.append("Implement additional quality checks and backup delivery options")

        if anomaly_types.get('Route Deviation', 0) > 0:
            recommendations.append("Verify GPS tracking accuracy and driver compliance")

        if len(anomalies) == 0:
            recommendations.append("Operations performing within normal parameters")

        return recommendations[:5]  # Limit to 5 recommendations

    def _generate_mock_anomalies(self) -> Dict[str, Any]:
        """Generate mock anomalies when detection fails"""
        return {
            "anomalies": [
                {
                    "id": "mock_anomaly_1",
                    "type": "Mock Anomaly",
                    "severity": "medium",
                    "confidence": 0.7,
                    "description": "Mock anomaly for demonstration purposes",
                    "data": {"id": "mock_1", "status": "unknown"}
                }
            ],
            "risk_score": 0.3,
            "recommendations": [
                "Anomaly detection requires more operational data",
                "Consider collecting delivery metrics for better analysis"
            ]
        }
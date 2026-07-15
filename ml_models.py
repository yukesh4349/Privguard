import os
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

class IsolationForestAnomalyDetector:
    """
    Unsupervised ML model for detecting point anomalies.
    """
    def __init__(self, model_path: str = "models/iso_forest.pkl", scaler_path: str = "models/scaler.pkl"):
        self.model_path = model_path
        self.scaler_path = scaler_path
        
        # Create models directory if it doesn't exist
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        self.model = None
        self.scaler = None
        self.load_model()
        
    def load_model(self):
        if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
            self.model = joblib.load(self.model_path)
            self.scaler = joblib.load(self.scaler_path)
        else:
            # Initialize untrained models
            self.model = IsolationForest(contamination=0.05, random_state=42)
            self.scaler = StandardScaler()
            
    def train(self, X: np.ndarray):
        """Trains the Isolation Forest model on historical feature data."""
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        
        # Save models
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
        
    def predict_score(self, X: np.ndarray) -> float:
        """
        Returns a normalized risk score from 0-100 based on the model's decision function.
        100 = Highly anomalous, 0 = Normal
        """
        if self.model is None or not hasattr(self.model, "estimators_") or not self.model.estimators_:
            # Model not trained, fallback to 0
            return 0.0
            
        X_scaled = self.scaler.transform(X)
        
        # decision_function returns negative values for outliers, positive for inliers
        # Range is generally around [-0.5, 0.5]
        score = self.model.decision_function(X_scaled)[0]
        
        # Normalize to 0-100 where higher is more anomalous
        # We invert the score (so negative becomes positive) and scale it
        normalized = 50 * (1 - score)
        return float(np.clip(normalized, 0, 100))

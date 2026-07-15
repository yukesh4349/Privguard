import numpy as np
from ml_models import IsolationForestAnomalyDetector

def generate_synthetic_data():
    print("Generating synthetic data...")
    num_samples = 1000
    
    # Normal behavior data
    # Feature 0: Hour of day (mostly 9-17)
    hours = np.random.normal(loc=13, scale=2, size=num_samples)
    hours = np.clip(hours, 0, 23).astype(int)
    
    # Feature 1: Bytes transferred (mostly 100-5000 bytes)
    bytes_tx = np.random.exponential(scale=1000, size=num_samples)
    
    # Feature 2: Time since last event (mostly seconds to minutes)
    time_diffs = np.random.exponential(scale=600, size=num_samples)
    
    # Feature 3: Is new system (mostly 0)
    is_new = np.random.binomial(n=1, p=0.05, size=num_samples)
    
    X_train = np.column_stack((hours, bytes_tx, time_diffs, is_new))
    
    print("Training Isolation Forest Anomaly Detector...")
    detector = IsolationForestAnomalyDetector()
    detector.train(X_train)
    print("Training complete. Models saved to models/ directory.")
    
if __name__ == "__main__":
    generate_synthetic_data()

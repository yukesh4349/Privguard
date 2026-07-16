import numpy as np
from typing import Dict, Any
from datetime import datetime

class FeatureExtractor:
    """
    Extracts rolling behavioral features (1h/24h/7d windows).
    In a production system, this would read from a Feature Store (e.g. Feast)
    or a Stream Processor (e.g. Flink). 
    """
    def __init__(self):
        # In-memory mock feature store
        self.user_history = {}
    
    def extract_features(self, event: Any) -> np.ndarray:
        """
        Extracts a feature vector for the ML model based on the event.
        Features:
        0: Hour of day (0-23)
        1: Bytes transferred (normalized or raw)
        2: Time since last event (seconds)
        3: Is new system (0 or 1)
        """
        user_id = str(event.session_id) # Using session_id as a proxy for user_id in this mock
        
        # Ensure timestamp is offset-naive if it's offset-aware to avoid timezone mixing
        if isinstance(event.timestamp, str):
            event_time = datetime.fromisoformat(event.timestamp.replace('Z', '+00:00'))
        else:
            event_time = event.timestamp
            
        if event_time.tzinfo is not None:
            event_time = event_time.replace(tzinfo=None)

        # Initialize user history if not present
        if user_id not in self.user_history:
            self.user_history[user_id] = {
                "last_event_time": event_time,
                "accessed_systems": set()
            }
        
        history = self.user_history[user_id]
        
        # Feature 1: Hour of day
        hour_of_day = event_time.hour
        
        # Feature 2: Bytes transferred (default to 0 if None)
        bytes_tx = event.bytes_transferred or 0
        
        # Feature 3: Time since last event
        time_diff = (event_time - history["last_event_time"]).total_seconds()
        if time_diff < 0:
            time_diff = 0
            
        # Feature 4: Is new system?
        target_system = event.target_system or "unknown"
        is_new_system = 1 if target_system not in history["accessed_systems"] else 0
        
        # Update history
        history["last_event_time"] = event_time
        history["accessed_systems"].add(target_system)
        
        # Return as numpy array (1, 4) for sklearn compatibility
        return np.array([[hour_of_day, bytes_tx, time_diff, is_new_system]])

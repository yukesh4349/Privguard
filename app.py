from fastapi import FastAPI, HTTPException
from models import EventModel, RiskScoreResponse
from features import FeatureExtractor
from ml_models import IsolationForestAnomalyDetector

app = FastAPI(
    title="Insider Threat Detection API",
    description="AI-Driven Privileged Access Misuse & Insider Threat Detection Platform",
    version="1.0.0"
)

# Initialize singletons
feature_extractor = FeatureExtractor()
anomaly_detector = IsolationForestAnomalyDetector()

@app.post("/api/v1/events/ingest", response_model=RiskScoreResponse)
async def ingest_event(event: EventModel):
    """
    Ingest a single event, evaluate it against rules, anomaly models, and graph context.
    """
    # 1. Feature Extraction
    features = feature_extractor.extract_features(event)
    
    # 2. Anomaly Model (UEBA) evaluation
    anomaly_score = anomaly_detector.predict_score(features)
    
    # 3. Rule Engine evaluation (Mocked for now)
    rule_score = 0.0
    if event.bytes_transferred and event.bytes_transferred > 10000:
        rule_score = 80.0
        
    # 4. Graph Context evaluation (Mocked for now)
    graph_score = 0.0
    
    # 5. Composite Score Calculation
    # Weights: w1=0.30 (Rules), w2=0.35 (Anomaly), w3=0.20 (Graph), w4=0.15 (Context)
    # Using normalized context weight distribution to 1.0 for the first 3
    composite = (0.35 * rule_score) + (0.45 * anomaly_score) + (0.20 * graph_score)
    
    # Routing logic based on composite score
    risk_band = "Low"
    action = "allow"
    if composite > 85:
        risk_band = "Critical"
        action = "auto-block-session"
    elif composite > 60:
        risk_band = "High"
        action = "jit-approval-required"
    elif composite > 30:
        risk_band = "Medium"
        action = "step-up-mfa"
        
    explanation = (f"Risk {composite:.1f}/100 - "
                   f"Anomaly Score: {anomaly_score:.1f}, "
                   f"Rule Score: {rule_score:.1f}. "
                   f"Action assigned based on {risk_band} risk band.")
        
    return RiskScoreResponse(
        event_id=event.event_id,
        composite_risk_score=composite,
        risk_band=risk_band,
        action_required=action,
        explanation=explanation
    )

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Insider Threat Engine is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any
from app.api import deps
from app.models.user import User

router = APIRouter()

@router.get("/flagged-users")
def get_flagged_users(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    flagged = db.query(User).filter(User.is_flagged == True).all()
    
    results = []
    for u in flagged:
        results.append({
            "username": u.username,
            "name": u.name,
            "department": u.department,
            "failed_login_attempts": u.failed_login_attempts,
            "anomalous_actions": 1 if u.is_flagged else 0,
            "reasons": ["High Risk Event Detected"] if u.is_flagged else [],
            "last_flagged_at": None
        })
    return results

@router.delete("/{username}")
def delete_user(
    username: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    name = user.name
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully", "name": name}

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def seed():
    db = SessionLocal()
    
    # Create admin
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            name="Security Admin",
            department="SecOps",
            role="admin",
            hashed_password=get_password_hash("123456")
        )
        db.add(admin)

    # Create test user
    alice = db.query(User).filter(User.username == "alice").first()
    if not alice:
        alice = User(
            username="alice",
            name="Alice Chen",
            department="Engineering",
            role="user",
            hashed_password=get_password_hash("123456")
        )
        db.add(alice)

    db.commit()
    print("Database seeded successfully with 'admin' and 'alice'.")

if __name__ == "__main__":
    seed()

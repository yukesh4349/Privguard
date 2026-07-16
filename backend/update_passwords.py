from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def update_passwords():
    db = SessionLocal()
    users = db.query(User).all()
    new_hashed_password = get_password_hash("112233")
    for user in users:
        user.hashed_password = new_hashed_password
    db.commit()
    print("Updated passwords for all existing users.")

if __name__ == "__main__":
    update_passwords()

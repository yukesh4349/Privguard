import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base_class import Base
from app.api.deps import get_db
from app.models.user import User
from app.core.security import get_password_hash

# In-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Create test users
    admin_user = User( # type: ignore
        username="admin_test",
        hashed_password=get_password_hash("password123"),
        name="Admin Test",
        department="SecOps",
        role="admin",
        is_active=True
    )
    regular_user = User( # type: ignore
        username="user_test",
        hashed_password=get_password_hash("password123"),
        name="User Test",
        department="Engineering",
        role="user",
        is_active=True
    )
    session.add(admin_user)
    session.add(regular_user)
    session.commit()
    
    yield session
    
    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    del app.dependency_overrides[get_db]

@pytest.fixture(scope="module")
def admin_token_headers(client: TestClient):
    login_data = {
        "username": "admin_test",
        "password": "password123",
    }
    r = client.post("/api/v1/auth/login", data=login_data)
    tokens = r.json()
    a_token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {a_token}"}
    return headers

@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient):
    login_data = {
        "username": "user_test",
        "password": "password123",
    }
    r = client.post("/api/v1/auth/login", data=login_data)
    tokens = r.json()
    a_token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {a_token}"}
    return headers

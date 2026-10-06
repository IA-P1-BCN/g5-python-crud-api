from fastapi.testclient import TestClient
from back.app.main import app

client = TestClient(app)

def fixtureroom_data():
    return {
        "name": "Sala Test Pro",
        "capacity": 4,
        "duration": 60,
        "base_price": 50.00
    }

def test_create_room_success():
    response = client.post("/api/v1/rooms", json={
        "name": "Sala Misterio 1",
        "capacity": 4,
        "duration": 60,
        "base_price": 45.00
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Sala Misterio 1"
    assert "id" in data
    assert data["status"] == "active"

def test_create_room_duplicate_name():
    payload = {
        "name": "Sala Duplicada",
        "capacity": 2,
        "duration": 45,
        "base_price": 30.00
    }
    # Primera creación (éxito)
    client.post("/api/v1/rooms", json=payload)
    
    # Segunda creación con el mismo nombre (debe fallar con 409)
    response = client.post("/api/v1/rooms", json=payload)
    assert response.status_code == 409
    data = response.json()
    assert data["code"] == "DUPLICATE"
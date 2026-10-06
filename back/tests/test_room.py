from decimal import Decimal
from types import SimpleNamespace
from back.app.models import Room

URL = "/api/v1/rooms"


def test_create_room_success(client):
    """Prueba la creación exitosa de una sala (201 Created)."""
    response = client.post(URL, json={
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


def test_create_room_duplicate_name(client, db):
    """Prueba que un nombre duplicado devuelva un error 409 Conflict."""
    # Insertamos una sala previa para simular el duplicado
    existing_room = Room(
        name="Sala Duplicada",
        capacity=2,
        duration=45,
        base_price=30.00
    )
    db.add(existing_room)
    db.commit()

    response = client.post(URL, json={
        "name": "Sala Duplicada",
        "capacity": 4,
        "duration": 60,
        "base_price": 40.00
    })
    assert response.status_code == 409
    data = response.json()
    assert data["code"] == "DUPLICATE"
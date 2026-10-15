import logging

import pytest
from fastapi.testclient import TestClient

from back.app.core.errors import AppError
from back.app.main import app

client = TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def temp_route():
    added = []

    def add(path, endpoint):
        app.add_api_route(path, endpoint)
        added.append(app.router.routes[-1])

    yield add
    for route in added:
        app.router.routes.remove(route)


def test_health():
    for path in ("/health", "/api/v1/health"):
        response = client.get(path)

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


def test_app_error_format(temp_route):
    def failing():
        raise AppError("Business rule failed", code="RULE_FAILED")

    temp_route("/test-app-error", failing)

    response = client.get("/test-app-error")

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Business rule failed",
        "code": "RULE_FAILED",
    }


def test_request_logging(caplog):
    with caplog.at_level(logging.INFO):
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert any(
        "request | method=GET | path=/api/v1/health | status=200" in record.message
        for record in caplog.records
    )


def test_unexpected_exception_logging(caplog, temp_route):
    def failing():
        raise RuntimeError("Unexpected test failure")

    temp_route("/test-unexpected-error", failing)

    with caplog.at_level(logging.ERROR):
        response = client.get("/test-unexpected-error")

    assert response.status_code == 500
    assert response.json() == {
        "detail": "Internal server error",
        "code": "INTERNAL_ERROR",
    }
    assert any(
        "unexpected exception | method=GET | path=/test-unexpected-error"
        in record.message
        and record.exc_info
        for record in caplog.records
    )


def test_validation_error_has_code():
    response = client.get("/api/v1/rooms?page=0")

    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "VALIDATION_ERROR"
    assert isinstance(body["detail"], str)
    assert "page" in body["detail"]


def test_unknown_route_has_not_found_code():
    response = client.get("/api/v1/nope")

    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def test_method_not_allowed_has_code():
    response = client.delete("/health")

    assert response.status_code == 405
    assert response.json()["code"] == "METHOD_NOT_ALLOWED"

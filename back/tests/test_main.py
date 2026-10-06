import logging

from fastapi.testclient import TestClient

from back.app.core.errors import AppError
from back.app.main import app

client = TestClient(app, raise_server_exceptions=False)


def test_health():
    for path in ("/health", "/api/v1/health"):
        response = client.get(path)

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


def test_app_error_format():
    @app.get("/test-app-error")
    def test_app_error():
        raise AppError("Business rule failed")

    response = client.get("/test-app-error")

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Business rule failed",
        "code": "BR-X1",
    }


def test_request_logging(caplog):
    with caplog.at_level(logging.INFO):
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert any(
        "request | method=GET | path=/api/v1/health | status=200" in record.message
        for record in caplog.records
    )


def test_unexpected_exception_logging(caplog):
    @app.get("/test-unexpected-error")
    def test_unexpected_error():
        raise RuntimeError("Unexpected test failure")

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
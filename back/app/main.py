import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from back.app.config.logging import setup_logging
from back.app.core.errors import AppError

setup_logging()

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Escape Room API",
    version="0.1.0",
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    response = None

    try:
        response = await call_next(request)
        return response
    finally:
        logger.info(
            "request | method=%s | path=%s | status=%s",
            request.method,
            request.url.path,
            response.status_code if response is not None else 500,
        )


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.code,
            "message": exc.message,
        },
    )


@app.exception_handler(Exception)
async def unexpected_exception_handler(request: Request, exc: Exception):
    logger.exception(
        "unexpected exception | method=%s | path=%s",
        request.method,
        request.url.path,
    )

    return JSONResponse(
        status_code=500,
        content={
            "code": "INTERNAL_ERROR",
            "message": "Internal server error",
        },
    )


@app.get("/")
def root():
    return {"message": "Escape Room API"}


@app.get("/health")
@app.get("/api/v1/health")
def health():
    return {"status": "ok"}
from sqlalchemy.exc import IntegrityError


def is_violation_of(exc: IntegrityError, *markers: str) -> bool:
    message = str(exc.orig if exc.orig is not None else exc).lower()
    return any(marker.lower() in message for marker in markers)

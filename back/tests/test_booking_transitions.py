import pytest

from back.app.core.errors import AppError
from back.app.models.booking import TRANSITIONS, ensure_transition

ALLOWED = [
    ("PENDING", "CONFIRMED"),
    ("PENDING", "CANCELLED"),
    ("CONFIRMED", "IN_PROGRESS"),
    ("CONFIRMED", "CANCELLED"),
    ("IN_PROGRESS", "COMPLETED"),
]


@pytest.mark.parametrize(("current", "new"), ALLOWED)
def test_allowed_transition_passes(current, new):
    ensure_transition(current, new, "change")


@pytest.mark.parametrize(
    ("current", "new"),
    [
        ("PENDING", "IN_PROGRESS"),
        ("CONFIRMED", "COMPLETED"),
        ("IN_PROGRESS", "CANCELLED"),
        ("COMPLETED", "CANCELLED"),
        ("CANCELLED", "CONFIRMED"),
        ("COMPLETED", "IN_PROGRESS"),
    ],
)
def test_forbidden_transition_raises_409(current, new):
    with pytest.raises(AppError) as exc:
        ensure_transition(current, new, "change")
    assert exc.value.code == "INVALID_TRANSITION"
    assert exc.value.status_code == 409


def test_final_states_have_no_exit():
    assert TRANSITIONS["COMPLETED"] == set()
    assert TRANSITIONS["CANCELLED"] == set()

from sqlalchemy import select

from back.app.core.pagination import PageParams, paginate
from back.app.models import User


def _add_users(db, n):
    for i in range(n):
        db.add(User(email=f"u{i}@x.com", name=f"U{i}"))
    db.commit()


def test_paginate_first_page(db):
    _add_users(db, 5)

    page = paginate(db, select(User).order_by(User.id), PageParams(page=1, size=2))

    assert page["total"] == 5
    assert page["page"] == 1
    assert page["size"] == 2
    assert [u.name for u in page["items"]] == ["U0", "U1"]


def test_paginate_last_partial_page(db):
    _add_users(db, 5)

    page = paginate(db, select(User).order_by(User.id), PageParams(page=3, size=2))

    assert [u.name for u in page["items"]] == ["U4"]


def test_paginate_page_beyond_end_is_empty(db):
    _add_users(db, 2)

    page = paginate(db, select(User).order_by(User.id), PageParams(page=9, size=2))

    assert page["items"] == []
    assert page["total"] == 2

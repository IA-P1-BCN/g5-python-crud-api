from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from back.app.config.settings import settings

engine = create_engine(settings.database_url)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass
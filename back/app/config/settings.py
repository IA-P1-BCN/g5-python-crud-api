from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    shared_database_url: str | None = None
    supabase_url: str
    admin_emails: str = ""
    max_active_bookings: int = 5

    @field_validator("supabase_url")
    @classmethod
    def _supabase_url_must_be_https(cls, value: str) -> str:
        if not value.startswith("https://"):
            raise ValueError("SUPABASE_URL must start with https://")
        return value

    @property
    def effective_database_url(self) -> str:
        url = self.shared_database_url or self.database_url

        if url.startswith("postgresql://"):
            return url.replace(
                "postgresql://",
                "postgresql+psycopg://",
                1,
            )

        return url

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

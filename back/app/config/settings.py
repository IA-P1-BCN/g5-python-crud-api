from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    shared_database_url: str | None = None

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

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
    )


settings = Settings()
from fastapi import FastAPI

app = FastAPI(
    title="Escape Room API",
    version="0.1.0",
)


@app.get("/")
def root():
    return {"message": "Escape Room API"}
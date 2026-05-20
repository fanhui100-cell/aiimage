# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, templates

app = FastAPI(title="AI Image SaaS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(templates.router, prefix="/api/templates", tags=["templates"])

@app.get("/health")
def health():
    return {"status": "ok"}

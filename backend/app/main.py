# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, templates, generations, credits, history

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
app.include_router(generations.router, prefix="/api/generate", tags=["generate"])
app.include_router(credits.router, prefix="/api/credits", tags=["credits"])
app.include_router(history.router, prefix="/api/history", tags=["history"])

@app.get("/health")
def health():
    return {"status": "ok"}

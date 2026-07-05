# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, templates, generations, credits, history
from app.routers.prompts import router as prompts_router

app = FastAPI(title="AI Image SaaS")

allowed_origins = list(
    dict.fromkeys(
        [
            settings.FRONTEND_URL,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(templates.router, prefix="/api/templates", tags=["templates"])
app.include_router(generations.router, prefix="/api/generate", tags=["generate"])
app.include_router(credits.router, prefix="/api/credits", tags=["credits"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(prompts_router)

@app.get("/health")
def health():
    return {"status": "ok"}

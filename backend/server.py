from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.getenv('MONGO_URL') or os.getenv('MONGODB_URI')
if not mongo_url:
    raise RuntimeError('Missing MONGO_URL environment variable')

db_name = os.getenv('DB_NAME') or os.getenv('MONGO_DB_NAME') or 'brs_reminder'
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI()
api_router = APIRouter(prefix="/api")


@app.get("/")
async def service_root():
    return {
        "message": "BRS Reminder API",
        "health": "/api/health",
        "docs": "/docs",
    }


@app.get("/health")
async def service_health():
    return {"ok": True, "scope": "service"}


# ---------- Models ----------
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    store_code: str
    display_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LoginRequest(BaseModel):
    user_id: str
    store_code: str


class RegisterRequest(BaseModel):
    user_id: str
    store_code: str
    display_name: Optional[str] = None


class LoginResponse(BaseModel):
    id: str
    user_id: str
    store_code: str
    display_name: str


class Client(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_user_id: str
    name: str
    phone_number: Optional[str] = ""
    order_number: str
    provider: Optional[str] = ""  # "Virgin" | "Bell" | ""
    installation_date: str  # ISO date string YYYY-MM-DD
    order_details: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ClientCreate(BaseModel):
    owner_user_id: str
    name: str
    phone_number: Optional[str] = ""
    order_number: str
    provider: Optional[str] = ""
    installation_date: str
    order_details: str


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    order_number: Optional[str] = None
    provider: Optional[str] = None
    installation_date: Optional[str] = None
    order_details: Optional[str] = None


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "BRS Reminder API"}


@api_router.get("/health")
async def health():
    return {"ok": True}


@api_router.post("/auth/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    uid = payload.user_id.strip()
    code = payload.store_code.strip()
    # Case-insensitive user_id match for forgiving login UX
    user = await db.users.find_one(
        {
            "user_id": {"$regex": f"^{uid}$", "$options": "i"},
            "store_code": code,
        },
        {"_id": 0},
    )
    if not user:
        raise HTTPException(status_code=401, detail="Invalid User ID or Store Code")
    return LoginResponse(**user)


@api_router.post("/auth/register", response_model=LoginResponse)
async def register(payload: RegisterRequest):
    uid = payload.user_id.strip()
    code = payload.store_code.strip()
    display = (payload.display_name or uid).strip()

    if len(uid) < 3:
        raise HTTPException(status_code=400, detail="User ID must be at least 3 characters")
    if len(code) < 4:
        raise HTTPException(status_code=400, detail="Store Code must be at least 4 characters")
    if not display:
        display = uid

    existing = await db.users.find_one(
        {"user_id": {"$regex": f"^{uid}$", "$options": "i"}}
    )
    if existing:
        raise HTTPException(status_code=409, detail="User ID already taken. Please choose another.")

    user = User(user_id=uid, store_code=code, display_name=display)
    await db.users.insert_one(user.model_dump())
    return LoginResponse(
        id=user.id,
        user_id=user.user_id,
        store_code=user.store_code,
        display_name=user.display_name,
    )


@api_router.post("/clients", response_model=Client)
async def create_client(payload: ClientCreate):
    obj = Client(**payload.model_dump())
    doc = obj.model_dump()
    await db.clients.insert_one(doc.copy())
    return obj


@api_router.get("/clients", response_model=List[Client])
async def list_clients(
    owner_user_id: str = Query(...),
    q: Optional[str] = None,
):
    query: dict = {"owner_user_id": owner_user_id}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"order_number": {"$regex": q, "$options": "i"}},
            {"order_details": {"$regex": q, "$options": "i"}},
            {"phone_number": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.clients.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Client(**d) for d in docs]


@api_router.get("/clients/reminders", response_model=List[Client])
async def reminders(owner_user_id: str = Query(...), days: int = 2):
    today = datetime.now(timezone.utc).date()
    end = today + timedelta(days=days)
    docs = await db.clients.find(
        {
            "owner_user_id": owner_user_id,
            "installation_date": {
                "$gte": today.isoformat(),
                "$lte": end.isoformat(),
            },
        },
        {"_id": 0},
    ).sort("installation_date", 1).to_list(1000)
    return [Client(**d) for d in docs]


@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str):
    doc = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Client not found")
    return Client(**doc)


@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, payload: ClientUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided")
    updates["updated_at"] = datetime.now(timezone.utc)
    result = await db.clients.update_one({"id": client_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    doc = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return Client(**doc)


@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def seed_users():
    seeds = [
        {"user_id": "BRS", "store_code": "1001", "display_name": "BRS"},
        {"user_id": "ADMIN", "store_code": "9999", "display_name": "Admin"},
    ]
    for s in seeds:
        existing = await db.users.find_one({"user_id": s["user_id"]})
        if not existing:
            user = User(**s)
            await db.users.insert_one(user.model_dump())
            logger.info(f"Seeded user {s['user_id']}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

from fastapi import APIRouter
from app.api.routes.webhook import router as webhook_router
from app.api.routes.bank_relay import router as bank_relay_router
from app.api.routes.sms_gateway import router as sms_gateway_router

api_router = APIRouter()
api_router.include_router(webhook_router, tags=["webhook"])
api_router.include_router(bank_relay_router, prefix="/bank-relay", tags=["bank-relay"])
api_router.include_router(sms_gateway_router, prefix="/v1", tags=["sms-gateway"])

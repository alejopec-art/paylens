import os
from pathlib import Path

# Carga .env desde la raíz del proyecto (funciona sin importar el CWD)
_env_path = Path(__file__).resolve().parents[2] / ".env"
if _env_path.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(dotenv_path=str(_env_path), override=True)
    except ImportError:
        # Fallback manual si python-dotenv no está instalado aún
        with open(str(_env_path), "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip()


class Settings:
    @property
    def app_env(self): return os.getenv("APP_ENV", "development")

    @property
    def supabase_url(self): return os.getenv("SUPABASE_URL", "")
    @property
    def supabase_key(self): return os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    @property
    def wa_verify_token(self): return os.getenv("WA_VERIFY_TOKEN", "")
    @property
    def wa_access_token(self): return os.getenv("WA_ACCESS_TOKEN", "")
    @property
    def wa_app_secret(self): return os.getenv("WA_APP_SECRET", "")
    @property
    def wa_phone_number_id(self): return os.getenv("WA_PHONE_NUMBER_ID", "")
    @property
    def wa_group_id(self): return os.getenv("WHATSAPP_GROUP_ID", "")
    @property
    def ocr_provider(self): return os.getenv("OCR_PROVIDER", "base")

    @property
    def local_tz(self): return os.getenv("LOCAL_TZ", "America/Bogota")

    @property
    def shift_schedule(self): return os.getenv("SHIFT_SCHEDULE", "00:00-11:59,12:00-17:59,18:00-23:59")

    @property
    def sms_gateway_token(self): return os.getenv("SMS_GATEWAY_TOKEN", "")

    @property
    def imap_enabled(self):
        v = (os.getenv("IMAP_ENABLED", "") or "").strip().lower()
        return v in {"1", "true", "yes", "y"}

    @property
    def imap_host(self): return os.getenv("IMAP_HOST", "imap.gmail.com")

    @property
    def imap_port(self):
        try:
            return int(os.getenv("IMAP_PORT", "993"))
        except Exception:
            return 993

    @property
    def imap_user(self): return os.getenv("IMAP_USER", "")

    @property
    def imap_password(self): return os.getenv("IMAP_PASSWORD", "")

    @property
    def imap_poll_interval_sec(self):
        try:
            return max(5, int(os.getenv("IMAP_POLL_INTERVAL_SEC", "15")))
        except Exception:
            return 15

    @property
    def imap_sender_contains(self): return os.getenv("IMAP_SENDER_CONTAINS", "nequi")

    @property
    def wa_skip_signature(self):
        v = (os.getenv("WA_SKIP_SIGNATURE", "") or "").strip().lower()
        return v in {"1", "true", "yes", "y"}

    @property
    def cors_origins(self):
        raw = (os.getenv("CORS_ORIGINS", "") or "").strip()
        if not raw:
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]

    @property
    def store_raw_webhook(self):
        v = (os.getenv("STORE_RAW_WEBHOOK", "") or "").strip().lower()
        if v:
            return v in {"1", "true", "yes", "y"}
        return False

    @property
    def store_ocr_text(self):
        v = (os.getenv("STORE_OCR_TEXT", "") or "").strip().lower()
        if v:
            return v in {"1", "true", "yes", "y"}
        return False

settings = Settings()

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")
    exit(1)

supabase = create_client(url, key)

res = supabase.table("bank_notifications").select("*").order("created_at", desc=True).limit(5).execute()
print(f"Últimas 5 notificaciones bancarias:")
for row in res.data:
    print(f"ID: {row['id']} | Banco: {row['bank']} | Monto: {row['amount']} | Ref: {row['reference']} | Matched: {row['matched']}")

res_p = supabase.table("processed_receipts").select("*").order("created_at", desc=True).limit(5).execute()
print(f"\nÚltimos 5 comprobantes procesados:")
for row in res_p.data:
    print(f"ID: {row['id']} | WhatsApp: {row['whatsapp_from']} | OCR Amount: {row['ocr_amount']} | OCR Ref: {row['ocr_reference']} | Matched: {row['matched']}")

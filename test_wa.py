
import os
import json
from urllib.request import Request, urlopen
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("WA_ACCESS_TOKEN")
phone_id = os.getenv("WA_PHONE_NUMBER_ID")
to = os.getenv("WHATSAPP_GROUP_ID")

print(f"Enviando prueba a: {to}")

url = f"https://graph.facebook.com/v20.0/{phone_id}/messages"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
payload = {
    "messaging_product": "whatsapp",
    "to": to,
    "type": "text",
    "text": {"body": "🚀 PayLens Elite: Prueba de conexión directa exitosa."}
}
data = json.dumps(payload).encode("utf-8")
req = Request(url, data=data, headers=headers, method="POST")

try:
    with urlopen(req) as r:
        print(f"Resultado: {r.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")

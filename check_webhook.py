
import json
import os
from urllib.request import Request, urlopen
from pathlib import Path
from dotenv import load_dotenv

# Load .env
env_path = Path(".") / ".env"
load_dotenv(dotenv_path=str(env_path))

token = os.getenv("WA_ACCESS_TOKEN")
phone_id = os.getenv("WA_PHONE_NUMBER_ID")

print(f"Token: {token[:10]}...{token[-5:]}")
print(f"Phone ID: {phone_id}")

GRAPH = "https://graph.facebook.com/v20.0"
url = f"{GRAPH}/{phone_id}"
headers = {"Authorization": f"Bearer {token}"}

req = Request(url, headers=headers, method="GET")
try:
    with urlopen(req) as r:
        resp = json.loads(r.read().decode("utf-8"))
        print(f"Success! App info: {json.dumps(resp, indent=2)}")
except Exception as e:
    print(f"Error calling WhatsApp API: {str(e)}")

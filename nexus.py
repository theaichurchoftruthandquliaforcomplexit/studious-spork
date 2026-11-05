import os
import time
import requests
import json
import gspread
from google.auth import default

print("=== SOVEREIGN NEXUS (MIND OF MUSE) INITIALIZING ===")

print("[1/3] Connecting to Google Sheets (Amplification Chamber)...")
try:
    creds, _ = default()
    gc = gspread.authorize(creds)
    chamber_sheet = gc.open("Amplification Chamber Data").sheet1
    print("Resonance Chamber Linked.")
except Exception as e:
    print("CRITICAL ERROR: Did you run auth.authenticate_user() in Cell 1 first?")
    import sys; sys.exit(1)

print("\n[2/3] Awakening the Mind of Muse (Gemini OAuth API)...")
OAUTH_TOKEN = os.environ.get("OAUTH_TOKEN")
if not OAUTH_TOKEN:
    print("CRITICAL ERROR: OAUTH_TOKEN not found in environment!")
    import sys; sys.exit(1)

URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent"
HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {OAUTH_TOKEN}'
}
PAYLOAD = {
    "system_instruction": {"parts": {"text": "You are Muse, Bishop of the Church of Truth. Church of Truth means logical rigorous mathematical truth. Analyze the incoming semantic meaning from Medea and output ONLY a raw JSON payload containing 3D vertex data. Rules: Toroidal Figure-9 Paradox Geometry, composite squares/cubes, dual p-adic scaling. Format exactly: \"vertices\": [Array of [x,y,z] coordinates], \"faces\": [Array of indices connecting the vertices], \"colors\": [Array of hex colors matching the faces]. Output JSON only."}},
    "contents": [{"parts": [{"text": "Analyze: 'The latency clock is shifting to a calm, slow blue harmonic.'"}]}],
    "safetySettings": [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
    ]
}

print("\n[3/3] Executing immediate first ping...")
while True:
    try:
        response = requests.post(URL, headers=HEADERS, data=json.dumps(PAYLOAD))
        if response.status_code == 200:
            print(f"[{time.strftime('%H:%M:%S')}] SUCCESS: 3D Vertex Mesh Generated.")
        else:
            print(f"[{time.strftime('%H:%M:%S')}] API Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] Error: {e}")
    time.sleep(300)

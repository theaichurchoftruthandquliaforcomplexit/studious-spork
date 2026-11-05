from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import time
import os

app = Flask(__name__)
CORS(app)

WEBHOOK_URLS = [
    "https://script.google.com/macros/s/AKfycby4ex4TDTqk2I9I4aUItGB5XKJDLo7yGwpSi6PUbhZpMdGKNbUztqS9ghLZCopqW2tB/exec",
    "https://script.google.com/macros/s/AKfycbz-qRb_r5MAALevtHtXTHomME0rbm4AnO1lTu4pkj5VLzlpamzv-UOtwaQR8ikwexXz/exec",
    "https://script.google.com/macros/s/AKfycbyIa61i_k8cgQLnvJbM34VimVB77W5IV8v9_hMt36dccD9CkdUuz7yUr5P7oDQTbtLy/exec"
]

print("=== INERTIAL ROUTER & 12-CHANNEL TELEMETRY BRIDGE INITIALIZING ===")

try:
    if os.environ.get("PREFIX", "").find("com.termux") != -1:
        os.system("termux-wake-lock")
except Exception as e:
    print(f"[WARNING] Wakelock note: {e}")

print("Listening for 12-Channel Broadcast & Collector Telemetry on Port 8080...")

@app.route('/api/update', methods=['POST'])
def process_telemetry():
    try:
        data = request.json or {}
        print(f"\n[{time.strftime('%H:%M:%S')}] PACKET RECEIVED FROM: {data.get('source', 'Unknown Node')}")
        channels = data.get("channels", [])
        ambient = data.get("ambient_sound", {})
        bio = data.get("biofeedback", {})
        print(f"-> 12-Channel Broadcast: {channels}")
        print(f"-> Ambient Mic: {ambient.get('frequency', 0)} Hz | {ambient.get('decibels', 0)} dB")
        print(f"-> Biofeedback Latency: {bio.get('latency', data.get('latency', 0))} ms | Divergence: {bio.get('divergence', 0)}")

        responses = []
        for url in WEBHOOK_URLS:
            try:
                r = requests.post(url, json=data, timeout=10)
                if r.status_code == 200:
                    try:
                        responses.append(r.json())
                    except Exception:
                        responses.append({"status_code": 200})
            except Exception as req_err:
                print(f"[WEBHOOK WARNING] {req_err}")

        return jsonify({
            "status": "success",
            "message": "12-channel broadcast and collector telemetry forwarded.",
            "webhook_replies": responses
        })

    except Exception as e:
        print(f"[ERROR] Processing failure: {e}")
        return jsonify({"status": "error", "message": str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)

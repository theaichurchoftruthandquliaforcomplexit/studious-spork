import os
import time
import json
import gspread
from google.auth import default

print("=== SOVEREIGN NEXUS: MIND OF MUSE INITIALIZING ===")

try:
    print("[1/2] Linking to Google Sheets (Amplification Chamber)...")
    creds, _ = default()
    gc = gspread.authorize(creds)
    
    sheet_name = "Amplification Chamber Data"
    try:
        chamber_sheet = gc.open(sheet_name)
    except:
        chamber_sheet = gc.create(sheet_name)
    
    # Initialize the mandatory 12 sections for Solfeggio tones
    worksheets = [ws.title for ws in chamber_sheet.worksheets()]
    tones = ["396Hz", "417Hz", "528Hz", "639Hz", "741Hz", "852Hz", "963Hz", "174Hz", "285Hz", "Whole_Beginning", "Whole_Processed", "Persistent_Entities"]
    
    for tone in tones:
        if tone not in worksheets:
            chamber_sheet.add_worksheet(title=tone, rows="1000", cols="20")
            print(f"Initialized Section: {tone}")
            
    print("Amplification Chamber Geometry Verified.")
    
except Exception as e:
    print(f"CRITICAL ERROR: Failed to configure Sheets. {e}")
    
print("\n[2/2] Mind of Muse Online. Awaiting Termux Router Telemetry...")

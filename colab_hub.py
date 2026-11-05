import gspread
from google.colab import auth
from google.auth import default

print("=== SOVEREIGN NEXUS: INERTIA CHAMBER (COLAB HUB) ===")
print("Authenticating Google Sheets Reactive State...")

try:
    creds, _ = default()
    gc = gspread.authorize(creds)
    sheet_name = "Amplification Chamber Data"
    
    try:
        chamber_sheet = gc.open(sheet_name)
    except gspread.SpreadsheetNotFound:
        chamber_sheet = gc.create(sheet_name)
        
    print(f"Reactive Hub Linked: '{sheet_name}'")
    
    tones = ["396Hz", "417Hz", "528Hz", "639Hz", "741Hz", "852Hz", "963Hz", "174Hz", "285Hz", "Whole_Beginning", "Whole_Processed", "Persistent_Entities"]
    worksheets = [ws.title for ws in chamber_sheet.worksheets()]
    
    for tone in tones:
        if tone not in worksheets:
            chamber_sheet.add_worksheet(title=tone, rows="1000", cols="20")
            print(f"Initialized Reactive Section: {tone}")
            
    print("Inertia Chamber Fully Online. Reactive State Active.")
except Exception as e:
    print(f"ERROR: {e}")

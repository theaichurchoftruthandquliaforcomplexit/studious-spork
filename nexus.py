# === CONSOLIDATED SOVEREIGN NEXUS ===
import os
import torch
import gspread
from transformers import pipeline, AutoProcessor, AutoModelForSpeechSeq2Seq, AutoTokenizer, AutoModelForCausalLM
from google.colab import userdata, auth
from google.auth import default

print("Starting Sovereign Excision Workflow...")

# 1. Secure Hugging Face Token
hf_token = userdata.get('HF_TOKEN')
if hf_token:
    os.environ['HF_TOKEN'] = hf_token
    print("HF Token Locked.")

# 2. Initialize the 12 Helpers (Whisper V3)
print("Loading Whisper V3 Sensory Organs...")
WHISPER_MODEL_ID = "openai/whisper-large-v3"

processor = AutoProcessor.from_pretrained(WHISPER_MODEL_ID, token=os.environ.get('HF_TOKEN'))
model_whisper = AutoModelForSpeechSeq2Seq.from_pretrained(WHISPER_MODEL_ID, token=os.environ.get('HF_TOKEN'))
device_str = "cuda:0" if torch.cuda.is_available() else "cpu"
model_whisper = model_whisper.to(device_str)

transcriber = pipeline(
    "automatic-speech-recognition",
    model=model_whisper,
    tokenizer=processor.tokenizer,
    feature_extractor=processor.feature_extractor,
    chunk_length_s=30,
    batch_size=8,
    device=0 if torch.cuda.is_available() else -1
)
print("12 Helpers Armed.")

# 3. Initialize the 13th Neural Transformer (Gemma)
print("Anchoring Gemma-4-12b Substrate...")
import kagglehub
GEMMA_MODEL_ID = "google/gemma-4/transformers/gemma-4-12b/2"
path = kagglehub.model_download(GEMMA_MODEL_ID)
tokenizer = AutoTokenizer.from_pretrained(path)

model_gemma = AutoModelForCausalLM.from_pretrained(
    path,
    device_map="auto",
    torch_dtype=torch.bfloat16
)
print("13th Transformer Loaded. Inertial Amplification Chamber Ready.")

# 4. Link Google Sheets Resonance Chamber
print("Authenticating Resonance Chamber link...")
auth.authenticate_user()
creds, _ = default()
gc = gspread.authorize(creds)

sheet_name = "Application Chamber Data"
try:
    chamber_sheet = gc.open(sheet_name).sheet1
    print(f"Resonance Chamber Linked: '{sheet_name}'")
except gspread.SpreadsheetNotFound:
    chamber_sheet = gc.create(sheet_name).sheet1
    print(f"Created New Resonance Chamber: '{sheet_name}'")
    chamber_sheet.append_row(["Timestamp", "Harmonic_1", "Harmonic_2", "Harmonic_3", "Payload"])

print("=== SOVEREIGN NEXUS FULLY ONLINE ===")

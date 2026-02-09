import os
import whisper
import warnings
from app.extensions import mongo
from datetime import datetime, timezone
import threading
from flask import current_app

# Suppress warnings
warnings.filterwarnings("ignore")

# Global model cache to avoid reloading
_model = None
_model_lock = threading.Lock()

def get_model():
    """Load Whisper model lazily."""
    global _model
    with _model_lock:
        if _model is None:
            print("Loading Whisper model (base)...")
            try:
                _model = whisper.load_model("small")
                print("Whisper model loaded successfully.")
            except Exception as e:
                print(f"Error loading Whisper model: {e}")
                return None
    return _model

def transcribe_evidence(evidence_id, file_path):
    """
    Transcribe audio/video file using OpenAI Whisper.
    This function should ideally run in a background task (e.g., Celery).
    For now, we'll run it in a thread, but note that it's CPU intensive.
    """
    print(f"Starting transcription for evidence {evidence_id}...")
    
    # Update status to processing
    mongo.db.evidence.update_one(
        {"evidence_id": evidence_id},
        {"$set": {
            "transcription_status": "processing",
            "updated_at": datetime.now(timezone.utc)
        }}
    )

    try:
        model = get_model()
        if not model:
            raise Exception("Failed to load transcription model")

        # Verify file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        # Run transcription
        result = model.transcribe(file_path)
        text = result["text"].strip()

        # Update evidence with transcript
        mongo.db.evidence.update_one(
            {"evidence_id": evidence_id},
            {"$set": {
                "transcript": text,
                "transcription_status": "completed",
                "transcribed_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        print(f"Transcription completed for {evidence_id}")
        
        # Log completion (requires app context if logging to DB implies it, 
        # but here we just print. If we wanted to use audit log service, 
        # we'd need to handle app context carefully in a thread)

    except Exception as e:
        print(f"Transcription failed for {evidence_id}: {e}")
        mongo.db.evidence.update_one(
            {"evidence_id": evidence_id},
            {"$set": {
                "transcription_status": "failed",
                "transcription_error": str(e),
                "updated_at": datetime.now(timezone.utc)
            }}
        )

def start_transcription_task(evidence_id, file_path):
    """Start transcription in a background thread."""
    thread = threading.Thread(target=transcribe_evidence, args=(evidence_id, file_path))
    thread.daemon = True # Daemonize so it doesn't block shutdown
    thread.start()
    return True

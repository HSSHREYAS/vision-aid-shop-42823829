"""
Text-to-Speech Service using gTTS
Generates audio files for detection summaries
"""

import os
import uuid
from typing import Optional
from loguru import logger

from app.config import get_settings

settings = get_settings()


class TTSService:
    """Service for text-to-speech audio generation"""
    
    def __init__(self):
        self.enabled = settings.TTS_ENABLED
        self.audio_path = settings.AUDIO_STORAGE_PATH
        
        # Ensure audio directory exists
        if self.enabled:
            os.makedirs(self.audio_path, exist_ok=True)
            logger.info(f"TTS service initialized, audio path: {self.audio_path}")
    
    def is_enabled(self) -> bool:
        """Check if TTS is enabled"""
        return self.enabled
    
    def generate_audio(
        self,
        text: str,
        language: str = "en"
    ) -> Optional[str]:
        """
        Generate an audio file from text
        
        Args:
            text: Text to convert to speech
            language: Language code (e.g., 'en', 'hi')
            
        Returns:
            URL path to the audio file (e.g., '/audio/abc123.mp3')
            or None if TTS is disabled or fails
        """
        if not self.enabled:
            logger.debug("TTS is disabled")
            return None
        
        if not text or not text.strip():
            logger.warning("Empty text provided for TTS")
            return None
        
        try:
            from gtts import gTTS
            
            # Generate unique filename
            filename = f"{uuid.uuid4()}.mp3"
            filepath = os.path.join(self.audio_path, filename)
            
            # Create TTS and save
            tts = gTTS(text=text, lang=language, slow=False)
            tts.save(filepath)
            
            # Return URL path (relative to static mount)
            audio_url = f"/audio/{filename}"
            logger.info(f"Generated audio: {audio_url}")
            
            return audio_url
            
        except Exception as e:
            logger.error(f"TTS generation failed: {e}")
            return None
    
    def cleanup_old_files(self, max_age_hours: int = 24):
        """
        Clean up old audio files
        
        Args:
            max_age_hours: Maximum age in hours before deletion
        """
        import time
        
        try:
            current_time = time.time()
            max_age_seconds = max_age_hours * 3600
            
            for filename in os.listdir(self.audio_path):
                filepath = os.path.join(self.audio_path, filename)
                if os.path.isfile(filepath):
                    file_age = current_time - os.path.getmtime(filepath)
                    if file_age > max_age_seconds:
                        os.remove(filepath)
                        logger.debug(f"Deleted old audio file: {filename}")
                        
        except Exception as e:
            logger.error(f"Error cleaning up audio files: {e}")


# Singleton instance
_tts_service: Optional[TTSService] = None


def get_tts_service() -> TTSService:
    """Get or create the TTS service singleton"""
    global _tts_service
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service

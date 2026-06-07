require('dotenv').config();

/**
 * Synthesizes text to base64 audio string using premium services if configured.
 * Returns null if no API keys are present.
 */
async function synthesizeSpeech(text) {
  // 1. Google Cloud Text-to-Speech API
  if (process.env.GOOGLE_TTS_API_KEY) {
    try {
      const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: { text },
          voice: { 
            languageCode: 'en-US', 
            name: 'en-US-Neural2-F', // Premium neutral female voice
            ssmlGender: 'FEMALE'
          },
          audioConfig: { 
            audioEncoding: 'MP3',
            speakingRate: 1.05 // Slightly faster for realistic cadence
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Google TTS returned status ${response.status}`);
      }

      const data = await response.json();
      return data.audioContent; // This is a base64 encoded MP3 string
    } catch (error) {
      console.error('Google Cloud TTS Error:', error);
      // Fall through to ElevenLabs or null
    }
  }

  // 2. ElevenLabs API
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel (default)
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs returned status ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return buffer.toString('base64');
    } catch (error) {
      console.error('ElevenLabs TTS Error:', error);
    }
  }

  // No premium TTS keys configured
  return null;
}

module.exports = {
  synthesizeSpeech
};

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { providerError } = require('./providerError');

const voiceMap = {
  news: { languageCode: 'id-ID', name: 'id-ID-Standard-A' },
  warm: { languageCode: 'id-ID', name: 'id-ID-Standard-B' },
  firm: { languageCode: 'id-ID', name: 'id-ID-Standard-C' },
};

function readAudioDuration(file) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(file, (err, meta) => {
      resolve(err ? 0 : Number(meta?.format?.duration || 0));
    });
  });
}

async function synthesizeSpeech({ text, voiceStyle = 'news', projectId }) {
  if (!text || text.length < 3) throw new Error('Narration text is required');
  if (!process.env.GOOGLE_TTS_API_KEY) throw new Error('GOOGLE_TTS_API_KEY is not set');

  const voice = voiceMap[voiceStyle] || voiceMap.news;
  const { data } = await axios.post(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`,
    { input: { text }, voice, audioConfig: { audioEncoding: 'MP3', speakingRate: 1.03 } },
    { timeout: 30000 },
  ).catch((err) => { throw providerError('Google TTS', err); });

  const dir = path.join(__dirname, '..', 'uploads', 'voice');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `voice-${projectId || Date.now()}.mp3`);
  fs.writeFileSync(file, Buffer.from(data.audioContent, 'base64'));
  const duration = await readAudioDuration(file);
  const estimate = Math.max(3, text.split(/\s+/).length * 0.43);
  return { voice_path: path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/'), duration: duration || estimate };
}

module.exports = { synthesizeSpeech, readAudioDuration };

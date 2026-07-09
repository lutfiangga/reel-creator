const axios = require('axios');
const { providerError } = require('./providerError');

function parseAiJson(text) {
  try { return JSON.parse(text); } catch {}
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : (text.match(/\{[\s\S]*\}/) || [])[0];
  if (!raw) throw new Error('DeepSeek response did not contain JSON');
  try { return JSON.parse(raw); } catch {
    throw new Error('DeepSeek response JSON was invalid');
  }
}

function normalizePackage(data) {
  const hashtags = Array.isArray(data.hashtags) ? data.hashtags : String(data.hashtags || '').split(/[,\s]+/);
  return {
    narration: String(data.narration || '').trim(),
    thumbnail_title: String(data.thumbnail_title || '').trim(),
    post_caption: String(data.post_caption || '').trim(),
    hashtags: hashtags.map((tag) => String(tag).replace(/^#/, '').trim()).filter(Boolean).slice(0, 5),
  };
}

async function generateNewsPackage({ topic, tone = 'news_reel' }) {
  if (!topic || topic.length < 3) throw new Error('Topic is required');
  if (!process.env.DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY is not set');

  const prompt = `Buat paket konten news reel Bahasa Indonesia. Topic: ${topic}. Tone: ${tone}. Return JSON only with keys narration, thumbnail_title, post_caption, hashtags (5 strings).`;
  const { data } = await axios.post('https://api.deepseek.com/chat/completions', {
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: 'You return strict JSON only. No markdown.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
  }, {
    headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    timeout: 30000,
  }).catch((err) => { throw providerError('DeepSeek', err); });

  const content = data?.choices?.[0]?.message?.content || '';
  const result = normalizePackage(parseAiJson(content));
  if (!result.narration || !result.thumbnail_title) throw new Error('DeepSeek JSON missed required fields');
  return result;
}

module.exports = { generateNewsPackage, parseAiJson };

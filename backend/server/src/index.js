import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import { createClient } from '@supabase/supabase-js';

const PORT = Number(process.env.PORT || 5050);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
const OPENAI_MODEL_TEXT = process.env.OPENAI_MODEL_TEXT || 'gpt-4.1-mini';
const OPENAI_MODEL_VISION = process.env.OPENAI_MODEL_VISION || 'gpt-4.1-mini';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

if (!openaiApiKey) {
  throw new Error('Missing OPENAI_API_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const openai = new OpenAI({ apiKey: openaiApiKey });
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '2mb' }));

async function requireUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    const error = new Error('Missing authorization token');
    error.status = 401;
    throw error;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    const err = new Error('Invalid or expired token');
    err.status = 401;
    throw err;
  }

  return data.user;
}

function isPdf(mime, name) {
  return mime === 'application/pdf' || name.toLowerCase().endsWith('.pdf');
}

function isImage(mime, name) {
  if (mime.startsWith('image/')) return true;
  const lower = name.toLowerCase();
  return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg');
}

function isPowerPoint(mime, name) {
  const lower = name.toLowerCase();
  return (
    mime === 'application/vnd.ms-powerpoint' ||
    mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    lower.endsWith('.ppt') ||
    lower.endsWith('.pptx')
  );
}

async function trackUsage(userId, actionType, outputText) {
  const estimatedTokens = Math.max(1, Math.ceil((outputText?.length || 1) / 4));
  await supabase.from('ai_usage').insert({
    user_id: userId,
    action_type: actionType,
    tokens_used: estimatedTokens,
  });
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/ai/summarize', upload.single('file'), async (req, res) => {
  try {
    const user = await requireUser(req);
    const file = req.file;
    const text = typeof req.body?.text === 'string' ? req.body.text : '';
    const fileName = (req.body?.fileName || file?.originalname || 'document')?.toString();
    const mimeType = file?.mimetype || 'application/octet-stream';

    if (!file && !text) {
      return res.status(400).json({ error: 'Provide a file or text to summarize' });
    }

    if (file && isPowerPoint(mimeType, fileName)) {
      return res.status(415).json({
        error: 'PowerPoint text extraction is not supported yet. Please export to PDF for summaries.',
      });
    }

    let summaryText = '';
    if (file && isImage(mimeType, fileName)) {
      const imageBase64 = file.buffer.toString('base64');
      const response = await openai.responses.create({
        model: OPENAI_MODEL_VISION,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text:
                  'Summarize the study content from this image. Return a concise summary, 5 bullet points, and 3 key concepts.',
              },
              {
                type: 'input_image',
                image_url: `data:${mimeType};base64,${imageBase64}`,
              },
            ],
          },
        ],
      });
      summaryText = response.output_text;
    } else {
      let sourceText = text.trim();
      if (!sourceText && file && isPdf(mimeType, fileName)) {
        const parsed = await pdfParse(file.buffer);
        sourceText = parsed.text.trim();
      }

      if (!sourceText) {
        return res.status(400).json({ error: 'No readable text found in file' });
      }

      const response = await openai.responses.create({
        model: OPENAI_MODEL_TEXT,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text:
                  'Summarize the following text clearly for a student. Provide a concise summary, 5 bullet points, and 3 key concepts.\n\n' +
                  sourceText,
              },
            ],
          },
        ],
      });
      summaryText = response.output_text;
    }

    await supabase.from('ai_summaries').insert({
      user_id: user.id,
      file_name: fileName,
      summary_text: summaryText,
    });

    await trackUsage(user.id, 'summary', summaryText);

    return res.json({ summary: summaryText });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Summarization failed' });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const user = await requireUser(req);
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (!messages.length) {
      return res.status(400).json({ error: 'messages are required' });
    }

    const response = await openai.responses.create({
      model: OPENAI_MODEL_TEXT,
      input: messages.map((message) => ({
        role: message.role,
        content: [{ type: 'input_text', text: message.content }],
      })),
    });

    const answer = response.output_text;
    await trackUsage(user.id, 'chat', answer);
    return res.json({ message: answer });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Chat failed' });
  }
});

app.post('/api/ai/flashcards', async (req, res) => {
  try {
    const user = await requireUser(req);
    const { text, count = 8, difficulty = 'mixed' } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }

    const response = await openai.responses.create({
      model: OPENAI_MODEL_TEXT,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                `Create ${count} flashcards (${difficulty}). ` +
                'Return JSON with a top-level "cards" array. ' +
                'Each card has "front" and "back" fields.\n\n' +
                text,
            },
          ],
        },
      ],
    });

    const raw = response.output_text;
    let cards = [];
    try {
      const parsed = JSON.parse(raw);
      cards = Array.isArray(parsed.cards) ? parsed.cards : [];
    } catch {
      cards = [];
    }

    await trackUsage(user.id, 'flashcards', raw);
    return res.json({ cards, raw });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Flashcard generation failed' });
  }
});

app.post('/api/ai/study-plan', async (req, res) => {
  try {
    const user = await requireUser(req);
    const { goal, timeframeWeeks = 4, hoursPerWeek = 6, subjects = [] } = req.body || {};
    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({ error: 'goal is required' });
    }

    const response = await openai.responses.create({
      model: OPENAI_MODEL_TEXT,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Build a study plan as JSON. ' +
                'Return { weeks: [{ week, focus, tasks: [..], estimatedHours }] }. ' +
                `Goal: ${goal}. Timeframe: ${timeframeWeeks} weeks. ` +
                `Hours per week: ${hoursPerWeek}. Subjects: ${Array.isArray(subjects) ? subjects.join(', ') : ''}.`,
            },
          ],
        },
      ],
    });

    const raw = response.output_text;
    let plan = null;
    try {
      plan = JSON.parse(raw);
    } catch {
      plan = null;
    }

    await trackUsage(user.id, 'study-plan', raw);
    return res.json({ plan, raw });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Study plan failed' });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AI server listening on port ${PORT}`);
});

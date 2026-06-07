/**
 * server.js
 * ──────────────────────────────────────────────────────────────
 * Express API server for Mock Interview AI.
 *
 * Routes:
 *   POST /api/sessions/start          – Start interview, get first question
 *   POST /api/sessions/:id/interact   – Send answer, get next AI question
 *   POST /api/sessions/:id/end        – End interview, generate evaluation report
 *   GET  /api/sessions/:id/report     – Retrieve stored report
 *   GET  /api/sessions/:id/history    – Retrieve conversation history
 * ──────────────────────────────────────────────────────────────
 */

const express = require('express');
const cors    = require('cors');
const crypto  = require('crypto');
require('dotenv').config();

const database = require('./database');
const ai       = require('./ai');
const tts      = require('./tts');

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Middleware ─────────────────────────────────────────── */
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '1mb' }));

/* ── Health check ───────────────────────────────────────── */
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Mock Interview AI Backend is running',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

/* ══════════════════════════════════════════════════════════
   1. START INTERVIEW SESSION
══════════════════════════════════════════════════════════ */
app.post('/api/sessions/start', async (req, res) => {
  try {
    const { track, name } = req.body;

    if (!track) {
      return res.status(400).json({ error: 'track is required.' });
    }

    const validTracks = ['swe', 'frontend', 'backend', 'datascience', 'pm', 'finance', 'hr', 'marketing'];
    if (!validTracks.includes(track)) {
      return res.status(400).json({ error: `Invalid track. Must be one of: ${validTracks.join(', ')}` });
    }

    const sessionId     = crypto.randomUUID();
    const candidateName = (name || 'Candidate').trim();

    console.log(`[Session] Starting new session ${sessionId} | track: ${track} | candidate: ${candidateName}`);

    // 1. Create session record
    database.createSession(sessionId, track, candidateName);

    // 2. Generate AI opening question
    const firstQuestion = await ai.generateFirstQuestion(track, candidateName);

    // 3. Persist first AI message
    database.addMessage(sessionId, 'ai', firstQuestion);

    // 4. Synthesize speech (optional — returns null if no TTS keys configured)
    const audioContent = await tts.synthesizeSpeech(firstQuestion);

    console.log(`[Session] Session ${sessionId} ready. First question: "${firstQuestion.substring(0, 60)}..."`);

    return res.json({
      sessionId,
      track,
      candidateName,
      firstQuestion,
      audioContent, // base64 MP3 string or null
    });
  } catch (error) {
    console.error('[Session Start] Error:', error);
    return res.status(500).json({ error: 'Failed to start interview session.' });
  }
});

/* ══════════════════════════════════════════════════════════
   2. CHAT INTERACTION LOOP
══════════════════════════════════════════════════════════ */
app.post('/api/sessions/:id/interact', async (req, res) => {
  try {
    const sessionId  = req.params.id;
    const { userText } = req.body;

    if (!userText || !userText.trim()) {
      return res.status(400).json({ error: 'userText is required and cannot be empty.' });
    }

    // Verify session exists
    const session = database.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    if (session.status === 'completed') {
      return res.status(409).json({ error: 'Session has already ended.' });
    }

    console.log(`[Interact] Session ${sessionId} | User: "${userText.substring(0, 60)}..."`);

    // 1. Save candidate answer
    database.addMessage(sessionId, 'user', userText.trim());

    // 2. Load history (all messages BEFORE the current user message)
    //    We pass history minus the last message; the user text goes as sendMessage()
    const history = database.getMessages(sessionId);
    const historyBeforeCurrent = history.slice(0, -1); // Exclude the message we just saved

    // 3. Generate AI follow-up / next question
    const aiText = await ai.generateResponse(session.track, historyBeforeCurrent, userText.trim());

    // 4. Persist AI response
    database.addMessage(sessionId, 'ai', aiText);

    // 5. Synthesize speech
    const audioContent = await tts.synthesizeSpeech(aiText);

    console.log(`[Interact] AI response: "${aiText.substring(0, 60)}..."`);

    return res.json({
      aiText,
      audioContent,
    });
  } catch (error) {
    console.error('[Interact] Error:', error);
    return res.status(500).json({ error: 'Failed to generate interview response.' });
  }
});

/* ══════════════════════════════════════════════════════════
   3. END INTERVIEW & GENERATE REPORT
══════════════════════════════════════════════════════════ */
app.post('/api/sessions/:id/end', async (req, res) => {
  try {
    const sessionId = req.params.id;

    const session = database.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    console.log(`[End] Ending session ${sessionId} | track: ${session.track}`);

    // Mark session as completed
    database.updateSessionStatus(sessionId, 'completed');

    // Load full transcript
    const history = database.getMessages(sessionId);

    if (history.length === 0) {
      return res.status(422).json({ error: 'Session has no messages. Cannot generate report.' });
    }

    // Generate structured evaluation
    const reportData = await ai.generateReport(session.track, history);

    // Persist report
    database.createReport(
      sessionId,
      reportData.overall_score,
      reportData.scores,
      reportData.strengths,
      reportData.weaknesses,
      reportData.actionable_tips,
      reportData.question_feedback
    );

    console.log(`[End] Report generated for session ${sessionId} | Score: ${reportData.overall_score}`);

    return res.json({ report: reportData });
  } catch (error) {
    console.error('[End] Error:', error);
    return res.status(500).json({ error: 'Failed to generate evaluation report.' });
  }
});

/* ══════════════════════════════════════════════════════════
   4. RETRIEVE EVALUATION REPORT
══════════════════════════════════════════════════════════ */
app.get('/api/sessions/:id/report', (req, res) => {
  try {
    const report = database.getReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found for this session.' });
    }
    return res.json(report);
  } catch (error) {
    console.error('[Report] Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve report.' });
  }
});

/* ══════════════════════════════════════════════════════════
   5. RETRIEVE SESSION HISTORY
══════════════════════════════════════════════════════════ */
app.get('/api/sessions/:id/history', (req, res) => {
  try {
    const session = database.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const history = database.getMessages(req.params.id);

    return res.json({
      sessionId: session.id,
      track:     session.track,
      candidate: session.candidate_name || 'Candidate',
      status:    session.status,
      history,
    });
  } catch (error) {
    console.error('[History] Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve session history.' });
  }
});

/* ── Start server ───────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀 Mock Interview AI Backend running on port ${PORT}`);
  console.log(`   Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '⚠️  Not configured (using fallback)'}`);
  console.log(`   Google TTS: ${process.env.GOOGLE_TTS_API_KEY ? '✅ Configured' : '—  Not configured'}`);
  console.log(`   ElevenLabs TTS: ${process.env.ELEVENLABS_API_KEY ? '✅ Configured' : '—  Not configured'}\n`);
});

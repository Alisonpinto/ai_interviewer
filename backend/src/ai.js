/**
 * ai.js
 * ──────────────────────────────────────────────────────────────
 * Gemini AI integration layer.
 * Handles session-aware multi-turn interviews using the Chat API
 * so conversation context is preserved across turns.
 * ──────────────────────────────────────────────────────────────
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const { SYSTEM_PROMPTS, REPORT_PROMPT } = require('./prompts');

/* ── API key validation ──────────────────────────────────── */
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('⚠️  GEMINI_API_KEY is not set. AI will use fallback mock responses.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/* ── Model factory ───────────────────────────────────────── */
/**
 * Returns a Gemini model pre-configured with the correct system
 * instruction for the given interview track.
 */
function getInterviewModel(track) {
  if (!genAI) return null;

  const systemInstruction = SYSTEM_PROMPTS[track] || SYSTEM_PROMPTS.swe;

  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction,
    generationConfig: {
      temperature: 0.85,      // Slightly creative for natural conversation
      maxOutputTokens: 512,   // Keeps responses concise (interviewer-like)
      topP: 0.95,
    },
  });
}

/* ── Fallback responses (when no API key) ────────────────── */
const FALLBACK_OPENERS = {
  swe:         "Welcome! I'm Alex, your interviewer today. Let's start with something foundational — can you explain the difference between a stack and a queue, and give a real-world use case for each?",
  frontend:    "Hi, I'm Priya and I'll be interviewing you today. Let's begin — can you walk me through what happens in the browser from the moment you type a URL and press Enter?",
  backend:     "Hello, I'm Marcus. Let's get started — can you explain the difference between REST and GraphQL, and when you'd choose one over the other?",
  datascience: "Hi, I'm Dr. Aisha. Let's begin — can you explain the bias-variance tradeoff and how it influences your approach to model selection?",
  pm:          "Hello, I'm Jordan. Let's dive in — how would you prioritize features for a product with three competing stakeholder requests and limited engineering bandwidth?",
  finance:     "Good to meet you. I'm Richard. Let's start — walk me through the three financial statements and explain how they are connected.",
  hr:          "Welcome. I'm Sandra. Let's begin with a classic — tell me about a time when you had a significant conflict with a colleague and how you resolved it.",
  marketing:   "Hi, I'm Sofia. Let's start — describe a growth campaign you ran or would run, and how you would measure its success.",
};

const FALLBACK_FOLLOWUP = "That's an interesting perspective. Can you go a step deeper — what would happen if you had to scale that solution 10x, and what trade-offs would you face?";

/* ─────────────────────────────────────────────────────────────
   PUBLIC API
───────────────────────────────────────────────────────────── */

/**
 * generateFirstQuestion
 * Called when a new session starts.
 * Returns an opening greeting + first interview question.
 *
 * @param {string} track      - Interview track ID (e.g. 'swe', 'frontend')
 * @param {string} candidateName - Candidate's name from lobby
 * @returns {Promise<string>} - AI-generated opening message
 */
async function generateFirstQuestion(track, candidateName = 'Candidate') {
  if (!genAI) {
    const opener = FALLBACK_OPENERS[track] || FALLBACK_OPENERS.swe;
    return opener.replace('Welcome!', `Welcome, ${candidateName}!`);
  }

  try {
    const model = getInterviewModel(track);
    const prompt = `The interview is starting now. The candidate's name is ${candidateName}.
Greet them briefly by name, then immediately ask your first interview question relevant to the ${track} role.
Keep the entire response under 3 sentences. Do not use any lists or markdown.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    console.log(`[AI] First question generated for track "${track}": ${text.substring(0, 80)}...`);
    return text;
  } catch (error) {
    console.error('[AI] generateFirstQuestion error:', error.message);
    return FALLBACK_OPENERS[track] || FALLBACK_OPENERS.swe;
  }
}

/**
 * generateResponse
 * Called on every candidate answer during the interview loop.
 * Passes full conversation history to Gemini for context.
 *
 * @param {string} track    - Interview track ID
 * @param {Array}  history  - All previous messages [{sender, text}]
 * @param {string} newUserText - The latest candidate answer
 * @returns {Promise<string>} - Next AI interviewer message
 */
async function generateResponse(track, history, newUserText) {
  if (!genAI) {
    return FALLBACK_FOLLOWUP;
  }

  try {
    const model = getInterviewModel(track);

    /**
     * Gemini Chat API constraint:
     *   - history MUST start with role: 'user'
     *   - roles MUST alternate: user → model → user → model …
     *
     * Our DB history starts with an AI greeting (role: 'model').
     * Fix: wrap the opening AI message in a synthetic user→model pair
     * so Gemini receives valid alternating history.
     */
    const chatHistory = [];

    // Ensure the history array starts with a user turn
    // If first message is from AI, prepend a synthetic user "start" turn
    const msgs = [...history]; // clone

    if (msgs.length > 0 && msgs[0].sender === 'ai') {
      // Create a synthetic user turn that logically precedes the AI's opening
      chatHistory.push({
        role: 'user',
        parts: [{ text: 'Begin the interview.' }],
      });
      chatHistory.push({
        role: 'model',
        parts: [{ text: msgs[0].text }],
      });
      msgs.shift(); // remove the first AI message — already added above
    }

    // Add the remaining messages (should now start with user)
    for (const msg of msgs) {
      chatHistory.push({
        role: msg.sender === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.text }],
      });
    }

    console.log(`[AI] Chat history length: ${chatHistory.length} turns for track "${track}"`);

    // Start a stateful chat with full prior context
    const chat = model.startChat({ history: chatHistory });

    // Send the latest candidate response
    const result = await chat.sendMessage(newUserText);
    const text = result.response.text().trim();
    console.log(`[AI] Response generated for track "${track}": ${text.substring(0, 80)}...`);
    return text;
  } catch (error) {
    console.error('[AI] generateResponse error:', error.message);
    // Graceful degradation — keep the interview going
    return "Thank you for sharing that. Can you tell me more about a specific challenge you faced and how you overcame it?";
  }
}

/**
 * generateReport
 * Called at the end of the interview to create a structured evaluation.
 * Uses a dedicated prompt with JSON output mode.
 *
 * @param {string} track   - Interview track ID
 * @param {Array}  history - Complete conversation history [{sender, text}]
 * @returns {Promise<Object>} - Structured report object
 */
async function generateReport(track, history) {
  // Fallback report when no API key
  if (!genAI) {
    return buildMockReport(track, history);
  }

  try {
    // Use a separate model instance with JSON mode enabled
    const reportModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3, // Lower temperature for structured, consistent JSON
        maxOutputTokens: 2048,
      },
    });

    // Build transcript text
    const transcript = history
      .map(msg => `${msg.sender === 'ai' ? 'INTERVIEWER' : 'CANDIDATE'}: ${msg.text}`)
      .join('\n\n');

    if (!transcript.trim()) {
      return buildMockReport(track, history);
    }

    const prompt = REPORT_PROMPT(track, transcript);
    const result = await reportModel.generateContent(prompt);
    const responseText = result.response.text().trim();

    console.log('[AI] Report generated successfully');
    const report = JSON.parse(responseText);

    // Validate and sanitize
    return sanitizeReport(report);
  } catch (error) {
    console.error('[AI] generateReport error:', error.message);
    return buildMockReport(track, history);
  }
}

/* ── Internal helpers ────────────────────────────────────── */

/**
 * Sanitizes the report JSON to ensure all required fields exist
 * with correct types, preventing downstream crashes.
 */
function sanitizeReport(report) {
  return {
    overall_score: clampScore(report.overall_score ?? 70),
    scores: {
      technical_accuracy: clampScore(report.scores?.technical_accuracy ?? 70),
      communication:      clampScore(report.scores?.communication ?? 70),
      problem_solving:    clampScore(report.scores?.problem_solving ?? 70),
      culture_fit:        clampScore(report.scores?.culture_fit ?? 70),
    },
    strengths:         Array.isArray(report.strengths) ? report.strengths.slice(0, 5) : ['Clear communication'],
    weaknesses:        Array.isArray(report.weaknesses) ? report.weaknesses.slice(0, 5) : ['Needs more depth'],
    question_feedback: Array.isArray(report.question_feedback) ? report.question_feedback : [],
    actionable_tips:   Array.isArray(report.actionable_tips) ? report.actionable_tips.slice(0, 5) : ['Practice regularly'],
  };
}

function clampScore(n) {
  const num = Number(n);
  return isNaN(num) ? 70 : Math.max(0, Math.min(100, Math.round(num)));
}

/**
 * Returns a reasonable mock report used when the API key is absent
 * or report generation fails.
 */
function buildMockReport(track, history) {
  const qCount = history.filter(m => m.sender === 'ai').length;
  const aCount = history.filter(m => m.sender === 'user').length;

  const trackLabels = {
    swe: 'Software Engineering', frontend: 'Frontend Development',
    backend: 'Backend Development', datascience: 'Data Science',
    pm: 'Product Management', finance: 'Finance',
    hr: 'HR & Behavioral', marketing: 'Marketing & Sales',
  };

  return {
    overall_score: 72,
    scores: {
      technical_accuracy: 70,
      communication:      75,
      problem_solving:    72,
      culture_fit:        74,
    },
    strengths: [
      'Communicated answers clearly and concisely',
      `Demonstrated foundational knowledge in ${trackLabels[track] || track}`,
      'Maintained composure and professional tone throughout',
    ],
    weaknesses: [
      'Could provide more depth and specific examples',
      'Some answers lacked discussion of edge cases or trade-offs',
      'Technical vocabulary could be expanded with more precise terminology',
    ],
    question_feedback: history
      .filter(m => m.sender === 'ai')
      .slice(0, aCount)
      .map((aiMsg, i) => {
        const userMsg = history.filter(m => m.sender === 'user')[i];
        return {
          question: aiMsg.text,
          answer: userMsg?.text || 'No response recorded',
          score: 70,
          critique: 'Answer was reasonable but could benefit from more specific examples and deeper technical analysis.',
        };
      }),
    actionable_tips: [
      'Practice explaining your thought process out loud before committing to an answer',
      `Review core ${trackLabels[track] || track} concepts and recent industry developments`,
      'Use the STAR method for behavioral questions and structured frameworks for technical ones',
    ],
  };
}

module.exports = {
  generateFirstQuestion,
  generateResponse,
  generateReport,
};

// Quick debug script to test Gemini chat API with the FIXED history logic
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { SYSTEM_PROMPTS } = require('./src/prompts');

async function test() {
  const key = process.env.GEMINI_API_KEY;
  console.log('Key present:', !!key, key ? `(starts with ${key.substring(0,8)}...)` : '');

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPTS.swe,
    generationConfig: { temperature: 0.85, maxOutputTokens: 512, topP: 0.95 },
  });

  // Simulate DB history: [{sender:'ai', text:'...'}, {sender:'user', text:'...'}]
  const dbHistory = [
    { sender: 'ai',   text: "Welcome! I'm Alex. Let's start — explain the difference between a stack and a queue." },
    // user message will be passed as sendMessage(), not in history
  ];

  // Apply the fix: build chatHistory
  const chatHistory = [];
  const msgs = [...dbHistory];

  if (msgs.length > 0 && msgs[0].sender === 'ai') {
    chatHistory.push({ role: 'user',  parts: [{ text: 'Begin the interview.' }] });
    chatHistory.push({ role: 'model', parts: [{ text: msgs[0].text }] });
    msgs.shift();
  }
  for (const msg of msgs) {
    chatHistory.push({ role: msg.sender === 'ai' ? 'model' : 'user', parts: [{ text: msg.text }] });
  }

  console.log('\nChat history:');
  chatHistory.forEach((m, i) => console.log(`  [${i}] ${m.role}: ${m.parts[0].text.substring(0,60)}`));

  const userInput = "A stack uses LIFO — used for call stacks and undo operations. A queue uses FIFO — used for BFS and task scheduling.";
  console.log('\nUser input:', userInput);

  try {
    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(userInput);
    console.log('\n✅ AI Response:', result.response.text());
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('Stack:', err.stack);
  }
}

test();

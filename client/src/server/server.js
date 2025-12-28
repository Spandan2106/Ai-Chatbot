import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.set("trust proxy", 1); // Trust Render's load balancer for secure connection detection
app.use(cors());
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY. Please create a .env file in the client directory.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// POST /api/chat { model, messages: [{role, content}, ...] }
app.post("/api/chat", async (req, res) => {
  try {
    const { model = "gemini-2.5-flash-lite", messages = [] } = req.body || {};

    console.log(`🤖 Using model: ${model}`);
    const genModel = genAI.getGenerativeModel({ 
      model,
      systemInstruction: "You are Jarves, a futuristic and intelligent AI assistant. You are helpful, concise, and friendly."
    });

    // 1. Extract the last message as the prompt
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.content;

    // 2. Format history (excluding the last message)
    // Gemini roles: "user" or "model". OpenAI roles: "user" or "assistant".
    const history = messages.slice(0, -1)
      .filter(m => m.role !== 'system') // Gemini doesn't support system role in history directly
      .map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

    // Gemini history must start with a user message. Remove the welcome message if it's first.
    if (history.length > 0 && history[0].role === "model") {
      history.shift();
    }

    const chat = genModel.startChat({ history });
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err?.message || "Unknown error" });
  }
});

// Serve static files from the React app (dist)
const distPath = path.join(__dirname, "../../dist");
app.use(express.static(distPath));

// Handle React routing, return all requests to React app
app.get("*", (req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("<h1>404 Not Found</h1><p>The client build files are missing.</p><p>If you are running locally, run <code>npm run build</code>.</p><p>If you are on Render, ensure the Build Command is <code>npm install && npm run build</code>.</p>");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ API ready on http://localhost:${PORT}`));
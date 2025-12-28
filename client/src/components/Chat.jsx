import React, { useEffect, useMemo, useRef, useState } from "react";
import { sendChat } from "../services/api.js";
import MessageBubble from "./MessageBubble.jsx";
import { SendIcon } from "./Icones.jsx";

export default function Chat() {
  const [messages, setMessages] = useState([
    { id: crypto.randomUUID(), role: "assistant", content: "Hi! I’m Jarves. Ask me anything. 🧠💬" },
  ]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash-lite");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const abortControllerRef = useRef(null);

  const isProd = import.meta.env.PROD;
  let backendUrl = import.meta.env.VITE_API_BASE || (isProd ? window.location.origin : "http://localhost:3001");
  if (backendUrl === "/") backendUrl = window.location.origin;

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Text-to-Speech: Read the latest message if it's from AI and speech is enabled
  useEffect(() => {
    if (!speechEnabled || loading) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "assistant") {
      const utterance = new SpeechSynthesisUtterance(lastMsg.content);
      // Optional: Select a specific voice if desired
      // const voices = window.speechSynthesis.getVoices();
      // utterance.voice = voices.find(v => v.lang.includes('en')) || null;
      window.speechSynthesis.cancel(); // Stop any previous speech
      window.speechSynthesis.speak(utterance);
    }
  }, [messages, loading, speechEnabled]);

  // Speech-to-Text: Handle Microphone
  function handleMic() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition. Try Chrome or Edge.");
      return;
    }
    
    if (isListening) return; // Already listening

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.start();
  }

  async function handleSend() {
    if (!canSend) return;
    setError("");

    // Cancel previous request if active
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsg = { id: crypto.randomUUID(), role: "user", content: input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const payload = messages.filter(m => m.role !== "error").concat(userMsg).map(({ role, content }) => ({ role, content }));
      // Pass signal to API (requires api.js update to support it, but works for UI logic here)
      const { text } = await sendChat({ model, messages: payload, signal: controller.signal });
      
      if (controller.signal.aborted) return;

      setMessages(m => [...m, { id: crypto.randomUUID(), role: "assistant", content: text || "(No response)" }]);
    } catch (e) {
      if (e.name === "AbortError" || abortControllerRef.current?.signal.aborted) return;
      const msg = e instanceof Error ? e.message : String(e);
      setMessages(m => [...m, { id: crypto.randomUUID(), role: "error", content: `⚠️ Request failed: ${msg}` }]);
      setError(msg);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function clearChat() {
    setMessages([{ id: crypto.randomUUID(), role: "assistant", content: "Chat cleared. How can I help now?" }]);
    setError("");
  }

  function handleStop() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }

  return (
    <div className="chat">
      <div ref={listRef} className="chat__list">
        {messages.map(m => (<MessageBubble key={m.id} role={m.role} text={m.content} />))}
        {loading && (
          <div className="message">
            <div className="bubble bubble--ai">
              <div className="typing">
                <div className="typing__dot"></div>
                <div className="typing__dot"></div>
                <div className="typing__dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="composer">
        <div className="composer__inner">
          <div className="box">
            <textarea
              className="input"
              rows={1}
              placeholder="Ask me anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <div className="toolbar">
              <div className="small">{error ? "Error — try again" : ""}</div>
              <div className="toolbar__actions">
                <select value={model} onChange={(e) => setModel(e.target.value)} className="ghost">
                  <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (10 RPM)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash (5 RPM)</option>
                  <option value="gemini-3-flash">gemini-3-flash (5 RPM)</option>
                  <option value="gemma-3-27b">gemma-3-27b (30 RPM)</option>
                </select>
                
                <button className={`btn ghost ${isListening ? "listening" : ""}`} onClick={handleMic} title="Speak">
                  {isListening ? "🔴" : <MicIcon />}
                </button>
                <button className="btn ghost" onClick={() => { setSpeechEnabled(!speechEnabled); window.speechSynthesis.cancel(); }} title="Toggle Text-to-Speech">
                  {speechEnabled ? <SpeakerIcon /> : <SpeakerOffIcon />}
                </button>

                {loading ? (
                  <button className="btn" onClick={handleStop} style={{ background: "#ef4444" }}>
                    <StopIcon /> Stop
                  </button>
                ) : (
                  <button className="btn" disabled={!canSend} onClick={handleSend}>
                    <SendIcon /> Send
                  </button>
                )}
                <button className="btn ghost" onClick={clearChat}>Clear</button>
              </div>
            </div>
          </div>
          <div className="small" style={{ marginTop: 8 }}>Backend: <code>{backendUrl}</code> • Set <code>GEMINI_API_KEY</code> on the server.</div>
        </div>
      </div>
    </div>
  );
}

// Simple inline icons
const MicIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const SpeakerIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
const SpeakerOffIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>;
const StopIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>;
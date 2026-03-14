// src/components/Chatbot.jsx
// Sam - Career Assistant Chatbot
// Usage: {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
// Toggle button ke liye neeche wala blue button HATAO aur apna button use karo

import { useState, useRef, useEffect } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const QUICK_PROMPTS = [
  "Improve my resume ✍️",
  "Interview tips 🎯",
  "Salary negotiation 💰",
  "Switch careers 🔄",
  "Top skills to learn 📚",
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
.sam-wrap*{box-sizing:border-box;margin:0;padding:0}
.sam-box{
  position:fixed;bottom:24px;right:24px;
  width:370px;height:540px;
  background:#0f0f1a;border-radius:20px;
  display:flex;flex-direction:column;
  box-shadow:0 24px 70px rgba(0,0,0,0.5),0 0 0 1px rgba(139,92,246,0.3);
  overflow:hidden;z-index:9999;
  animation:samUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
  font-family:'Inter',sans-serif;
}
@keyframes samUp{from{opacity:0;transform:translateY(28px) scale(0.95)}to{opacity:1;transform:none}}
.sam-header{
  display:flex;align-items:center;gap:11px;
  padding:14px 18px;
  background:linear-gradient(135deg,#1e1040 0%,#12102a 100%);
  border-bottom:1px solid rgba(139,92,246,0.2);flex-shrink:0;
}
.sam-hav{
  width:38px;height:38px;border-radius:11px;flex-shrink:0;
  background:linear-gradient(135deg,#7c3aed,#4f46e5);
  display:flex;align-items:center;justify-content:center;
  font-size:18px;box-shadow:0 4px 12px rgba(124,58,237,0.4);
}
.sam-hinfo{flex:1}
.sam-hname{color:#fff;font-weight:700;font-size:14.5px}
.sam-hstatus{display:flex;align-items:center;gap:5px;color:#a78bfa;font-size:11.5px;margin-top:2px}
.sam-dot{width:6px;height:6px;background:#34d399;border-radius:50%;animation:samPulse 2s infinite}
@keyframes samPulse{0%,100%{opacity:1}50%{opacity:0.4}}
.sam-hbtns{display:flex;gap:5px}
.sam-ibtn{
  width:30px;height:30px;border:none;border-radius:8px;
  background:rgba(255,255,255,0.08);color:#a78bfa;
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  font-size:14px;transition:all .18s;
}
.sam-ibtn:hover{background:rgba(255,255,255,0.15);color:#fff}
.sam-ibtn.cls:hover{background:rgba(239,68,68,0.2);color:#f87171}
.sam-msgs{
  flex:1;overflow-y:auto;
  padding:14px;display:flex;flex-direction:column;gap:10px;
}
.sam-msgs::-webkit-scrollbar{width:3px}
.sam-msgs::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.3);border-radius:3px}
.sam-bwrap{display:flex;flex-direction:column;animation:samFi 0.22s ease}
@keyframes samFi{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.sam-bwrap.user{align-items:flex-end}
.sam-bwrap.assistant{align-items:flex-start}
.sam-slabel{font-size:10.5px;font-weight:700;margin-bottom:4px;padding:0 4px;letter-spacing:0.4px}
.sam-bwrap.user .sam-slabel{color:#a78bfa}
.sam-bwrap.assistant .sam-slabel{color:#60a5fa}
.sam-bubble{
  max-width:86%;padding:10px 14px;
  border-radius:16px;font-size:13.5px;line-height:1.6;word-break:break-word;
}
.sam-bwrap.user .sam-bubble{
  background:linear-gradient(135deg,#7c3aed,#4f46e5);
  color:#fff;border-bottom-right-radius:3px;
  box-shadow:0 4px 14px rgba(124,58,237,0.3);
}
.sam-bwrap.assistant .sam-bubble{
  background:rgba(255,255,255,0.08);
  color:#e2e8f0;border:1px solid rgba(255,255,255,0.1);
  border-bottom-left-radius:3px;
}
.sam-bwrap.assistant .sam-bubble.err{
  background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.25);color:#fca5a5;
}
.sam-btime{font-size:10px;color:#6b7280;margin-top:4px;padding:0 4px}
.sam-typing{
  display:flex;align-items:center;gap:5px;
  padding:12px 16px;
  background:rgba(255,255,255,0.07);
  border:1px solid rgba(255,255,255,0.1);
  border-radius:16px;border-bottom-left-radius:3px;width:fit-content;
}
.sam-typing span{width:6px;height:6px;background:#7c3aed;border-radius:50%;animation:samB 1.2s infinite}
.sam-typing span:nth-child(2){animation-delay:0.2s}
.sam-typing span:nth-child(3){animation-delay:0.4s}
@keyframes samB{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
.sam-chips{display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 8px;flex-shrink:0}
.sam-chip{
  background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);
  color:#a78bfa;font-size:12px;font-weight:500;
  padding:5px 11px;border-radius:20px;cursor:pointer;
  transition:all .18s;font-family:inherit;white-space:nowrap;
}
.sam-chip:hover{background:rgba(124,58,237,0.3);border-color:#7c3aed;color:#c4b5fd}
.sam-inputarea{
  padding:10px 14px 14px;
  border-top:1px solid rgba(255,255,255,0.06);
  background:rgba(0,0,0,0.2);flex-shrink:0;
}
.sam-inputrow{display:flex;gap:8px;align-items:center}
.sam-input{
  flex:1;background:rgba(255,255,255,0.07);
  border:1px solid rgba(255,255,255,0.12);
  border-radius:12px;padding:10px 14px;
  color:#fff;font-size:13.5px;font-family:inherit;outline:none;
  transition:border-color .18s;
}
.sam-input::placeholder{color:#6b7280}
.sam-input:focus{border-color:rgba(124,58,237,0.6)}
.sam-sendbtn{
  width:40px;height:40px;flex-shrink:0;
  background:linear-gradient(135deg,#7c3aed,#4f46e5);
  border:none;border-radius:11px;color:#fff;
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  font-size:16px;transition:all .18s;
  box-shadow:0 4px 12px rgba(124,58,237,0.4);
}
.sam-sendbtn:hover:not(:disabled){transform:scale(1.06)}
.sam-sendbtn:disabled{opacity:0.45;cursor:not-allowed;transform:none}
`;

const fmt = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function Chatbot({ onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1, role: "assistant",
      text: "Hi! I'm Sam 👋 your career assistant. Ask me anything about jobs, resumes, skills, or career growth!",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { id: Date.now(), role: "user", text: msg, time: new Date() };
    setMessages(p => [...p, userMsg]);
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.text,
      }));

      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: msg, history }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error ${res.status}`);
      }

      const data = await res.json();
      const reply =
        data.reply || data.message || data.response || data.content ||
        "I'm here to help! Could you rephrase that?";

      setMessages(p => [...p, {
        id: Date.now() + 1, role: "assistant",
        text: reply, time: new Date(),
      }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(p => [...p, {
        id: Date.now() + 1, role: "assistant",
        text: "I'm having trouble connecting right now. Please check that the backend is running and GROQ_API_KEY is set in your .env file.",
        time: new Date(), isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 1, role: "assistant",
      text: "Hi! I'm Sam 👋 your career assistant. Ask me anything about jobs, resumes, skills, or career growth!",
      time: new Date(),
    }]);
  };

  return (
    <div className="sam-wrap">
      <style>{CSS}</style>
      <div className="sam-box">
        {/* Header */}
        <div className="sam-header">
          <div className="sam-hav">🤖</div>
          <div className="sam-hinfo">
            <div className="sam-hname">Sam · Career Assistant</div>
            <div className="sam-hstatus"><div className="sam-dot" />Online · Powered by AI</div>
          </div>
          <div className="sam-hbtns">
            <button className="sam-ibtn" onClick={clearChat} title="Clear chat">🗑</button>
            <button className="sam-ibtn cls" onClick={onClose} title="Close">✕</button>
          </div>
        </div>

        {/* Messages */}
        <div className="sam-msgs">
          {messages.map(m => (
            <div key={m.id} className={`sam-bwrap ${m.role}`}>
              <div className="sam-slabel">{m.role === "user" ? "🙋 You" : "🤖 Sam"}</div>
              <div className={`sam-bubble ${m.isError ? "err" : ""}`}>{m.text}</div>
              <div className="sam-btime">{fmt(m.time)}</div>
            </div>
          ))}
          {loading && (
            <div className="sam-bwrap assistant">
              <div className="sam-slabel">🤖 Sam</div>
              <div className="sam-typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        {messages.length === 1 && (
          <div className="sam-chips">
            {QUICK_PROMPTS.map(q => (
              <button key={q} className="sam-chip" onClick={() => send(q)}>{q}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="sam-inputarea">
          <div className="sam-inputrow">
            <input
              ref={inputRef}
              className="sam-input"
              placeholder="Ask Sam anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              disabled={loading}
            />
            <button
              className="sam-sendbtn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
            >➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}

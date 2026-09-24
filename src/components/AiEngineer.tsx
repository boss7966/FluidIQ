import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Mic, MicOff, Send, Volume2, VolumeX, Sparkles, AlertCircle, HelpCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
  isSnippet?: boolean;
  unitRef?: number;
}

const PRESET_QUERIES = [
  { text: "FluidIQ, explain 'Creeping' in cylinders.", category: "Troubleshooting" },
  { text: "Kenapa pam hidraulik bergetar dan bising?", category: "Malay / Hydraulics" },
  { text: "What is the formula for Pascal's Law?", category: "Math & Force" },
  { text: "Explain the FRL unit in pneumatics.", category: "Components" }
];

export default function AiEngineer({ onProgressUpdate }: { onProgressUpdate?: (percent: number) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Selamat datang! I am FluidIQ, your J4012 Smart Lab Assistant. Ask me anything about pneumatics, hydraulics, sequence logic, formulas, or troubleshooting in the lab. I speak both English and Malay!"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isDictating, setIsDictating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle Text-to-Speech
  const speakText = (text: string) => {
    if (!voiceEnabled) return;
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Strip markdown syntax for cleaner TTS
      const cleanText = text
        .replace(/\*\*|__/g, "")
        .replace(/#+\s/g, "")
        .replace(/-\s/g, "")
        .replace(/`[^`]+`/g, (m) => m.replace(/`/g, ""))
        .substring(0, 300); // Limit length to avoid infinite drone

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      
      // Try to find a standard English or Malay voice
      const voices = window.speechSynthesis.getVoices();
      const malayVoice = voices.find(v => v.lang.includes("MS") || v.lang.includes("ID") || v.lang.includes("my"));
      const englishVoice = voices.find(v => v.lang.includes("EN") || v.lang.includes("en-US"));
      
      // If the text contains lots of Malay words, use Malay voice if available
      const containsMalay = /kenapa|pam|injap|bising|silinder|penggerak|tekanan/i.test(text);
      if (containsMalay && malayVoice) {
        utterance.voice = malayVoice;
      } else if (englishVoice) {
        utterance.voice = englishVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis failed:", err);
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    const userMsg = textToSend;
    setInputText("");
    
    // Add user message
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      // Send history
      const historyPayload = messages.slice(-5).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMsg,
          history: historyPayload
        })
      });

      if (!res.ok) throw new Error("Server responded with error.");
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
          isSnippet: !!data.unitId,
          unitRef: data.unitId
        }
      ]);

      // Speak answer
      speakText(data.answer);

      // Trigger completion boost if troubleshooting was asked
      if (onProgressUpdate && (userMsg.toLowerCase().includes("creeping") || userMsg.toLowerCase().includes("rayapan"))) {
        // Boost for researching troubleshooting
        onProgressUpdate(15);
      }

    } catch (err: any) {
      console.error(err);
      const errReply = "My communication valve is slightly choked. Let me reply locally:\n\nPascal's Law is formulated as **F = P x A**. In Hydraulics (Unit 6), this allows massive force multiplication. Please set your GEMINI_API_KEY in Secrets for full AI capabilities!";
      setMessages((prev) => [...prev, { role: "assistant", text: errReply }]);
      speakText(errReply);
    } finally {
      setLoading(false);
    }
  };

  // Simulate Mic dictation
  const triggerVoiceInput = () => {
    if (isDictating) {
      setIsDictating(false);
      return;
    }

    setIsDictating(true);
    // Pick a random preset query to simulate speaking after a short delay
    const randomPreset = PRESET_QUERIES[Math.floor(Math.random() * PRESET_QUERIES.length)].text;
    
    let chars = "";
    let i = 0;
    const interval = setInterval(() => {
      if (i < randomPreset.length) {
        chars += randomPreset[i];
        setInputText(chars);
        i++;
      } else {
        clearInterval(interval);
        setIsDictating(false);
        // Wait a brief moment and auto-send
        setTimeout(() => {
          handleSend(randomPreset);
        }, 600);
      }
    }, 45);
  };

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="flex flex-col h-[520px] bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-xl text-slate-100 font-sans">
      {/* Panel Header */}
      <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wider text-slate-100 flex items-center gap-2">
              THE AI ENGINEER
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono border border-emerald-500/20">LIVE RAG</span>
            </h3>
            <p className="text-xs text-slate-400">J4012 Module Intelligent Expert</p>
          </div>
        </div>

        {/* Audio control button */}
        <button
          onClick={() => {
            if (voiceEnabled) window.speechSynthesis.cancel();
            setVoiceEnabled(!voiceEnabled);
          }}
          className={`p-2 rounded-lg border transition ${
            voiceEnabled 
              ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20" 
              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
          }`}
          title={voiceEnabled ? "Mute Voice Out" : "Enable Voice Out"}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 text-xs md:text-sm shadow ${
                m.role === "user"
                  ? "bg-amber-600 text-slate-50 rounded-br-none"
                  : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none space-y-2"
              }`}
            >
              {/* Message header */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-1">
                <span>{m.role === "user" ? "STUDENT" : "FLUIDIQ"}</span>
                {m.unitRef && (
                  <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded text-[9px] border border-amber-500/20">
                    UNIT {m.unitRef}
                  </span>
                )}
              </div>

              {/* Message text */}
              <div className="whitespace-pre-wrap leading-relaxed">
                {m.text.split("\n").map((line, lIdx) => {
                  // Format simple formulas
                  if (line.includes("=") && (line.includes("P") || line.includes("F") || line.includes("V"))) {
                    return (
                      <div key={lIdx} className="my-2 p-2 bg-slate-950 border-l-2 border-amber-500 rounded font-mono text-amber-400 text-center text-sm">
                        {line}
                      </div>
                    );
                  }
                  return <p key={lIdx} className="mb-1">{line}</p>;
                })}
              </div>

              {/* Lab repair summary card helper */}
              {m.isSnippet && m.unitRef === 11 && (
                <div className="mt-3 p-2.5 bg-red-950/20 border border-red-500/20 rounded font-mono text-slate-300 space-y-1 text-[11px]">
                  <div className="flex items-center gap-1.5 text-red-400 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    REPAIR CHECKLIST ISSUED
                  </div>
                  <p className="text-slate-400 text-[10px]">Cylinder Creeping Diagnose (Section 11.1.5)</p>
                  <a
                    href="/api/download/troubleshoot"
                    download
                    className="inline-block mt-1.5 text-center w-full py-1 text-xs bg-red-500/10 text-red-400 rounded border border-red-500/20 hover:bg-red-500/20 transition"
                  >
                    Download Repair Checklist.pdf
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg rounded-bl-none p-3.5 max-w-[80%] flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-xs text-slate-400 font-mono tracking-wider">SCANNING SYLLABUS...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/60 overflow-x-auto flex gap-2 shrink-0 no-scrollbar">
        {PRESET_QUERIES.map((p, pIdx) => (
          <button
            key={pIdx}
            disabled={loading || isDictating}
            onClick={() => handleSend(p.text)}
            className="whitespace-nowrap text-[10px] font-medium bg-slate-800 hover:bg-slate-700/80 hover:text-amber-400 text-slate-300 border border-slate-700/55 rounded-full px-3 py-1 transition shrink-0"
          >
            {p.text}
          </button>
        ))}
      </div>

      {/* Input controls */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2 shrink-0">
        <button
          onClick={triggerVoiceInput}
          disabled={loading}
          className={`p-2.5 rounded-lg border transition ${
            isDictating
              ? "bg-red-600/15 text-red-400 border-red-500/30 animate-pulse"
              : "bg-slate-800 text-slate-300 border-slate-700 hover:text-amber-400"
          }`}
          title="Simulate Voice Command"
        >
          {isDictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          disabled={loading || isDictating}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(inputText)}
          placeholder={isDictating ? "Speaking to FluidIQ..." : "Ask a J4012 lab question..."}
          className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
        />

        <button
          onClick={() => handleSend(inputText)}
          disabled={loading || isDictating || !inputText.trim()}
          className="p-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

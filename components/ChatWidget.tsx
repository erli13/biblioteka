"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok || !res.body) throw new Error("No response from server");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantText,
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Ndodhi një gabim. Provo përsëri!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes pop-in {
          0%   { opacity: 0; transform: scale(0.85) translateY(12px); }
          60%  { transform: scale(1.04) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes msg-in {
          0%   { opacity: 0; transform: translateY(8px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: translateY(0); }
          40%           { transform: translateY(-6px); }
        }
        @keyframes wiggle {
          0%,100% { transform: rotate(0deg) scale(1); }
          25%     { transform: rotate(-8deg) scale(1.15); }
          75%     { transform: rotate(8deg) scale(1.15); }
        }
        .chat-window  { animation: pop-in 0.28s cubic-bezier(.34,1.56,.64,1) both; }
        .msg-bubble   { animation: msg-in 0.2s ease both; }
        .dot-1 { animation: bounce-dot 1.1s 0.0s infinite; }
        .dot-2 { animation: bounce-dot 1.1s 0.18s infinite; }
        .dot-3 { animation: bounce-dot 1.1s 0.36s infinite; }
        .fab-wiggle   { animation: wiggle 0.4s ease; }
      `}</style>

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Mbyll chat-in" : "Hap asistentin e bibliotekës"}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-yellow-400 border-2 border-black flex items-center justify-center text-3xl hover:-translate-y-1 active:translate-y-0.5 transition-transform duration-150 cursor-pointer select-none"
        style={{ borderRadius: 0 }}
      >
        <span
          className={`transition-transform duration-200 ${open ? "rotate-90 scale-90" : "rotate-0 scale-100"}`}
          style={{ display: "inline-block" }}
        >
          {open ? "✕" : "📚"}
        </span>
        {/* Notification pip when there are messages and chat is closed */}
        {!open && messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-black text-white text-[9px] font-black flex items-center justify-center">
            {messages.filter((m) => m.role === "assistant").length}
          </span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="chat-window fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col border-2 border-black bg-white overflow-hidden">
          {/* Header */}
          <div className="bg-black text-white px-4 py-3 flex items-center gap-3">
            <span className="text-xl">🦉</span>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-widest uppercase text-yellow-400">
                Asistenti i Bibliotekës
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                Dhaskal Todri · gjithmonë gati
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-80 bg-gray-50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-6 gap-2 select-none">
                <span className="text-4xl">📖</span>
                <p className="text-xs text-gray-500 text-center font-medium">
                  Pyetmë për libra, autorë,<br />ose rekomandime!
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`msg-bubble flex items-end gap-1.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                style={{ animationDelay: "0ms" }}
              >
                {msg.role === "assistant" && (
                  <span className="text-base mb-0.5 select-none">🦉</span>
                )}
                <div
                  className={`max-w-[78%] px-3 py-2 text-sm border-2 border-black font-medium leading-relaxed ${
                    msg.role === "user"
                      ? "bg-yellow-400 text-black whitespace-pre-wrap"
                      : "bg-white text-black prose prose-sm prose-neutral max-w-none"
                  }`}
                >
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-black">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        code: ({ children }) => <code className="bg-gray-100 border border-black px-1 text-xs font-mono">{children}</code>,
                        h1: ({ children }) => <p className="font-black text-base mb-1">{children}</p>,
                        h2: ({ children }) => <p className="font-black mb-1">{children}</p>,
                        h3: ({ children }) => <p className="font-bold mb-1">{children}</p>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
                {msg.role === "user" && (
                  <span className="text-base mb-0.5 select-none">🧑‍🎓</span>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="msg-bubble flex items-end gap-1.5 justify-start">
                <span className="text-base mb-0.5 select-none">🦉</span>
                <div className="px-4 py-3 border-2 border-black bg-white flex items-center gap-1.5">
                  <span className="dot-1 w-2 h-2 bg-black inline-block" style={{ borderRadius: 0 }} />
                  <span className="dot-2 w-2 h-2 bg-yellow-400 border border-black inline-block" style={{ borderRadius: 0 }} />
                  <span className="dot-3 w-2 h-2 bg-black inline-block" style={{ borderRadius: 0 }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div className="flex border-t-2 border-black">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Kërko një libër…"
              disabled={loading}
              className="flex-1 px-3 py-2.5 text-sm text-black bg-white outline-none placeholder-gray-400 disabled:opacity-50 font-medium"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-yellow-400 text-black text-sm font-black border-l-2 border-black uppercase tracking-wide hover:-translate-y-0.5 active:translate-y-0.5 transition-transform duration-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Dërgo
            </button>
          </div>
        </div>
      )}
    </>
  );
}

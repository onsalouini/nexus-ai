import { useState } from "react";
import { api } from "../../lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function RiskModelsPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour 👋 Je suis NEXUS AI, votre assistant intelligent de gestion de projets. Je peux vous aider avec la planification, la répartition des tâches, la gestion de votre équipe, l'analyse des risques et le suivi de vos projets.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const message = input.trim();

    if (!message || loading) return;

    const userMessage: Message = {
      role: "user",
      content: message,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/ai/chat", {
        message,
        history: messages,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.reply,
      };

      setMessages([
        ...updatedMessages,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("Erreur NEXUS AI :", error);

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content:
            "Désolé, NEXUS AI est temporairement indisponible. Veuillez réessayer.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#071021]/70 backdrop-blur-xl">

      {/* Header */}
      <div className="border-b border-white/[0.08] p-6">
        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-2xl">
            🤖
          </div>

          <div>
            <h1 className="text-xl font-semibold text-white">
              NEXUS AI
            </h1>

            <p className="text-sm text-slate-400">
              Assistant intelligent de gestion de projets
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-xs text-emerald-400">
              Assistant actif
            </span>
          </div>

        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-5 overflow-y-auto p-6">

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-5 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "bg-cyan-500 text-white"
                  : "border border-white/[0.08] bg-white/[0.04] text-slate-200"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-3 text-sm text-slate-400">
              NEXUS AI réfléchit...
            </div>
          </div>
        )}

      </div>

      {/* Input */}
      <div className="border-t border-white/[0.08] p-4">

        <div className="flex items-end gap-3">

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Posez une question sur vos projets ou votre équipe..."
            className="max-h-32 min-h-[48px] flex-1 resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
          />

          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500 text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ➤
          </button>

        </div>

        <p className="mt-2 text-xs text-slate-600">
          NEXUS AI est spécialisé dans la gestion de projets et d'équipes.
        </p>

      </div>

    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";

type Message = {
  id?: number;
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: number;
  title: string;
};

type Attachment = {
  id?: number;
  original_name?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

const suggestions = [
  {
    icon: "📊",
    title: "Analyser mes projets",
    text: "Quels sont les points importants à surveiller dans mes projets ?",
  },
  {
    icon: "👥",
    title: "Organiser mon équipe",
    text: "Comment répartir efficacement les tâches entre mon équipe ?",
  },
  {
    icon: "⚠️",
    title: "Gérer les risques",
    text: "Comment identifier et réduire les risques d'un projet ?",
  },
  {
    icon: "⏱️",
    title: "Optimiser l'effort",
    text: "Comment réduire l'écart entre l'effort prévu et l'effort estimé ?",
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export default function RiskModelsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [conversation, setConversation] =
    useState<Conversation | null>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploadingFile, setUploadingFile] = useState(false);

  const [attachment, setAttachment] =
    useState<Attachment | null>(null);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Charger la dernière conversation au démarrage
   */
  useEffect(() => {
    loadLatestConversation();
  }, []);

  const loadLatestConversation = async () => {
    try {
      const response = await api.get("/ai/conversations");

      const conversations: Conversation[] = response.data;

      if (conversations.length === 0) {
        return;
      }

      const latestConversation = conversations[0];

      const conversationResponse = await api.get(
        `/ai/conversations/${latestConversation.id}`
      );

      setConversation(latestConversation);

      setMessages(
        conversationResponse.data.messages ?? []
      );
    } catch (error) {
      console.error(
        "Erreur lors du chargement de la conversation :",
        error
      );
    }
  };

  /**
   * Créer une nouvelle conversation
   */
  const createConversation = async (
    firstMessage: string
  ) => {
    const response = await api.post(
      "/ai/conversations",
      {
        title:
          firstMessage.length > 60
            ? `${firstMessage.substring(0, 60)}...`
            : firstMessage,
      }
    );

    return response.data as Conversation;
  };

  /**
   * Sélectionner un fichier
   */
  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setErrorMessage(null);

    /**
     * Vérifier la taille
     */
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(
        "Le fichier est trop volumineux. La taille maximale est de 10 Mo."
      );

      event.target.value = "";
      return;
    }

    /**
     * Vérifier le type
     */
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setErrorMessage(
        "Format non supporté. Utilisez un PDF, DOCX ou TXT."
      );

      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setAttachment(null);
  };

  /**
   * Supprimer le fichier sélectionné
   */
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setAttachment(null);
    setErrorMessage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Upload du fichier vers Laravel
   */
  const uploadFile = async (
    currentConversation: Conversation
  ) => {
    if (!selectedFile) {
      return null;
    }

    setUploadingFile(true);

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await api.post(
        `/ai/conversations/${currentConversation.id}/attachments`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadedAttachment: Attachment =
        response.data.attachment ?? response.data;

      setAttachment(uploadedAttachment);

      return uploadedAttachment;
    } catch (error: unknown) {
  console.error(
    "Erreur upload fichier :",
    error
  );

  let backendMessage =
    "Impossible d'envoyer le fichier. Veuillez réessayer.";

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (
      typeof response?.data?.message ===
      "string"
    ) {
      backendMessage =
        response.data.message;
    }
  }

  setErrorMessage(backendMessage);

  throw error;
}finally {
      setUploadingFile(false);
    }
  };

  /**
   * Envoyer un message
   */
  const sendMessage = async (
    customMessage?: string
  ) => {
    const message =
      (customMessage ?? input).trim();

    /**
     * Autoriser l'envoi d'un fichier même
     * si le texte est vide.
     */
    if (
      (!message && !selectedFile) ||
      loading
    ) {
      return;
    }

    setLoading(true);
    setInput("");
    setErrorMessage(null);

    try {
      /**
       * Créer une conversation si nécessaire
       */
      let currentConversation = conversation;

      if (!currentConversation) {
        currentConversation =
          await createConversation(
            message ||
              selectedFile?.name ||
              "Analyse de document"
          );

        setConversation(currentConversation);
      }

      /**
       * Upload du document avant le message
       */
      let uploadedAttachment = attachment;

      if (selectedFile && !uploadedAttachment) {
        uploadedAttachment =
          await uploadFile(
            currentConversation
          );
      }

      /**
       * Construire le contenu du message
       */
      let finalMessage = message;

      if (uploadedAttachment) {
        const fileName =
          uploadedAttachment.original_name ??
          uploadedAttachment.file_name ??
          selectedFile?.name ??
          "document";

        if (finalMessage) {
          finalMessage =
            `${finalMessage}\n\n📎 Document joint : ${fileName}`;
        } else {
          finalMessage =
            `Analyse le document joint : ${fileName}`;
        }
      }

      /**
       * Envoyer le message au backend
       */
      const response = await api.post(
        `/ai/conversations/${currentConversation.id}/messages`,
        {
          content: finalMessage,
        }
      );

      const userMessage: Message =
        response.data.user_message;

      const assistantMessage: Message =
        response.data.assistant_message;

      setMessages((previous) => [
        ...previous,
        userMessage,
        assistantMessage,
      ]);

      /**
       * Nettoyer le fichier après envoi
       */
      removeSelectedFile();
    } catch (error) {
      console.error(
        "Erreur NEXUS AI :",
        error
      );

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "Je rencontre momentanément un problème de connexion. Veuillez réessayer dans quelques instants.",
        },
      ]);
    } finally {
      setLoading(false);
      setUploadingFile(false);
    }
  };

  /**
   * Gestion de la touche Entrée
   */
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  /**
   * Formater la taille du fichier
   */
  const formatFileSize = (
    bytes: number
  ) => {
    if (bytes < 1024) {
      return `${bytes} octets`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} Ko`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="relative flex h-[calc(100vh-120px)] min-h-[600px] flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#050B18] shadow-2xl shadow-black/20">

      {/* ================= BACKGROUND ================= */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-cyan-500/[0.07] blur-3xl" />

        <div className="absolute -right-32 top-1/4 h-80 w-80 rounded-full bg-violet-500/[0.06] blur-3xl" />
      </div>

      {/* ================= HEADER ================= */}

      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.07] px-6 py-5">

        <div className="flex items-center gap-4">

          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-violet-500/15">

            <span className="text-xl">
              ✦
            </span>

            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#050B18] bg-emerald-400" />

          </div>

          <div>

            <div className="flex items-center gap-2">

              <h1 className="text-[15px] font-semibold tracking-wide text-white">
                NEXUS AI
              </h1>

              <span className="rounded-md border border-cyan-400/15 bg-cyan-400/[0.06] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-cyan-300">
                Copilot
              </span>

            </div>

            <p className="mt-0.5 text-xs text-slate-500">
              Assistant intelligent de gestion
            </p>

          </div>

        </div>

        <div className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 sm:flex">

          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />

          <span className="text-[11px] font-medium text-slate-400">
            En ligne
          </span>

        </div>

      </header>

      {/* ================= CONTENT ================= */}

      <main className="relative z-10 flex-1 overflow-y-auto">

        {isEmpty ? (

          /* ================= WELCOME ================= */

          <div className="flex min-h-full flex-col items-center justify-center px-5 py-10">

            <div className="relative mb-6">

              <div className="absolute inset-0 rounded-[26px] bg-cyan-400/10 blur-2xl" />

              <div className="relative flex h-20 w-20 items-center justify-center rounded-[26px] border border-white/[0.09] bg-gradient-to-br from-cyan-400/[0.12] via-[#101B35] to-violet-500/[0.12] shadow-xl shadow-black/20">

                <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-4xl font-semibold text-transparent">
                  ✦
                </span>

              </div>

            </div>

            <div className="max-w-xl text-center">

              <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-cyan-400/80">
                Intelligence opérationnelle
              </p>

              <h2 className="text-3xl font-semibold tracking-tight text-white">

                Votre copilote pour{" "}

                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  mieux décider.
                </span>

              </h2>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-500">

                Analysez vos projets, organisez vos équipes et anticipez
                les risques grâce à l'assistant intelligent de NEXUS AI.

              </p>

            </div>

            {/* ================= SUGGESTIONS ================= */}

            <div className="mt-9 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">

              {suggestions.map(
                (suggestion) => (

                  <button
                    key={suggestion.title}
                    onClick={() =>
                      sendMessage(
                        suggestion.text
                      )
                    }
                    disabled={loading}
                    className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left transition-all duration-200 hover:border-cyan-400/20 hover:bg-white/[0.045] hover:shadow-lg hover:shadow-cyan-950/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    <div className="flex items-start gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.035] text-sm transition group-hover:border-cyan-400/15">
                        {suggestion.icon}
                      </div>

                      <div>

                        <p className="text-sm font-medium text-slate-200">
                          {suggestion.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {suggestion.text}
                        </p>

                      </div>

                    </div>

                  </button>

                )
              )}

            </div>

          </div>

        ) : (

          /* ================= CHAT ================= */

          <div className="mx-auto flex w-full max-w-4xl flex-col gap-7 px-5 py-7">

            {messages.map(
              (message, index) => (

                <div
                  key={
                    message.id ??
                    index
                  }
                  className={`flex gap-3 ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  {message.role ===
                    "assistant" && (

                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] text-sm text-cyan-300">
                      ✦
                    </div>

                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3.5 text-sm leading-6 ${
                      message.role === "user"
                        ? "rounded-br-md bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-950/20"
                        : "rounded-bl-md border border-white/[0.07] bg-white/[0.035] text-slate-300"
                    }`}
                  >
                    {message.content}
                  </div>

                </div>

              )
            )}

            {/* ================= LOADING ================= */}

            {(loading ||
              uploadingFile) && (

              <div className="flex items-start gap-3">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] text-sm text-cyan-300">
                  ✦
                </div>

                <div className="rounded-2xl rounded-bl-md border border-white/[0.07] bg-white/[0.035] px-4 py-3.5">

                  {uploadingFile ? (

                    <div className="flex items-center gap-2">

                      <span className="text-xs text-slate-400">
                        Analyse du document...
                      </span>

                    </div>

                  ) : (

                    <div className="flex items-center gap-1.5">

                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />

                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 [animation-delay:150ms]" />

                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 [animation-delay:300ms]" />

                    </div>

                  )}

                </div>

              </div>

            )}

          </div>

        )}

      </main>

      {/* ================= INPUT ================= */}

      <footer className="relative z-10 border-t border-white/[0.07] bg-[#050B18]/80 px-5 py-4 backdrop-blur-xl">

        <div className="mx-auto max-w-4xl">

          {/* ERROR */}

          {errorMessage && (

            <div className="mb-3 flex items-center justify-between rounded-xl border border-red-400/15 bg-red-400/[0.05] px-4 py-2.5">

              <p className="text-xs text-red-300">
                {errorMessage}
              </p>

              <button
                onClick={() =>
                  setErrorMessage(null)
                }
                className="ml-3 text-xs text-red-400 hover:text-red-300"
              >
                ✕
              </button>

            </div>

          )}

          {/* ================= FILE PREVIEW ================= */}

          {selectedFile && (

            <div className="mb-3 flex items-center justify-between rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] px-4 py-3">

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07]">

                  <span className="text-lg">
                    📄
                  </span>

                </div>

                <div className="min-w-0">

                  <p className="truncate text-xs font-medium text-slate-200">
                    {selectedFile.name}
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {formatFileSize(
                      selectedFile.size
                    )}
                  </p>

                </div>

              </div>

              <button
                onClick={
                  removeSelectedFile
                }
                disabled={
                  loading ||
                  uploadingFile
                }
                className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.05] hover:text-red-400 disabled:opacity-40"
                aria-label="Supprimer le fichier"
              >
                ✕
              </button>

            </div>

          )}

          {/* ================= INPUT BOX ================= */}

          <div className="relative flex items-end rounded-2xl border border-white/[0.09] bg-white/[0.035] p-2 transition focus-within:border-cyan-400/25 focus-within:bg-white/[0.045]">

            {/* FILE INPUT */}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={
                handleFileSelect
              }
              className="hidden"
            />

            {/* ATTACH BUTTON */}

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                loading ||
                uploadingFile
              }
              aria-label="Joindre un document"
              title="Joindre un PDF, DOCX ou TXT"
              className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.05] hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-30"
            >

              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 1 1-2.83-2.83l8.49-8.48" />
              </svg>

            </button>

            {/* TEXTAREA */}

            <textarea
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              rows={1}
              disabled={
                loading ||
                uploadingFile
              }
              placeholder={
                selectedFile
                  ? "Que voulez-vous analyser dans ce document ?"
                  : "Demandez à NEXUS AI..."
              }
              className="min-h-[44px] max-h-32 flex-1 resize-none bg-transparent px-2 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 disabled:opacity-50"
            />

            {/* SEND */}

            <button
              onClick={() =>
                sendMessage()
              }
              disabled={
                loading ||
                uploadingFile ||
                (!input.trim() &&
                  !selectedFile)
              }
              aria-label="Envoyer"
              className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-950/30 transition-all hover:scale-[1.03] hover:shadow-cyan-900/40 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:scale-100"
            >

              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>

            </button>

          </div>

          {/* FOOTER INFO */}

          <div className="mt-2 flex items-center justify-between px-1">

            <p className="text-[10px] text-slate-600">
              📎 PDF · DOCX · TXT · Max 10 Mo
            </p>

            <p className="hidden text-[10px] text-slate-600 sm:block">
              Entrée pour envoyer · Shift + Entrée pour une nouvelle ligne
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
}
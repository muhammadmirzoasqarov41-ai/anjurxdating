import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import {
  getMatch,
  listenMessages,
  sendMessage,
  maybeBotReply,
} from "../lib/firestore";
import { isBotUid } from "../data/bots";
import ChatBubble from "../components/ChatBubble";

export default function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getMatch(matchId).then(setMatch);
    const unsub = listenMessages(matchId, setMessages);
    return unsub;
  }, [matchId]);

  // bajo el scroll cada vez que entra un mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!match) {
    return <div className="h-screen bg-white" />;
  }

  const otherUid = match.users.find((u) => u !== user.uid);
  const other = match.profiles?.[otherUid] || {};

  async function handleSend(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setText("");
    try {
      await sendMessage(matchId, user.uid, value);
      // si el otro lado es un bot, le toca contestar
      if (isBotUid(otherUid)) {
        const botCount = messages.filter((m) => m.senderUid === otherUid).length;
        maybeBotReply(matchId, otherUid, botCount).catch(() => {});
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* cabecera del chat */}
      <header className="flex items-center gap-3 px-4 h-14 border-b border-gray-100">
        <button onClick={() => navigate("/matches")} className="text-gray-500" title="Orqaga" aria-label="Orqaga">
          <ArrowLeft size={22} />
        </button>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
          {other.photo ? (
            <img src={other.photo} alt={other.displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-gray-400">
              {other.displayName?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <span className="font-semibold text-gray-900">{other.displayName}</span>
      </header>

      {/* mensajes */}
      <div className="flex-1 overflow-y-auto thin-scroll px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-6">
            Match bo'ldingiz. Birinchi bo'lib salom yozing.
          </p>
        )}
        {messages.map((m) => (
          <ChatBubble key={m.id} text={m.text} mine={m.senderUid === user.uid} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 border-t border-gray-100"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Xabar yozing..."
          className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 outline-none text-sm focus:ring-1 focus:ring-flame-start"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="w-10 h-10 rounded-full flame-bg text-white flex items-center justify-center disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

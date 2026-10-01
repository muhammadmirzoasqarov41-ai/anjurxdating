import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, ChevronDown, Flame } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import {
  getMatch,
  getProfile,
  listenMessages,
  sendMessage,
  maybeBotReply,
  updateUserPresence,
} from "../lib/firestore";
import { isBotUid } from "../data/bots";
import ChatBubble from "../components/ChatBubble";

const ICEBREAKERS = [
  "Salom! 👋",
  "Qalaysiz? 😊",
  "Kuningiz qanday o'tyapti?",
  "Tanishsak bo'ladimi? ✨",
];

export default function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { markAsRead } = useChatStore();

  const [match, setMatch] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // Set user presence as online
  useEffect(() => {
    if (user?.uid) {
      updateUserPresence(user.uid, true);
      const interval = setInterval(() => {
        updateUserPresence(user.uid, true);
      }, 60000);
      return () => {
        clearInterval(interval);
        updateUserPresence(user.uid, false);
      };
    }
  }, [user?.uid]);

  // Load match details and setup real-time message listener
  useEffect(() => {
    let unsub = () => {};

    getMatch(matchId).then((m) => {
      setMatch(m);
      if (m && user?.uid) {
        const otherId = m.users.find((u) => u !== user.uid);
        if (otherId && !isBotUid(otherId)) {
          getProfile(otherId).then(setOtherProfile);
        }
      }
    });

    unsub = listenMessages(matchId, (msgs) => {
      setMessages(msgs);

      // If user is currently in chat, mark incoming unread messages as read
      if (user?.uid) {
        const hasUnreadFromOther = msgs.some(
          (m) => m.senderUid !== user.uid && !m.read
        );
        if (hasUnreadFromOther) {
          markAsRead(matchId, user.uid);
        }
      }
    });

    // Mark as read immediately on entry
    if (user?.uid) {
      markAsRead(matchId, user.uid);
    }

    return () => {
      unsub();
    };
  }, [matchId, user?.uid, markAsRead]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
    setShowScrollBottom(false);
  }, []);

  // Handle auto-scroll on new messages
  useEffect(() => {
    if (messages.length === 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    if (isInitialLoadRef.current) {
      scrollToBottom(false);
      isInitialLoadRef.current = false;
      return;
    }

    // Check if user is near the bottom
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 140;

    const lastMsg = messages[messages.length - 1];
    const isMine = lastMsg?.senderUid === user?.uid;

    if (isNearBottom || isMine) {
      scrollToBottom(true);
    } else {
      setShowScrollBottom(true);
    }
  }, [messages, user?.uid, scrollToBottom]);

  // Monitor scroll position
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom > 150) {
      setShowScrollBottom(true);
    } else {
      setShowScrollBottom(false);
    }
  };

  if (!match) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <header className="flex items-center gap-3 px-4 h-14 border-b border-gray-100 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="w-28 h-4 rounded bg-gray-200" />
        </header>
        <div className="flex-1 p-4 space-y-3">
          <div className="w-2/3 h-10 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="w-1/2 h-10 rounded-2xl bg-gray-100 ml-auto animate-pulse" />
        </div>
      </div>
    );
  }

  const otherUid = match.users.find((u) => u !== user?.uid);
  const other = match.profiles?.[otherUid] || {};
  const isBot = isBotUid(otherUid);
  const isOnline = isBot || Boolean(otherProfile?.online);

  async function handleSend(e) {
    if (e) e.preventDefault();
    const value = text.trim();
    if (!value || sending || !user?.uid) return;

    setSending(true);
    setText("");

    try {
      await sendMessage(matchId, user.uid, value, otherUid);
      scrollToBottom(true);

      // Bot auto-reply if chatting with bot
      if (isBot) {
        const botCount = messages.filter((m) => m.senderUid === otherUid).length;
        maybeBotReply(matchId, otherUid, botCount, user.uid).catch(() => {});
      }
    } catch (err) {
      console.error("Xabar yuborishda xatolik:", err);
    } finally {
      setSending(false);
    }
  }

  function handleIcebreakerClick(greeting) {
    setText(greeting);
  }

  return (
    <div className="flex flex-col h-screen bg-white max-w-md mx-auto relative select-none">
      {/* Chat Header */}
      <header className="flex items-center justify-between px-3 h-14 border-b border-gray-100 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => navigate("/matches")}
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors"
            title="Orqaga"
            aria-label="Orqaga"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Avatar with live online dot */}
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
            {other.photo ? (
              <img
                src={other.photo}
                alt={other.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-gray-400 text-sm">
                {other.displayName?.[0]?.toUpperCase()}
              </span>
            )}
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </div>

          {/* Name & Online Status */}
          <div className="min-w-0 leading-tight">
            <h2 className="font-bold text-sm text-gray-900 truncate">
              {other.displayName}
            </h2>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              {isOnline ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Onlayn
                </span>
              ) : otherProfile?.lastSeenAt ? (
                "Yaqinda onlayn edi"
              ) : (
                "Oflayn"
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto thin-scroll px-3 py-4 space-y-2 relative"
      >
        {/* Empty state & Icebreakers */}
        {messages.length === 0 && (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full flame-bg text-white flex items-center justify-center mx-auto shadow-xs">
              <Flame size={20} fill="currentColor" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-gray-800">
                Match bo'ldingiz!
              </h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                {other.displayName} bilan suhbatni birinchi bo'lib boshlang.
              </p>
            </div>

            {/* Icebreaker chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 max-w-xs mx-auto">
              {ICEBREAKERS.map((greeting, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleIcebreakerClick(greeting)}
                  className="px-3 py-1.5 rounded-full bg-gray-50 hover:bg-rose-50 hover:text-flame-start border border-gray-200 text-xs font-semibold text-gray-700 transition-colors"
                >
                  {greeting}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((m) => (
          <ChatBubble
            key={m.id}
            text={m.text}
            mine={m.senderUid === user?.uid}
            createdAt={m.createdAt}
            read={Boolean(m.read)}
          />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Floating "New Message" / Scroll to bottom pill */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-4 px-3 py-1.5 rounded-full bg-white shadow-card border border-gray-200 text-xs font-bold text-flame-start flex items-center gap-1 hover:scale-105 active:scale-95 transition-all z-20"
        >
          <span>Yangi xabarlar</span>
          <ChevronDown size={14} />
        </button>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-100 bg-white sticky bottom-0 z-20"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Xabar yozing..."
          disabled={sending}
          className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 outline-none text-sm text-gray-800 placeholder-gray-400 focus:ring-1 focus:ring-flame-start"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full flame-bg text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all shadow-xs shrink-0"
          title="Yuborish"
        >
          <Send size={17} />
        </button>
      </form>
    </div>
  );
}

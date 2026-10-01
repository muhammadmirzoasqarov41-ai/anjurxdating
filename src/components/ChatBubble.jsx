import { Check, CheckCheck } from "lucide-react";
import { formatMessageTime } from "../lib/firestore";

export default function ChatBubble({ text, mine, createdAt, read }) {
  const timeStr = formatMessageTime(createdAt);

  return (
    <div className={"flex " + (mine ? "justify-end" : "justify-start")}>
      <div
        className={
          "relative max-w-[78%] px-3.5 py-2 rounded-2xl text-sm leading-snug shadow-2xs " +
          (mine
            ? "flame-bg text-white rounded-br-xs"
            : "bg-gray-100 text-gray-800 rounded-bl-xs border border-gray-200/50")
        }
      >
        {/* Message body */}
        <p className="break-words select-text">{text}</p>

        {/* Time and Delivery / Read Status */}
        <div
          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
            mine ? "text-white/80" : "text-gray-400"
          }`}
        >
          {timeStr && <span>{timeStr}</span>}

          {mine && (
            <span className="inline-flex items-center">
              {read ? (
                <CheckCheck
                  size={13}
                  className="text-sky-200"
                  title="O'qildi"
                />
              ) : (
                <Check
                  size={12}
                  className="text-white/70"
                  title="Yuborildi"
                />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


import React from "react";
import { format } from "date-fns";
import { CheckCheck } from "lucide-react";

type MessageStatus = "sent" | "delivered" | "read";

interface ChatMessageProps {
  content: string;
  timestamp: Date;
  isSent: boolean;
  status?: MessageStatus;
  senderName?: string;
  showSender?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  timestamp,
  isSent,
  status = "sent",
  senderName,
  showSender = false,
}) => {
  const messageClass = isSent ? "message-bubble-sent" : "message-bubble-received";
  
  const statusIcon = () => {
    if (!isSent) return null;
    
    return (
      <div className="flex items-center mt-1 text-xs space-x-1 justify-end">
        <span className="text-gray-400 dark:text-gray-500 text-[10px]">
          {format(timestamp, "h:mm a")}
        </span>
        <CheckCheck 
          size={14} 
          className={`
            ${status === "sent" ? "text-gray-400" : ""}
            ${status === "delivered" ? "text-gray-500" : ""}
            ${status === "read" ? "text-blue-500" : ""}
          `} 
        />
      </div>
    );
  };

  return (
    <div className={`flex flex-col mb-3 animate-slide-in ${isSent ? "items-end" : "items-start"}`}>
      {showSender && !isSent && (
        <span className="text-xs text-gray-500 ml-2 mb-1">{senderName}</span>
      )}
      <div className={messageClass}>
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
      {statusIcon()}
    </div>
  );
};

export default ChatMessage;

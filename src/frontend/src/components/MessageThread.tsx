import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useRef } from "react";
import type { Message } from "../backend";
import { fromNanoseconds } from "../utils/formatting";

interface MessageThreadProps {
  messages: Message[];
  currentPrincipal: string;
}

export function MessageThread({
  messages,
  currentPrincipal,
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        No messages yet. Say hello!
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 pr-3">
      <div className="space-y-3 py-2">
        {messages.map((msg) => {
          const isOwn = msg.sender.toString() === currentPrincipal;
          return (
            <div
              key={msg.id.toString()}
              className={cn("flex", isOwn ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                  isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    isOwn
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {format(fromNanoseconds(msg.sentAt), "h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

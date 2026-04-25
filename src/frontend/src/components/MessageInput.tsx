import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSendMessage } from "../hooks/useQueries";

interface MessageInputProps {
  conversationId: bigint;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const [content, setContent] = useState("");
  const { mutate: sendMessage, isPending } = useSendMessage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    sendMessage(
      { conversationId, content: trimmed },
      {
        onSuccess: () => setContent(""),
        onError: (error) => {
          toast.error(error.message || "Failed to send message");
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t pt-3">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
        disabled={isPending}
        autoFocus
      />
      <Button type="submit" size="icon" disabled={isPending || !content.trim()}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}

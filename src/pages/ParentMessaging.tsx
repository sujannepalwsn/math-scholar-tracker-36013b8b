"use client";
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageSquare, Search, Send } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ParentMessaging() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations for parent
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["parent-chat-conversations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("chat_conversations")
        .select(`*, students:student_id(id, name, grade), centers:center_id(id, name)`)
        .eq("parent_user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch unread counts per conversation
  const { data: unreadCounts = {} } = useQuery({
    queryKey: ["unread-counts", user?.id, conversations.map((c: any) => c.id).join(",")],
    queryFn: async () => {
      if (!user?.id || conversations.length === 0) return {};
      const counts: Record<string, number> = {};
      for (const conv of conversations) {
        const { count, error } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("is_read", false)
          .neq("sender_user_id", user.id);
        if (!error) counts[conv.id] = count || 0;
      }
      return counts;
    },
    enabled: !!user?.id && conversations.length > 0,
    refetchInterval: 10000,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["chat-messages", selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation?.id) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`*, sender:sender_user_id(id, username, role)`)
        .eq("conversation_id", selectedConversation.id)
        .order("sent_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedConversation?.id,
    refetchInterval: 3000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!selectedConversation?.id) return;
    const channel = supabase
      .channel(`chat-${selectedConversation.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${selectedConversation.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["chat-messages", selectedConversation.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read
  useEffect(() => {
    const markAsRead = async () => {
      if (!selectedConversation?.id || !user?.id) return;
      const unread = messages.filter((m: any) => !m.is_read && m.sender_user_id !== user.id);
      if (unread.length > 0) {
        await supabase
          .from("chat_messages")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in("id", unread.map((m: any) => m.id));
        queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
      }
    };
    markAsRead();
  }, [messages, selectedConversation?.id, user?.id]);

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversation?.id || !user?.id || !newMessage.trim()) throw new Error("Missing data");
      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: selectedConversation.id,
        sender_user_id: user.id,
        message_text: newMessage.trim(),
      });
      if (error) throw error;
      await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", selectedConversation.id);
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages", selectedConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ["parent-chat-conversations"] });
    },
    onError: (error: any) => toast.error(error.message || "Failed to send message"),
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) sendMessageMutation.mutate();
  };

  const filteredConversations = conversations.filter((conv: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      conv.students?.name?.toLowerCase().includes(q) ||
      conv.centers?.name?.toLowerCase().includes(q)
    );
  });

  const getConversationName = (conv: any) => conv.centers?.name || "Center";
  const getConversationSub = (conv: any) => `Student: ${conv.students?.name}`;

  // Mobile: show chat list or chat view
  const showChatView = isMobile && selectedConversation;

  const ConversationList = () => (
    <div className="flex flex-col h-full bg-card">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {conversationsLoading ? (
          <div className="flex flex-col gap-2 p-3">
             {[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-10 px-4">
            <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">No conversations found</p>
          </div>
        ) : (
          filteredConversations.map((conv: any) => {
            const unread = unreadCounts[conv.id] || 0;
            const isActive = selectedConversation?.id === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={cn(
                  "w-full text-left p-4 border-b hover:bg-muted/50 transition-all flex items-center gap-3 relative",
                  isActive && "bg-primary/5 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-primary"
                )}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{getConversationName(conv)?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={cn("text-sm font-semibold truncate", unread > 0 ? "text-foreground" : "text-foreground/80")}>
                      {getConversationName(conv)}
                    </p>
                    {conv.updated_at && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate">{getConversationSub(conv)}</p>
                    {unread > 0 && <Badge className="h-5 min-w-[20px] rounded-full p-0 flex items-center justify-center text-[10px] shrink-0 bg-primary">{unread}</Badge>}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </ScrollArea>
    </div>
  );

  const ChatView = () => (
    <div className="flex flex-col h-full bg-background">
      {/* Chat header */}
      <div className="p-4 border-b bg-card flex items-center gap-3 shrink-0 h-16">
        {isMobile && (
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => setSelectedConversation(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {selectedConversation ? (
          <>
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">{getConversationName(selectedConversation)?.[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{getConversationName(selectedConversation)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold truncate">
                {selectedConversation.students?.name} • Grade {selectedConversation.students?.grade}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a conversation</p>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {!selectedConversation ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 py-20">
            <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center mb-2">
              <MessageSquare className="h-8 w-8 opacity-20" />
            </div>
            <p className="font-semibold text-sm">Select a conversation</p>
            <p className="text-xs text-center max-w-[200px]">Communication with institutional leadership is initiated here.</p>
          </div>
        ) : messagesLoading ? (
          <div className="space-y-4">
             {[1,2,3,4].map(i => (
               <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                 <div className="h-12 w-40 rounded-xl bg-muted animate-pulse" />
               </div>
             ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-muted-foreground italic">No message history. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg: any) => {
              const isOwn = msg.sender_user_id === user?.id;
              return (
                <div key={msg.id} className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[85%] md:max-w-[70%] p-3 shadow-sm text-sm leading-relaxed",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none"
                      : "bg-card border border-border/50 rounded-2xl rounded-tl-none"
                  )}>
                    <p className="whitespace-pre-wrap">{msg.message_text}</p>
                  </div>
                  <div className={cn("flex items-center gap-1.5 mt-1 px-1")}>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {format(new Date(msg.sent_at), "h:mm a")}
                    </p>
                    {isOwn && (
                      <span className={cn("text-[10px] font-bold", msg.is_read ? "text-primary" : "text-muted-foreground/40")}>
                        {msg.is_read ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      {selectedConversation && (
        <div className="p-4 border-t bg-card">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (newMessage.trim()) sendMessageMutation.mutate(); } }}
              placeholder="Type a message..."
              className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl border-muted-foreground/10 bg-muted/30 focus-visible:ring-primary/20"
              rows={1}
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMessageMutation.isPending} className="h-11 w-11 rounded-xl shrink-0 shadow-soft">
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-[9px] text-center text-muted-foreground mt-2 font-semibold uppercase tracking-widest">
            Messages are securely logged for academic oversight
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)] flex flex-col">
      <div className="shrink-0">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
          Communication Portal
        </h1>
        <p className="text-sm text-muted-foreground font-medium">Direct secure channel for academic synchronization.</p>
      </div>

      <Card className="flex-1 border shadow-strong overflow-hidden rounded-2xl flex flex-col min-h-0 bg-card/60 backdrop-blur-sm">
        {isMobile ? (
          showChatView ? <ChatView /> : <ConversationList />
        ) : (
          <div className="flex h-full divide-x">
            <div className="w-80 shrink-0 h-full overflow-hidden">
              <ConversationList />
            </div>
            <div className="flex-1 h-full overflow-hidden">
              <ChatView />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

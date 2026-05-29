import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Conversation, Message, PhoneNumber } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
  MessageSquare,
  Send,
  Search,
  Phone,
  MoreVertical,
  User,
  Loader2,
  Plus,
  Pencil,
  Pin,
  FolderInput,
  Trash2,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  ImageIcon,
  Mic,
  MicOff,
  X,
  Play,
  Pause,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, isToday, isYesterday } from "date-fns";

interface ConversationWithMessages extends Conversation {
  messages?: Message[];
}

function MessageStatusIcon({ status, isOutbound }: { status: string; isOutbound: boolean }) {
  if (!isOutbound) return null;
  
  switch (status) {
    case "pending":
      return <Clock className="h-3 w-3" />;
    case "sent":
      return <Check className="h-3 w-3" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3" />;
    case "read":
      return <CheckCheck className="h-3 w-3 text-blue-400" />;
    case "failed":
      return <AlertCircle className="h-3 w-3 text-red-400" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
}

function NewConversationDialog({ 
  onCreated, 
  selectedPhoneNumberId,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: { 
  onCreated: (id: string) => void;
  selectedPhoneNumberId: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    externalOnOpenChange?.(v);
  };
  const [contactNumber, setContactNumber] = useState("");
  const [contactName, setContactName] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: { contactNumber: string; contactName: string; phoneNumberId: string }) => {
      const res = await apiRequest("POST", "/api/conversations", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Contact Added",
        description: "You can now start messaging",
      });
      setOpen(false);
      setContactNumber("");
      setContactName("");
      onCreated(data.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add contact",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!contactNumber.trim() || !selectedPhoneNumberId) return;
    createMutation.mutate({
      contactNumber: contactNumber.trim(),
      contactName: contactName.trim(),
      phoneNumberId: selectedPhoneNumberId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-new-conversation">
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            Add a new contact to start messaging
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Phone Number *</Label>
            <Input
              id="contactNumber"
              placeholder="+1 (555) 123-4567"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              data-testid="input-contact-number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactName">Name (optional)</Label>
            <Input
              id="contactName"
              placeholder="John Doe"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              data-testid="input-contact-name"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!contactNumber.trim() || createMutation.isPending}
            data-testid="button-create-conversation"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Add Contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditContactDialog({ 
  conversation, 
  open, 
  onOpenChange 
}: { 
  conversation: Conversation; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [contactName, setContactName] = useState(conversation.contactName || "");
  const [category, setCategory] = useState(conversation.category || "general");

  useEffect(() => {
    setContactName(conversation.contactName || "");
    setCategory(conversation.category || "general");
  }, [conversation]);

  const updateMutation = useMutation({
    mutationFn: async (data: { contactName: string; category: string }) => {
      return apiRequest("PATCH", `/api/conversations/${conversation.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({ title: "Contact Updated", description: "Contact details have been saved." });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update contact", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ contactName: contactName.trim(), category });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>Update contact details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input value={conversation.contactNumber} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editName">Name</Label>
            <Input
              id="editName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Contact name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editCategory">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
  onNewConversation,
  selectedPhoneNumberId,
  newConversationOpen,
  onNewConversationOpenChange,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  onNewConversation?: (id: string) => void;
  selectedPhoneNumberId: string;
  newConversationOpen?: boolean;
  onNewConversationOpenChange?: (open: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);
  const { toast } = useToast();

  const pinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      return apiRequest("PATCH", `/api/conversations/${id}`, { isPinned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({ title: "Contact Removed", description: "The contact has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove contact", variant: "destructive" });
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: string }) => {
      return apiRequest("PATCH", `/api/conversations/${id}`, { category });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({ title: "Contact Moved", description: "Contact category updated." });
    },
  });

  const filteredConversations = conversations
    .filter((conv) => {
      const matchesSearch =
        conv.contactName?.toLowerCase().includes(search.toLowerCase()) ||
        conv.contactNumber.includes(search);
      
      if (activeTab === "sales") {
        return matchesSearch && conv.category === "sales";
      }
      return matchesSearch;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  const formatTime = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMM d");
  };

  const getInitials = (name: string | null, number: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return number.slice(-2);
  };

  const handleEdit = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversation(conv);
  };

  const handlePin = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    pinMutation.mutate({ id: conv.id, isPinned: !conv.isPinned });
  };

  const handleMove = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    const newCategory = conv.category === "sales" ? "general" : "sales";
    moveMutation.mutate({ id: conv.id, category: newCategory });
  };

  const handleRemove = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remove ${conv.contactName || conv.contactNumber}?`)) {
      deleteMutation.mutate(conv.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex-1 p-2 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-lg">Contacts</h2>
          {onNewConversation && (
            <NewConversationDialog
              onCreated={onNewConversation}
              selectedPhoneNumberId={selectedPhoneNumberId}
              open={newConversationOpen}
              onOpenChange={onNewConversationOpenChange}
            />
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-conversations"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="all" data-testid="tab-all-conversations">All</TabsTrigger>
            <TabsTrigger value="sales" data-testid="tab-sales-conversations">Sales</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1 pl-[0px] pt-[0px] pb-[0px] pr-[0px]">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No contacts found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-2 py-2 rounded-lg transition-colors hover-elevate cursor-pointer ${selectedId === conv.id ? "bg-accent" : ""}`}
                onClick={() => onSelect(conv.id)}
                data-testid={`conversation-${conv.id}`}
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(conv.contactName, conv.contactNumber)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-1">
                    {conv.isPinned && (
                      <Pin className="h-3 w-3 text-primary flex-shrink-0" />
                    )}
                    <p className="font-medium truncate text-sm flex-1">
                      {conv.contactName || conv.contactNumber}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 ml-1">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground truncate flex-1">
                      {conv.lastMessagePreview
                        ? conv.lastMessagePreview.length > 40
                          ? conv.lastMessagePreview.slice(0, 40) + "…"
                          : conv.lastMessagePreview
                        : "No messages yet"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge variant="default" className="h-4 min-w-4 flex items-center justify-center text-xs flex-shrink-0 px-1 ml-1">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`flex-shrink-0 h-7 w-7 transition-opacity ${selectedId === conv.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                      data-testid={`menu-conversation-${conv.id}`}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => handleEdit(conv, e)} data-testid="menu-edit">
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handlePin(conv, e)} data-testid="menu-pin">
                      <Pin className={`mr-2 h-4 w-4 ${conv.isPinned ? "text-primary" : ""}`} />
                      {conv.isPinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleMove(conv, e)} data-testid="menu-move">
                      <FolderInput className="mr-2 h-4 w-4" />
                      Move to {conv.category === "sales" ? "General" : "Sales"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleRemove(conv, e)}
                      className="text-destructive focus:text-destructive"
                      data-testid="menu-remove"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      {editingConversation && (
        <EditContactDialog
          conversation={editingConversation}
          open={!!editingConversation}
          onOpenChange={(open) => !open && setEditingConversation(null)}
        />
      )}
    </div>
  );
}

function MessageThread({
  conversationId,
  conversation,
  phoneNumbers,
}: {
  conversationId: string;
  conversation: Conversation | undefined;
  phoneNumbers: PhoneNumber[];
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", conversationId, "messages"],
    enabled: !!conversationId,
  });

  const sendMutation = useMutation({
    mutationFn: async (payload: { content: string; mediaUrl?: string; mediaType?: string }) => {
      const res = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, payload);
      return res.json();
    },
    onSuccess: (data: any) => {
      setMessage("");
      clearMedia();
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (data?.smsError) {
        toast({
          title: "Message saved but SMS delivery failed",
          description: data.smsError,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearMedia = () => {
    setMediaFile(null);
    setMediaType(null);
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearMedia();
    const preview = URL.createObjectURL(file);
    setMediaFile(file);
    setMediaPreviewUrl(preview);
    setMediaType(file.type);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const file = new File([blob], `voice-${Date.now()}.${mimeType === "audio/webm" ? "webm" : "ogg"}`, { type: mimeType });
        const preview = URL.createObjectURL(blob);
        setMediaFile(file);
        setMediaPreviewUrl(preview);
        setMediaType(mimeType);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to record voice messages.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !mediaFile) return;

    let uploadedMediaUrl: string | undefined;
    let uploadedMediaType: string | undefined;

    if (mediaFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", mediaFile);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || "Upload failed");
        }
        const data = await response.json();
        uploadedMediaUrl = data.url;
        uploadedMediaType = data.mediaType;
      } catch (err) {
        toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Could not upload file", variant: "destructive" });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    sendMutation.mutate({
      content: message.trim(),
      mediaUrl: uploadedMediaUrl,
      mediaType: uploadedMediaType,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatRecordingTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const formatMessageTime = (date: Date | string) => {
    return format(new Date(date), "h:mm a");
  };

  const getInitials = (name: string | null, number: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return number.slice(-2);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
              <Skeleton className={`h-16 ${i % 2 === 0 ? "w-48" : "w-56"} rounded-lg`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {conversation ? getInitials(conversation.contactName, conversation.contactNumber) : "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {conversation?.contactName || conversation?.contactNumber || "Unknown"}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <Phone className="h-3 w-3" />
              <span>{conversation?.contactNumber}</span>
              {conversation?.phoneNumberId && (() => {
                const ph = phoneNumbers.find(p => p.id === conversation.phoneNumberId);
                return ph ? (
                  <span className="text-xs text-muted-foreground/70">
                    &bull; via {ph.number}
                  </span>
                ) : null;
              })()}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-conversation-menu">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem data-testid="menu-view-contact">
              <User className="mr-2 h-4 w-4" />
              View Contact
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg overflow-hidden ${
                    msg.direction === "outbound"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {/* Image media */}
                  {msg.mediaUrl && msg.mediaType?.startsWith("image/") && (
                    <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={msg.mediaUrl}
                        alt="Sent image"
                        className="max-w-full max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        data-testid={`img-message-${msg.id}`}
                      />
                    </a>
                  )}
                  {/* Audio media */}
                  {msg.mediaUrl && msg.mediaType?.startsWith("audio/") && (
                    <div className="p-3 pb-1">
                      <audio
                        controls
                        src={msg.mediaUrl}
                        className="w-full max-w-xs h-10"
                        data-testid={`audio-message-${msg.id}`}
                        style={{ filter: msg.direction === "outbound" ? "invert(1)" : "none" }}
                      />
                    </div>
                  )}
                  {/* Text content */}
                  {msg.content && (
                    <p className="text-sm whitespace-pre-wrap p-3 pb-1">{msg.content}</p>
                  )}
                  <div
                    className={`flex items-center gap-2 px-3 pb-2 text-xs ${
                      msg.direction === "outbound"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span>{formatMessageTime(msg.createdAt)}</span>
                    {msg.direction === "outbound" && (
                      <MessageStatusIcon status={msg.status} isOutbound={true} />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t bg-background">
        {/* Media preview */}
        {mediaPreviewUrl && (
          <div className="px-4 pt-3 flex items-start gap-3">
            {mediaType?.startsWith("image/") ? (
              <div className="relative">
                <img
                  src={mediaPreviewUrl}
                  alt="Preview"
                  className="max-h-32 max-w-48 rounded-lg object-cover border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={clearMedia}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : mediaType?.startsWith("audio/") ? (
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <Mic className="h-4 w-4 text-muted-foreground" />
                <audio controls src={mediaPreviewUrl} className="h-8 max-w-[200px]" />
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearMedia}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : null}
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </div>
            )}
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="px-4 pt-3 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              Recording {formatRecordingTime(recordingTime)}
            </div>
          </div>
        )}

        <div className="p-3 flex items-end gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
            data-testid="input-file"
          />

          {/* Image picker button */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendMutation.isPending || isRecording}
            title="Attach image"
            data-testid="button-attach-image"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>

          {/* Voice recorder button */}
          <Button
            variant="ghost"
            size="icon"
            className={`flex-shrink-0 h-9 w-9 ${isRecording ? "text-destructive hover:text-destructive" : "text-muted-foreground hover:text-foreground"}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={sendMutation.isPending || !!mediaFile}
            title={isRecording ? "Stop recording" : "Record voice message"}
            data-testid="button-voice-record"
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sendMutation.isPending || isRecording}
            className="flex-1"
            data-testid="input-message"
          />

          <Button
            onClick={handleSend}
            disabled={(!message.trim() && !mediaFile) || sendMutation.isPending || isUploading || isRecording}
            className="flex-shrink-0"
            data-testid="button-send-message"
          >
            {sendMutation.isPending || isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PhoneNumberWithUnread extends PhoneNumber {
  unreadCount?: number;
}

// Tone patterns for Web Audio API: [frequency, durationSecs, volume]
type ToneNote = [number, number, number];
const ringtoneTones: Record<string, ToneNote[]> = {
  "chime":        [[1047, 0.12, 0.4], [880, 0.12, 0.3], [1047, 0.25, 0.35]],
  "bell":         [[880, 0.8, 0.45]],
  "ding":         [[1319, 0.3, 0.5]],
  "pop":          [[330, 0.04, 0.6], [660, 0.08, 0.4]],
  "bubble":       [[523, 0.07, 0.4], [784, 0.12, 0.35]],
  "swoosh":       [[200, 0.08, 0.3], [400, 0.08, 0.3], [600, 0.1, 0.25]],
  "notification": [[784, 0.1, 0.4], [1047, 0.2, 0.45]],
  "alert":        [[880, 0.08, 0.5], [660, 0.08, 0.4], [880, 0.15, 0.45]],
  "message":      [[523, 0.1, 0.4], [659, 0.18, 0.4]],
  "ping":         [[1319, 0.22, 0.5]],
  "soft-chime":   [[659, 0.25, 0.25], [784, 0.35, 0.2]],
  "gentle":       [[523, 0.4, 0.2]],
  "subtle":       [[880, 0.18, 0.2]],
  "whisper":      [[440, 0.12, 0.15]],
  "bright":       [[1319, 0.08, 0.4], [1047, 0.08, 0.35], [1319, 0.18, 0.4]],
  "cheerful":     [[784, 0.08, 0.4], [1047, 0.08, 0.4], [1319, 0.18, 0.45]],
  "positive":     [[659, 0.08, 0.35], [784, 0.08, 0.35], [1047, 0.18, 0.4]],
  "success":      [[523, 0.07, 0.35], [659, 0.07, 0.35], [784, 0.07, 0.35], [1047, 0.25, 0.4]],
};

// Track seen message IDs to prevent duplicate notifications
const seenMessageIds = new Set<string>();

function playNotificationSound(ringtoneId: string) {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const notes = ringtoneTones[ringtoneId] || ringtoneTones["chime"];
    let t = ctx.currentTime;
    notes.forEach(([freq, dur, vol]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    });
    setTimeout(() => ctx.close(), 2000);
  } catch (_) {}
}

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function showBrowserNotification(title: string, body: string, messageId: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.png", tag: messageId });
  }
}

export default function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState<string | null>(null);
  const [listWidth, setListWidth] = useState(280);
  const [newContactOpen, setNewContactOpen] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(0);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = Math.max(200, Math.min(500, dragStartWidthRef.current + (e.clientX - dragStartXRef.current)));
      setListWidth(newWidth);
    };
    const onMouseUp = () => { isDraggingRef.current = false; };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "m") {
        e.preventDefault();
        setNewContactOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleNewMessage = useCallback((data: any) => {
    const msg = data.message;
    if (msg && msg.direction === "inbound") {
      const messageId = msg.id || msg.signalwireMessageId || `${Date.now()}`;
      
      // Prevent duplicate notifications for same message
      if (seenMessageIds.has(messageId)) {
        return;
      }
      seenMessageIds.add(messageId);
      
      // Keep set size manageable (last 100 messages)
      if (seenMessageIds.size > 100) {
        const firstId = seenMessageIds.values().next().value;
        if (firstId) seenMessageIds.delete(firstId);
      }
      
      // Use ringtone from user profile (falls back to localStorage then default)
      const ringtoneId = user?.ringtone
        || localStorage.getItem(`sms-ringtone-${user?.id}`)
        || 'chime';
      playNotificationSound(ringtoneId);
      const contactName = msg.senderName || data.conversation?.contactName || data.conversation?.contactNumber || "New Contact";
      const messageContent = msg.content || "";
      showBrowserNotification("New Message", `${contactName}: ${messageContent.substring(0, 50)}`, messageId);
      toast({
        title: "New Message",
        description: `${contactName}: ${messageContent.substring(0, 50)}`,
      });
    }
  }, [toast, user]);

  const { subscribeToConversation, unsubscribeFromConversation } = useWebSocket({
    onNewMessage: handleNewMessage,
  });

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Mutation to mark conversation as read
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await apiRequest("POST", `/api/conversations/${conversationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  useEffect(() => {
    if (selectedConversationId) {
      subscribeToConversation(selectedConversationId);
      // Mark conversation as read when selected
      markAsReadMutation.mutate(selectedConversationId);
      return () => unsubscribeFromConversation(selectedConversationId);
    }
  }, [selectedConversationId, subscribeToConversation, unsubscribeFromConversation]);

  const { data: phoneNumbers = [], isLoading: phoneNumbersLoading } = useQuery<PhoneNumber[]>({
    queryKey: ["/api/phone-numbers", { includeAssigned: true }],
    queryFn: async () => {
      const res = await fetch("/api/phone-numbers?includeAssigned=true", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch phone numbers");
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: allConversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  // Calculate unread counts per phone number
  const phoneNumbersWithUnread: PhoneNumberWithUnread[] = phoneNumbers.map((phone) => {
    const unreadCount = allConversations
      .filter((conv) => conv.phoneNumberId === phone.id)
      .reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    return { ...phone, unreadCount };
  });

  // Calculate total unread across all phone numbers
  const totalUnreadCount = phoneNumbersWithUnread.reduce((sum, phone) => sum + (phone.unreadCount || 0), 0);

  // Filter conversations by selected phone number and sort by lastMessageAt (newest first)
  const filteredConversations = selectedPhoneNumberId
    ? allConversations
        .filter((conv) => conv.phoneNumberId === selectedPhoneNumberId)
        .sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bTime - aTime;
        })
    : [];

  const selectedConversation = allConversations.find((c) => c.id === selectedConversationId);

  // Reset selected conversation when phone number changes
  useEffect(() => {
    setSelectedConversationId(null);
  }, [selectedPhoneNumberId]);

  // Show loading state while phone numbers are loading
  if (phoneNumbersLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show message if no phone numbers available
  if (phoneNumbers.length === 0) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center text-muted-foreground max-w-md">
          <Phone className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No Phone Numbers</p>
          <p className="text-sm">
            {user?.role === "team_member"
              ? "No phone numbers have been assigned to you yet. Please ask your admin to assign a number from the Team Management page."
              : "You need to buy phone numbers first before you can start messaging. Go to Buy Numbers page to purchase numbers from your connected gateway."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Phone Number Selector */}
      <div className="border-b p-4 bg-muted/30">
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium whitespace-nowrap">Select Number:</Label>
          <div className="relative">
            <Select 
              value={selectedPhoneNumberId || ""} 
              onValueChange={(val) => setSelectedPhoneNumberId(val)}
            >
              <SelectTrigger className="w-[300px]" data-testid="select-phone-number">
                <SelectValue placeholder="Choose a phone number" />
              </SelectTrigger>
            <SelectContent>
              {phoneNumbersWithUnread.map((phone) => (
                <SelectItem key={phone.id} value={phone.id}>
                  <div className="flex items-center gap-2 justify-between w-full">
                    <span>{phone.number}</span>
                    {phone.friendlyName && (
                      <span className="text-muted-foreground text-xs">({phone.friendlyName})</span>
                    )}
                    {(phone.unreadCount ?? 0) > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center text-xs ml-2">
                        {phone.unreadCount}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!selectedPhoneNumberId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground max-w-md">
            <Phone className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Select a Phone Number</p>
            <p className="text-sm">
              Choose a phone number from the dropdown above to view and manage contacts for that number.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <Card
            className="flex-shrink-0 rounded-none border-y-0 border-l-0 overflow-hidden"
            style={{ width: listWidth }}
          >
            <ConversationList
              conversations={filteredConversations}
              selectedId={selectedConversationId}
              onSelect={setSelectedConversationId}
              isLoading={conversationsLoading}
              onNewConversation={setSelectedConversationId}
              selectedPhoneNumberId={selectedPhoneNumberId}
              newConversationOpen={newContactOpen}
              onNewConversationOpenChange={setNewContactOpen}
            />
          </Card>
          <div
            className="w-1 flex-shrink-0 cursor-col-resize bg-border hover:bg-primary/40 active:bg-primary/60 transition-colors select-none"
            onMouseDown={(e) => {
              isDraggingRef.current = true;
              dragStartXRef.current = e.clientX;
              dragStartWidthRef.current = listWidth;
              e.preventDefault();
            }}
            data-testid="resize-handle"
          />
          <div className="flex-1 bg-background overflow-hidden">
            {selectedConversationId ? (
              <MessageThread
                conversationId={selectedConversationId}
                conversation={selectedConversation}
                phoneNumbers={phoneNumbers}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a contact</p>
                <p className="text-sm">Choose a contact from the list to start messaging</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

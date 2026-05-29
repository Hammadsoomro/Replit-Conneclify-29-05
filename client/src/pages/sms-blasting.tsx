import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Upload,
  Send,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
} from "lucide-react";
import type { PhoneNumber } from "@shared/schema";

interface Contact {
  phone: string;
  name: string;
}

interface BlastResult {
  sent: number;
  failed: number;
  errors: { phone: string; error: string }[];
}

export default function SmsBlastingPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSendingRef = useRef(false);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [message, setMessage] = useState("");
  const [fromNumberId, setFromNumberId] = useState("");
  const [result, setResult] = useState<BlastResult | null>(null);
  const [fileName, setFileName] = useState("");

  const { data: phoneNumbers = [] } = useQuery<PhoneNumber[]>({
    queryKey: ["/api/phone-numbers", { includeAssigned: true }],
    queryFn: () => fetch("/api/phone-numbers?includeAssigned=true").then((r) => r.json()),
  });

  const blastMutation = useMutation({
    mutationFn: async (data: { contacts: Contact[]; message: string; phoneNumberId: string }) => {
      const blastId = crypto.randomUUID();
      const res = await apiRequest("POST", "/api/sms-blast", { ...data, blastId });
      return res.json() as Promise<BlastResult>;
    },
    onSuccess: (data) => {
      isSendingRef.current = false;
      setResult(data);
      toast({
        title: "Blast Complete",
        description: `${data.sent} sent, ${data.failed} failed`,
        variant: data.failed > 0 ? "destructive" : "default",
      });
    },
    onError: (err: any) => {
      isSendingRef.current = false;
      toast({
        title: "Blast Failed",
        description: err.message || "Failed to send SMS blast",
        variant: "destructive",
      });
    },
  });

  const downloadTemplate = () => {
    const csvContent = "phone_number,name\n+12025551234,John Doe\n+12025555678,Jane Smith\n+923001234567,Ahmed Khan";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sms_blast_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): Contact[] => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes("phone") ||
      firstLine.includes("number") ||
      firstLine.includes("mobile");

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const headerCols = hasHeader ? firstLine.split(",").map((h) => h.trim()) : [];
    const phoneIdx = headerCols.findIndex((h) => h.includes("phone") || h.includes("number") || h.includes("mobile"));
    const nameIdx = headerCols.findIndex((h) => h.includes("name"));

    return dataLines
      .map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const phone = cols[phoneIdx >= 0 ? phoneIdx : 0] || "";
        const name = cols[nameIdx >= 0 ? nameIdx : 1] || "";
        return { phone, name };
      })
      .filter((c) => c.phone && c.phone.replace(/\D/g, "").length >= 7);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResult(null);

    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast({
          title: "No contacts found",
          description: "Make sure the file has a phone_number column",
          variant: "destructive",
        });
        return;
      }
      setContacts(parsed);
      toast({
        title: `${parsed.length} contacts loaded`,
        description: "Ready to send",
      });
    } catch {
      toast({ title: "Failed to read file", variant: "destructive" });
    }

    e.target.value = "";
  };

  const handleSend = () => {
    if (!fromNumberId || contacts.length === 0 || !message.trim()) return;
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    setResult(null);
    blastMutation.mutate({ contacts, message: message.trim(), phoneNumberId: fromNumberId });
  };

  const clearContacts = () => {
    setContacts([]);
    setFileName("");
    setResult(null);
  };

  const charCount = message.length;
  const smsCount = Math.ceil(charCount / 160) || 1;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SMS Blasting</h1>
        <p className="text-muted-foreground mt-1">
          Upload a contact list and send a single message to everyone at once.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Step 1 – Phone Number */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
              Select Sender Number
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={fromNumberId} onValueChange={setFromNumberId}>
              <SelectTrigger data-testid="select-from-number">
                <SelectValue placeholder="Choose a phone number to send from…" />
              </SelectTrigger>
              <SelectContent>
                {phoneNumbers.map((ph) => (
                  <SelectItem key={ph.id} value={ph.id} data-testid={`option-number-${ph.id}`}>
                    {ph.adminId ? `${ph.id} (${ph.number})` : ph.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Step 2 – Upload contacts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
              Upload Contact List
            </CardTitle>
            <CardDescription>
              Download the template, fill in your contacts, then upload it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" size="sm" onClick={downloadTemplate} data-testid="button-download-template">
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>

            <Separator />

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
                data-testid="input-file-upload"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload-file"
              >
                <Upload className="h-4 w-4 mr-2" />
                {fileName ? "Change File" : "Upload CSV File"}
              </Button>
              {fileName && (
                <div className="flex items-center gap-2 flex-1">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{fileName}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-auto flex-shrink-0"
                    onClick={clearContacts}
                    data-testid="button-clear-contacts"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              )}
            </div>

            {contacts.length > 0 && (
              <div className="rounded-lg border bg-muted/40 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/60">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{contacts.length} contacts loaded</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">#</th>
                        <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Phone</th>
                        <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.slice(0, 100).map((c, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-1.5 font-mono text-xs">{c.phone}</td>
                          <td className="px-3 py-1.5">{c.name || <span className="text-muted-foreground/50">—</span>}</td>
                        </tr>
                      ))}
                      {contacts.length > 100 && (
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-xs text-muted-foreground text-center">
                            +{contacts.length - 100} more contacts
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3 – Message */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
              Write Your Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              placeholder="Type your SMS message here…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
              data-testid="textarea-blast-message"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{charCount} characters</span>
              <span>{smsCount} SMS {smsCount > 1 ? "parts" : "part"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Send */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {contacts.length > 0 ? (
                  <>Sending to <span className="font-medium text-foreground">{contacts.length}</span> contacts</>
                ) : (
                  "Upload contacts to get started"
                )}
              </div>
              <Button
                onClick={handleSend}
                disabled={
                  !fromNumberId ||
                  contacts.length === 0 ||
                  !message.trim() ||
                  blastMutation.isPending
                }
                className="min-w-32"
                data-testid="button-send-blast"
              >
                {blastMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Blast
                  </>
                )}
              </Button>
            </div>

            {blastMutation.isPending && (
              <Progress className="mt-4 h-1.5" value={undefined} />
            )}
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className="border-0 shadow-none bg-muted/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Blast Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span><strong>{result.sent}</strong> sent</span>
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span><strong>{result.failed}</strong> failed</span>
                  </div>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-xs flex gap-2 text-destructive">
                      <span className="font-mono">{e.phone}</span>
                      <span className="text-muted-foreground">— {e.error}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

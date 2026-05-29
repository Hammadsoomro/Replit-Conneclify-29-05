import { useQuery, useMutation } from "@tanstack/react-query";
import type { PhoneNumber, SmsGateway } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Phone, MoreVertical, Plus, MessageSquare, Voicemail, Smartphone, RefreshCw, AlertTriangle, Settings } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GatewayResponse {
  id: string;
  name: string;
  provider: "twilio" | "signalwire" | "telnyx";
  isActive: boolean;
  hasCredentials: boolean;
}

function CapabilityBadge({ capability }: { capability: string }) {
  const icons: Record<string, React.ElementType> = {
    sms: MessageSquare,
    voice: Phone,
    mms: Smartphone,
    fax: Voicemail,
  };
  const Icon = icons[capability.toLowerCase()] || Phone;

  return (
    <Badge variant="secondary" className="gap-1">
      <Icon className="h-3 w-3" />
      {capability.toUpperCase()}
    </Badge>
  );
}

function normalizeCapabilities(capabilities?: string | string[] | null) {
  if (!capabilities) {
    return [];
  }
  if (Array.isArray(capabilities)) {
    return capabilities;
  }
  return capabilities
    .split(",")
    .map((cap) => cap.trim())
    .filter(Boolean);
}

export default function BoughtNumbersPage() {
  const { toast } = useToast();
  const { data: phoneNumbers = [], isLoading } = useQuery<PhoneNumber[]>({
    queryKey: ["/api/phone-numbers", { includeAssigned: true }],
    queryFn: async () => {
      const res = await fetch("/api/phone-numbers?includeAssigned=true");
      if (!res.ok) throw new Error("Failed to fetch phone numbers");
      return res.json();
    },
  });
  
  const { data: gateways = [] } = useQuery<GatewayResponse[]>({
    queryKey: ["/api/integrations/gateways"],
  });
  
  const activeGateway = gateways.find(g => g.isActive);
  const providerName = activeGateway?.provider 
    ? activeGateway.provider.charAt(0).toUpperCase() + activeGateway.provider.slice(1)
    : "Provider";

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/phone-numbers/sync");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers", { includeAssigned: true }] });
      toast({
        title: "Sync Complete",
        description: data.message || `Synced ${data.synced} numbers`,
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      const isAuthError = message.toLowerCase().includes("authentication") || 
                          message.toLowerCase().includes("unauthorized") ||
                          message.toLowerCase().includes("invalid");
      toast({
        title: "Sync Failed",
        description: isAuthError 
          ? "Authentication failed. Please check your gateway credentials in Settings > Integrations."
          : "Could not sync numbers from provider. Make sure you have a gateway connected.",
        variant: "destructive",
      });
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: async ({ id, friendlyName }: { id: string; friendlyName: string }) => {
      return apiRequest("PATCH", `/api/phone-numbers/${id}`, { friendlyName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers", { includeAssigned: true }] });
      toast({
        title: "Name Updated",
        description: "Phone number name has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update name",
        variant: "destructive",
      });
    },
  });

  const handleEditName = (phone: PhoneNumber) => {
    const newName = prompt("Enter new name for this phone number:", phone.friendlyName || "");
    if (newName !== null && newName.trim() !== "") {
      updateNameMutation.mutate({ id: phone.id, friendlyName: newName.trim() });
    } else if (newName !== null && newName.trim() === "") {
      toast({
        title: "Invalid Name",
        description: "Please enter a valid name for the phone number.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (phone: PhoneNumber) => {
    const capabilities = normalizeCapabilities(phone.capabilities);
    toast({
      title: phone.number,
      description: `Provider ID: ${phone.providerId || "N/A"}\nCapabilities: ${capabilities.length ? capabilities.join(", ") : "SMS"}`,
    });
  };

  const handleReleaseNumber = (phone: PhoneNumber) => {
    toast({
      title: "Release Number",
      description: "Number release must be done through your SMS provider's dashboard. This ensures proper billing and compliance.",
    });
  };

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return number;
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bought Numbers</h1>
          <p className="text-muted-foreground">
            Manage your purchased phone numbers and their capabilities
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || !activeGateway}
            data-testid="button-sync-numbers"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? "Syncing..." : `Sync from ${providerName}`}
          </Button>
          <Button asChild data-testid="button-buy-number">
            <Link href="/buy-numbers">
              <Plus className="mr-2 h-4 w-4" />
              Buy New Number
            </Link>
          </Button>
        </div>
      </div>

      {!activeGateway && (
        <Alert variant="destructive" data-testid="alert-no-gateway">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No SMS Gateway Connected</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Connect an SMS provider to sync and manage your phone numbers.</span>
            <Button variant="outline" size="sm" asChild className="ml-4">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Connect Gateway
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {activeGateway && (
      <Card>
        <CardHeader>
          <CardTitle>Your Phone Numbers</CardTitle>
          <CardDescription>
            {activeGateway 
              ? `${phoneNumbers.length} phone number${phoneNumbers.length !== 1 ? "s" : ""} synced from ${providerName}`
              : "Connect a gateway to manage your numbers"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {phoneNumbers.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">No phone numbers yet</p>
              <p className="text-muted-foreground mb-4">
                Purchase your first phone number to start messaging
              </p>
              <Button asChild>
                <Link href="/buy-numbers" data-testid="link-buy-numbers-empty">
                  <Plus className="mr-2 h-4 w-4" />
                  Buy Your First Number
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Friendly Name</TableHead>
                  <TableHead>Capabilities</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Purchased</TableHead>
                  <TableHead>Monthly Rate</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phoneNumbers.map((phone) => (
                  <TableRow key={phone.id} data-testid={`phone-number-${phone.id}`}>
                    <TableCell className="font-medium font-mono">
                      {formatPhoneNumber(phone.number)}
                    </TableCell>
                    <TableCell>{phone.friendlyName || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {normalizeCapabilities(phone.capabilities).map((cap) => (
                          <CapabilityBadge key={cap} capability={cap} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={phone.isActive ? "default" : "secondary"}>
                        {phone.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(phone.purchasedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{phone.monthlyRate || "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`menu-phone-${phone.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleEditName(phone)}
                            data-testid={`edit-name-${phone.id}`}
                          >
                            Edit Name
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleViewDetails(phone)}
                            data-testid={`view-details-${phone.id}`}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleReleaseNumber(phone)}
                            data-testid={`release-number-${phone.id}`}
                          >
                            Release Number
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}

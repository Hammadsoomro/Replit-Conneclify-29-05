import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";
import {
  Phone,
  Search,
  MessageSquare,
  Smartphone,
  Loader2,
  ShoppingCart,
  MapPin,
  AlertTriangle,
  Settings,
} from "lucide-react";

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
  { code: "DC", name: "District of Columbia" },
];

const CA_PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "YT", name: "Yukon" },
];

const AU_STATES = [
  { code: "NSW", name: "New South Wales" },
  { code: "VIC", name: "Victoria" },
  { code: "QLD", name: "Queensland" },
  { code: "WA", name: "Western Australia" },
  { code: "SA", name: "South Australia" },
  { code: "TAS", name: "Tasmania" },
  { code: "ACT", name: "Australian Capital Territory" },
  { code: "NT", name: "Northern Territory" },
];

const GB_REGIONS = [
  { code: "ENG", name: "England" },
  { code: "SCT", name: "Scotland" },
  { code: "WLS", name: "Wales" },
  { code: "NIR", name: "Northern Ireland" },
];

const DE_STATES = [
  { code: "BB", name: "Brandenburg" },
  { code: "BE", name: "Berlin" },
  { code: "BW", name: "Baden-Württemberg" },
  { code: "BY", name: "Bavaria" },
  { code: "HB", name: "Bremen" },
  { code: "HE", name: "Hesse" },
  { code: "HH", name: "Hamburg" },
  { code: "MV", name: "Mecklenburg-Vorpommern" },
  { code: "NI", name: "Lower Saxony" },
  { code: "NW", name: "North Rhine-Westphalia" },
  { code: "RP", name: "Rhineland-Palatinate" },
  { code: "SH", name: "Schleswig-Holstein" },
  { code: "SL", name: "Saarland" },
  { code: "SN", name: "Saxony" },
  { code: "ST", name: "Saxony-Anhalt" },
  { code: "TH", name: "Thuringia" },
];

const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
];

const REGIONS_BY_COUNTRY: Record<string, { code: string; name: string }[]> = {
  US: US_STATES,
  CA: CA_PROVINCES,
  AU: AU_STATES,
  GB: GB_REGIONS,
  DE: DE_STATES,
};

interface AvailableNumber {
  number: string;
  friendlyName: string;
  region: string;
  city: string;
  capabilities: string[];
  monthlyRate: string;
}

function CapabilityBadge({ capability }: { capability: string }) {
  const icons: Record<string, React.ElementType> = {
    sms: MessageSquare,
    voice: Phone,
    mms: Smartphone,
  };
  const Icon = icons[capability.toLowerCase()] || Phone;

  return (
    <Badge variant="secondary" className="gap-1">
      <Icon className="h-3 w-3" />
      {capability.toUpperCase()}
    </Badge>
  );
}

interface GatewayResponse {
  id: string;
  name: string;
  provider: "twilio" | "signalwire" | "telnyx";
  isActive: boolean;
  hasCredentials: boolean;
}

export default function BuyNumbersPage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState({
    areaCode: "",
    country: "US",
    region: "any",
  });
  const [hasSearched, setHasSearched] = useState(false);

  const regions = REGIONS_BY_COUNTRY[searchParams.country] || [];

  const { data: gateways = [] } = useQuery<GatewayResponse[]>({
    queryKey: ["/api/integrations/gateways"],
  });
  
  const activeGateway = gateways.find(g => g.isActive);

  const {
    data: availableNumbers = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery<AvailableNumber[]>({
    queryKey: ["/api/phone-numbers/available", searchParams.areaCode, searchParams.country, searchParams.region],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchParams.areaCode) params.append("areaCode", searchParams.areaCode);
      if (searchParams.country) params.append("country", searchParams.country);
      if (searchParams.region && searchParams.region !== "any") {
        params.append("region", searchParams.region);
      }
      const url = `/api/phone-numbers/available?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch available numbers");
      }
      return res.json();
    },
    enabled: hasSearched,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (number: string) => {
      return apiRequest("POST", "/api/phone-numbers/purchase", { number });
    },
    onSuccess: () => {
      toast({
        title: "Number purchased!",
        description: "The phone number has been added to your account.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers"] });
    },
    onError: (error) => {
      toast({
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "Could not purchase the number",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    setHasSearched(true);
    refetch();
  };

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return number;
  };

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buy Numbers</h1>
        <p className="text-muted-foreground">
          Search and purchase new phone numbers for your messaging platform
        </p>
      </div>

      {!activeGateway && (
        <Alert variant="destructive" data-testid="alert-no-gateway">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No SMS Gateway Connected</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Connect an SMS provider before you can search and buy phone numbers.</span>
            <Button variant="outline" size="sm" asChild className="ml-4">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Connect Gateway
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Search Available Numbers</CardTitle>
          <CardDescription>
            {activeGateway 
              ? "Find phone numbers by country and region"
              : "Connect a gateway to search for numbers"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={searchParams.country}
                onValueChange={(value) =>
                  setSearchParams((prev) => ({ ...prev, country: value, region: "any" }))
                }
              >
                <SelectTrigger className="w-52" data-testid="select-country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select
                value={searchParams.region}
                onValueChange={(value) =>
                  setSearchParams((prev) => ({ ...prev, region: value }))
                }
              >
                <SelectTrigger className="w-48" data-testid="select-region">
                  <SelectValue placeholder="Any region" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="any">Any</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.code} value={region.code}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="areaCode">Area Code (Optional)</Label>
              <Input
                id="areaCode"
                placeholder="e.g., 415"
                value={searchParams.areaCode}
                onChange={(e) =>
                  setSearchParams((prev) => ({ ...prev, areaCode: e.target.value }))
                }
                className="w-32"
                data-testid="input-area-code"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={isFetching || !activeGateway} data-testid="button-search">
                {isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Numbers</CardTitle>
          <CardDescription>
            {hasSearched
              ? `${availableNumbers.length} numbers found`
              : "Search to find available numbers"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasSearched ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">Search for numbers</p>
              <p className="text-muted-foreground">
                Use the search form above to find available phone numbers
              </p>
            </div>
          ) : isFetching ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-4 w-24" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-9 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : availableNumbers.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">No numbers found</p>
              <p className="text-muted-foreground">
                Try a different area code or region
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableNumbers.map((number) => (
                <Card key={number.number} className="hover-elevate" data-testid={`number-card-${number.number}`}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div>
                        <p className="font-mono text-lg font-semibold">
                          {formatPhoneNumber(number.number)}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {number.city}, {number.region}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {number.capabilities.map((cap) => (
                          <CapabilityBadge key={cap} capability={cap} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm font-medium">
                          {number.monthlyRate}/mo
                        </span>
                        <Button
                          size="sm"
                          onClick={() => purchaseMutation.mutate(number.number)}
                          disabled={purchaseMutation.isPending}
                          data-testid={`button-buy-${number.number}`}
                        >
                          {purchaseMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ShoppingCart className="mr-2 h-4 w-4" />
                          )}
                          Buy
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

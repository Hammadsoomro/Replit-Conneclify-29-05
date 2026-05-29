export interface SmsProviderConfig {
  provider: "twilio" | "signalwire" | "telnyx";
  credentials: Record<string, string>;
  gatewayId: string;
  adminId: string;
}

export interface AvailableNumber {
  number: string;
  friendlyName?: string;
  region?: string;
  city?: string;
  locality?: string;
  capabilities?: string[];
  monthlyRate?: string;
}

export interface OwnedNumber {
  id: string;
  number: string;
  friendlyName?: string;
  capabilities?: string[];
}

export interface PurchasedNumber {
  id: string;
  number: string;
  friendlyName?: string;
}

export interface SendSmsParams {
  to: string;
  from: string;
  body: string;
  statusCallback?: string;
  mediaUrl?: string;
}

export interface SmsResult {
  id: string;
  status: string;
  to: string;
  from: string;
  body: string;
}

export interface SearchNumbersParams {
  areaCode?: string;
  country?: string;
  region?: string;
}

export interface ISmsProvider {
  isConfigured(): boolean;
  testConnection(): Promise<{ success: boolean; error?: string }>;
  getAvailableNumbers(params?: SearchNumbersParams): Promise<AvailableNumber[]>;
  getOwnedNumbers(): Promise<OwnedNumber[]>;
  purchaseNumber(number: string): Promise<PurchasedNumber>;
  sendSms(params: SendSmsParams): Promise<SmsResult>;
}

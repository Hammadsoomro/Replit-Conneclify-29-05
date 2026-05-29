import type { ISmsProvider, SmsProviderConfig } from "./types";
import { TwilioProvider } from "./twilio-provider";
import { SignalWireProvider } from "./signalwire-provider";
import { TelnyxProvider } from "./telnyx-provider";
import type { SmsGateway } from "@shared/schema";

export type { ISmsProvider, SmsProviderConfig, AvailableNumber, OwnedNumber, PurchasedNumber, SendSmsParams, SmsResult, SearchNumbersParams } from "./types";

export function createSmsProvider(gateway: SmsGateway): ISmsProvider {
  let credentials: Record<string, string>;
  
  try {
    if (typeof gateway.credentials === "string") {
      if (!gateway.credentials || gateway.credentials.trim() === "") {
        throw new Error("Empty credentials");
      }
      credentials = JSON.parse(gateway.credentials);
    } else if (gateway.credentials && typeof gateway.credentials === "object") {
      credentials = gateway.credentials as Record<string, string>;
    } else {
      throw new Error("Invalid credentials format");
    }
  } catch (parseError: any) {
    console.error(`Failed to parse credentials for gateway ${gateway.id}:`, parseError.message);
    throw new Error(`Invalid gateway credentials: ${parseError.message}`);
  }
    
  const config: SmsProviderConfig = {
    provider: gateway.provider,
    credentials: credentials,
    gatewayId: gateway.id,
    adminId: gateway.adminId,
  };

  switch (gateway.provider) {
    case "twilio":
      return new TwilioProvider(config);
    case "signalwire":
      return new SignalWireProvider(config);
    case "telnyx":
      return new TelnyxProvider(config);
    default:
      throw new Error(`Unknown SMS provider: ${gateway.provider}`);
  }
}

export class NoGatewayProvider implements ISmsProvider {
  isConfigured(): boolean {
    return false;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: "No SMS gateway configured" };
  }

  async getAvailableNumbers(_params?: any): Promise<never[]> {
    throw new Error("No SMS gateway configured. Please connect a gateway in Settings > Integrations.");
  }

  async getOwnedNumbers(): Promise<never[]> {
    throw new Error("No SMS gateway configured. Please connect a gateway in Settings > Integrations.");
  }

  async purchaseNumber(): Promise<never> {
    throw new Error("No SMS gateway configured. Please connect a gateway in Settings > Integrations.");
  }

  async sendSms(): Promise<never> {
    throw new Error("No SMS gateway configured. Please connect a gateway in Settings > Integrations.");
  }
}

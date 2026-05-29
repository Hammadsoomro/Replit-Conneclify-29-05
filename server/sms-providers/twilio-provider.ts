import type { ISmsProvider, SmsProviderConfig, AvailableNumber, OwnedNumber, PurchasedNumber, SendSmsParams, SmsResult, SearchNumbersParams } from "./types";

export class TwilioProvider implements ISmsProvider {
  private accountSid: string;
  private authToken: string;
  private baseUrl: string;

  constructor(config: SmsProviderConfig) {
    const { accountSid, authToken } = config.credentials;
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`;
  }

  isConfigured(): boolean {
    return !!(this.accountSid && this.authToken);
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: "Missing required credentials" };
    }

    const url = `${this.baseUrl}/IncomingPhoneNumbers.json?PageSize=1`;
    console.log(`Testing Twilio connection to: ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          if (errorText) errorMessage = errorText.substring(0, 200);
        }
        console.error(`Twilio test failed: ${errorMessage}`);
        return { 
          success: false, 
          error: `Authentication failed: ${errorMessage}` 
        };
      }

      console.log("Twilio connection test successful");
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.name === 'AbortError' 
        ? "Connection timeout - please try again" 
        : (err.message || "Connection failed");
      console.error(`Twilio connection error: ${errorMsg}`, err);
      return { success: false, error: errorMsg };
    }
  }

  private getAuthHeader(): string {
    return "Basic " + Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
  }

  async getAvailableNumbers(searchParams?: SearchNumbersParams): Promise<AvailableNumber[]> {
    if (!this.isConfigured()) {
      throw new Error("Twilio is not configured");
    }

    const params = new URLSearchParams({
      SmsEnabled: "true",
      PageSize: "50",
    });
    if (searchParams?.areaCode) {
      params.append("AreaCode", searchParams.areaCode);
    }
    if (searchParams?.region) {
      params.append("InRegion", searchParams.region);
    }

    const country = searchParams?.country || "US";
    const response = await fetch(
      `${this.baseUrl}/AvailablePhoneNumbers/${country}/Local.json?${params}`,
      {
        headers: {
          Authorization: this.getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch available numbers");
    }

    const data = await response.json();
    return (data.available_phone_numbers || []).map((num: any) => {
      // Parse capabilities from Twilio API response {voice: true, sms: true, mms: true}
      const caps: string[] = [];
      if (num.capabilities?.voice) caps.push("voice");
      if (num.capabilities?.sms) caps.push("sms");
      if (num.capabilities?.mms) caps.push("mms");
      
      return {
        number: num.phone_number,
        friendlyName: num.friendly_name,
        region: num.region,
        city: num.locality || "",
        capabilities: caps.length > 0 ? caps : ["sms", "voice"],
        monthlyRate: "$1.50",
      };
    });
  }

  async getOwnedNumbers(): Promise<OwnedNumber[]> {
    if (!this.isConfigured()) {
      throw new Error("Twilio is not configured");
    }

    const response = await fetch(
      `${this.baseUrl}/IncomingPhoneNumbers.json`,
      {
        headers: {
          Authorization: this.getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch owned numbers");
    }

    const data = await response.json();
    return (data.incoming_phone_numbers || []).map((num: any) => ({
      id: num.sid,
      number: num.phone_number,
      friendlyName: num.friendly_name,
      capabilities: num.capabilities?.sms ? ["sms", "voice"] : ["voice"],
    }));
  }

  async purchaseNumber(number: string): Promise<PurchasedNumber> {
    if (!this.isConfigured()) {
      throw new Error("Twilio is not configured");
    }

    const response = await fetch(
      `${this.baseUrl}/IncomingPhoneNumbers.json`,
      {
        method: "POST",
        headers: {
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          PhoneNumber: number,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to purchase number");
    }

    const data = await response.json();
    return {
      id: data.sid,
      number: data.phone_number,
      friendlyName: data.friendly_name,
    };
  }

  async sendSms(params: SendSmsParams): Promise<SmsResult> {
    if (!this.isConfigured()) {
      throw new Error("Twilio is not configured");
    }

    const bodyParams: Record<string, string> = {
      To: params.to,
      From: params.from,
      Body: params.body,
    };

    if (params.statusCallback) {
      bodyParams.StatusCallback = params.statusCallback;
    }

    if (params.mediaUrl) {
      bodyParams.MediaUrl = params.mediaUrl;
    }

    const response = await fetch(
      `${this.baseUrl}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(bodyParams),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send SMS");
    }

    const data = await response.json();
    return {
      id: data.sid,
      status: data.status,
      to: data.to,
      from: data.from,
      body: data.body,
    };
  }
}

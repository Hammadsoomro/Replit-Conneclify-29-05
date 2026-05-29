import type { ISmsProvider, SmsProviderConfig, AvailableNumber, OwnedNumber, PurchasedNumber, SendSmsParams, SmsResult, SearchNumbersParams } from "./types";

export class SignalWireProvider implements ISmsProvider {
  private projectId: string;
  private token: string;
  private spaceUrl: string;

  constructor(config: SmsProviderConfig) {
    const { projectId, token, spaceUrl } = config.credentials;
    this.projectId = projectId;
    this.token = token;
    this.spaceUrl = spaceUrl?.replace(/^https?:\/\//, "") || "";
  }

  isConfigured(): boolean {
    return !!(this.projectId && this.token && this.spaceUrl);
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: "Missing required credentials" };
    }

    const url = `${this.baseUrl}/IncomingPhoneNumbers.json?PageSize=1`;
    console.log(`Testing SignalWire connection to: ${url}`);
    console.log(`Project ID: ${this.projectId.substring(0, 8)}...`);
    console.log(`Space URL: ${this.spaceUrl}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
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
        console.error(`SignalWire test failed: ${errorMessage}`);
        return { 
          success: false, 
          error: `Authentication failed: ${errorMessage}` 
        };
      }

      console.log("SignalWire connection test successful");
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.name === 'AbortError' 
        ? "Connection timeout - please check your Space URL" 
        : (err.message || "Connection failed");
      console.error(`SignalWire connection error: ${errorMsg}`, err);
      return { success: false, error: errorMsg };
    }
  }

  private getAuthHeader(): string {
    return "Basic " + Buffer.from(`${this.projectId}:${this.token}`).toString("base64");
  }

  private get baseUrl(): string {
    return `https://${this.spaceUrl}/api/laml/2010-04-01/Accounts/${this.projectId}`;
  }

  async getAvailableNumbers(searchParams?: SearchNumbersParams): Promise<AvailableNumber[]> {
    if (!this.isConfigured()) {
      throw new Error("SignalWire is not configured");
    }

    const params = new URLSearchParams({
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
      `${this.baseUrl}/AvailablePhoneNumbers/${country}/Local?${params}`,
      {
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch available numbers");
    }

    const data = await response.json();
    return (data.available_phone_numbers || []).map((num: any) => {
      // Parse capabilities from API response object {voice: true, SMS: true, MMS: true}
      const caps: string[] = [];
      if (num.capabilities?.voice) caps.push("voice");
      if (num.capabilities?.SMS) caps.push("sms");
      if (num.capabilities?.MMS) caps.push("mms");
      
      return {
        number: num.phone_number,
        friendlyName: num.friendly_name,
        region: num.region,
        city: num.rate_center || num.locality || "",
        capabilities: caps.length > 0 ? caps : ["sms", "voice"],
        monthlyRate: "$1.15",
      };
    });
  }

  async getOwnedNumbers(): Promise<OwnedNumber[]> {
    if (!this.isConfigured()) {
      throw new Error("SignalWire is not configured");
    }

    const response = await fetch(
      `${this.baseUrl}/IncomingPhoneNumbers`,
      {
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
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
      capabilities: ["sms", "voice"],
    }));
  }

  async purchaseNumber(number: string): Promise<PurchasedNumber> {
    if (!this.isConfigured()) {
      throw new Error("SignalWire is not configured");
    }

    const response = await fetch(
      `${this.baseUrl}/IncomingPhoneNumbers`,
      {
        method: "POST",
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
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
      throw new Error("SignalWire is not configured");
    }

    const bodyParams: Record<string, string> = {
      To: params.to,
      From: params.from,
      Body: params.body,
    };

    // Add status callback URL if provided
    if (params.statusCallback) {
      bodyParams.StatusCallback = params.statusCallback;
    }

    if (params.mediaUrl) {
      bodyParams.MediaUrl = params.mediaUrl;
    }

    const response = await fetch(
      `${this.baseUrl}/Messages`,
      {
        method: "POST",
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
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

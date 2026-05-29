const SIGNALWIRE_PROJECT_ID = process.env.SIGNALWIRE_PROJECT_ID;
const SIGNALWIRE_TOKEN = process.env.SIGNALWIRE_TOKEN;
const SIGNALWIRE_SPACE_URL = process.env.SIGNALWIRE_SPACE_URL;

function getBaseUrl(): string {
  return `https://${SIGNALWIRE_SPACE_URL}/api/relay/rest`;
}

function getAuthHeader(): string {
  const credentials = Buffer.from(`${SIGNALWIRE_PROJECT_ID}:${SIGNALWIRE_TOKEN}`).toString("base64");
  return `Basic ${credentials}`;
}

export interface AvailableNumber {
  number: string;
  friendlyName: string;
  region: string;
  city: string;
  capabilities: string[];
  monthlyRate: string;
}

export interface SignalWireNumber {
  id: string;
  number: string;
  name: string;
  state: string;
  region: string;
}

export async function searchAvailableNumbers(areaCode?: string, country: string = "US"): Promise<AvailableNumber[]> {
  try {
    // Use the LaML API endpoint for searching available phone numbers
    const url = new URL(`https://${SIGNALWIRE_SPACE_URL}/api/laml/2010-04-01/Accounts/${SIGNALWIRE_PROJECT_ID}/AvailablePhoneNumbers/${country}/Local.json`);
    
    if (areaCode) {
      url.searchParams.set("AreaCode", areaCode);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SignalWire search error:", response.status, errorText);
      throw new Error(`SignalWire API error: ${response.status}`);
    }

    const data = await response.json();
    
    // LaML API returns available_phone_numbers array
    return (data.available_phone_numbers || []).map((num: any) => ({
      number: num.phone_number || num.friendly_name,
      friendlyName: num.friendly_name || num.phone_number,
      region: num.region || num.iso_region || "",
      city: num.locality || "",
      capabilities: [
        num.capabilities?.sms ? "sms" : null,
        num.capabilities?.voice ? "voice" : null,
        num.capabilities?.mms ? "mms" : null,
      ].filter(Boolean) as string[],
      monthlyRate: "$1.15",
    }));
  } catch (error) {
    console.error("Error searching SignalWire numbers:", error);
    throw error;
  }
}

export async function purchasePhoneNumber(phoneNumber: string): Promise<SignalWireNumber> {
  try {
    const response = await fetch(`https://${SIGNALWIRE_SPACE_URL}/api/relay/rest/phone_numbers`, {
      method: "POST",
      headers: {
        "Authorization": getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: phoneNumber,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SignalWire purchase error:", response.status, errorText);
      throw new Error(`Failed to purchase number: ${response.status}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      number: data.e164 || data.number,
      name: data.name || "Purchased Number",
      state: data.state || "active",
      region: data.region || "",
    };
  } catch (error) {
    console.error("Error purchasing SignalWire number:", error);
    throw error;
  }
}

export async function getOwnedNumbers(): Promise<SignalWireNumber[]> {
  try {
    const response = await fetch(`https://${SIGNALWIRE_SPACE_URL}/api/relay/rest/phone_numbers`, {
      method: "GET",
      headers: {
        "Authorization": getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SignalWire owned numbers error:", response.status, errorText);
      throw new Error(`SignalWire API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.data || []).map((num: any) => ({
      id: num.id,
      number: num.e164 || num.number,
      name: num.name || "Phone Number",
      state: num.state || "active",
      region: num.region || "",
    }));
  } catch (error) {
    console.error("Error fetching owned numbers:", error);
    throw error;
  }
}

export async function sendSMS(from: string, to: string, body: string): Promise<{ messageId: string; status: string }> {
  try {
    const response = await fetch(`https://${SIGNALWIRE_SPACE_URL}/api/laml/2010-04-01/Accounts/${SIGNALWIRE_PROJECT_ID}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": getAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: from,
        To: to,
        Body: body,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SignalWire send SMS error:", response.status, errorText);
      throw new Error(`Failed to send SMS: ${response.status}`);
    }

    const data = await response.json();
    return {
      messageId: data.sid,
      status: data.status || "sent",
    };
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
}

export async function getMessageHistory(phoneNumber?: string): Promise<any[]> {
  try {
    const url = new URL(`https://${SIGNALWIRE_SPACE_URL}/api/laml/2010-04-01/Accounts/${SIGNALWIRE_PROJECT_ID}/Messages.json`);
    if (phoneNumber) {
      url.searchParams.set("From", phoneNumber);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SignalWire messages error:", response.status, errorText);
      return [];
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error("Error fetching message history:", error);
    return [];
  }
}

export function isConfigured(): boolean {
  return !!(SIGNALWIRE_PROJECT_ID && SIGNALWIRE_TOKEN && SIGNALWIRE_SPACE_URL);
}

export function getConfig(): { projectId?: string; spaceUrl?: string } {
  return {
    projectId: SIGNALWIRE_PROJECT_ID,
    spaceUrl: SIGNALWIRE_SPACE_URL,
  };
}

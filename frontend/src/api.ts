export const API_BASE_URL = "http://localhost:5000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
    },
    credentials: "include",
    ...options,
  });
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      errorMessage = data?.error || data?.message || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

export const api = {
  // Emails
  uploadEmailsCsv(formData: FormData) {
    return request<{ success: boolean; message: string; results: any }>(
      "/emails",
      { method: "POST", body: formData }
    );
  },
  uploadEmailsList(emails: string[]) {
    return request<{ success: boolean; message: string; results: any }>(
      "/emails",
      { method: "POST", body: JSON.stringify({ emails }) }
    );
  },
  getEmails() {
    return request<{ success: boolean; emails: any[] }>("/emails");
  },
  updateEmail(id: number, email: string) {
    return request<{ success: boolean; result: any }>(`/emails/${id}`, {
      method: "PUT",
      body: JSON.stringify({ email }),
    });
  },
  deleteEmail(id: number) {
    return request<{ success: boolean; result: any }>(`/emails/${id}`, {
      method: "DELETE",
    });
  },
  clearEmails() {
    return request<{ success: boolean; result: any }>(`/emails`, {
      method: "DELETE",
    });
  },

  // SMTP (backend supports latest only; frontend can manage multiple locally)
  getSmtpConfig() {
    return request<{ success: boolean; config?: any; message?: string }>(
      "/smtp"
    );
  },
  saveSmtpConfig(config: {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure?: boolean;
  }) {
    return request<{ success: boolean; message: string; config: any }>(
      "/smtp",
      { method: "POST", body: JSON.stringify(config) }
    );
  },

  // Settings
  getSettings() {
    return request<{ success: boolean; settings: { delay_ms: number; max_emails_per_day: number } }>(
      "/settings"
    );
  },
  saveSettings(settings: { delay_ms: number; max_emails_per_day: number }) {
    return request<{ success: boolean; message: string; settings: any }>(
      "/settings",
      { method: "POST", body: JSON.stringify(settings) }
    );
  },

  // Send
  sendNow(payload?: { subject?: string; htmlContent?: string }) {
    return request<{ success: boolean; message: string }>("/send", {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  },
  sendStatus() {
    return request<{ isCurrentlySending: boolean; progress: any }>(
      "/send/status"
    );
  },
  stopSending() {
    return request<{ success: boolean; message: string }>("/send/stop", {
      method: "POST",
    });
  },
  resetStatuses() {
    return request<{ success: boolean; message: string; resetCount: number }>(
      "/send/reset",
      { method: "POST" }
    );
  },
};



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

  // Email Lists
  getEmailLists() {
    return request<{ success: boolean; lists: any[] }>("/email-lists");
  },
  createEmailList(name: string) {
    return request<{ success: boolean; message: string; list: any }>(
      "/email-lists",
      { method: "POST", body: JSON.stringify({ name }) }
    );
  },
  updateEmailList(id: number, name: string) {
    return request<{ success: boolean; message: string }>(`/email-lists/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
  },
  deleteEmailList(id: number) {
    return request<{ success: boolean; message: string }>(`/email-lists/${id}`, {
      method: "DELETE",
    });
  },
  getEmailListItems(listId: number) {
    return request<{ success: boolean; emails: any[] }>(`/email-lists/${listId}/emails`);
  },
  addEmailsToList(listId: number, emails: string[]) {
    return request<{ success: boolean; message: string; results: any }>(
      `/email-lists/${listId}/emails`,
      { method: "POST", body: JSON.stringify({ emails }) }
    );
  },
  uploadEmailsToList(listId: number, formData: FormData) {
    return request<{ success: boolean; message: string; results: any }>(
      `/email-lists/${listId}/emails`,
      { method: "POST", body: formData }
    );
  },
  updateEmailInList(listId: number, emailId: number, email: string) {
    return request<{ success: boolean; message: string }>(
      `/email-lists/${listId}/emails/${emailId}`,
      { method: "PUT", body: JSON.stringify({ email }) }
    );
  },
  deleteEmailFromList(listId: number, emailId: number) {
    return request<{ success: boolean; message: string }>(
      `/email-lists/${listId}/emails/${emailId}`,
      { method: "DELETE" }
    );
  },

  // SMTP Profiles
  getSmtpProfiles() {
    return request<{ success: boolean; profiles: any[] }>("/smtp-profiles");
  },
  getSmtpProfile(id: number) {
    return request<{ success: boolean; profile: any }>(`/smtp-profiles/${id}`);
  },
  createSmtpProfile(profile: {
    name: string;
    host: string;
    port: number;
    username: string;
    password: string;
    encryption: string;
  }) {
    return request<{ success: boolean; message: string; profile: any }>(
      "/smtp-profiles",
      { method: "POST", body: JSON.stringify(profile) }
    );
  },
  updateSmtpProfile(id: number, profile: {
    name: string;
    host: string;
    port: number;
    username: string;
    password: string;
    encryption: string;
  }) {
    return request<{ success: boolean; message: string }>(`/smtp-profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify(profile),
    });
  },
  deleteSmtpProfile(id: number) {
    return request<{ success: boolean; message: string }>(`/smtp-profiles/${id}`, {
      method: "DELETE",
    });
  },
  testSmtpProfile(id: number) {
    return request<{ success: boolean; message: string }>(`/smtp-profiles/${id}/test`, {
      method: "POST",
    });
  },

  // Campaigns
  getCampaigns() {
    return request<{ success: boolean; campaigns: any[] }>("/campaigns");
  },
  getCampaign(id: number) {
    return request<{ success: boolean; campaign: any }>(`/campaigns/${id}`);
  },
  createCampaign(campaign: {
    name: string;
    subject: string;
    template: string;
    list_id: number;
    smtp_profile_id: number;
  }) {
    return request<{ success: boolean; message: string; campaign: any }>(
      "/campaigns",
      { method: "POST", body: JSON.stringify(campaign) }
    );
  },
  updateCampaign(id: number, campaign: {
    name: string;
    subject: string;
    template: string;
    list_id: number;
    smtp_profile_id: number;
    status?: string;
  }) {
    return request<{ success: boolean; message: string }>(`/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify(campaign),
    });
  },
  deleteCampaign(id: number) {
    return request<{ success: boolean; message: string }>(`/campaigns/${id}`, {
      method: "DELETE",
    });
  },
  startCampaign(id: number) {
    return request<{ success: boolean; message: string }>(`/campaigns/${id}/start`, {
      method: "POST",
    });
  },
  getCampaignEmails(id: number) {
    return request<{ success: boolean; emails: any[] }>(`/campaigns/${id}/emails`);
  },
  getCampaignStats(id: number) {
    return request<{ success: boolean; stats: any }>(`/campaigns/${id}/stats`);
  },
  getCampaignDebug(id: number) {
    return request<{ success: boolean; debug: any }>(`/campaigns/${id}/debug`);
  },
};



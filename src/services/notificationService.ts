
/**
 * Tailoring Empire ERP - Notification Service
 * Handles delivery to WhatsApp, Email, and SMS (Mock Implementation)
 */

export interface NotificationPayload {
  to: string;
  subject?: string;
  body: string;
  channel: 'whatsapp' | 'email' | 'sms';
}

export const notificationService = {
  async send(payload: NotificationPayload) {
    console.log(`[Notification Service] Dispatching to ${payload.channel}:`, payload);
    
    // In a real production app, you would call your backend API or provider SDK here
    // Example: 
    // await fetch('/api/notifications/send', { method: 'POST', body: JSON.stringify(payload) });
    
    // For now, simulate network delay
    return new Promise((resolve) => setTimeout(resolve, 800));
  },

  async sendWhatsApp(phone: string, message: string) {
    return this.send({ to: phone, body: message, channel: 'whatsapp' });
  },

  async sendEmail(email: string, subject: string, message: string) {
    return this.send({ to: email, subject, body: message, channel: 'email' });
  }
};

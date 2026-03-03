/**
 * Phase 1.1.7: Supplier Invitation Email Templates (CAP-INV)
 *
 * Email templates for magic link invitations sent to new suppliers.
 * Worker consumes these via SUPPLIER_INVITED outbox events.
 */

export interface InvitationEmailData {
  readonly supplierName: string;
  readonly email: string;
  readonly invitationMessage: string | null;
  readonly magicLink: string;
  readonly expiresAt: Date;
  readonly buyerCompanyName: string;
  readonly buyerContactEmail: string;
}

/**
 * Generate HTML email for supplier invitation.
 *
 * @param data Invitation email data
 * @returns HTML email content
 */
export function generateInvitationEmailHtml(data: InvitationEmailData): string {
  const expiryDays = Math.ceil((data.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Supplier Portal Invitation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #e5e5e5;
    }
    .header h1 {
      color: #1a1a1a;
      font-size: 24px;
      margin: 0 0 8px 0;
    }
    .content {
      margin-bottom: 32px;
    }
    .content p {
      margin: 16px 0;
      line-height: 1.7;
    }
    .cta-button {
      display: inline-block;
      background-color: #0052cc;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      text-align: center;
      margin: 24px 0;
    }
    .cta-button:hover {
      background-color: #0042a3;
    }
    .cta-container {
      text-align: center;
    }
    .message-box {
      background-color: #f8f9fa;
      border-left: 4px solid #0052cc;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .message-box p {
      margin: 0;
      font-style: italic;
      color: #555;
    }
    .expiry-notice {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px 16px;
      margin: 24px 0;
      border-radius: 4px;
      font-size: 14px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e5e5;
      font-size: 14px;
      color: #666;
      text-align: center;
    }
    .footer a {
      color: #0052cc;
      text-decoration: none;
    }
    .security-note {
      background-color: #f0f4ff;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
      font-size: 13px;
      line-height: 1.5;
    }
    .security-note strong {
      color: #0052cc;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Welcome to ${escapeHtml(data.buyerCompanyName)} Supplier Portal</h1>
      <p style="color: #666; margin: 0;">You've been invited to join our supplier network</p>
    </div>

    <div class="content">
      <p>Hello <strong>${escapeHtml(data.supplierName)}</strong>,</p>

      <p>${escapeHtml(data.buyerCompanyName)} has invited you to join their Supplier Portal. This secure platform enables seamless collaboration including:</p>

      <ul style="line-height: 1.8; color: #555;">
        <li>Submit invoices electronically</li>
        <li>Track payment status in real-time</li>
        <li>Manage compliance documents</li>
        <li>Communicate directly with AP team</li>
        <li>View aging reports and statements</li>
      </ul>

      ${
        data.invitationMessage
          ? `<div class="message-box">
        <p><strong>Message from ${escapeHtml(data.buyerCompanyName)}:</strong></p>
        <p>${escapeHtml(data.invitationMessage)}</p>
      </div>`
          : ''
      }

      <div class="expiry-notice">
        ⏱️ This invitation expires in <strong>${expiryDays} days</strong> (${data.expiresAt.toLocaleDateString(
          'en-US',
          {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }
        )})
      </div>

      <div class="cta-container">
        <a href="${escapeHtml(data.magicLink)}" class="cta-button">
          Accept Invitation &amp; Get Started
        </a>
      </div>

      <p style="font-size: 14px; color: #666; text-align: center;">
        Or copy and paste this link into your browser:<br>
        <span style="font-family: monospace; color: #0052cc; word-break: break-all;">${escapeHtml(data.magicLink)}</span>
      </p>

      <div class="security-note">
        <strong>🔒 Security Notice:</strong> This is a secure, one-time link that will create your supplier account. 
        Do not share this link with anyone. If you did not expect this invitation or have concerns, 
        please contact <a href="mailto:${escapeHtml(data.buyerContactEmail)}">${escapeHtml(data.buyerContactEmail)}</a>.
      </div>
    </div>

    <div class="footer">
      <p>Need help? Contact us at <a href="mailto:${escapeHtml(data.buyerContactEmail)}">${escapeHtml(data.buyerContactEmail)}</a></p>
      <p style="color: #999; font-size: 12px; margin-top: 16px;">
        © ${new Date().getFullYear()} ${escapeHtml(data.buyerCompanyName)}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate plain text email for supplier invitation (fallback).
 *
 * @param data Invitation email data
 * @returns Plain text email content
 */
export function generateInvitationEmailText(data: InvitationEmailData): string {
  const expiryDays = Math.ceil((data.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return `
WELCOME TO ${data.buyerCompanyName.toUpperCase()} SUPPLIER PORTAL
${'='.repeat(60)}

Hello ${data.supplierName},

${data.buyerCompanyName} has invited you to join their Supplier Portal.

This secure platform enables seamless collaboration including:

• Submit invoices electronically
• Track payment status in real-time
• Manage compliance documents
• Communicate directly with AP team
• View aging reports and statements

${
  data.invitationMessage
    ? `
MESSAGE FROM ${data.buyerCompanyName.toUpperCase()}:
${'-'.repeat(60)}
${data.invitationMessage}
${'-'.repeat(60)}
`
    : ''
}

⏱️ IMPORTANT: This invitation expires in ${expiryDays} days
   (${data.expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})

ACCEPT INVITATION:
${data.magicLink}

Click the link above or copy and paste it into your browser to create
your supplier account and get started.

🔒 SECURITY NOTICE:
This is a secure, one-time link that will create your supplier account.
Do not share this link with anyone. If you did not expect this invitation
or have concerns, please contact ${data.buyerContactEmail}.

${'-'.repeat(60)}
Need help? Contact us at ${data.buyerContactEmail}

© ${new Date().getFullYear()} ${data.buyerCompanyName}. All rights reserved.
`;
}

/**
 * Escape HTML to prevent XSS in email templates.
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Generate subject line for invitation email.
 */
export function generateInvitationEmailSubject(data: InvitationEmailData): string {
  return `Invitation to join ${data.buyerCompanyName} Supplier Portal`;
}

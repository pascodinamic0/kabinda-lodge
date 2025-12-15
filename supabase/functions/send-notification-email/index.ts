// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'contact' | 'password-reset' | 'review-request' | 'account-update' | 'email-confirmation' | 'test';
  to: string;
  data?: Record<string, any>;
  subject?: string;
  content?: string;
}

const getEmailTemplate = (type: string, data: Record<string, any>) => {
  const baseStyle = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #8B5A2B 0%, #A0522D 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
      .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280; }
      .button { display: inline-block; background: #8B5A2B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
      .button:hover { background: #A0522D; }
      .credentials { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 16px 0; }
      .notice { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; color: #856404; }
    </style>
  `;

  switch (type) {
    case 'contact':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>Kabinda Lodge</h1>
            <p>Contact Form Submission</p>
          </div>
          <div class="content">
            <h2>New Message Received</h2>
            <p><strong>From:</strong> ${data.name} (${data.email})</p>
            ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
            <p><strong>Subject:</strong> ${data.subject}</p>
            <div style="background: #f9fafb; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0;">
              <p><strong>Message:</strong></p>
              <p>${data.message}</p>
            </div>
            <p>Please respond to this inquiry at your earliest convenience.</p>
          </div>
          <div class="footer">
            <p>Kabinda Lodge Management System</p>
          </div>
        </div>
      `;

    case 'password-reset':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>Kabinda Lodge</h1>
            <p>Password Reset Notification</p>
          </div>
          <div class="content">
            <h2>Your Password Has Been Reset</h2>
            <p>Dear ${data.userName || 'User'},</p>
            <p>Your password has been successfully reset by a system administrator.</p>
            <div class="notice">
              <p><strong>🔒 Security Notice:</strong> For your security, we do not include passwords in emails. Please contact your administrator to receive your new login credentials through a secure channel.</p>
            </div>
            <p><strong>Reset Reason:</strong> ${data.reason || 'Administrative password reset'}</p>
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Contact your administrator to receive your temporary password securely</li>
              <li>Log in and change your password immediately</li>
              <li>If you did not request this change, contact support immediately</li>
            </ul>
          </div>
          <div class="footer">
            <p>Kabinda Lodge Management System</p>
            <p>This is an automated security notification</p>
          </div>
        </div>
      `;

    case 'review-request':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>Kabinda Lodge</h1>
            <p>We Hope You Enjoyed Your Stay!</p>
          </div>
          <div class="content">
            <h2>Please Share Your Experience</h2>
            <p>Dear ${data.guestName || 'Valued Guest'},</p>
            <p>Thank you for staying with us at Kabinda Lodge. We hope you had a wonderful experience!</p>
            <p><strong>Your Stay Details:</strong></p>
            <ul>
              <li><strong>Room:</strong> ${data.roomName}</li>
              <li><strong>Check-in:</strong> ${new Date(data.startDate).toLocaleDateString()}</li>
              <li><strong>Check-out:</strong> ${new Date(data.endDate).toLocaleDateString()}</li>
            </ul>
            <p>We would greatly appreciate if you could take a moment to share your feedback about your stay. Your review helps us improve our services and assists future guests.</p>
            <a href="${data.reviewLink}" class="button">Leave a Review</a>
            <p>Thank you for choosing Kabinda Lodge. We look forward to welcoming you back soon!</p>
          </div>
          <div class="footer">
            <p>Kabinda Lodge - Creating Memorable Experiences</p>
          </div>
        </div>
      `;

    case 'email-confirmation':
      const confirmationUrl = data?.confirmation_url || data?.confirmationUrl || '#';
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>🌟 Welcome to Kabinda Lodge</h1>
          </div>
          <div class="content">
            <h2>Confirm Your Email Address</h2>
            <p>Welcome to Kabinda Lodge! We're excited to have you join our community of distinguished guests.</p>
            <p>To complete your registration and secure your account, please confirm your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" class="button" style="color: white; text-decoration: none;">
                ✨ Confirm Your Email
              </a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #8B5A2B; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${confirmationUrl}
            </p>
            
            <div class="notice">
              <p style="margin: 0;"><strong>🔒 Security Notice:</strong> This confirmation link will expire in 24 hours for your security. If you didn't create an account with Kabinda Lodge, please ignore this email.</p>
            </div>
            
            <p>Once confirmed, you'll have access to:</p>
            <ul>
              <li>🏨 Room bookings and reservations</li>
              <li>🍽️ Restaurant dining reservations</li>
              <li>🏢 Conference room bookings</li>
              <li>📞 Guest services and support</li>
              <li>⭐ Exclusive member benefits</li>
            </ul>
            
            <p>Thank you for choosing Kabinda Lodge. We look forward to providing you with an exceptional experience.</p>
          </div>
          <div class="footer">
            <p><strong>Kabinda Lodge</strong><br>Your Premier Hospitality Destination</p>
            <p>If you need assistance, contact us at <a href="mailto:support@kakindalodge.com">support@kakindalodge.com</a></p>
          </div>
        </div>
      `;

    case 'test':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>📧 Test Email</h1>
          </div>
          <div class="content">
            <h2>Email Configuration Test</h2>
            <p>Congratulations! Your email configuration is working correctly.</p>
            <p>This test email was sent from your Kabinda Lodge application using Resend.</p>
            <p><strong>Test details:</strong></p>
            <ul>
              <li>Sent at: ${new Date().toLocaleString()}</li>
              <li>Email service: Resend</li>
              <li>Template: Custom HTML</li>
            </ul>
          </div>
          <div class="footer">
            <p>Kabinda Lodge Email System</p>
          </div>
        </div>
      `;

    case 'account-update':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>Kabinda Lodge</h1>
            <p>Account Information Updated</p>
          </div>
          <div class="content">
            <h2>Your Account Has Been Updated</h2>
            <p>Dear ${data.userName || 'User'},</p>
            <p>Your account information has been successfully updated by a system administrator.</p>
            <div class="credentials">
              <p><strong>Updated Account Information:</strong></p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Role:</strong> ${data.role}</p>
            </div>
            ${data.newPassword ? `
            <div class="notice">
              <p><strong>🔒 Password Changed:</strong> Your password has been updated. For security, we do not include passwords in emails. Please contact your administrator to receive your new credentials securely.</p>
            </div>
            ` : ''}
            <p>Please log in with your updated credentials to access the system.</p>
            <p>If you have any questions or concerns, please contact your administrator.</p>
          </div>
          <div class="footer">
            <p>Kabinda Lodge Management System</p>
          </div>
        </div>
      `;

    default:
      return `<p>Invalid email type</p>`;
  }
};

const getEmailSubject = (type: string, data: Record<string, any>) => {
  switch (type) {
    case 'contact':
      return `Contact Form: ${data?.subject || 'New Message'}`;
    case 'password-reset':
      return `Kabinda Lodge - Password Reset Notification`;
    case 'review-request':
      return `Kabinda Lodge - Share Your Experience`;
    case 'account-update':
      return `Kabinda Lodge - Account Updated`;
    case 'email-confirmation':
      return '✨ Welcome to Kabinda Lodge - Please Confirm Your Email';
    case 'test':
      return '📧 Test Email from Kabinda Lodge';
    default:
      return `Kabinda Lodge Notification`;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client for logging
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, to, data = {}, subject: customSubject, content: customContent }: EmailRequest = await req.json();

    console.log("Email request:", { type, to: to.substring(0, 5) + "***" });

    // Get email template and subject
    const html = customContent || getEmailTemplate(type, data);
    const subject = customSubject || getEmailSubject(type, data);

    // Determine sender based on type
    let from = "Kabinda Lodge <noreply@resend.dev>";
    switch (type) {
      case 'contact':
        from = "Kabinda Lodge <contact@resend.dev>";
        break;
      case 'email-confirmation':
        from = "Kabinda Lodge <welcome@resend.dev>";
        break;
      case 'test':
        from = "Kabinda Lodge <test@resend.dev>";
        break;
      default:
        from = "Kabinda Lodge <noreply@resend.dev>";
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
    });

    if (emailResponse.error) {
      throw new Error(`Resend API error: ${emailResponse.error.message}`);
    }

    // Log successful email send
    await supabase.from('security_audit_log').insert({
      event_type: 'email_sent',
      event_details: {
        email_type: type,
        recipient: to,
        email_id: emailResponse.data?.id,
        timestamp: new Date().toISOString()
      }
    });

    console.log("Email sent successfully:", emailResponse.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error sending email:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send email" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
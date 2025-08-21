import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'contact' | 'password-reset' | 'review-request' | 'account-update';
  to: string;
  data: Record<string, any>;
}

const getEmailTemplate = (type: string, data: Record<string, any>) => {
  const baseStyle = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
      .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280; }
      .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
      .credentials { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 16px 0; }
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
            <div class="credentials">
              <p><strong>New Login Credentials:</strong></p>
              <p><strong>Email:</strong> ${data.userEmail}</p>
              <p><strong>Temporary Password:</strong> ${data.newPassword}</p>
            </div>
            <p><strong>Important:</strong> Please log in and change your password immediately for security reasons.</p>
            <p><strong>Reset Reason:</strong> ${data.reason || 'Administrative password reset'}</p>
            <p>If you did not request this change, please contact support immediately.</p>
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
              <p><strong>Updated Login Credentials:</strong></p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Role:</strong> ${data.role}</p>
              ${data.newPassword ? `<p><strong>New Password:</strong> ${data.newPassword}</p>` : ''}
            </div>
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
      return `Contact Form: ${data.subject}`;
    case 'password-reset':
      return `Kabinda Lodge - Password Reset Notification`;
    case 'review-request':
      return `Kabinda Lodge - Share Your Experience`;
    case 'account-update':
      return `Kabinda Lodge - Account Updated`;
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

    const { type, to, data }: EmailRequest = await req.json();

    console.log("Email request:", { type, to: to.substring(0, 5) + "***" });

    // Get email template and subject
    const html = getEmailTemplate(type, data);
    const subject = getEmailSubject(type, data);

    // Determine sender based on type
    let from = "Kabinda Lodge <noreply@resend.dev>";
    if (type === 'contact') {
      from = "Kabinda Lodge <contact@resend.dev>";
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
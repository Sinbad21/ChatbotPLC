export interface MonthlyStats {
  conversations: number;
  messages: number;
  leads: number;
  activeBotsCount: number;
}

export function monthlyReportTemplate(name: string, stats: MonthlyStats, month: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Monthly Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Your ${month} Report</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 16px; color: #333333; line-height: 1.6;">
                Hi ${name},
              </p>

              <p style="font-size: 16px; color: #333333; line-height: 1.6;">
                Here's a summary of your chatbot performance for ${month}:
              </p>

              <!-- Stats Grid -->
              <table width="100%" cellpadding="0" cellspacing="15" style="margin: 30px 0;">
                <tr>
                  <td width="50%" style="background-color: #eff6ff; border-radius: 8px; padding: 20px; text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; color: #3b82f6;">${stats.conversations.toLocaleString()}</div>
                    <div style="font-size: 14px; color: #666666; margin-top: 8px;">Conversations</div>
                  </td>
                  <td width="50%" style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; color: #10b981;">${stats.messages.toLocaleString()}</div>
                    <div style="font-size: 14px; color: #666666; margin-top: 8px;">Messages</div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="background-color: #fef3c7; border-radius: 8px; padding: 20px; text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; color: #f59e0b;">${stats.leads.toLocaleString()}</div>
                    <div style="font-size: 14px; color: #666666; margin-top: 8px;">Leads Captured</div>
                  </td>
                  <td width="50%" style="background-color: #f5f3ff; border-radius: 8px; padding: 20px; text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; color: #8b5cf6;">${stats.activeBotsCount}</div>
                    <div style="font-size: 14px; color: #666666; margin-top: 8px;">Active Bots</div>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #333333;">
                  <strong>Pro Tip:</strong> Review your conversation analytics to identify popular topics and optimize your bot's responses for better engagement.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.APP_URL}/dashboard/analytics"
                   style="background-color: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  View Full Analytics
                </a>
              </div>

              <p style="font-size: 14px; color: #666666;">
                Keep up the great work!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                &copy; 2024 Chatbot Studio. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
                To unsubscribe from monthly reports, <a href="${process.env.APP_URL}/settings/notifications" style="color: #6366f1;">update your preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

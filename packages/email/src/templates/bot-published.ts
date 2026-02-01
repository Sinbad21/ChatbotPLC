export function botPublishedTemplate(name: string, botName: string, botUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Bot is Live!</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Your Bot is Live!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 16px; color: #333333; line-height: 1.6;">
                Hi ${name},
              </p>

              <p style="font-size: 16px; color: #333333; line-height: 1.6;">
                Congratulations! Your chatbot <strong>"${botName}"</strong> has been successfully published and is now live.
              </p>

              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #6366f1;">Next Steps:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #333333;">
                  <li style="margin-bottom: 10px;">Share your chatbot with users</li>
                  <li style="margin-bottom: 10px;">Embed the widget on your website</li>
                  <li style="margin-bottom: 10px;">Monitor conversations in real-time</li>
                  <li>Review analytics and insights</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${botUrl}"
                   style="background-color: #6366f1; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-right: 10px;">
                  View Bot Dashboard
                </a>
              </div>

              <p style="font-size: 14px; color: #666666; margin-top: 30px;">
                Your chatbot is ready to start engaging with your users. Good luck!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                &copy; 2024 Chatbot Studio. All rights reserved.
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

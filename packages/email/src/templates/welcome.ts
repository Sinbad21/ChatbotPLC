export function welcomeTemplate(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Chatbot Studio</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px;">Welcome to Chatbot Studio!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 16px; color: #333333; line-height: 1.6;">
                Hi ${name},
              </p>

              <p style="font-size: 16px; color: #333333; line-height: 1.6;">
                Thank you for joining <strong>Chatbot Studio</strong>! We're excited to help you build amazing AI-powered chatbots.
              </p>

              <p style="font-size: 16px; color: #333333; line-height: 1.6;">
                Here's what you can do next:
              </p>

              <ul style="font-size: 16px; color: #333333; line-height: 1.8;">
                <li>Create your first chatbot in minutes</li>
                <li>Upload documents to build your knowledge base</li>
                <li>Customize your chatbot's appearance and behavior</li>
                <li>Embed the chat widget on your website</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.APP_URL}/dashboard"
                   style="background-color: #6366f1; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Get Started
                </a>
              </div>

              <p style="font-size: 14px; color: #666666; margin-top: 30px;">
                Need help? Check out our <a href="${process.env.APP_URL}/docs" style="color: #6366f1;">documentation</a> or reach out to our support team.
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

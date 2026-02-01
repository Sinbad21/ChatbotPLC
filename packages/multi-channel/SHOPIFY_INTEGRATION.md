# Shopify Integration Guide

## Overview
Integrate Chatbot Studio into your Shopify store to assist customers with product questions, order tracking, and checkout support.

## Quick Integration (3 Steps)

### Step 1: Get Your Widget Code
1. Log in to Chatbot Studio dashboard
2. Go to Integrations → Shopify
3. Copy your unique widget code

### Step 2: Add to Shopify Theme
1. Go to Shopify Admin → Online Store → Themes
2. Click **Actions** → **Edit code** on your active theme
3. Find `theme.liquid` in the Layout folder
4. Paste the code before `</body>` tag:

```html
<script>
  window.chatbotConfig = {
    botId: 'YOUR_BOT_ID',
    apiUrl: 'https://api.yourdomain.com',
    shopifyStore: '{{ shop.permanent_domain }}',
    position: 'bottom-right',
    theme: 'light',
    shopifyIntegration: true
  };
</script>
<script src="https://cdn.yourdomain.com/widget.js" async></script>
```

5. Click **Save**

### Step 3: Test
Visit your store and verify the chat widget appears in the bottom right corner.

## Shopify-Specific Features

### Product Recommendations
The chatbot can recommend products based on:
- Customer's browsing history
- Current cart contents
- Similar product searches
- Best sellers
- Recently viewed items

Enable in: Dashboard → Integrations → Shopify → Product Recommendations

### Order Tracking
Customers can track orders directly in chat:
- Order status updates
- Shipping tracking links
- Estimated delivery dates
- Return/exchange requests

Enable in: Dashboard → Integrations → Shopify → Order Tracking

### Cart Recovery
Automatically remind customers about abandoned carts:
- Proactive chat messages
- Personalized discount offers
- Direct checkout links

Configure in: Dashboard → Integrations → Shopify → Cart Recovery

### Inventory Alerts
Notify customers when:
- Out-of-stock items are back
- Products are low in stock
- Pre-orders are available

## Advanced Configuration

### Pass Customer Data to Chat
```liquid
<script>
  window.chatbotConfig = {
    botId: 'YOUR_BOT_ID',
    apiUrl: 'https://api.yourdomain.com',
    {% if customer %}
    userData: {
      name: '{{ customer.name }}',
      email: '{{ customer.email }}',
      customerId: '{{ customer.id }}',
      totalOrders: '{{ customer.orders_count }}',
      totalSpent: '{{ customer.total_spent | money }}'
    },
    {% endif %}
    shopifyIntegration: true
  };
</script>
```

### Show Widget Only on Specific Pages

#### Product pages only:
```liquid
{% if template.name == 'product' %}
  <script src="https://cdn.yourdomain.com/widget.js" async></script>
{% endif %}
```

#### Hide on checkout:
```liquid
{% unless template.name == 'checkout' %}
  <script src="https://cdn.yourdomain.com/widget.js" async></script>
{% endunless %}
```

#### Show only to logged-in customers:
```liquid
{% if customer %}
  <script src="https://cdn.yourdomain.com/widget.js" async></script>
{% endif %}
```

### Custom Positioning
```javascript
window.chatbotConfig = {
  botId: 'YOUR_BOT_ID',
  position: 'bottom-left',  // bottom-right, bottom-left, top-right, top-left
  offset: {
    x: 20,  // Horizontal offset in pixels
    y: 20   // Vertical offset in pixels
  }
};
```

### Custom Styling
```css
/* Add to Assets/theme.css or custom CSS section */
#chatbot-widget {
  --widget-primary-color: #5c6ac4; /* Match Shopify admin color */
  --widget-border-radius: 12px;
  --widget-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

## Shopify Plus Features

### Multi-language Support
For Shopify Plus stores with multiple languages:
```liquid
<script>
  window.chatbotConfig = {
    botId: 'YOUR_BOT_ID',
    language: '{{ request.locale.iso_code }}',  // Auto-detect store language
    shopifyIntegration: true
  };
</script>
```

### B2B Wholesale Support
For B2B/wholesale customers:
```liquid
{% if customer.tags contains 'wholesale' %}
  <script>
    window.chatbotConfig = {
      botId: 'YOUR_WHOLESALE_BOT_ID',  // Use different bot for B2B
      userData: {
        isWholesale: true,
        customerTags: '{{ customer.tags | join: "," }}'
      }
    };
  </script>
{% endif %}
```

## Integration with Shopify Apps

### Klaviyo Integration
Sync chat conversations with Klaviyo for email marketing:
- Enable in Dashboard → Integrations → Klaviyo
- Requires Klaviyo API key

### Yotpo Reviews Integration
Show product reviews in chat responses:
- Enable in Dashboard → Integrations → Yotpo
- Automatically pulls reviews from Yotpo

### Recharge Subscriptions
Support subscription inquiries:
- Pause/resume subscriptions
- Change delivery frequency
- Update payment methods

Enable in Dashboard → Integrations → Recharge

## Performance Optimization

### Lazy Loading
Widget loads only when needed:
```javascript
window.chatbotConfig = {
  botId: 'YOUR_BOT_ID',
  lazyLoad: true,  // Loads when user scrolls or after 5 seconds
  delayMs: 5000    // Delay in milliseconds
};
```

### Mobile Optimization
Auto-adjust for mobile devices:
```javascript
window.chatbotConfig = {
  botId: 'YOUR_BOT_ID',
  mobile: {
    position: 'bottom-center',  // Full width on mobile
    fullScreen: true            // Open in full screen
  }
};
```

## Analytics Integration

### Google Analytics 4
Track chat events in GA4:
```javascript
window.chatbotConfig = {
  botId: 'YOUR_BOT_ID',
  analytics: {
    ga4: true,
    events: {
      chatOpened: 'chat_opened',
      messageSent: 'chat_message_sent',
      leadCaptured: 'chat_lead_captured'
    }
  }
};
```

### Shopify Analytics
Chat metrics automatically sync to Shopify Analytics dashboard.

## Troubleshooting

### Widget not visible
1. **Clear Shopify cache**: Save theme.liquid again
2. **Check theme compatibility**: Some themes require specific placement
3. **Verify Bot ID**: Copy from dashboard exactly
4. **Test in incognito**: Rule out browser cache issues

### Widget conflicts with Shopify Inbox
Hide Shopify Inbox when using Chatbot Studio:
```liquid
<style>
  .shopify-chat-button {
    display: none !important;
  }
</style>
```

### Product recommendations not working
1. Verify Shopify integration is enabled in dashboard
2. Check that products are synced (Dashboard → Integrations → Shopify → Sync Products)
3. Ensure product catalog is public

### Order tracking returns errors
1. Enable "Read orders" permission in Shopify API settings
2. Re-authenticate Shopify connection in dashboard
3. Verify customer email matches order email

## Compliance & Privacy

### GDPR Compliance
- Customer data is stored securely
- Automatic data deletion after 30 days of inactivity
- GDPR-compliant consent management

Enable GDPR mode:
```javascript
window.chatbotConfig = {
  botId: 'YOUR_BOT_ID',
  gdpr: true,  // Shows consent banner
  gdprMessage: 'We use cookies to improve chat experience'
};
```

### CCPA Compliance
California residents can request data deletion:
- Privacy controls available in chat settings
- "Do Not Sell" option in widget

## Support & Resources

- **Installation Support**: support@chatbotstudio.com
- **Video Tutorial**: https://youtu.be/shopify-integration
- **API Documentation**: https://docs.chatbotstudio.com/shopify
- **Community**: https://community.chatbotstudio.com/shopify

## Migration from Other Chat Tools

### From Tidio
Import chat history and automations. Contact support@chatbotstudio.com

### From Gorgias
Existing tickets can be imported. See migration guide.

### From Zendesk Chat
Migration script available in dashboard.

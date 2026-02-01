# WordPress Integration Guide

## Overview
Integrate Chatbot Studio widget into your WordPress site in 3 easy ways.

## Method 1: Using Plugin (Recommended)

### Installation
1. Download the Chatbot Studio WordPress plugin from your dashboard
2. Go to WordPress Admin → Plugins → Add New → Upload Plugin
3. Upload the `.zip` file and activate
4. Go to Settings → Chatbot Studio
5. Enter your Bot ID and API Key
6. Save and the widget will appear automatically

### Configuration Options
- **Position**: Bottom right, bottom left, top right, top left
- **Theme**: Light, dark, auto
- **Language**: Auto-detect or force specific language
- **Pages**: Show on all pages or specific pages only

## Method 2: Manual Script Injection

### Using Header/Footer Plugin
1. Install "Insert Headers and Footers" plugin
2. Go to Settings → Insert Headers and Footers
3. Paste the following code in the Footer section:

```html
<script>
  window.chatbotConfig = {
    botId: 'YOUR_BOT_ID',
    apiUrl: 'https://api.yourdomain.com',
    position: 'bottom-right',
    theme: 'light'
  };
</script>
<script src="https://cdn.yourdomain.com/widget.js" async></script>
```

4. Replace `YOUR_BOT_ID` with your actual Bot ID from dashboard
5. Save changes

### Using Theme Editor (Advanced)
1. Go to Appearance → Theme Editor
2. Select `footer.php` or `header.php`
3. Add the script code before `</body>` tag
4. Save changes

**⚠️ Warning**: Theme updates will overwrite this. Use child theme or plugin method instead.

## Method 3: Using Page Builder

### Elementor
1. Edit page with Elementor
2. Add "HTML" widget
3. Paste the script code
4. Update page

### Gutenberg
1. Add "Custom HTML" block
2. Paste the script code
3. Publish page

### WPBakery
1. Add "Raw HTML" element
2. Paste the script code
3. Save page

## Advanced Configuration

### Show widget only to logged-in users
```php
// Add to functions.php
add_action('wp_footer', function() {
  if (is_user_logged_in()) {
    ?>
    <script src="https://cdn.yourdomain.com/widget.js" async></script>
    <?php
  }
});
```

### Pass WordPress user data to chatbot
```javascript
window.chatbotConfig = {
  botId: 'YOUR_BOT_ID',
  apiUrl: 'https://api.yourdomain.com',
  userData: {
    name: '<?php echo wp_get_current_user()->display_name; ?>',
    email: '<?php echo wp_get_current_user()->user_email; ?>',
    userId: '<?php echo get_current_user_id(); ?>'
  }
};
```

### Hide on specific pages
```javascript
// Hide on checkout and cart pages (WooCommerce)
if (document.body.classList.contains('woocommerce-checkout') ||
    document.body.classList.contains('woocommerce-cart')) {
  window.chatbotConfig.enabled = false;
}
```

## WooCommerce Integration

### Show order status in chat
Enable "WooCommerce Integration" in dashboard settings to allow customers to:
- Track order status
- Get shipping updates
- Request refunds
- View order history

### Product recommendations
The chatbot can recommend products based on:
- Customer browsing history
- Previous purchases
- Cart contents
- Search queries

Configuration available in Dashboard → Integrations → WooCommerce

## Troubleshooting

### Widget not appearing
1. Clear WordPress cache (WP Super Cache, W3 Total Cache, etc.)
2. Check if JavaScript is enabled in browser
3. Verify Bot ID is correct
4. Check browser console for errors

### Widget appears twice
- Remove manual script if using plugin
- Check if script is in both header and footer
- Deactivate conflicting plugins

### Widget conflicts with other chat tools
Add this to hide other chat widgets:
```css
/* Add to Appearance → Customize → Additional CSS */
#other-chat-widget {
  display: none !important;
}
```

## Performance Optimization

The widget script is:
- **Async loaded**: Doesn't block page rendering
- **Lazy loaded**: Chat interface loads only when needed
- **Cached**: CDN-delivered with long cache headers
- **Lightweight**: ~15 KB gzipped

## Support

For issues or questions:
- Email: support@chatbotstudio.com
- Documentation: https://docs.chatbotstudio.com
- Forum: https://community.chatbotstudio.com

# Booking Widget - Embed Guide

## Overview

The Chatbot Studio Booking Widget can be embedded on any website in three ways:
1. **Floating Button** - A sticky button that opens a modal
2. **Inline Embed** - Direct iframe embed in page content
3. **Direct Link** - Direct URL to the booking page

---

## Method 1: Floating Button (Recommended)

Add this script to your website's HTML, preferably before the closing `</body>` tag:

```html
<script
  src="https://yourdomain.com/booking-widget.js"
  data-connection-id="YOUR_CONNECTION_ID"
  data-button-text="Prenota Ora"
  data-button-color="#10b981"
  data-button-position="bottom-right">
</script>
```

### Configuration Options

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `data-connection-id` | **Yes** | - | Your calendar connection ID |
| `data-button-text` | No | "Prenota Appuntamento" | Text shown on the button |
| `data-button-color` | No | `#10b981` | Button background color (hex) |
| `data-button-position` | No | `bottom-right` | Button position: `bottom-right`, `bottom-left`, `top-right`, `top-left` |

### Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <h1>Welcome to My Business</h1>
  <p>Book an appointment with us!</p>

  <!-- Booking Widget -->
  <script
    src="https://yourdomain.com/booking-widget.js"
    data-connection-id="clx123abc456"
    data-button-text="Book Now"
    data-button-color="#3b82f6"
    data-button-position="bottom-right">
  </script>
</body>
</html>
```

---

## Method 2: Inline Embed

Embed the booking widget directly in your page content:

```html
<div id="booking-widget">
  <script
    src="https://yourdomain.com/booking-widget.js"
    data-connection-id="YOUR_CONNECTION_ID"
    data-inline="true">
  </script>
</div>
```

### Example

```html
<div class="booking-section">
  <h2>Book Your Appointment</h2>
  <p>Choose a date and time that works for you.</p>

  <!-- Inline Widget -->
  <script
    src="https://yourdomain.com/booking-widget.js"
    data-connection-id="clx123abc456"
    data-inline="true">
  </script>
</div>
```

---

## Method 3: Direct Link

Simply link to the booking page:

```html
<a href="https://yourdomain.com/booking/YOUR_CONNECTION_ID">
  Book an Appointment
</a>
```

Or as a button:

```html
<a href="https://yourdomain.com/booking/clx123abc456"
   class="btn btn-primary">
  Book Now
</a>
```

---

## Method 4: Programmatic Control

You can open/close the widget programmatically using JavaScript:

```html
<button onclick="openBookingWidget()">
  Custom Book Button
</button>

<script
  src="https://yourdomain.com/booking-widget.js"
  data-connection-id="clx123abc456">
</script>

<script>
  // Open widget programmatically
  function myCustomFunction() {
    openBookingWidget();
  }

  // Close widget programmatically
  function closeBooking() {
    closeBookingWidget();
  }
</script>
```

---

## Finding Your Connection ID

1. Log in to your Chatbot Studio dashboard
2. Go to **Dashboard → Calendar**
3. Your connection ID is displayed in the calendar settings
4. Copy the connection ID (format: `clx...`)

---

## Customization

### Button Colors

Use any hex color code:

```html
data-button-color="#10b981"  <!-- Green (default) -->
data-button-color="#3b82f6"  <!-- Blue -->
data-button-color="#ef4444"  <!-- Red -->
data-button-color="#8b5cf6"  <!-- Purple -->
data-button-color="#f59e0b"  <!-- Orange -->
```

### Button Position

Choose from 4 positions:

```html
data-button-position="bottom-right"  <!-- Default -->
data-button-position="bottom-left"
data-button-position="top-right"
data-button-position="top-left"
```

### Button Text

Customize the button text:

```html
data-button-text="Prenota Ora"        <!-- Italian -->
data-button-text="Book Now"           <!-- English -->
data-button-text="Reserve su cita"    <!-- Spanish -->
data-button-text="Réserver"           <!-- French -->
```

---

## WordPress Integration

### Using a Plugin

1. Install "Insert Headers and Footers" or similar plugin
2. Add the script to the footer section
3. Save changes

### Manual Theme Edit

1. Go to **Appearance → Theme Editor**
2. Open `footer.php`
3. Add the script before `</body>`
4. Save changes

```php
<!-- Before closing body tag -->
<script
  src="https://yourdomain.com/booking-widget.js"
  data-connection-id="clx123abc456"
  data-button-text="Book Now">
</script>
<?php wp_footer(); ?>
</body>
</html>
```

---

## Wix Integration

1. Go to your Wix site editor
2. Click **Settings** → **Custom Code**
3. Click **+ Add Custom Code**
4. Paste the booking widget script
5. Set placement: **Body - End**
6. Apply to: **All Pages** (or specific pages)
7. Click **Apply**

---

## Squarespace Integration

1. Go to **Settings** → **Advanced** → **Code Injection**
2. Paste the script in the **Footer** section
3. Click **Save**

Or for specific pages:

1. Open the page you want to edit
2. Click **Settings** (gear icon)
3. Go to **Advanced**
4. Paste script in **Page Header Code Injection**
5. Click **Save**

---

## Shopify Integration

1. Go to **Online Store** → **Themes**
2. Click **Actions** → **Edit code**
3. Open `theme.liquid`
4. Add script before `</body>`
5. Click **Save**

```liquid
<!-- Before closing body tag -->
<script
  src="https://yourdomain.com/booking-widget.js"
  data-connection-id="clx123abc456">
</script>
</body>
</html>
```

---

## React/Next.js Integration

### React Component

```jsx
import { useEffect } from 'react';

export function BookingWidget({ connectionId }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://yourdomain.com/booking-widget.js';
    script.setAttribute('data-connection-id', connectionId);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [connectionId]);

  return null;
}
```

### Usage

```jsx
import { BookingWidget } from './BookingWidget';

export default function Home() {
  return (
    <div>
      <h1>Welcome</h1>
      <BookingWidget connectionId="clx123abc456" />
    </div>
  );
}
```

---

## Troubleshooting

### Widget doesn't appear

1. Check that the connection ID is correct
2. Ensure the script is loaded (check browser console)
3. Verify there are no JavaScript errors
4. Make sure the booking system is active in your dashboard

### Button position is wrong

- Try different `data-button-position` values
- Check for CSS conflicts with your site's styles
- Use browser DevTools to inspect the button element

### Widget doesn't open

1. Check browser console for errors
2. Verify the widget URL is accessible
3. Check if any ad blockers are interfering
4. Try using the direct link method instead

### Styling conflicts

If the widget button conflicts with your site's styles:

1. Use inline embed instead of floating button
2. Customize button colors to match your brand
3. Use direct link method with your own button

---

## Security & Performance

### HTTPS Required

The booking widget requires HTTPS for security. Ensure your website uses HTTPS.

### Load Time

The widget script is lightweight (~5KB) and loads asynchronously, so it won't block page rendering.

### Privacy

- The widget only collects booking information (name, email, phone)
- Data is stored securely in our database
- No tracking cookies are used
- Full GDPR compliance

---

## Support

For help with embedding the booking widget:

1. Check this documentation first
2. Contact support at support@yourdomain.com
3. Visit our help center: https://yourdomain.com/help

---

## Examples

### Full Page Example

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prenota - My Business</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .hero {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      margin-bottom: 40px;
    }
  </style>
</head>
<body>
  <div class="hero">
    <h1>Welcome to My Business</h1>
    <p>Professional services tailored to your needs</p>
  </div>

  <h2>Book Your Appointment</h2>
  <p>Click the button below to schedule a time that works for you.</p>

  <!-- Booking Widget -->
  <script
    src="https://yourdomain.com/booking-widget.js"
    data-connection-id="clx123abc456"
    data-button-text="Prenota Ora"
    data-button-color="#667eea"
    data-button-position="bottom-right">
  </script>
</body>
</html>
```

---

**Last updated:** November 2025
**Version:** 1.0

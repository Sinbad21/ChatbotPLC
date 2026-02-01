/**
 * OMNICAL STUDIO - Booking Widget Embed Script
 *
 * Usage (with widgetId - for standalone customers):
 * <script src="https://yourdomain.com/booking-widget.js"
 *         data-widget-id="your-widget-id"
 *         data-button-text="Prenota Ora"
 *         data-button-color="#10b981">
 * </script>
 *
 * Legacy usage (with connectionId - for bot customers):
 * <script src="https://yourdomain.com/booking-widget.js"
 *         data-connection-id="your-connection-id"
 *         data-button-text="Prenota Ora"
 *         data-button-color="#10b981">
 * </script>
 */

(function() {
  'use strict';

  // Get script tag and configuration
  const script = document.currentScript;
  const widgetId = script.getAttribute('data-widget-id');
  const connectionId = script.getAttribute('data-connection-id'); // Legacy support
  const buttonText = script.getAttribute('data-button-text') || 'Prenota Appuntamento';
  const buttonColor = script.getAttribute('data-button-color') || '#10b981';
  const buttonPosition = script.getAttribute('data-button-position') || 'bottom-right';
  const locale = script.getAttribute('data-locale') || 'it'; // Default to Italian
  const inline = script.getAttribute('data-inline') === 'true';

  // Prefer widgetId, fallback to connectionId for backwards compatibility
  const identifier = widgetId || connectionId;

  if (!identifier) {
    console.error('Booking Widget: data-widget-id or data-connection-id attribute is required');
    return;
  }

  // Configuration
  const baseUrl = script.src.replace('/booking-widget.js', '');
  const widgetPath = widgetId ? `booking/widget/${widgetId}` : `booking/${connectionId}`;
  const widgetUrl = `${baseUrl}/${widgetPath}?locale=${locale}`;

  // Create widget container
  function createWidget() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'booking-widget-overlay';
    overlay.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999998;
      backdrop-filter: blur(4px);
    `;

    // Create iframe container
    const container = document.createElement('div');
    container.id = 'booking-widget-container';
    container.style.cssText = `
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 600px;
      height: 90%;
      max-height: 800px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      z-index: 999999;
      overflow: hidden;
    `;

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      position: absolute;
      top: 16px;
      right: 16px;
      width: 36px;
      height: 36px;
      border: none;
      background: rgba(0, 0, 0, 0.1);
      color: #333;
      font-size: 28px;
      line-height: 1;
      cursor: pointer;
      border-radius: 50%;
      z-index: 1000000;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeBtn.onmouseover = function() {
      this.style.background = 'rgba(0, 0, 0, 0.2)';
    };
    closeBtn.onmouseout = function() {
      this.style.background = 'rgba(0, 0, 0, 0.1)';
    };
    closeBtn.onclick = closeWidget;

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = widgetUrl;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 16px;
    `;
    iframe.allow = 'geolocation';

    container.appendChild(closeBtn);
    container.appendChild(iframe);

    // Create trigger button (if not inline)
    let triggerBtn;
    if (!inline) {
      triggerBtn = document.createElement('button');
      triggerBtn.id = 'booking-widget-trigger';
      triggerBtn.textContent = buttonText;

      const positions = {
        'bottom-right': 'bottom: 24px; right: 24px;',
        'bottom-left': 'bottom: 24px; left: 24px;',
        'top-right': 'top: 24px; right: 24px;',
        'top-left': 'top: 24px; left: 24px;',
      };

      triggerBtn.style.cssText = `
        position: fixed;
        ${positions[buttonPosition] || positions['bottom-right']}
        background: ${buttonColor};
        color: white;
        border: none;
        padding: 16px 32px;
        font-size: 16px;
        font-weight: 600;
        border-radius: 50px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 999997;
        transition: all 0.3s;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      triggerBtn.onmouseover = function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
      };
      triggerBtn.onmouseout = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      };
      triggerBtn.onclick = openWidget;
    }

    // Append to body
    document.body.appendChild(overlay);
    document.body.appendChild(container);
    if (triggerBtn) {
      document.body.appendChild(triggerBtn);
    }

    // Close on overlay click
    overlay.onclick = closeWidget;
  }

  function openWidget() {
    const overlay = document.getElementById('booking-widget-overlay');
    const container = document.getElementById('booking-widget-container');
    if (overlay && container) {
      overlay.style.display = 'block';
      container.style.display = 'block';
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
  }

  function closeWidget() {
    const overlay = document.getElementById('booking-widget-overlay');
    const container = document.getElementById('booking-widget-container');
    if (overlay && container) {
      overlay.style.display = 'none';
      container.style.display = 'none';
      document.body.style.overflow = ''; // Restore scrolling
    }
  }

  // Create inline embed function
  function createInlineEmbed() {
    const iframe = document.createElement('iframe');
    iframe.src = widgetUrl;
    iframe.style.cssText = `
      width: 100%;
      height: 700px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    `;
    iframe.allow = 'geolocation';

    // Insert after script tag
    script.parentNode.insertBefore(iframe, script.nextSibling);
  }

  // Global function to open widget (can be called from anywhere)
  window.openBookingWidget = openWidget;
  window.closeBookingWidget = closeWidget;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (inline) {
        createInlineEmbed();
      } else {
        createWidget();
      }
    });
  } else {
    if (inline) {
      createInlineEmbed();
    } else {
      createWidget();
    }
  }
})();

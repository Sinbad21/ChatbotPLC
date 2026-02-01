/**
 * Email Notification Service
 * Sends booking confirmation and notification emails using Resend
 */

import { Resend } from 'resend';

// Initialize Resend (will use RESEND_API_KEY from environment)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Email sender address (must be verified in Resend dashboard)
const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'bookings@yourdomain.com';

interface BookingEmailData {
  ownerEmail?: string;
  attendeeEmail?: string;
  attendeeName?: string;
  attendeeFirstName?: string;
  attendeeLastName?: string;
  attendeePhone?: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  notes?: string;
  calendarName?: string;
}

/**
 * Send booking confirmation email to attendee
 */
export async function sendAttendeeConfirmation(data: BookingEmailData): Promise<void> {
  if (!data.attendeeEmail) {
    console.log('No attendee email provided, skipping confirmation email');
    return;
  }

  const startDate = new Date(data.startTime);
  const endDate = new Date(data.endTime);

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Prenotazione Confermata</h1>
    </div>
    <div class="content">
      <p>Ciao ${data.attendeeFirstName || data.attendeeName},</p>
      <p>La tua prenotazione è stata confermata con successo!</p>

      <div class="info-box">
        <h2 style="margin-top: 0;">Dettagli Appuntamento</h2>
        <p><strong>📅 Data:</strong> ${startDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p><strong>🕐 Orario:</strong> ${startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
        ${data.calendarName ? `<p><strong>📍 Calendario:</strong> ${data.calendarName}</p>` : ''}
        ${data.notes ? `<p><strong>📝 Note:</strong> ${data.notes}</p>` : ''}
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0;">I Tuoi Dati</h3>
        <p><strong>Nome:</strong> ${data.attendeeFirstName} ${data.attendeeLastName}</p>
        <p><strong>Email:</strong> ${data.attendeeEmail}</p>
        ${data.attendeePhone ? `<p><strong>Telefono:</strong> ${data.attendeePhone}</p>` : ''}
      </div>

      <p style="margin-top: 30px;">Riceverai un promemoria prima dell'appuntamento.</p>
      <p>Se hai bisogno di modificare o cancellare l'appuntamento, contattaci.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Omnical Studio. Tutti i diritti riservati.</p>
    </div>
  </div>
</body>
</html>
  `;

  const emailText = `
Prenotazione Confermata

Ciao ${data.attendeeFirstName || data.attendeeName},

La tua prenotazione è stata confermata con successo!

DETTAGLI APPUNTAMENTO:
Data: ${startDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
Orario: ${startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
${data.notes ? `Note: ${data.notes}` : ''}

I TUOI DATI:
Nome: ${data.attendeeFirstName} ${data.attendeeLastName}
Email: ${data.attendeeEmail}
${data.attendeePhone ? `Telefono: ${data.attendeePhone}` : ''}

Se hai bisogno di modificare o cancellare l'appuntamento, contattaci.

© ${new Date().getFullYear()} Omnical Studio
  `;

  // Send email using Resend
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: data.attendeeEmail,
        subject: 'Conferma Prenotazione / Booking Confirmation',
        html: emailHtml,
        text: emailText,
      });

      console.log('✅ Attendee confirmation email sent:', result);
    } catch (error) {
      console.error('❌ Failed to send attendee confirmation email:', error);
      throw error;
    }
  } else {
    // Fallback to logging if Resend not configured
    console.log('⚠️ RESEND_API_KEY not configured. Email would be sent to:', data.attendeeEmail);
    console.log('Subject: Conferma Prenotazione');
    console.log('Preview:', emailText.substring(0, 200));
  }
}

/**
 * Send booking notification email to owner
 */
export async function sendOwnerNotification(data: BookingEmailData): Promise<void> {
  if (!data.ownerEmail) {
    console.log('No owner email configured, skipping notification');
    return;
  }

  const startDate = new Date(data.startTime);
  const endDate = new Date(data.endTime);

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Nuova Prenotazione Ricevuta</h1>
    </div>
    <div class="content">
      <p>Hai ricevuto una nuova prenotazione!</p>

      <div class="info-box">
        <h2 style="margin-top: 0;">Dettagli Appuntamento</h2>
        <p><strong>📅 Data:</strong> ${startDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p><strong>🕐 Orario:</strong> ${startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
        ${data.notes ? `<p><strong>📝 Note:</strong> ${data.notes}</p>` : ''}
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0;">Informazioni Cliente</h3>
        <p><strong>👤 Nome:</strong> ${data.attendeeFirstName} ${data.attendeeLastName}</p>
        <p><strong>📧 Email:</strong> <a href="mailto:${data.attendeeEmail}">${data.attendeeEmail}</a></p>
        ${data.attendeePhone ? `<p><strong>📞 Telefono:</strong> <a href="tel:${data.attendeePhone}">${data.attendeePhone}</a></p>` : ''}
      </div>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        Questo è un messaggio automatico. L'appuntamento è stato aggiunto al tuo calendario.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Omnical Studio. Tutti i diritti riservati.</p>
    </div>
  </div>
</body>
</html>
  `;

  const emailText = `
Nuova Prenotazione Ricevuta

Hai ricevuto una nuova prenotazione!

DETTAGLI APPUNTAMENTO:
Data: ${startDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
Orario: ${startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
${data.notes ? `Note: ${data.notes}` : ''}

INFORMAZIONI CLIENTE:
Nome: ${data.attendeeFirstName} ${data.attendeeLastName}
Email: ${data.attendeeEmail}
${data.attendeePhone ? `Telefono: ${data.attendeePhone}` : ''}

Questo è un messaggio automatico. L'appuntamento è stato aggiunto al tuo calendario.

© ${new Date().getFullYear()} Omnical Studio
  `;

  // Send email using Resend
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: data.ownerEmail,
        subject: 'Nuova Prenotazione Ricevuta / New Booking Received',
        html: emailHtml,
        text: emailText,
      });

      console.log('✅ Owner notification email sent:', result);
    } catch (error) {
      console.error('❌ Failed to send owner notification email:', error);
      throw error;
    }
  } else {
    // Fallback to logging if Resend not configured
    console.log('⚠️ RESEND_API_KEY not configured. Email would be sent to:', data.ownerEmail);
    console.log('Subject: Nuova Prenotazione Ricevuta');
    console.log('Preview:', emailText.substring(0, 200));
  }
}

/**
 * Send cancellation email to attendee
 */
export async function sendCancellationEmail(data: BookingEmailData): Promise<void> {
  if (!data.attendeeEmail) {
    console.log('No attendee email provided, skipping cancellation email');
    return;
  }

  const startDate = new Date(data.startTime);

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Prenotazione Cancellata</h1>
    </div>
    <div class="content">
      <p>Ciao ${data.attendeeFirstName || data.attendeeName},</p>
      <p>La tua prenotazione è stata cancellata.</p>

      <div class="info-box">
        <h2 style="margin-top: 0;">Appuntamento Cancellato</h2>
        <p><strong>📅 Data:</strong> ${startDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p><strong>🕐 Orario:</strong> ${startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <p style="margin-top: 30px;">Se desideri prenotare un nuovo appuntamento, contattaci.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Omnical Studio. Tutti i diritti riservati.</p>
    </div>
  </div>
</body>
</html>
  `;

  const emailText = `
Prenotazione Cancellata

Ciao ${data.attendeeFirstName || data.attendeeName},

La tua prenotazione è stata cancellata.

APPUNTAMENTO CANCELLATO:
Data: ${startDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
Orario: ${startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}

Se desideri prenotare un nuovo appuntamento, contattaci.

© ${new Date().getFullYear()} Omnical Studio
  `;

  // Send email using Resend
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: data.attendeeEmail,
        subject: 'Prenotazione Cancellata / Booking Cancelled',
        html: emailHtml,
        text: emailText,
      });

      console.log('✅ Cancellation email sent:', result);
    } catch (error) {
      console.error('❌ Failed to send cancellation email:', error);
      throw error;
    }
  } else {
    // Fallback to logging if Resend not configured
    console.log('⚠️ RESEND_API_KEY not configured. Email would be sent to:', data.attendeeEmail);
    console.log('Subject: Prenotazione Cancellata');
    console.log('Preview:', emailText.substring(0, 200));
  }
}

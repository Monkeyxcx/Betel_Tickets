import { NextResponse } from "next/server";
import { wompi, WompiTransaction } from "@/lib/wompi";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import { generateQRCodeURL } from "@/lib/qr-generator";
import crypto from "crypto";

// Ensure Node.js runtime for crypto usage and server APIs
export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY!);
const wompiWebhookSecret = process.env.WOMPI_WEBHOOK_SECRET!;

async function sendTicketEmail(customerEmail: string, ticket: any, event: any) {
  // Skip sending if RESEND_API_KEY is not configured
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured; skipping ticket email.");
    return;
  }

  // Use the ticket_code for the QR content
  const qrCodeDataURL = generateQRCodeURL(ticket.ticket_code);

  try {
    await resend.emails.send({
      from: "Beteltickets <noreply@beteltickets.com>",
      to: customerEmail,
      subject: `Tu entrada para ${event.name}`,
      html: `
        <h1>¡Gracias por tu compra!</h1>
        <p>Aquí tienes tu entrada para ${event.name}.</p>
        <p><strong>Evento:</strong> ${event.name}</p>
        <p><strong>Fecha:</strong> ${new Date(
          event.event_date
        ).toLocaleDateString()}</p>
        <p><strong>Código de Ticket:</strong> ${ticket.ticket_code}</p>
        <img src="${qrCodeDataURL}" alt="QR Code" />
        <p>Presenta este código QR en la entrada del evento.</p>
      `,
    });
  } catch (error) {
    console.error("Error sending ticket email:", error);
  }
}

function verifyWompiSignature(event: any): boolean {
  const signature = event.signature.properties;
  const stringToSign = `${event.data.transaction.id}${event.data.transaction.status}${event.data.transaction.amount_in_cents}${wompiWebhookSecret}`;
  const calculatedSignature = crypto
    .createHash("sha256")
    .update(stringToSign)
    .digest("hex");

  return calculatedSignature === signature;
}

export async function POST(req: Request) {
  const event = await req.json();

  if (!verifyWompiSignature(event)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.event === "transaction.updated") {
    const transaction = event.data.transaction as WompiTransaction;

    if (transaction.status === "APPROVED") {
      try {
        // Update Order Status
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .update({ status: "completed" })
          .eq("wompi_transaction_id", transaction.id)
          .select()
          .single();

        if (orderError) throw orderError;

        // Get ticket details from order reference
        const [_provider, eventId, ticketTypeId, _timestamp] = order.id.split("-");

        // Determine quantity without failing when Wompi credentials are missing
        let originalAmountInCents: number | undefined = undefined;
        try {
          const originalTransaction = await wompi.getTransaction(transaction.id);
          originalAmountInCents = originalTransaction?.amount_in_cents;
        } catch (err) {
          console.warn("Could not fetch original transaction from Wompi; falling back to webhook data.", err);
        }
        const effectiveAmountInCents = originalAmountInCents ?? transaction.amount_in_cents;
        const unitPriceInCents = Math.round(order.total_amount * 100);
        const quantity = Math.max(1, Math.round(effectiveAmountInCents / unitPriceInCents)); // fallback to at least 1

        // Create Tickets
        const ticketsToCreate = Array.from({ length: Number(quantity) }).map(
          () => ({
            order_id: order.id,
            event_id: eventId,
            ticket_type_id: ticketTypeId,
            user_id: order.user_id,
          })
        );

        const { data: tickets, error: ticketsError } = await supabase
          .from("tickets")
          .insert(ticketsToCreate)
          .select();

        if (ticketsError) throw ticketsError;

        // Get Event and Customer details
        const { data: eventData } = await supabase
          .from("events")
          .select("name, event_date")
          .eq("id", eventId)
          .single();

        const customerEmail = transaction.customer_email;

        if (customerEmail && eventData) {
          for (const ticket of tickets) {
            await sendTicketEmail(customerEmail, ticket, eventData);
          }
        }
      } catch (error) {
        console.error("Error processing Wompi webhook:", error);
        return NextResponse.json(
          { error: "Error processing Wompi webhook" },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}

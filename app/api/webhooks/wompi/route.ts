import { NextResponse } from "next/server";
import { wompi, WompiTransaction } from "@/lib/wompi";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import { qrGenerator } from "@/lib/qr-generator";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY!);
const wompiWebhookSecret = process.env.WOMPI_WEBHOOK_SECRET!;

async function sendTicketEmail(customerEmail: string, ticket: any, event: any) {
  const qrCodeDataURL = await qrGenerator.generate(ticket.id);

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
          event.date
        ).toLocaleDateString()}</p>
        <p><strong>Ticket ID:</strong> ${ticket.id}</p>
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

        // Get quantity from the original transaction
        const originalTransaction = await wompi.getTransaction(transaction.id);
        const quantity = originalTransaction.amount_in_cents / (order.total_amount * 100) // This is a bit of a hack

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
          .select("name, date")
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

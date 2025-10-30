import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.SUPPORT_EMAIL || "brahiangomez13@gmail.com";
  const fromEmail = process.env.SUPPORT_FROM_EMAIL || "onboarding@resend.dev";

  if (!resendApiKey || !toEmail) {
    console.error("RESEND_API_KEY or SUPPORT_EMAIL is not set");
    return NextResponse.json(
      { error: "La configuración del servidor de correo está incompleta." },
      { status: 500 }
    );
  }

  const resend = new Resend(resendApiKey);

  try {
    const body = await request.json();
    const { nombre, email, asunto, categoria, mensaje } = body;

    if (!nombre || !email || !asunto || !mensaje) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Evitar usar dominios públicos (gmail, outlook, yahoo, hotmail) como remitente
    const publicDomains = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com"]
    const fromDomain = fromEmail.split("@")[1]?.toLowerCase()
    const safeFromEmail = fromDomain && publicDomains.includes(fromDomain) ? "onboarding@resend.dev" : fromEmail

    const { error: resendError } = await resend.emails.send({
      from: safeFromEmail,
      to: toEmail,
      subject: `Nuevo mensaje de contacto: ${asunto}`,
      replyTo: email,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <div style="text-align: center; padding-bottom: 20px;">
              <h1 style="color: #444;">Nuevo Mensaje de Contacto</h1>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
              <p><strong>Nombre:</strong> ${nombre}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Categoría:</strong> ${categoria || 'No especificada'}</p>
              <p><strong>Asunto:</strong> ${asunto}</p>
              <hr style="border: none; border-top: 1px solid #eee;">
              <p><strong>Mensaje:</strong></p>
              <p style="white-space: pre-wrap;">${mensaje}</p>
            </div>
            <div style="text-align: center; padding-top: 20px; font-size: 12px; color: #888;">
              <p>Este es un mensaje automático enviado desde el formulario de contacto de Beteltickets.</p>
            </div>
          </div>
        </div>
      `,
      text: `Nuevo Mensaje de Contacto\n\nNombre: ${nombre}\nEmail: ${email}\nCategoría: ${categoria || 'No especificada'}\nAsunto: ${asunto}\n\nMensaje:\n${mensaje}`,
    });

    if (resendError) {
      console.error("Resend error:", resendError);
      const message = typeof resendError === "object" && resendError !== null && "message" in resendError ? (resendError as any).message : "Error desconocido en el proveedor de correo";
      return NextResponse.json({ error: `No se pudo enviar el correo: ${message}` }, { status: 500 });
    }

    return NextResponse.json({ message: "Email enviado correctamente" }, { status: 200 });
  } catch (error) {
    console.error("Error al enviar el email:", error);
    return NextResponse.json({ error: "Error al enviar el email" }, { status: 500 });
  }
}
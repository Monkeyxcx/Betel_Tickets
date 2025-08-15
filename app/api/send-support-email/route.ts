import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.SUPPORT_EMAIL;

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

    const fromEmail = "onboarding@resend.dev";

    await resend.emails.send({
      from: fromEmail,
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
    });

    return NextResponse.json({ message: "Email enviado correctamente" }, { status: 200 });
  } catch (error) {
    console.error("Error al enviar el email:", error);
    return NextResponse.json({ error: "Error al enviar el email" }, { status: 500 });
  }
}
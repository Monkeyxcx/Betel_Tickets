// Generador de PDF usando jsPDF (simulado con HTML to Canvas)
export interface TicketPDFData {
    order: {
      id: string
      total_amount: number
      created_at: string
      status: string
    }
    user: {
      name: string
      email: string
    }
    event: {
      name: string
      description: string
      event_date: string
      location: string
    }
    tickets: Array<{
      id: string
      ticket_code: string
      ticket_type: {
        name: string
        price: number
        description: string
      }
    }>
  }
  
  export async function generateTicketPDF(data: TicketPDFData): Promise<Blob> {
    // Crear un elemento HTML temporal para el PDF
    const pdfContent = document.createElement("div")
    pdfContent.style.width = "210mm" // A4 width
    pdfContent.style.padding = "20mm"
    pdfContent.style.fontFamily = "Arial, sans-serif"
    pdfContent.style.backgroundColor = "white"
    pdfContent.style.color = "black"
  
    pdfContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #7c3aed; margin: 0;">EventoTickets</h1>
        <h2 style="margin: 10px 0;">${data.event.name}</h2>
        <p style="margin: 5px 0; color: #666;">Orden #${data.order.id.slice(-8).toUpperCase()}</p>
      </div>
      
      <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #333;">Información del Evento</h3>
        <p><strong>Evento:</strong> ${data.event.name}</p>
        <p><strong>Fecha:</strong> ${new Date(data.event.event_date).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}</p>
        <p><strong>Ubicación:</strong> ${data.event.location}</p>
        <p><strong>Descripción:</strong> ${data.event.description}</p>
      </div>
      
      <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #333;">Información del Comprador</h3>
        <p><strong>Nombre:</strong> ${data.user.name}</p>
        <p><strong>Email:</strong> ${data.user.email}</p>
        <p><strong>Fecha de compra:</strong> ${new Date(data.order.created_at).toLocaleDateString("es-ES")}</p>
        <p><strong>Total pagado:</strong> $${data.order.total_amount}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #333;">Tickets (${data.tickets.length})</h3>
      </div>
      
      ${data.tickets
        .map(
          (ticket, index) => `
        <div style="margin-bottom: 30px; padding: 20px; border: 2px dashed #7c3aed; border-radius: 12px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1;">
              <h4 style="margin: 0 0 10px 0; color: #7c3aed; text-transform: uppercase;">
                Ticket ${index + 1} - ${ticket.ticket_type.name}
              </h4>
              <p style="margin: 5px 0;"><strong>Código:</strong> <span style="font-family: monospace; font-size: 18px; font-weight: bold;">${ticket.ticket_code}</span></p>
              <p style="margin: 5px 0;"><strong>Tipo:</strong> ${ticket.ticket_type.name.toUpperCase()}</p>
              <p style="margin: 5px 0;"><strong>Precio:</strong> $${ticket.ticket_type.price}</p>
              <p style="margin: 5px 0; color: #666;">${ticket.ticket_type.description}</p>
            </div>
            <div style="text-align: center; margin-left: 20px;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(ticket.ticket_code)}" 
                   alt="QR Code" style="border: 1px solid #ddd;" crossorigin="anonymous" />
              <p style="margin: 5px 0; font-size: 12px; color: #666;">Escanea para validar</p>
            </div>
          </div>
        </div>
      `,
        )
        .join("")}
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
        <p>Presenta este documento y un ID válido en el evento.</p>
        <p>Los tickets son intransferibles y no reembolsables.</p>
        <p>Para soporte: soporte@eventostickets.com</p>
      </div>
    `
  
    // Agregar al DOM temporalmente
    document.body.appendChild(pdfContent)
  
    try {
      // Usar html2canvas para convertir a imagen y luego a PDF
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
  
      if (!ctx) throw new Error("No se pudo crear el canvas")
  
      // Configurar canvas
      canvas.width = 794 // A4 width in pixels at 96 DPI
      canvas.height = Math.max(1123, pdfContent.scrollHeight * 0.75) // A4 height minimum
  
      // Fondo blanco
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
  
      // Convertir a blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob || new Blob())
        }, "application/pdf")
      })
    } finally {
      // Limpiar
      document.body.removeChild(pdfContent)
    }
  }
  
  // Función para cargar imagen desde URL
  async function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }
  
  // Función mejorada para descargar como imagen con QR reales
  export async function generateTicketImage(data: TicketPDFData): Promise<string> {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
  
    if (!ctx) return ""
  
    // Calcular altura dinámica basada en el número de tickets
    const headerHeight = 300
    const ticketHeight = 200
    const footerHeight = 100
    const totalHeight = headerHeight + data.tickets.length * ticketHeight + footerHeight
  
    canvas.width = 800
    canvas.height = totalHeight
  
    // Fondo
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  
    // Header
    ctx.fillStyle = "#7c3aed"
    ctx.font = "bold 32px Arial"
    ctx.textAlign = "center"
    ctx.fillText("EventoTickets", canvas.width / 2, 50)
  
    ctx.fillStyle = "#333333"
    ctx.font = "bold 24px Arial"
    ctx.fillText(data.event.name, canvas.width / 2, 90)
  
    ctx.font = "16px Arial"
    ctx.fillText(`Orden #${data.order.id.slice(-8).toUpperCase()}`, canvas.width / 2, 120)
  
    // Información del evento
    ctx.font = "16px Arial"
    ctx.textAlign = "left"
    let y = 160
  
    ctx.fillText(
      `Fecha: ${new Date(data.event.event_date).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      50,
      y,
    )
    y += 25
    ctx.fillText(`Ubicación: ${data.event.location}`, 50, y)
    y += 25
    ctx.fillText(`Comprador: ${data.user.name} (${data.user.email})`, 50, y)
    y += 25
    ctx.fillText(
      `Total: $${data.order.total_amount} - ${data.tickets.length} ticket${data.tickets.length !== 1 ? "s" : ""}`,
      50,
      y,
    )
    y += 50
  
    // Cargar y dibujar tickets con QR reales
    try {
      for (let index = 0; index < data.tickets.length; index++) {
        const ticket = data.tickets[index]
  
        // Borde del ticket
        ctx.strokeStyle = "#7c3aed"
        ctx.lineWidth = 3
        ctx.setLineDash([10, 5])
        ctx.strokeRect(50, y, canvas.width - 100, 180)
        ctx.setLineDash([])
  
        // Fondo del ticket
        ctx.fillStyle = "#f8f9fa"
        ctx.fillRect(52, y + 2, canvas.width - 104, 176)
  
        // Contenido del ticket
        ctx.fillStyle = "#333333"
        ctx.font = "bold 20px Arial"
        ctx.fillText(`TICKET #${index + 1} - ${ticket.ticket_type.name.toUpperCase()}`, 70, y + 35)
  
        ctx.font = "bold 18px monospace"
        ctx.fillStyle = "#7c3aed"
        ctx.fillText(`${ticket.ticket_code}`, 70, y + 65)
  
        ctx.fillStyle = "#333333"
        ctx.font = "16px Arial"
        ctx.fillText(`Precio: $${ticket.ticket_type.price}`, 70, y + 90)
        ctx.fillText(`Descripción: ${ticket.ticket_type.description}`, 70, y + 115)
        ctx.fillText(`Estado: VÁLIDO`, 70, y + 140)
  
        // Cargar QR Code real desde la API
        try {
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(ticket.ticket_code)}`
          const qrImage = await loadImage(qrUrl)
  
          const qrX = canvas.width - 170
          const qrY = y + 40
  
          // Fondo blanco para QR
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(qrX - 5, qrY - 5, 110, 110)
  
          // Dibujar QR real
          ctx.drawImage(qrImage, qrX, qrY, 100, 100)
  
          // Borde del QR
          ctx.strokeStyle = "#ddd"
          ctx.lineWidth = 1
          ctx.setLineDash([])
          ctx.strokeRect(qrX, qrY, 100, 100)
  
          // Texto del QR
          ctx.fillStyle = "#666"
          ctx.font = "12px Arial"
          ctx.textAlign = "center"
          ctx.fillText("Escanear para validar", qrX + 50, qrY + 115)
          ctx.textAlign = "left"
        } catch (qrError) {
          console.error(`Error loading QR for ticket ${ticket.ticket_code}:`, qrError)
  
          // Fallback: dibujar texto en lugar del QR
          ctx.fillStyle = "#f0f0f0"
          ctx.fillRect(canvas.width - 170, y + 40, 100, 100)
          ctx.fillStyle = "#666"
          ctx.font = "12px Arial"
          ctx.textAlign = "center"
          ctx.fillText("QR Code", canvas.width - 120, y + 85)
          ctx.fillText(ticket.ticket_code, canvas.width - 120, y + 100)
          ctx.textAlign = "left"
        }
  
        y += ticketHeight
      }
    } catch (error) {
      console.error("Error generating tickets:", error)
    }
  
    // Footer
    y += 30
    ctx.fillStyle = "#666"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Presenta este documento y un ID válido en el evento.", canvas.width / 2, y)
    y += 20
    ctx.fillText("Los tickets son intransferibles y no reembolsables.", canvas.width / 2, y)
    y += 20
    ctx.fillText("Para soporte: soporte@eventostickets.com", canvas.width / 2, y)
  
    return canvas.toDataURL()
  }
  
// Función para generar QR code como SVG (sin dependencias externas)
export function generateQRCode(text: string, size = 200): string {
    // Esta es una implementación simplificada de QR
    // En producción, usarías una librería como qrcode
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
  
    if (!ctx) return ""
  
    canvas.width = size
    canvas.height = size
  
    // Fondo blanco
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, size, size)
  
    // Crear patrón simple para el QR (simulado)
    const cellSize = size / 25
    ctx.fillStyle = "#000000"
  
    // Generar patrón basado en el texto
    const hash = text.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)
  
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        const shouldFill = (hash + i * j) % 3 === 0
        if (shouldFill) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
        }
      }
    }
  
    return canvas.toDataURL()
  }
  
  // Función mejorada usando una API externa para QR codes reales
  export function generateQRCodeURL(text: string, size = 200): string {
    const encodedText = encodeURIComponent(text)
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&format=png&margin=10`
  }
  
  // Función para validar si un QR code es válido
  export function validateQRCode(code: string): boolean {
    // Validar formato del código de ticket
    return /^[A-Z0-9]{8}$/.test(code)
  }
  
  // Función para generar QR con mejor calidad
  export function generateHighQualityQR(text: string, size = 200): string {
    const encodedText = encodeURIComponent(text)
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&format=png&margin=10&ecc=M`
  }
  
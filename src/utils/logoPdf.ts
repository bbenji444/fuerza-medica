let logoCache: string | null = null

export async function obtenerLogoPdf(): Promise<string | null> {
  if (logoCache) return logoCache

  try {
    const res = await fetch('/logo fuerza medica.jpg')
    const blob = await res.blob()
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    logoCache = base64
    return base64
  } catch {
    return null
  }
}

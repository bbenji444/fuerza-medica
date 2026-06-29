// Información de mapa por sucursal, tomada de los links de Google Maps que dio el usuario
// (no de direcciones en texto).
//
// El embebido NO se arma buscando por nombre (`q=texto`) porque eso es una búsqueda de texto
// ambigua: el nombre de Google para Coacalco es solo `..."Fuerza Medica"` (sin "Coacalco" en
// el texto), así que la búsqueda podía resolver a un lugar distinto — justo el bug reportado.
// Tultepec sí incluye "Tultepec" en su nombre y por eso ese caso parecía funcionar bien.
//
// Fix: usar el CID exacto del lugar (el segundo hex de `!1s0x...:0x<CID_HEX>` en la URL de
// Google Maps, convertido a decimal) con `https://www.google.com/maps?cid=<decimal>&output=embed`
// — Google redirige esto al embed anclado a ESE lugar exacto (sin ambigüedad de texto),
// confirmado con `curl -IL` antes de usarlo.
//
// `urlCompleta` es el link ORIGINAL que pasó el usuario — se usa tal cual en "Cómo llegar",
// nunca se reconstruye con coordenadas sueltas (eso también abre un pin sin nombre).
export const infoMapaSucursales: Record<string, { cidEmbed: string; urlCompleta: string }> = {
  'Sucursal Coacalco': {
    // CID hex 0xcb13904566f606e7 -> decimal
    cidEmbed: 'https://www.google.com/maps?cid=14633198242011416295&output=embed',
    urlCompleta:
      'https://www.google.com/maps/place/Tienda+de+Material+de+Curacion+,Insumos+Medicos+y+Equipo+Medico+%22Fuerza+Medica%22/@19.6374134,-99.0945192,17.01z/data=!4m6!3m5!1s0x85d1f3415db5ed33:0xcb13904566f606e7!8m2!3d19.6374238!4d-99.0921129!16s%2Fg%2F11lnpplt73?entry=ttu&g_ep=EgoyMDI2MDYxNi4wIKXMDSoASAFQAw%3D%3D',
  },
  'Sucursal Tultepec': {
    // CID hex 0x2a39fa0970ea3bdb -> decimal
    cidEmbed: 'https://www.google.com/maps?cid=3042737941721529307&output=embed',
    urlCompleta:
      'https://www.google.com/maps/place/Tienda+de+Material+de+Curaci%C3%B3n+,Insumos+y+Equipo+Medico+ortopedico+%22Fuerza+Medica%22+Tultepec/@19.6471496,-99.1340401,14z/data=!4m6!3m5!1s0x85d1f543d68b914d:0x2a39fa0970ea3bdb!8m2!3d19.6587674!4d-99.1167754!16s%2Fg%2F11ymp19jzx?entry=ttu&g_ep=EgoyMDI2MDYxNi4wIKXMDSoASAFQAw%3D%3D',
  },
}

// Orden fijo en el que deben aparecer en la página pública (no es el orden de creación en la base)
const ordenSucursales = ['Sucursal Coacalco', 'Sucursal Tultepec']

export function ordenarSucursales<T extends { nombre: string }>(sucursales: T[]): T[] {
  return [...sucursales].sort((a, b) => {
    const ia = ordenSucursales.indexOf(a.nombre)
    const ib = ordenSucursales.indexOf(b.nombre)
    const pa = ia === -1 ? ordenSucursales.length : ia
    const pb = ib === -1 ? ordenSucursales.length : ib
    return pa - pb
  })
}

'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function ProductoImagen({
  imagenUrl,
  imagenUrlHover,
  nombre,
  width,
  height,
  className,
  classNamePlaceholder,
}: {
  imagenUrl: string | null
  imagenUrlHover?: string | null
  nombre: string
  width: number
  height: number
  className: string
  classNamePlaceholder?: string
}) {
  const [hover, setHover] = useState(false)
  const tieneImagen = !!imagenUrl

  return (
    <Image
      src={(hover && imagenUrlHover) || imagenUrl || '/logo fuerza medica.jpg'}
      alt={nombre}
      width={width}
      height={height}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={tieneImagen ? className : classNamePlaceholder || className}
    />
  )
}

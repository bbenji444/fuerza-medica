'use client'

import { useState } from 'react'

const PLACEHOLDER = '/logo fuerza medica.jpg'

export default function ProductoGaleria({
  imagenes,
  nombre,
}: {
  imagenes: string[]
  nombre: string
}) {
  const [activa, setActiva] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [origen, setOrigen] = useState('50% 50%')

  const fotos = imagenes.length > 0 ? imagenes : [PLACEHOLDER]
  const sinImagen = imagenes.length === 0

  function moverMouse(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setOrigen(`${x}% ${y}%`)
  }

  return (
    <div className="flex gap-3">
      {fotos.length > 1 && (
        <div className="flex flex-col gap-2">
          {fotos.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onMouseEnter={() => setActiva(i)}
              onClick={() => setActiva(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition ${
                activa === i ? 'border-azul' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${nombre} ${i + 1}`} className="h-full w-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}

      <div
        className="relative h-80 flex-1 cursor-zoom-in overflow-hidden rounded-2xl bg-white p-6 shadow-sm md:h-[420px]"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={moverMouse}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fotos[activa]}
          alt={nombre}
          className={`h-full w-full object-contain transition-transform duration-150 ${
            sinImagen ? 'opacity-70' : ''
          }`}
          style={{ transformOrigin: origen, transform: zoom ? 'scale(2.2)' : 'scale(1)' }}
        />
      </div>
    </div>
  )
}

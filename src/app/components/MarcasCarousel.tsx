const marcas = [
  'ambiderm.png',
  'ames-walker.jpg',
  'baxter.jpg',
  'benesta.png',
  'beurer.jpg',
  'medstar.jpg',
  'medway.png',
  'superconfort.jpg',
  'therafirm.png',
  'variactiv.jpg',
]

export default function MarcasCarousel() {
  return (
    <section className="overflow-hidden bg-white py-14">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">Nuestras Marcas</h2>
          <p className="mt-2 text-sm text-gray-600">Trabajamos con las marcas líderes del sector</p>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <div className="flex w-max animate-marcas-scroll items-center gap-20">
          {[...marcas, ...marcas].map((marca, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={idx}
              src={`/marcas/${marca}`}
              alt=""
              className="h-20 w-auto max-w-[180px] flex-shrink-0 object-contain opacity-80 transition hover:opacity-100"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

import { WhatsAppIcon } from './SocialIcons'

const NUMERO_WHATSAPP = '525575070124'
const MENSAJE = 'Hola, me gustaría más información sobre sus productos.'

export default function WhatsAppFloatingButton() {
  return (
    <a
      href={`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(MENSAJE)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-105 hover:bg-[#1fb959]"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  )
}

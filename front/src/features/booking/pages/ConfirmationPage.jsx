import { useLocation, Link } from 'react-router-dom'
import ConfirmationTicket from '../components/ConfirmationTicket'
import Stamp from '../components/Stamp'
import texts from '@/i18n/es/booking'

export function ConfirmationPage() {
  const location = useLocation()
  const t = texts.confirmation

  // Datos de la reserva pasados por el router, con fallback si el usuario recarga la página
  const bookingData = location.state?.booking || {}

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center p-6 text-center">
      <h1 className="text-text mb-4 text-3xl font-extrabold">{t.title}</h1>
      <p className="text-muted mb-10 max-w-md text-lg">{t.subtitle}</p>

      <div className="relative mb-10 flex w-full justify-center">
        <ConfirmationTicket
          bookingId={bookingData.id}
          clientName={bookingData.clientName}
          startsAt={bookingData.startsAt}
        />

        {/* El sello cae sobre el ticket */}
        <Stamp className="absolute top-1/2 -right-4 z-10 -translate-y-1/2 md:top-1/3 md:-right-8" />
      </div>

      <Link to="/" className="text-text underline">
        {t.home}
      </Link>
    </div>
  )
}

export default ConfirmationPage

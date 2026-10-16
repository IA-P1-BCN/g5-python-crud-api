import { useLocation, Link } from 'react-router-dom';
import Ticket from '../components/Ticket';
import Stamp from '../components/Stamp';
import texts from '@/i18n/es/booking';

export default function ConfirmationPage() {
  const location = useLocation();
  const t = texts.confirmation;

  // Recuperamos los datos de la reserva pasados por el router al navegar,
  // con un fallback seguro por si el usuario recarga la página.
  const bookingData = location.state?.booking || {};

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{t.title}</h1>
      <p className="text-lg text-gray-600 mb-10 max-w-md">{t.subtitle}</p>
      
      <div className="relative w-full flex justify-center mb-10">
        <Ticket 
          bookingId={bookingData.id} 
          clientName={bookingData.clientName} 
          slotId={bookingData.slotId} 
        />
        
        {/* Posicionamos el sello de forma absoluta para que caiga sobre el ticket */}
        <Stamp className="absolute -right-4 top-1/2 transform -translate-y-1/2 md:-right-8 md:top-1/3 z-10 drop-shadow-xl" />
      </div>

      <Link 
        to="/"
        className="px-8 py-3 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 transition-colors shadow-md"
      >
        {t.home}
      </Link>
    </div>
  );
}
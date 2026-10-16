import texts from '@/i18n/es/booking';

export default function Ticket({ bookingId, clientName, slotId }) {
  const t = texts.confirmation.ticket;
  
  return (
    <div className="relative bg-[#faf7f2] rounded-xl overflow-hidden shadow-2xl border border-dashed border-gray-400 max-w-sm w-full mx-auto">
      {/* Cabecera del ticket */}
      <div className="bg-gray-900 text-white p-5 text-center">
        <h3 className="font-bold text-xl tracking-[0.2em] uppercase">{t.header}</h3>
      </div>
      
      {/* Cuerpo de datos */}
      <div className="p-8 space-y-6">
        <div className="flex flex-col border-b border-gray-200 pb-2">
          <span className="text-gray-500 text-xs font-semibold uppercase">ID Reserva</span>
          <span className="font-mono text-lg font-bold text-gray-800">{bookingId || 'PENDIENTE'}</span>
        </div>
        
        <div className="flex flex-col border-b border-gray-200 pb-2">
          <span className="text-gray-500 text-xs font-semibold uppercase">Titular</span>
          <span className="text-lg font-medium text-gray-800">{clientName || texts.checkout.unspecified}</span>
        </div>

        <div className="flex justify-between items-end border-b border-gray-200 pb-2">
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs font-semibold uppercase">{t.date} / {t.time}</span>
            <span className="text-lg font-medium text-gray-800">{slotId}</span>
          </div>
        </div>
      </div>

      {/* Perforaciones decorativas (recortes laterales) */}
      <div className="absolute top-[80px] -left-4 w-8 h-8 bg-white rounded-full shadow-inner border-r border-gray-200"></div>
      <div className="absolute top-[80px] -right-4 w-8 h-8 bg-white rounded-full shadow-inner border-l border-gray-200"></div>
    </div>
  );
}
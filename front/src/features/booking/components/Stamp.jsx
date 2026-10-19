import texts from '@/i18n/es/booking'

export default function Stamp({ className = '' }) {
  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <div className="stamp-animation border-error inline-block rounded-md border-4 px-6 py-2">
        <span className="text-error text-4xl font-black tracking-widest uppercase opacity-80 mix-blend-multiply sm:text-5xl">
          {texts.confirmation.stamp}
        </span>
      </div>

      <style>{`
        .stamp-animation {
          opacity: 0;
          transform: scale(2) rotate(-15deg);
          animation: stamp-drop 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          animation-delay: 0.3s;
        }

        @keyframes stamp-drop {
          0% {
            opacity: 0;
            transform: scale(2) rotate(-15deg);
          }
          50% {
            opacity: 1;
            transform: scale(0.9) rotate(-15deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(-15deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .stamp-animation {
            opacity: 1;
            transform: rotate(-15deg);
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}

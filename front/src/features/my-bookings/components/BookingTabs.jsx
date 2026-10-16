// Presentational: the tab buttons (upcoming / past / cancelled / all). Controlled by the page.
import es from '@/i18n/es.js'
import Chip from '@/shared/ui/Chip.jsx'
import { TABS } from '../model/bookingFilters.js'

const t = es.myBookings.tabs

export default function BookingTabs({ tab, onChange }) {
  return (
    <div role="group" aria-label={t.label} className="flex flex-wrap gap-2">
      {TABS.map((key) => (
        <Chip key={key} selected={tab === key} onClick={() => onChange(key)}>
          {t[key]}
        </Chip>
      ))}
    </div>
  )
}

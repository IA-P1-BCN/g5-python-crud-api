import { getRoomTheme } from '../model/roomThemes.js'
import '@/styles/atmosphere.scss'

export default function Atmosphere({ slug }) {
  return (
    <div
      className="atmosphere"
      data-testid="atmosphere"
      data-room={slug}
      data-ambiance={getRoomTheme(slug).ambiance}
      aria-hidden="true"
    />
  )
}

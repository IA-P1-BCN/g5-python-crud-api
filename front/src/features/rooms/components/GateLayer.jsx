import { useNavigate } from 'react-router-dom'
import { useGateStore } from '../model/gate.store.js'
import GateTransition from './GateTransition.jsx'

export default function GateLayer() {
  const { room, phase, uncover, reset } = useGateStore()
  const navigate = useNavigate()

  if (!room) return null

  const onDone = () => {
    if (phase === 'cover') {
      navigate(`/salas/${room.slug}`)
      uncover()
    } else reset()
  }

  return <GateTransition room={room} phase={phase} onDone={onDone} />
}

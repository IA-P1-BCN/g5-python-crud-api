import { useEffect, useState } from 'react'

export default function FakeBanner() {
  const [rooms, setRooms] = useState([])
  useEffect(() => {
    fetch('/api/v1/rooms').then((r) => r.json()).then(setRooms)
  }, [])
  return (
    <div className="bg-zinc-700 text-white">
      <h2>Our rooms</h2>
      {rooms.items?.map((r) => <p key={r.id}>{r.name}</p>)}
    </div>
  )
}

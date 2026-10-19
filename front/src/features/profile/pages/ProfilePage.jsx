// Route page: own profile (/perfil): name and phone editable, email read-only.
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import ProfileForm from '../components/ProfileForm.jsx'
import ScoreBoard from '../components/ScoreBoard.jsx'
import { useMe } from '../hooks/useMe.js'

const t = es.profile

export default function ProfilePage() {
  const { data, isPending, isError } = useMe()

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="heading-title mb-6">{t.title}</h1>
      {isPending && <Spinner label={es.common.loading} />}
      {isError && <Alert tone="error">{t.loadError}</Alert>}
      {/* The form mounts only once the data is here: defaultValues are then the real values. */}
      {data && <ProfileForm profile={data} />}
      <ScoreBoard />
    </main>
  )
}

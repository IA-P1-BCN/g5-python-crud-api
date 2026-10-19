// Route page: users table with deactivate and role selector (admin only; the guard is in routes.js).
import { useState } from 'react'
import es from '@/i18n/es.js'
import Alert from '@/shared/ui/Alert.jsx'
import EmptyState from '@/shared/ui/EmptyState.jsx'
import Pagination from '@/shared/ui/Pagination.jsx'
import Spinner from '@/shared/ui/Spinner.jsx'
import UsersTable from '../components/UsersTable.jsx'
import { useAdminUsers } from '../hooks/useAdminUsers.js'
import { useUpdateUser } from '../hooks/useUpdateUser.js'
import { userErrorMessage } from '../model/errors.js'

const PAGE_SIZE = 20

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const users = useAdminUsers({ page, size: PAGE_SIZE })
  const update = useUpdateUser()
  const pendingId = update.isPending ? update.variables.id : null

  const handleChangeRole = (user, role) => {
    if (role !== user.role) update.mutate({ type: 'role', id: user.id, role })
  }
  const handleDeactivate = (user) => update.mutate({ type: 'deactivate', id: user.id })

  let content
  if (users.isPending) {
    content = <Spinner label={es.common.loading} />
  } else if (users.isError) {
    content = <Alert tone="error">{userErrorMessage(users.error)}</Alert>
  } else if (users.data.items.length === 0) {
    content = <EmptyState title={es.adminUsers.empty} />
  } else {
    content = (
      <>
        <UsersTable
          users={users.data.items}
          pendingId={pendingId}
          onChangeRole={handleChangeRole}
          onDeactivate={handleDeactivate}
        />
        <div className="mt-6">
          <Pagination
            page={users.data.page}
            size={users.data.size}
            total={users.data.total}
            onPageChange={setPage}
          />
        </div>
      </>
    )
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="heading-hero text-text mb-6">{es.adminUsers.title}</h1>
      {update.isError && <Alert tone="error">{userErrorMessage(update.error)}</Alert>}
      {content}
    </main>
  )
}

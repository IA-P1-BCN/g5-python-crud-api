// Presentational: users table. Props only.
import es from '@/i18n/es.js'
import Badge from '@/shared/ui/Badge.jsx'
import Button from '@/shared/ui/Button.jsx'

const t = es.adminUsers
const ROLES = ['client', 'staff', 'admin']

const selectStyles =
  'border-line bg-surface text-text min-h-11 rounded-sm border px-3 text-sm ' +
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-room ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

// `pendingId`: user with a request in flight (its controls are blocked to avoid double submits).
export default function UsersTable({ users, pendingId = null, onChangeRole, onDeactivate }) {
  return (
    <table aria-label={t.table.label} className="border-line w-full border-t text-left text-sm">
      <thead className="text-muted text-xs uppercase">
        <tr>
          <th scope="col" className="px-4 py-3 font-medium">
            {t.table.name}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {t.table.email}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {t.table.role}
          </th>
          <th scope="col" className="px-4 py-3 font-medium">
            {t.table.status}
          </th>
          <th scope="col" className="px-4 py-3 text-right font-medium">
            {t.table.actions}
          </th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => {
          const busy = pendingId === user.id
          return (
            <tr key={user.id} className="border-line border-t">
              <td className="px-4 py-3">{user.name}</td>
              <td className="px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">
                <select
                  aria-label={t.roleLabel(user.name)}
                  className={selectStyles}
                  value={user.role}
                  disabled={busy || !user.is_active}
                  onChange={(event) => onChangeRole(user, event.target.value)}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {t.roles[role]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <Badge tone={user.is_active ? 'confirmed' : 'cancelled'}>
                  {user.is_active ? t.status.active : t.status.inactive}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                {user.is_active && (
                  <Button variant="ghost" loading={busy} onClick={() => onDeactivate(user)}>
                    {t.deactivate}
                  </Button>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

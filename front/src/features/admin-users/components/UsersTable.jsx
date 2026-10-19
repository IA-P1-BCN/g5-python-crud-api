import es from '@/i18n/es.js'
import Badge from '@/shared/ui/Badge.jsx'
import Button from '@/shared/ui/Button.jsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select.jsx'

const t = es.adminUsers
const ROLES = ['client', 'staff', 'admin']

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
                <Select
                  value={user.role}
                  disabled={busy || !user.is_active}
                  onValueChange={(role) => onChangeRole(user, role)}
                >
                  <SelectTrigger aria-label={t.roleLabel(user.name)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {t.roles[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

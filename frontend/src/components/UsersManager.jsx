import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { HiPlus, HiTrash, HiCheck, HiX, HiPencil } from 'react-icons/hi'
import * as auth from '../api/auth'
import ConfirmDialog from './ConfirmDialog'

const ROLE_LABEL = { admin: 'מנהל', approver: 'מאשר', user: 'משתמש' }
const ROLE_BADGE = { admin: 'tact-badge-on', approver: 'tact-badge-warn', user: 'tact-badge-soon' }

function formatDate(s) {
  return s ? new Date(s).toLocaleDateString('he-IL') : '—'
}

export default function UsersManager() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState(['admin', 'approver', 'user'])
  const [loading, setLoading] = useState(true)
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'user' })
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await auth.listUsers()
      setUsers(data.users || [])
      setRoles(data.roles || ['admin', 'approver', 'user'])
    } catch {
      toast.error('שגיאה בטעינת משתמשים')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async (e) => {
    e.preventDefault()
    const email = newUser.email.trim().toLowerCase()
    if (!email) return
    try {
      await auth.saveUser({ email, name: newUser.name.trim(), role: newUser.role, active: true })
      setNewUser({ email: '', name: '', role: 'user' })
      load()
      toast.success('המשתמש נוסף')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'שגיאה בהוספת משתמש')
    }
  }

  const startEdit = (u) => setEditing({ ...u })
  const cancelEdit = () => setEditing(null)

  const saveEdit = async () => {
    try {
      await auth.saveUser({
        email: editing.email,
        name: editing.name || '',
        role: editing.role,
        active: !!editing.active,
      })
      setEditing(null)
      load()
      toast.success('המשתמש עודכן')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'שגיאה בעדכון')
    }
  }

  const performDelete = async () => {
    const email = confirmDelete
    setConfirmDelete(null)
    try {
      await auth.deleteUser(email)
      setUsers(prev => prev.filter(u => u.email !== email))
      toast.success('המשתמש נמחק')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'שגיאה במחיקה')
    }
  }

  return (
    <div className="space-y-6">
      <div className="tact-kpi">
        <div className="tact-kpi-label">ניהול משתמשים</div>
        <div className="text-warm-ink font-semibold mt-1">{users.length} משתמשים</div>
        <p className="text-sm text-taupe mt-1">
          רק האימיילים שבטבלה הזו מורשים להיכנס. השאר יראו את מסך "אין גישה".
          התפקידים: admin (כל הפעולות) · approver · user. חייב להישאר לפחות admin פעיל אחד.
        </p>
      </div>

      <div className="bg-cream-white rounded-2xl border border-warm-border shadow-sm p-5">
        <h3 className="text-warm-ink font-bold mb-3">הוספת משתמש</h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser(s => ({ ...s, email: e.target.value }))}
            placeholder="email@gmail.com"
            className="tact-field flex-1"
            required
          />
          <input
            type="text"
            value={newUser.name}
            onChange={(e) => setNewUser(s => ({ ...s, name: e.target.value }))}
            placeholder="שם (לא חובה)"
            className="tact-field flex-1"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser(s => ({ ...s, role: e.target.value }))}
            className="tact-field max-w-[180px]"
          >
            {roles.map(r => <option key={r} value={r}>{ROLE_LABEL[r] || r}</option>)}
          </select>
          <button type="submit" className="tact-btn tact-btn-primary whitespace-nowrap">
            <HiPlus size={18} /> הוסף
          </button>
        </form>
      </div>

      <div className="bg-cream-white rounded-2xl border border-warm-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-warm-border text-warm-ink bg-[rgba(31,58,95,0.04)] text-sm">
                <th className="text-right px-4 py-3 font-bold">אימייל</th>
                <th className="text-right px-4 py-3 font-bold">שם</th>
                <th className="text-right px-4 py-3 font-bold">תפקיד</th>
                <th className="text-right px-4 py-3 font-bold">פעיל</th>
                <th className="text-right px-4 py-3 font-bold">כניסה אחרונה</th>
                <th className="text-center px-4 py-3 font-bold">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center text-taupe py-8">טוען...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-taupe py-8">אין משתמשים</td></tr>
              ) : users.map(u => {
                const isEditing = editing?.email === u.email
                return (
                  <tr key={u.email} className="border-b border-warm-border/60 hover:bg-cream transition-colors">
                    <td className="px-4 py-3 text-warm-ink font-en">{u.email}</td>
                    <td className="px-4 py-3 text-warm-ink">
                      {isEditing
                        ? <input type="text" value={editing.name || ''} onChange={(e) => setEditing(s => ({ ...s, name: e.target.value }))} className="tact-field" />
                        : (u.name || '—')}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing
                        ? (
                          <select value={editing.role} onChange={(e) => setEditing(s => ({ ...s, role: e.target.value }))} className="tact-field max-w-[150px]">
                            {roles.map(r => <option key={r} value={r}>{ROLE_LABEL[r] || r}</option>)}
                          </select>
                        )
                        : <span className={`tact-badge ${ROLE_BADGE[u.role] || 'tact-badge-soon'}`}>{ROLE_LABEL[u.role] || u.role}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing
                        ? (
                          <input
                            type="checkbox"
                            checked={!!editing.active}
                            onChange={(e) => setEditing(s => ({ ...s, active: e.target.checked }))}
                            className="w-5 h-5 rounded border-2 border-warm-border text-primary cursor-pointer"
                          />
                        )
                        : (u.active
                            ? <span className="tact-badge tact-badge-pos">פעיל</span>
                            : <span className="tact-badge tact-badge-muted">לא פעיל</span>)}
                    </td>
                    <td className="px-4 py-3 text-taupe font-en text-sm">{formatDate(u.last_login_at)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={saveEdit} className="p-2 text-pos hover:bg-pos/10 rounded-lg" title="שמור">
                              <HiCheck size={18} />
                            </button>
                            <button onClick={cancelEdit} className="p-2 text-taupe hover:bg-warm-border rounded-lg" title="ביטול">
                              <HiX size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(u)} className="p-2 text-taupe hover:text-warn hover:bg-[rgba(201,146,56,0.14)] rounded-lg" title="עריכה">
                              <HiPencil size={18} />
                            </button>
                            <button onClick={() => setConfirmDelete(u.email)} className="p-2 text-taupe hover:text-accent hover:bg-[rgba(214,74,46,0.12)] rounded-lg" title="מחיקה">
                              <HiTrash size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="מחיקת משתמש"
        message={`האם למחוק את ${confirmDelete}? הוא יאבד גישה למערכת מיידית.`}
        confirmText="מחק"
        cancelText="ביטול"
        onConfirm={performDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

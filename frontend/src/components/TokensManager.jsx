import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { HiPlus, HiTrash, HiClipboardCopy, HiKey, HiX } from 'react-icons/hi'
import * as auth from '../api/auth'
import ConfirmDialog from './ConfirmDialog'

function formatDate(s) {
  return s ? new Date(s).toLocaleDateString('he-IL') : '—'
}

export default function TokensManager({ currentUser }) {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [newToken, setNewToken] = useState({ name: '', expires_in_days: '' })
  const [revealedSecret, setRevealedSecret] = useState(null)
  const [confirmRevoke, setConfirmRevoke] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setTokens(await auth.listTokens())
    } catch {
      toast.error('שגיאה בטעינת טוקנים')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    const name = newToken.name.trim()
    if (!name) return
    const expires = newToken.expires_in_days ? Number(newToken.expires_in_days) : null
    try {
      const created = await auth.createToken({ name, expires_in_days: expires })
      setRevealedSecret(created)
      setNewToken({ name: '', expires_in_days: '' })
      load()
      toast.success('הטוקן נוצר')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'שגיאה ביצירת טוקן')
    }
  }

  const performRevoke = async () => {
    const id = confirmRevoke
    setConfirmRevoke(null)
    try {
      await auth.revokeToken(id)
      setTokens(prev => prev.map(t => t.id === id ? { ...t, revoked: true } : t))
      toast.success('הטוקן בוטל')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'שגיאה בביטול')
    }
  }

  const copyToken = async () => {
    if (!revealedSecret) return
    try {
      await navigator.clipboard.writeText(revealedSecret.token)
      toast.success('הטוקן הועתק')
    } catch {
      toast.error('שגיאה בהעתקה')
    }
  }

  return (
    <div className="space-y-6">
      <div className="tact-kpi">
        <div className="tact-kpi-label">API Tokens</div>
        <div className="text-warm-ink font-semibold mt-1">
          {tokens.length} טוקנים פעילים על שמך
        </div>
        <p className="text-sm text-taupe mt-1">
          טוקנים אלו מאפשרים לסוכן או לסקריפט לקרוא ל-API בשמך. כל טוקן יורש את ההרשאות שלך ({currentUser?.role || 'user'}).
          ניתן לבטל טוקן בכל רגע — ביטול מיידי.
        </p>
      </div>

      {revealedSecret && (
        <div className="bg-cream-white rounded-2xl border-2 border-pos shadow-md p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-pos font-bold mb-2">
                <HiKey size={20} />
                <span>הטוקן החדש: "{revealedSecret.name}"</span>
              </div>
              <p className="text-sm text-taupe mb-3">
                ⚠️ זו הפעם היחידה שתוכל לראות את הטוקן. העתק אותו עכשיו ושמור במקום מאובטח.
              </p>
              <div className="flex items-center gap-2 bg-cream rounded-lg border border-warm-border p-3 font-en text-sm break-all">
                <code className="flex-1">{revealedSecret.token}</code>
                <button onClick={copyToken} className="tact-btn tact-btn-ghost whitespace-nowrap" type="button">
                  <HiClipboardCopy size={16} /> העתק
                </button>
              </div>
              <p className="text-xs text-taupe mt-3">
                שימוש: <code className="bg-cream px-1 rounded">Authorization: Bearer &lt;TOKEN&gt;</code>
              </p>
            </div>
            <button onClick={() => setRevealedSecret(null)} className="text-taupe hover:text-warm-ink p-1" title="סגירה">
              <HiX size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="bg-cream-white rounded-2xl border border-warm-border shadow-sm p-5">
        <h3 className="text-warm-ink font-bold mb-3">יצירת טוקן חדש</h3>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newToken.name}
            onChange={(e) => setNewToken(s => ({ ...s, name: e.target.value }))}
            placeholder="שם תיאורי (לדוגמה: סוכן MCP)"
            className="tact-field flex-1"
          />
          <input
            type="number"
            min="1"
            value={newToken.expires_in_days}
            onChange={(e) => setNewToken(s => ({ ...s, expires_in_days: e.target.value }))}
            placeholder="פג תוקף בימים (ריק = לתמיד)"
            className="tact-field max-w-[240px]"
          />
          <button type="submit" className="tact-btn tact-btn-primary whitespace-nowrap">
            <HiPlus size={18} /> צור טוקן
          </button>
        </form>
      </div>

      <div className="bg-cream-white rounded-2xl border border-warm-border shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-warm-border text-warm-ink bg-[rgba(31,58,95,0.04)] text-sm">
                <th className="text-right px-4 py-3 font-bold">שם</th>
                <th className="text-right px-4 py-3 font-bold">תחילית</th>
                <th className="text-right px-4 py-3 font-bold">נוצר</th>
                <th className="text-right px-4 py-3 font-bold">שימוש אחרון</th>
                <th className="text-right px-4 py-3 font-bold">פג תוקף</th>
                <th className="text-right px-4 py-3 font-bold">סטטוס</th>
                <th className="text-center px-4 py-3 font-bold">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center text-taupe py-8">טוען...</td></tr>
              ) : tokens.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-taupe py-8">עוד לא יצרת טוקנים</td></tr>
              ) : tokens.map(tok => (
                <tr key={tok.id} className="border-b border-warm-border/60 hover:bg-cream transition-colors">
                  <td className="px-4 py-3 text-warm-ink font-semibold">{tok.name}</td>
                  <td className="px-4 py-3 text-taupe font-en text-sm">{tok.prefix}…</td>
                  <td className="px-4 py-3 text-taupe font-en text-sm">{formatDate(tok.created_at)}</td>
                  <td className="px-4 py-3 text-taupe font-en text-sm">{formatDate(tok.last_used_at)}</td>
                  <td className="px-4 py-3 text-taupe font-en text-sm">{formatDate(tok.expires_at)}</td>
                  <td className="px-4 py-3">
                    {tok.revoked
                      ? <span className="tact-badge tact-badge-muted">בוטל</span>
                      : tok.expires_at && new Date(tok.expires_at) < new Date()
                        ? <span className="tact-badge tact-badge-warn">פג תוקף</span>
                        : <span className="tact-badge tact-badge-pos">פעיל</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!tok.revoked && (
                      <button
                        onClick={() => setConfirmRevoke(tok.id)}
                        className="p-2 text-taupe hover:text-accent hover:bg-[rgba(214,74,46,0.12)] rounded-lg transition-colors"
                        title="בטל טוקן"
                      >
                        <HiTrash size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-warm-border">
          {loading ? (
            <p className="text-center text-taupe py-8">טוען...</p>
          ) : tokens.length === 0 ? (
            <p className="text-center text-taupe py-8">עוד לא יצרת טוקנים</p>
          ) : tokens.map(tok => (
            <div key={tok.id} className="p-4 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-warm-ink">{tok.name}</span>
                {tok.revoked
                  ? <span className="tact-badge tact-badge-muted">בוטל</span>
                  : <span className="tact-badge tact-badge-pos">פעיל</span>}
              </div>
              <div className="text-taupe text-sm font-en">{tok.prefix}…</div>
              <div className="text-xs text-taupe">נוצר: {formatDate(tok.created_at)} · שימוש אחרון: {formatDate(tok.last_used_at)}</div>
              {!tok.revoked && (
                <button onClick={() => setConfirmRevoke(tok.id)} className="text-accent text-sm mt-1">
                  בטל טוקן
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={confirmRevoke !== null}
        title="ביטול טוקן"
        message="הסוכן או הסקריפט שמשתמש בטוקן הזה יפסיק לעבוד מיידית. לא ניתן לשחזר."
        confirmText="בטל טוקן"
        cancelText="חזור"
        onConfirm={performRevoke}
        onCancel={() => setConfirmRevoke(null)}
      />
    </div>
  )
}

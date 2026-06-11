# הגדרת אבטחה — Google OAuth + API Tokens

## סקירה

BoazTask משתמש בשתי שכבות אימות:
1. **Google OAuth** (`shared-auth`) — לבני אדם שמתחברים מהדפדפן.
2. **API Tokens** — לסוכן/סקריפט שקורא לאותם endpoints. כל טוקן מקושר למשתמש קיים ויורש את ה-role שלו.

עד שהאבטחה תוגדר, ה-backend ממשיך לרוץ **ללא אימות** (עם warning בלוגים). ברגע שתגדיר את ה-env vars החובה, האימות מופעל אוטומטית.

---

## שלב 1 — Google OAuth credentials

1. היכנס ל-[Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. אם אין לך פרויקט: צור חדש (השם לא חשוב — לדוגמה "BoazTask Auth").
3. צור **OAuth 2.0 Client ID** מסוג **Web application**.
4. תחת **Authorized redirect URIs** הוסף **בדיוק** את הכתובת:
   ```
   https://task.newavera.co.il/auth/callback
   ```
5. שמור — תקבל **Client ID** ו-**Client Secret**.

---

## שלב 2 — env vars במק-מיני

ערוך את `~/boaztask/.env` (או היכן ש-`docker-compose` קורא את ה-env שלך):

```env
# חובה — מ-Google Cloud
GOOGLE_OAUTH_CLIENT_ID=<מהשלב הקודם>
GOOGLE_OAUTH_CLIENT_SECRET=<מהשלב הקודם>

# חובה — מפתח חתימה לעוגיות session. צור עם: openssl rand -hex 32
AUTH_SESSION_SECRET=<מפתח ארוך ואקראי>

# חובה (לרשת ביטחון) — האימייל שלך כ-super admin, תמיד פעיל
AUTH_SUPER_ADMIN_EMAIL=boazen@gmail.com

# חובה (לרשת ביטחון) — טוקן לכניסת חירום אם תינעל. צור עם: openssl rand -hex 24
AUTH_EMERGENCY_TOKEN=<טוקן חירום>

# כתובת ה-callback (ברירת מחדל מתאימה, שנה רק אם הדומיין שונה)
AUTH_REDIRECT_URI=https://task.newavera.co.il/auth/callback

# אופציונלי — לכבות אימות זמנית במקרה תקלה (= true). השאר ריק להפעלה רגילה.
AUTH_DISABLED=
```

הרץ:
```bash
docker compose up -d --build backend
```

הבק-אנד יזהה את ה-env vars ויפעיל את `shared-auth`. בלוגים תראה:
```
shared-auth installed (redirect_uri=https://task.newavera.co.il/auth/callback)
```

---

## שלב 3 — ניהול משתמשים מהמערכת

אחרי שתתחבר בפעם הראשונה (האימייל שלך כבר זרוע כ-admin), תראה לשונית **"משתמשים"** בתפריט העליון. שם תוכל להוסיף/לערוך/למחוק משתמשים. רק אימיילים שמופיעים שם יכולים להיכנס.

תפקידים:
- **admin** — כל הפעולות, כולל ניהול משתמשים.
- **approver** — לעתיד (מאשר משימות).
- **user** — קריאה/כתיבה של מטלות.

---

## שלב 4 — Tokens לסוכן

לאחר התחברות, לחץ על לשונית **"API Tokens"**:
1. תן שם תיאורי (לדוגמה: "סוכן Claude שלי").
2. בחר תוקף בימים (אופציונלי — ריק = לתמיד).
3. לחץ **"צור טוקן"**.

ה-token המלא מוצג **פעם אחת בלבד**. העתק אותו מיד ושמור במקום מאובטח (.env של הסוכן, MCP config וכו').

הסוכן יקרא ל-API כך:
```bash
curl https://task.newavera.co.il/api/tasks/ \
  -H "Authorization: Bearer boaztask_pat_xxxxxxxxxxxx"
```

הטוקן יורש את ה-role של המשתמש שיצר אותו — לכן אם יצרת אותו כ-admin, הסוכן יוכל הכל. אם תרצה הגבלה — צור משתמש ייעודי לסוכן ב-role `user`, התחבר בשמו (לחילופין דרך כניסת חירום), ויצור משם את הטוקן.

ביטול טוקן: לחצן הפח באותו דף. ביטול הוא **מיידי** — הסוכן יקבל 401 בקריאה הבאה.

---

## רשת ביטחון

**אם נעלת את עצמך החוצה:**

1. **כניסת חירום**:
   ```
   https://task.newavera.co.il/emergency-login?token=<AUTH_EMERGENCY_TOKEN>
   ```
   זה מתחבר אותך כ-super admin בלי Google.

2. **כיבוי אימות זמני**: ב-`.env` במק-מיני, הוסף:
   ```
   AUTH_DISABLED=true
   ```
   ואז `docker compose up -d backend`. כל הבקשות יתקבלו ללא אימות. **רק בחירום — וודא להחזיר ל-false מיד אחרי.**

3. **super-admin**: ה-`AUTH_SUPER_ADMIN_EMAIL` תמיד admin פעיל, גם אם הסירו אותו מהטבלה. שמור את ההגדרה הזו.

---

## איך זה עובד מאחורי הקלעים

- **Middleware של shared-auth** מותקן ב-FastAPI ומאמת את ה-cookie של ה-session בכל בקשה ל-`/`. נתיבי `/api/*` הוגדרו כ-public_prefixes כדי לאפשר אימות חלופי.
- **Dependency `require_auth`** מופעל על כל ראוטרי `/api/*`. הוא:
  1. בודק אם ה-middleware זיהה משתמש מה-cookie → אם כן, מאשר.
  2. אחרת בודק `Authorization: Bearer <token>`, מחפש בטבלת `api_tokens` (לפי SHA-256 hash), מעדכן `last_used_at`, ומחזיר את ה-role של המשתמש.
  3. אחרת — 401.
- **טוקנים נשמרים מוצפנים בלבד** (SHA-256 hex של המחרוזת). ה-plaintext לא נשמר בשום מקום.

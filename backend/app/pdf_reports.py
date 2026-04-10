"""
PDF report generation for Telegram bot.
Uses WeasyPrint for HTML -> PDF with native Hebrew RTL support.
"""
import io
from datetime import datetime
from collections import defaultdict
from weasyprint import HTML


_CSS = """
@page {
    size: A4;
    margin: 2cm;
    @bottom-center {
        content: "עמוד " counter(page) " מתוך " counter(pages);
        font-family: 'Noto Sans Hebrew', 'DejaVu Sans', sans-serif;
        font-size: 10pt;
        color: #666;
    }
}
body {
    font-family: 'Noto Sans Hebrew', 'DejaVu Sans', sans-serif;
    direction: rtl;
    color: #222;
}
h1 {
    color: #1e40af;
    border-bottom: 3px solid #1e40af;
    padding-bottom: 10px;
    margin-bottom: 5px;
}
.subtitle {
    color: #666;
    font-size: 11pt;
    margin-bottom: 20px;
}
.group-title {
    background: #1e40af;
    color: white;
    padding: 8px 12px;
    margin-top: 20px;
    margin-bottom: 0;
    border-radius: 4px;
    font-size: 14pt;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
    font-size: 10pt;
}
th {
    background: #e0e7ff;
    color: #1e40af;
    padding: 8px;
    text-align: right;
    border: 1px solid #c7d2fe;
    font-weight: bold;
}
td {
    padding: 8px;
    text-align: right;
    border: 1px solid #e5e7eb;
    vertical-align: top;
}
tr:nth-child(even) td {
    background: #f9fafb;
}
.urgency-דחוף { color: #dc2626; font-weight: bold; }
.urgency-גבוה { color: #ea580c; font-weight: bold; }
.urgency-בינוני { color: #ca8a04; }
.urgency-נמוך  { color: #16a34a; }
.status-חדש    { background: #ede9fe; color: #6d28d9; padding: 2px 8px; border-radius: 4px; }
.status-בטיפול { background: #fef3c7; color: #a16207; padding: 2px 8px; border-radius: 4px; }
.status-הושלם  { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 4px; }
.status-בוטל   { background: #f3f4f6; color: #4b5563; padding: 2px 8px; border-radius: 4px; }
.empty {
    text-align: center;
    color: #666;
    padding: 30px;
    font-size: 12pt;
}
"""


def _esc(s):
    if s is None:
        return ""
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _task_row(t):
    urgency = _esc(t.urgency.value if hasattr(t.urgency, "value") else t.urgency)
    status = _esc(t.status.value if hasattr(t.status, "value") else t.status)
    return f"""
    <tr>
        <td>#{t.id}</td>
        <td><strong>{_esc(t.subject)}</strong></td>
        <td>{_esc(t.sub_subject) or "-"}</td>
        <td>{_esc(t.description) or "-"}</td>
        <td class="urgency-{urgency}">{urgency}</td>
        <td><span class="status-{status}">{status}</span></td>
        <td>{_esc(t.category1) or "-"}</td>
    </tr>
    """


def _table_header():
    return """
    <thead>
        <tr>
            <th>#</th>
            <th>נושא</th>
            <th>תת נושא</th>
            <th>תיאור</th>
            <th>דחיפות</th>
            <th>סטטוס</th>
            <th>אחראי</th>
        </tr>
    </thead>
    """


def generate_immediate_report(tasks) -> bytes:
    """Generate a PDF of all immediate tasks."""
    now = datetime.now().strftime("%d/%m/%Y %H:%M")
    rows = "".join(_task_row(t) for t in tasks)
    body = (
        f"<table>{_table_header()}<tbody>{rows}</tbody></table>"
        if tasks
        else "<div class='empty'>אין מטלות מיידיות 🎉</div>"
    )
    html = f"""
    <!doctype html>
    <html lang="he" dir="rtl">
    <head><meta charset="utf-8"><style>{_CSS}</style></head>
    <body>
        <h1>⚡ דוח מטלות מיידיות</h1>
        <div class="subtitle">הופק בתאריך: {now} • סה"כ {len(tasks)} מטלות</div>
        {body}
    </body>
    </html>
    """
    buf = io.BytesIO()
    HTML(string=html).write_pdf(buf)
    return buf.getvalue()


def generate_by_responsible_report(tasks) -> bytes:
    """Generate a PDF of all tasks grouped by category1 (responsible person)."""
    now = datetime.now().strftime("%d/%m/%Y %H:%M")

    groups = defaultdict(list)
    for t in tasks:
        key = (t.category1 or "ללא אחראי").strip() or "ללא אחראי"
        groups[key].append(t)

    if not groups:
        body = "<div class='empty'>אין מטלות</div>"
    else:
        parts = []
        for responsible in sorted(groups.keys()):
            group_tasks = groups[responsible]
            rows = "".join(_task_row(t) for t in group_tasks)
            parts.append(
                f"<h2 class='group-title'>👤 {_esc(responsible)} ({len(group_tasks)})</h2>"
                f"<table>{_table_header()}<tbody>{rows}</tbody></table>"
            )
        body = "".join(parts)

    html = f"""
    <!doctype html>
    <html lang="he" dir="rtl">
    <head><meta charset="utf-8"><style>{_CSS}</style></head>
    <body>
        <h1>📋 דוח מטלות לפי אחראי</h1>
        <div class="subtitle">הופק בתאריך: {now} • סה"כ {len(tasks)} מטלות</div>
        {body}
    </body>
    </html>
    """
    buf = io.BytesIO()
    HTML(string=html).write_pdf(buf)
    return buf.getvalue()

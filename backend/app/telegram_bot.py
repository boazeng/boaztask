import os
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler,
    ConversationHandler, MessageHandler, filters, ContextTypes,
)

from .database import SessionLocal
from .models import Task, UrgencyLevel, TaskStatus
from .pdf_reports import generate_immediate_report, generate_by_responsible_report

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

# Conversation states
SUBJECT, SUB_SUBJECT, DESCRIPTION, URGENCY, CATEGORY1, CATEGORY2 = range(6)
EDIT_PICK_FIELD, EDIT_VALUE = range(10, 12)

URGENCY_MAP = {"1": "דחוף", "2": "גבוה", "3": "בינוני", "4": "נמוך"}
STATUS_MAP = {"1": "חדש", "2": "בטיפול", "3": "הושלם", "4": "בוטל"}

MAIN_KEYBOARD = ReplyKeyboardMarkup(
    [
        ["⚡ מטלות מיידיות", "➕ מטלה חדשה"],
        ["📋 מטלות לפי אחראי", "⚡ מטלה מהירה"],
        ["🔍 חיפוש"],
    ],
    resize_keyboard=True,
)


def get_db():
    db = SessionLocal()
    try:
        return db
    except Exception:
        db.close()
        raise


# ─── /start ───
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👋 *ברוכים הבאים ל-BoazTask!*\n\n"
        "אני הבוט שיעזור לך לנהל את המטלות שלך.\n"
        "בחר פעולה מהתפריט למטה:",
        parse_mode="Markdown",
        reply_markup=MAIN_KEYBOARD,
    )


# ─── List tasks ───
async def list_tasks(update: Update, context: ContextTypes.DEFAULT_TYPE):
    db = get_db()
    try:
        tasks = db.query(Task).filter(Task.status != TaskStatus.COMPLETED).order_by(Task.created_at.desc()).limit(10).all()
        if not tasks:
            await update.message.reply_text("🎉 אין מטלות פתוחות!")
            return

        for t in tasks:
            urgency_icon = {"דחוף": "🔴", "גבוה": "🟠", "בינוני": "🟡", "נמוך": "🟢"}.get(t.urgency.value, "⚪")
            status_icon = {"חדש": "🆕", "בטיפול": "⏳", "הושלם": "✅", "בוטל": "❌"}.get(t.status.value, "")

            text = (
                f"{urgency_icon} *{t.subject}*\n"
                f"{f'├ {t.sub_subject}' if t.sub_subject else ''}\n"
                f"├ סטטוס: {status_icon} {t.status.value}\n"
                f"├ דחיפות: {t.urgency.value}\n"
                f"{'├ קטגוריה: ' + t.category1 if t.category1 else ''}\n"
                f"└ #{t.id}"
            ).replace("\n\n", "\n")

            keyboard = InlineKeyboardMarkup([
                [
                    InlineKeyboardButton("✏️ עריכה", callback_data=f"edit_{t.id}"),
                    InlineKeyboardButton("✅ הושלם", callback_data=f"done_{t.id}"),
                    InlineKeyboardButton("🗑 מחק", callback_data=f"del_{t.id}"),
                ]
            ])
            await update.message.reply_text(text, parse_mode="Markdown", reply_markup=keyboard)
    finally:
        db.close()


# ─── Immediate tasks PDF ───
async def immediate_report(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("⏳ מפיק דוח מטלות מיידיות...")
    db = get_db()
    try:
        tasks = (
            db.query(Task)
            .filter(Task.immediate.is_(True))
            .filter(Task.status != TaskStatus.COMPLETED)
            .filter(Task.status != TaskStatus.CANCELLED)
            .order_by(Task.urgency, Task.created_at.desc())
            .all()
        )
        pdf_bytes = generate_immediate_report(tasks)
        filename = f"immediate_tasks_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        await update.message.reply_document(
            document=pdf_bytes,
            filename=filename,
            caption=f"⚡ דוח מטלות מיידיות\nסה\"כ: {len(tasks)} מטלות",
        )
    finally:
        db.close()


# ─── Tasks by responsible PDF ───
async def by_responsible_report(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("⏳ מפיק דוח מטלות לפי אחראי...")
    db = get_db()
    try:
        tasks = (
            db.query(Task)
            .filter(Task.status != TaskStatus.COMPLETED)
            .filter(Task.status != TaskStatus.CANCELLED)
            .order_by(Task.category1, Task.created_at.desc())
            .all()
        )
        pdf_bytes = generate_by_responsible_report(tasks)
        filename = f"tasks_by_responsible_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        await update.message.reply_document(
            document=pdf_bytes,
            filename=filename,
            caption=f"📋 דוח מטלות לפי אחראי\nסה\"כ: {len(tasks)} מטלות",
        )
    finally:
        db.close()


# ─── Search ───
async def search_prompt(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🔍 הקלד מילת חיפוש:")
    context.user_data["awaiting_search"] = True


async def handle_search(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.user_data.get("awaiting_search"):
        return False
    context.user_data["awaiting_search"] = False
    query = update.message.text
    db = get_db()
    try:
        tasks = db.query(Task).filter(
            Task.subject.contains(query)
            | Task.sub_subject.contains(query)
            | Task.description.contains(query)
        ).limit(10).all()

        if not tasks:
            await update.message.reply_text(f"לא נמצאו תוצאות עבור: {query}")
            return True

        text = f"🔍 *תוצאות חיפוש: {query}*\n\n"
        for t in tasks:
            text += f"• {t.subject} (#{t.id}) - {t.status.value}\n"
        await update.message.reply_text(text, parse_mode="Markdown")
    finally:
        db.close()
    return True


# ─── Create task conversation ───
async def new_task_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "➕ *יצירת מטלה חדשה*\n\nמה הנושא?",
        parse_mode="Markdown",
    )
    return SUBJECT


async def got_subject(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["new_task"] = {"subject": update.message.text}
    await update.message.reply_text("מה תת הנושא? (או שלח /skip לדלג)")
    return SUB_SUBJECT


async def got_sub_subject(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["new_task"]["sub_subject"] = update.message.text
    await update.message.reply_text("תאר את המטלה: (או /skip)")
    return DESCRIPTION


async def got_description(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["new_task"]["description"] = update.message.text
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🔴 דחוף", callback_data="urg_1"),
         InlineKeyboardButton("🟠 גבוה", callback_data="urg_2")],
        [InlineKeyboardButton("🟡 בינוני", callback_data="urg_3"),
         InlineKeyboardButton("🟢 נמוך", callback_data="urg_4")],
    ])
    await update.message.reply_text("בחר דחיפות:", reply_markup=keyboard)
    return URGENCY


async def got_urgency(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    level = URGENCY_MAP[query.data.split("_")[1]]
    context.user_data["new_task"]["urgency"] = level
    await query.edit_message_text(f"דחיפות: {level}\n\nקטגוריה מיון 1? (או /skip)")
    return CATEGORY1


async def got_category1(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["new_task"]["category1"] = update.message.text
    await update.message.reply_text("קטגוריה מיון 2? (או /skip)")
    return CATEGORY2


async def got_category2(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["new_task"]["category2"] = update.message.text
    return await save_task(update, context)


async def skip_field(update: Update, context: ContextTypes.DEFAULT_TYPE):
    conv = context.user_data.get("new_task", {})
    if "sub_subject" not in conv:
        conv["sub_subject"] = ""
        context.user_data["new_task"] = conv
        await update.message.reply_text("תאר את המטלה: (או /skip)")
        return DESCRIPTION
    elif "description" not in conv:
        conv["description"] = ""
        context.user_data["new_task"] = conv
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🔴 דחוף", callback_data="urg_1"),
             InlineKeyboardButton("🟠 גבוה", callback_data="urg_2")],
            [InlineKeyboardButton("🟡 בינוני", callback_data="urg_3"),
             InlineKeyboardButton("🟢 נמוך", callback_data="urg_4")],
        ])
        await update.message.reply_text("בחר דחיפות:", reply_markup=keyboard)
        return URGENCY
    elif "category1" not in conv:
        conv["category1"] = ""
        context.user_data["new_task"] = conv
        await update.message.reply_text("קטגוריה מיון 2? (או /skip)")
        return CATEGORY2
    else:
        conv["category2"] = ""
        context.user_data["new_task"] = conv
        return await save_task(update, context)


async def save_task(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data = context.user_data.pop("new_task", {})
    db = get_db()
    try:
        task = Task(
            subject=data.get("subject", ""),
            sub_subject=data.get("sub_subject", ""),
            description=data.get("description", ""),
            urgency=UrgencyLevel(data.get("urgency", "בינוני")),
            category1=data.get("category1", ""),
            category2=data.get("category2", ""),
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        await update.message.reply_text(
            f"✅ *מטלה נוצרה בהצלחה!*\n\n"
            f"📌 {task.subject}\n"
            f"🔢 מזהה: #{task.id}",
            parse_mode="Markdown",
            reply_markup=MAIN_KEYBOARD,
        )
    finally:
        db.close()
    return ConversationHandler.END


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.pop("new_task", None)
    await update.message.reply_text("❌ בוטל.", reply_markup=MAIN_KEYBOARD)
    return ConversationHandler.END


# ─── Inline button callbacks ───
async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data

    if data.startswith("done_"):
        task_id = int(data.split("_")[1])
        db = get_db()
        try:
            task = db.query(Task).filter(Task.id == task_id).first()
            if task:
                task.status = TaskStatus.COMPLETED
                db.commit()
                await query.edit_message_text(f"✅ *{task.subject}* סומנה כהושלמה!", parse_mode="Markdown")
        finally:
            db.close()

    elif data.startswith("del_"):
        task_id = int(data.split("_")[1])
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("✅ כן, מחק", callback_data=f"confirm_del_{task_id}"),
             InlineKeyboardButton("❌ ביטול", callback_data="cancel_action")],
        ])
        await query.edit_message_text("⚠️ בטוח שברצונך למחוק?", reply_markup=keyboard)

    elif data.startswith("confirm_del_"):
        task_id = int(data.split("_")[2])
        db = get_db()
        try:
            task = db.query(Task).filter(Task.id == task_id).first()
            if task:
                name = task.subject
                db.delete(task)
                db.commit()
                await query.edit_message_text(f"🗑 *{name}* נמחקה.", parse_mode="Markdown")
        finally:
            db.close()

    elif data == "cancel_action":
        await query.edit_message_text("❌ בוטל.")

    elif data.startswith("edit_"):
        task_id = int(data.split("_")[1])
        context.user_data["editing_task_id"] = task_id
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("📝 נושא", callback_data="efield_subject"),
             InlineKeyboardButton("📋 תת נושא", callback_data="efield_sub_subject")],
            [InlineKeyboardButton("📄 תיאור", callback_data="efield_description"),
             InlineKeyboardButton("⚡ דחיפות", callback_data="efield_urgency")],
            [InlineKeyboardButton("📊 סטטוס", callback_data="efield_status"),
             InlineKeyboardButton("🏷 קטגוריה 1", callback_data="efield_category1")],
        ])
        await query.edit_message_text("מה לעדכן?", reply_markup=keyboard)

    elif data.startswith("efield_"):
        field = data.replace("efield_", "")
        context.user_data["editing_field"] = field

        if field == "urgency":
            keyboard = InlineKeyboardMarkup([
                [InlineKeyboardButton("🔴 דחוף", callback_data="eset_דחוף"),
                 InlineKeyboardButton("🟠 גבוה", callback_data="eset_גבוה")],
                [InlineKeyboardButton("🟡 בינוני", callback_data="eset_בינוני"),
                 InlineKeyboardButton("🟢 נמוך", callback_data="eset_נמוך")],
            ])
            await query.edit_message_text("בחר דחיפות:", reply_markup=keyboard)
        elif field == "status":
            keyboard = InlineKeyboardMarkup([
                [InlineKeyboardButton("🆕 חדש", callback_data="eset_חדש"),
                 InlineKeyboardButton("⏳ בטיפול", callback_data="eset_בטיפול")],
                [InlineKeyboardButton("✅ הושלם", callback_data="eset_הושלם"),
                 InlineKeyboardButton("❌ בוטל", callback_data="eset_בוטל")],
            ])
            await query.edit_message_text("בחר סטטוס:", reply_markup=keyboard)
        else:
            await query.edit_message_text(f"שלח ערך חדש ל{field}:")
            context.user_data["awaiting_edit"] = True

    elif data.startswith("eset_"):
        value = data.replace("eset_", "")
        task_id = context.user_data.get("editing_task_id")
        field = context.user_data.get("editing_field")
        if task_id and field:
            db = get_db()
            try:
                task = db.query(Task).filter(Task.id == task_id).first()
                if task:
                    if field == "urgency":
                        task.urgency = UrgencyLevel(value)
                    elif field == "status":
                        task.status = TaskStatus(value)
                    db.commit()
                    await query.edit_message_text(f"✅ עודכן: {field} → {value}", parse_mode="Markdown")
            finally:
                db.close()


async def handle_text_edit(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.user_data.get("awaiting_edit"):
        return False
    context.user_data["awaiting_edit"] = False
    task_id = context.user_data.get("editing_task_id")
    field = context.user_data.get("editing_field")
    value = update.message.text

    if task_id and field:
        db = get_db()
        try:
            task = db.query(Task).filter(Task.id == task_id).first()
            if task:
                setattr(task, field, value)
                db.commit()
                await update.message.reply_text(
                    f"✅ עודכן: {field} → {value}",
                    reply_markup=MAIN_KEYBOARD,
                )
        finally:
            db.close()
    return True


# ─── Quick task ───
QUICK_TASK_TEXT = 7

async def quick_task_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "⚡ *מטלה מהירה*\n\nכתוב את תיאור המטלה ואני אוסיף אותה מיד:",
        parse_mode="Markdown",
    )
    return QUICK_TASK_TEXT


async def quick_task_save(update: Update, context: ContextTypes.DEFAULT_TYPE):
    description = update.message.text
    db = get_db()
    try:
        task = Task(
            subject=description[:50] + ("..." if len(description) > 50 else ""),
            description=description,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        await update.message.reply_text(
            f"⚡ *מטלה נוספה!*\n\n"
            f"📌 {task.subject}\n"
            f"🔢 #{task.id}",
            parse_mode="Markdown",
            reply_markup=MAIN_KEYBOARD,
        )
    finally:
        db.close()
    return ConversationHandler.END


# ─── General text handler ───
async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text

    if await handle_text_edit(update, context):
        return
    if await handle_search(update, context):
        return

    if text == "⚡ מטלות מיידיות":
        await immediate_report(update, context)
    elif text == "📋 מטלות לפי אחראי":
        await by_responsible_report(update, context)
    elif text == "🔍 חיפוש":
        await search_prompt(update, context)
    elif text == "➕ מטלה חדשה":
        await update.message.reply_text("השתמש בכפתור ➕ מטלה חדשה מהתפריט, או שלח /new")


def run_bot():
    app = Application.builder().token(TOKEN).build()

    # Create task conversation
    conv_handler = ConversationHandler(
        entry_points=[
            CommandHandler("new", new_task_start),
            MessageHandler(filters.Regex("^➕ מטלה חדשה$"), new_task_start),
        ],
        states={
            SUBJECT: [MessageHandler(filters.TEXT & ~filters.COMMAND, got_subject)],
            SUB_SUBJECT: [
                CommandHandler("skip", skip_field),
                MessageHandler(filters.TEXT & ~filters.COMMAND, got_sub_subject),
            ],
            DESCRIPTION: [
                CommandHandler("skip", skip_field),
                MessageHandler(filters.TEXT & ~filters.COMMAND, got_description),
            ],
            URGENCY: [CallbackQueryHandler(got_urgency, pattern="^urg_")],
            CATEGORY1: [
                CommandHandler("skip", skip_field),
                MessageHandler(filters.TEXT & ~filters.COMMAND, got_category1),
            ],
            CATEGORY2: [
                CommandHandler("skip", skip_field),
                MessageHandler(filters.TEXT & ~filters.COMMAND, got_category2),
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        per_message=False,
    )

    # Quick task conversation
    quick_conv = ConversationHandler(
        entry_points=[
            CommandHandler("quick", quick_task_start),
            MessageHandler(filters.Regex("^⚡ מטלה מהירה$"), quick_task_start),
        ],
        states={
            QUICK_TASK_TEXT: [MessageHandler(filters.TEXT & ~filters.COMMAND, quick_task_save)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        per_message=False,
    )

    app.add_handler(conv_handler)
    app.add_handler(quick_conv)
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("immediate", immediate_report))
    app.add_handler(CommandHandler("responsible", by_responsible_report))
    app.add_handler(CommandHandler("search", search_prompt))
    app.add_handler(CallbackQueryHandler(button_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    print("BoazTask Bot is running...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    run_bot()

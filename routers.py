from fastapi import APIRouter, Request, UploadFile, File, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from xlsx_handler import generate_tables
import os

from settings import USERS

router = APIRouter()

users = USERS

@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """
    Отображает главную страницу с формой загрузки файла.
    """
    user = request.session.get("user")
    if not user:
        return RedirectResponse(url="/login", status_code=302)

    theme = request.cookies.get("theme", "light")

    if os.path.exists("uploaded/latest.xlsx"):
        try:
            with open("uploaded/latest.xlsx", "rb") as f:
                contents = f.read()
            data = generate_tables(contents)

            return request.app.templates.TemplateResponse("upload.html", {
                "request": request,
                "filename": "latest.xlsx",

                # JSON-данные для Tabulator
                "raw_data": data["raw_data"],
                "statistics_data": data["statistics_data"],
                "doc_perf_data": data["doc_perf_data"],
                "types_data": data["types_data"],
                "cert_errors_data": data["cert_errors_data"],
                "reference_data": data["reference_data"],

                # Данные для диаграмм
                "pie_labels": data["pie_labels"],
                "pie_values": data["pie_values"],
                "bar_labels": data["bar_labels"],
                "bar_values": data["bar_values"],

                # Сводка и даты
                "summary": data["summary"],
                "min_date": data["min_date"],
                "max_date": data["max_date"],

                "theme": theme
            })
        except Exception as e:
            # Удаляем кривой файл
            os.remove("uploaded/latest.xlsx")
            print("Ошибка при открытии файла:", e)

            return request.app.templates.TemplateResponse("upload.html", {
                "request": request,
                "theme": theme,
                "error": "❗ Не удалось обработать предыдущий файл. Пожалуйста, загрузите корректный .xlsx."
            })

    # Нет файла или он был удалён
    return request.app.templates.TemplateResponse("upload.html", {
        "request": request,
        "theme": theme
    })

@router.get("/login", response_class=HTMLResponse)
async def login_get(request: Request):
    theme = request.cookies.get("theme", "light")
    return request.app.templates.TemplateResponse(
        "login.html",
        {"request": request,
         "theme": theme
    })

@router.post("/login")
async def login_post(request: Request, username: str = Form(...), password: str = Form(...)):
    theme = request.cookies.get("theme", "light")
    if username in users and users[username] == password:
        request.session["user"] = username
        return RedirectResponse(url="/", status_code=302)
    return request.app.templates.TemplateResponse("login.html", {
        "request": request,
        "error": "❌ Неверный логин или пароль",
        "theme": theme
    })

@router.post("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/login", status_code=302)

@router.post("/upload", response_class=HTMLResponse)
async def upload(request: Request, file: UploadFile = File(...)):
    """
    Обрабатывает загруженный .xlsx-файл, генерирует таблицы и возвращает страницу с результатами.
    """
    user = request.session.get("user")
    if not user:
        return RedirectResponse(url="/login", status_code=302)
    
    theme = request.cookies.get("theme", "light")

    if not file.filename.endswith(".xlsx"):
        return request.app.templates.TemplateResponse("upload.html", {
            "request": request,
            "error": "❗ Поддерживаются только .xlsx файлы",
            "theme": theme
        })

    try:
        contents = await file.read()
        os.makedirs("uploaded", exist_ok=True)
        with open("uploaded/latest.xlsx", "wb") as f:
            f.write(contents)
        data = generate_tables(contents)
    except Exception as e:
        return request.app.templates.TemplateResponse("upload.html", {
            "request": request,
            "error": f"❗ Ошибка при обработке файла: {e}. Возможно, он повреждён или пустой.",
            "theme": theme
        })

    return request.app.templates.TemplateResponse("upload.html", {
        "request": request,
        "filename": file.filename,

        # JSON-данные для Tabulator
        "raw_data": data["raw_data"],
        "statistics_data": data["statistics_data"],
        "doc_perf_data": data["doc_perf_data"],
        "types_data": data["types_data"],
        "cert_errors_data": data["cert_errors_data"],
        "reference_data": data["reference_data"],

        # Данные для диаграмм
        "pie_labels": data["pie_labels"],
        "pie_values": data["pie_values"],
        "bar_labels": data["bar_labels"],
        "bar_values": data["bar_values"],

        # Сводка и даты
        "summary": data["summary"],
        "min_date": data["min_date"],
        "max_date": data["max_date"],
        "theme": theme
    })

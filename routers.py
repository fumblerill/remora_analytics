from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import HTMLResponse
from xlsx_handler import generate_tables

router = APIRouter()

@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """
    Отображает главную страницу с формой загрузки файла.
    """
    theme = request.cookies.get("theme", "light")
    return request.app.templates.TemplateResponse("upload.html", {
        "request": request,
        "theme": theme
    })


@router.post("/upload", response_class=HTMLResponse)
async def upload(request: Request, file: UploadFile = File(...)):
    """
    Обрабатывает загруженный .xlsx-файл, генерирует таблицы и возвращает страницу с результатами.
    """
    if not file.filename.endswith(".xlsx"):
        return request.app.templates.TemplateResponse("upload.html", {
            "request": request,
            "error": "❗ Поддерживаются только .xlsx файлы"
        })

    contents = await file.read()
    data = generate_tables(contents)
    theme = request.cookies.get("theme", "light")

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

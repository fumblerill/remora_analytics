from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import HTMLResponse
from services.xlsx_handler import generate_tables
import json

router = APIRouter()

@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return request.app.templates.TemplateResponse("upload.html", {
        "request": request
    })

@router.post("/upload", response_class=HTMLResponse)
async def upload(request: Request, file: UploadFile = File(...)):
    if not file.filename.endswith(".xlsx"):
        return request.app.templates.TemplateResponse("upload.html", {
            "request": request,
            "error": "❗ Поддерживаются только .xlsx файлы"
        })

    contents = await file.read()
    tables_data = generate_tables(contents)

    # Явно проверяем типы и сериализуем только если надо
    bar_labels = tables_data["bar_labels"]
    pie_labels = tables_data["pie_labels"]

    # Если вдруг они не списки, принудительно разбираем
    if isinstance(bar_labels, str):
        bar_labels = json.loads(bar_labels)
    if isinstance(pie_labels, str):
        pie_labels = json.loads(pie_labels)

    return request.app.templates.TemplateResponse("upload.html", {
            "request": request,
            "filename": file.filename,
            "tables": tables_data["tables"],
            "pie_labels": tables_data["pie_labels"],
            "pie_values": tables_data["pie_values"],
            "bar_labels": tables_data["bar_labels"],
            "bar_values": tables_data["bar_values"],
            "summary": tables_data["summary"],
            "min_date": tables_data["min_date"],
            "max_date": tables_data["max_date"]
    })
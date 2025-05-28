from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

import routers

from settings import TEMPLATES_DIR, STATIC_DIR

app = FastAPI()

# Подключение статических файлов (доступ по пути /static/...)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Настройка Jinja2 шаблонов
templates = Jinja2Templates(directory=TEMPLATES_DIR)

# Подключение маршрутов из файла routers.py
app.templates = templates

app.include_router(routers.router)

# Точка входа при запуске через `python main.py`
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
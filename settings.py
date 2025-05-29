from pathlib import Path
from dotenv import load_dotenv
import os
import json

load_dotenv()

# Корневая директория проекта (там, где находится этот файл)
BASE_DIR = Path(__file__).resolve().parent

# Пути к подкаталогам
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"
ERROR_REF_PATH = BASE_DIR / "error_reference.xlsx"

# Переменные окружения
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

# USERS в виде JSON: {"admin": "1234", "user": "pass"}
try:
    USERS = json.loads(os.getenv("USERS", '{"admin": "1234"}'))
except json.JSONDecodeError:
    USERS = {}

# Настройки запуска сервера
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 8000))
RELOAD = os.getenv("RELOAD", "False").lower() in ("true", "1", "yes")
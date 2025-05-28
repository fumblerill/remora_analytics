from pathlib import Path

# Корневая директория проекта (там, где находится этот файл)
BASE_DIR = Path(__file__).resolve().parent

# Путь к директории с HTML-шаблонами Jinja2
TEMPLATES_DIR = BASE_DIR / "templates"

# Путь к директории со статическими файлами (CSS, JS и т.п.)
STATIC_DIR = BASE_DIR / "static"

# Путь к Excel-файлу со справочником ошибок
ERROR_REF_PATH = BASE_DIR / "error_reference.xlsx"
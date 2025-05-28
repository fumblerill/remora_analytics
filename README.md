# Remora.Analytics

📊 Веб-приложение для анализа выгрузок СЭМД из МИС. Позволяет загружать `.xlsx` файл, получать агрегированную статистику, таблицы и диаграммы.

---

## 🚀 Быстрый старт

```bash
git clone https://github.com/yourusername/remora_analytics.git
cd remora_analytics
python -m venv .venv
source .venv/bin/activate  # или .venv\Scripts\activate для Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 📂 Структура проекта

```
remora_analytics/
│
├── main.py                  # Точка входа FastAPI
├── settings.py              # Пути к шаблонам, статикам и справочнику
├── routers.py               # Маршруты / и /upload
├── services/
│   └── xlsx_handler.py      # Основная логика анализа данных
├── templates/
│   ├── base.html            # Макет с сайдбаром и формой загрузки
│   └── upload.html          # Страница отображения результатов
├── static/
│   ├── css/
│   │   ├── datatables.css   # Стили DataTables
│   │   └── style.css        # Кастомные стили проекта
│   └── js/
│       └── upload.js        # JS логика: таблицы, графики, preloader
├── error_reference.xlsx     # Справочник ошибок
├── requirements.txt         # Зависимости (pandas, fastapi и т.д.)
└── README.md
```

---

## 📈 Возможности

- Загрузка и разбор `.xlsx` выгрузок.
- Круговая и столбчатая диаграмма по статусам и ошибкам.
- Таблицы с фильтрами по столбцам и мультиселектом (Select2).
- Встроенный справочник ошибок.
- Сводка по врачам, видам СЭМД и периодам.

---

## 📦 Зависимости

- `FastAPI`
- `pandas`
- `jinja2`
- `chart.js`
- `DataTables`
- `Select2`

---

## 📌 План доработок

- [ ] Возможность экспорта отчёта
- [ ] Авторизация

---

## 🧑‍💻 Автор

Разработка внутри учреждения, v0.4  
Если нашли баг — откройте issue или напишите напрямую.
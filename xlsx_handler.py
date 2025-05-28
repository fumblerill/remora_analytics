import pandas as pd
import io
import re

from settings import ERROR_REF_PATH

# =================== Загрузка справочника ошибок ===================

def load_error_reference(table_id: str = "errorsDictTable") -> str | None:
    """
    Возвращает HTML-таблицу справочника ошибок.
    """
    if not ERROR_REF_PATH.exists():
        return None
    try:
        df = pd.read_excel(ERROR_REF_PATH)
        return df.to_html(
            table_id=table_id,
            classes="table table-sm table-striped",
            index=False,
            escape=False 
        )
    except Exception as e:
        print(f"[ERROR] Ошибка загрузки справочника: {e}")
        return None
    
def load_error_reference_dataframe() -> pd.DataFrame:
    """
    Возвращает DataFrame справочника ошибок.
    """
    if not ERROR_REF_PATH.exists():
        return pd.DataFrame()
    try:
        return pd.read_excel(ERROR_REF_PATH)
    except Exception as e:
        print(f"[ERROR] Ошибка загрузки справочника: {e}")
        return pd.DataFrame()

def generate_tables(xlsx_bytes: bytes) -> dict[str, str | dict[str, str]]:
    """
    Основная функция обработки загруженного файла.
    Возвращает таблицы, диаграммы, статистику и период дат.
    """

    df_errors = load_error_reference_dataframe()
    df = pd.read_excel(io.BytesIO(xlsx_bytes), skiprows=1)
    df.columns = (
        pd.Series(df.columns)
        .astype(str)
        .str.replace(r"[\u00a0\t]", " ", regex=True)
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
    ).values

    df = df.applymap(lambda x: re.sub(r"\s+", " ", str(x)).strip() if isinstance(x, str) else x)

    df_processed = process_main_file(df, df_errors)

    # Удаляем строки с итогами, например: "Всего: 1234"
    df_raw = df_processed[
        ~df_processed.apply(lambda row: row.astype(str).str.contains(r"^Всего:\s*\d+$", regex=True)).any(axis=1)
        ]

    df_statistics = create_summary_by_department(df)
    df_doc_perf = create_summary_by_employee_threshold(df)
    df_types = create_summary_by_type(df)
    df_cert_errors = create_summary_by_value_mismatch_threshold(df)
    pie_labels, pie_values = create_status_chart_data(df_statistics)
    bar_labels, bar_values = create_error_diagram(df_processed)
    summary_stats = display_summary(df_statistics, df_doc_perf)
    min_date, max_date = get_date(df)

    # Преобразуем все датафреймы с потенциальными Timestamp
    df_raw = convert_datetime(df_raw)
    df_statistics = convert_datetime(df_statistics)
    df_doc_perf = convert_datetime(df_doc_perf)
    df_types = convert_datetime(df_types)
    df_cert_errors = convert_datetime(df_cert_errors)
    df_errors = convert_datetime(df_errors)
    
    return {
        # Таблицы как списки словарей (JSON-ready)
        "raw_data": df_raw.fillna("").to_dict(orient="records"),
        "statistics_data": df_statistics.reset_index(drop=True).to_dict(orient="records"),
        "doc_perf_data": df_doc_perf.to_dict(orient="records"),
        "types_data": df_types.to_dict(orient="records"),
        "cert_errors_data": df_cert_errors.to_dict(orient="records"),
        "reference_data": df_errors.fillna("").to_dict(orient="records"),

        # Данные для графиков
        "pie_labels": pie_labels,
        "pie_values": pie_values,
        "bar_labels": bar_labels,
        "bar_values": bar_values,

        # Общая сводка и период
        "summary": summary_stats,
        "min_date": min_date,
        "max_date": max_date,
    }

def convert_datetime(df: pd.DataFrame) -> pd.DataFrame:
    """
    Приводит все datetime-столбцы в строковый формат, чтобы избежать ошибок сериализации JSON.
    """
    df = df.copy()
    for col in df.select_dtypes(include=["datetime64[ns]", "datetime64[ns, UTC]"]):
        df[col] = df[col].astype(str)
    return df

def process_main_file(df_main: pd.DataFrame, df_errors: pd.DataFrame) -> pd.DataFrame:
    """
    Извлекает коды ошибок из описаний и добавляет к ним расшифровку из справочника.
    """

    # Пытаемся извлечь код ошибки из текста по нескольким шаблонам
    df_main['Код ошибки'] = df_main['Описание'].str.extract(r"Code:\s*(\w+)", expand=False)

    # Альтернативные шаблоны, если первый не дал результата
    df_main['Код ошибки'] = df_main['Код ошибки'].fillna(
        df_main['Описание'].str.extract(r"Ошибка:\s*([\w\s]+?)(?:[:\[]|$)", expand=False)
    )
    df_main['Код ошибки'] = df_main['Код ошибки'].fillna(
        df_main['Описание'].str.extract(r"(CommunicationException|FaultException):", expand=False)
    )

    # Убираем лишние пробелы
    df_main['Код ошибки'] = df_main['Код ошибки'].str.strip()

    # Сопоставляем с описанием из справочника по полю "Код ответа"
    df_merged = pd.merge(
        df_main,
        df_errors[['Код ответа', 'Описание']].rename(columns={'Описание': 'Описание ошибки'}),
        how='left',
        left_on='Код ошибки',
        right_on='Код ответа'
    )

    # Вставляем финальное описание ошибки с учётом справочника
    df_merged['Описание'] = df_merged.apply(
        lambda row: "Отсутствует в справочнике"
        if pd.notna(row['Код ошибки']) and pd.isna(row['Код ответа']) else
        row['Описание ошибки']
        if pd.notna(row['Код ответа']) else
        row['Описание'],
        axis=1
    )

    # Удаляем технические поля
    df_merged.drop(columns=['Код ответа', 'Описание ошибки'], inplace=True, errors='ignore')

    return df_merged

def create_summary_by_department(df: pd.DataFrame) -> pd.DataFrame:
    """
    Формирует сводную таблицу по сотрудникам и отделениям:
    количество СЭМД с разными статусами и агрегированные итоги.
    """

    df = df.copy()

    # Преобразуем категориальные поля и ФИО в строки
    for col in df.select_dtypes(include=['category']).columns:
        df[col] = df[col].astype(str)
    df['Сотрудник, сформировавший СЭМД'] = df['Сотрудник, сформировавший СЭМД'].astype(str)

    # Фильтрация: удаляем пустые строки и NaN по ключевому столбцу
    df = df[
        df['Сотрудник, сформировавший СЭМД'].str.strip().notnull() &
        (df['Сотрудник, сформировавший СЭМД'] != 'nan') &
        (df['Сотрудник, сформировавший СЭМД'] != '')
    ]

    # Получаем уникальные пары "Сотрудник – Отделение"
    unique_pairs = df[['Сотрудник, сформировавший СЭМД', 'Отделение МО']].drop_duplicates()

    # Создаём сводную таблицу: количество СЭМД по статусам
    pivot = (
        df.groupby(['Отделение МО', 'Сотрудник, сформировавший СЭМД', 'Статус передачи СЭМД'])
        .size()
        .unstack(fill_value=0)
        .reset_index()
    )

    # Обязательные колонки для подсчёта агрегатов
    required_cols = [
        'Зарегистрирован в Нетрике',
        'Зарегистрирован в РЭМД',
        'Отказано в регистрации в Нетрике',
        'Отказано в регистрации в РЭМД'
    ]
    for col in required_cols:
        if col not in pivot.columns:
            pivot[col] = 0

    # Агрегированные столбцы: успешно и отказано
    pivot['СЭМД успешно зарегистрированных в РЭМД'] = (
        pivot['Зарегистрирован в Нетрике'] + pivot['Зарегистрирован в РЭМД']
    )
    pivot['СЭМД отказано в регистрации в РЭМД'] = (
        pivot['Отказано в регистрации в Нетрике'] + pivot['Отказано в регистрации в РЭМД']
    )

    # Удаляем вспомогательные поля
    pivot.drop(columns=required_cols, inplace=True)

    # Объединяем со списком сотрудников, чтобы вернуть "нулевые" значения
    result = pd.merge(unique_pairs, pivot,
                      on=['Отделение МО', 'Сотрудник, сформировавший СЭМД'],
                      how='left').fillna(0)

    # Переносим "Отделение МО" в начало таблицы
    cols = result.columns.tolist()
    cols.insert(0, cols.pop(cols.index('Отделение МО')))
    result = result[cols]

    # Приводим float → int, где это возможно
    for col in result.columns:
        if pd.api.types.is_float_dtype(result[col]):
            result[col] = result[col].astype(int)

    return result

def create_summary_by_employee_threshold(df: pd.DataFrame, threshold: int = 500) -> pd.DataFrame:
    """
    Возвращает таблицу сотрудников, которые выполнили не менее `threshold` успешно зарегистрированных СЭМД.
    """

    # Фильтруем только успешные записи
    successful_records = df[
        df['Статус передачи СЭМД'].isin(['Зарегистрирован в РЭМД', 'Зарегистрирован в Нетрике'])
    ]

    # Считаем количество успешных записей по каждому сотруднику
    employee_summary = (
        successful_records['Сотрудник, сформировавший СЭМД']
        .value_counts()
        .reset_index()
    )
    employee_summary.columns = ['Сотрудник, сформировавший СЭМД', 'Количество СЭМД']

    # Приводим к числам на всякий случай
    employee_summary['Количество СЭМД'] = pd.to_numeric(employee_summary['Количество СЭМД'], errors='coerce').fillna(0).astype(int)

    # Фильтрация по порогу
    filtered_summary = employee_summary[employee_summary['Количество СЭМД'] >= threshold]

    return filtered_summary

def create_summary_by_type(df: pd.DataFrame) -> pd.DataFrame:
    """
    Возвращает таблицу с количеством СЭМД по каждому виду и статусу передачи.
    Включает агрегированные поля: успешно зарегистрировано и отказано в регистрации.
    """

    # Группируем по виду СЭМД и статусу, считаем количество
    pivot_table = (
        df.groupby(['Вид СЭМД', 'Статус передачи СЭМД'])
        .size()
        .unstack(fill_value=0)
        .reset_index()
    )

    # Обязательные колонки для расчёта итогов
    required_columns = [
        'Зарегистрирован в Нетрике',
        'Зарегистрирован в РЭМД',
        'Отказано в регистрации в Нетрике',
        'Отказано в регистрации в РЭМД'
    ]

    # Добавляем недостающие колонки с нулями
    for col in required_columns:
        if col not in pivot_table.columns:
            pivot_table[col] = 0

    # Считаем агрегаты
    pivot_table['СЭМД успешно зарегистрированных в РЭМД'] = (
        pivot_table['Зарегистрирован в Нетрике'] + pivot_table['Зарегистрирован в РЭМД']
    )
    pivot_table['СЭМД отказано в регистрации в РЭМД'] = (
        pivot_table['Отказано в регистрации в Нетрике'] + pivot_table['Отказано в регистрации в РЭМД']
    )

    # Удаляем исходные поля
    pivot_table.drop(columns=required_columns, inplace=True, errors='ignore')

    # Перемещаем поле "успешно" ближе к началу для читаемости
    pivot_table.insert(1, 'СЭМД успешно зарегистрированных в РЭМД',
                       pivot_table.pop('СЭМД успешно зарегистрированных в РЭМД'))

    return pivot_table

def create_summary_by_value_mismatch_threshold(
    df: pd.DataFrame,
    threshold: str = 'VALUE_MISMATCH_METADATA_AND_CERTIFICATE'
) -> pd.DataFrame:
    """
    Возвращает таблицу сотрудников с количеством ошибок типа `threshold`,
    связанных с несоответствием метаданных и сертификата.
    """

    # Фильтруем строки, содержащие нужный код ошибки
    filtered_df = df[df['Код ошибки'] == threshold]

    # Подсчитываем количество таких ошибок на каждого сотрудника
    summary = (
        filtered_df['Сотрудник, сформировавший СЭМД']
        .value_counts()
        .reset_index()
    )
    summary.columns = ['Сотрудник, сформировавший СЭМД', 'Частота ошибки']

    return summary

def create_status_chart_data(df: pd.DataFrame) -> tuple[list[str], list[int]]:
    """
    Возвращает подписи и значения для круговой диаграммы по статусам СЭМД.
    """
    labels = [
        'СЭМД успешно зарегистрированных в РЭМД',
        'Не отправлен',
        'СЭМД отказано в регистрации в РЭМД'
    ]

    values = [
        int(df[label].sum()) if label in df.columns else 0
        for label in labels
    ]

    return labels, values

def create_error_diagram(df: pd.DataFrame) -> tuple[list[str], list[int]]:
    """
    Возвращает подписи и значения для столбчатой диаграммы ошибок.
    """
    # Убираем строки без кода ошибки
    df_filtered = df.dropna(subset=['Код ошибки'])

    # Подсчитываем количество каждой ошибки
    error_counts = df_filtered['Код ошибки'].value_counts()

    labels = error_counts.index.tolist()
    values = error_counts.values.tolist()

    return labels, values

def display_summary(df_stats: pd.DataFrame, df_doc_perf: pd.DataFrame) -> dict[str, str]:
    """
    Возвращает текстовую сводку статистики для сайдбара:
    общее количество, успешно, не отправлено, отказано, врачи > 500 СЭМД.
    """
    # Получаем суммы по статусам
    total_success = df_stats['СЭМД успешно зарегистрированных в РЭМД'].sum()
    total_not_sent = df_stats['Не отправлен'].sum()
    total_refused = df_stats['СЭМД отказано в регистрации в РЭМД'].sum()

    total_all = total_success + total_not_sent + total_refused

    # Количество врачей, выполнивших норму
    total_employees_500 = df_doc_perf['Сотрудник, сформировавший СЭМД'].count()

    # Расчёт процентов
    def percent(part: int, total: int) -> float:
        return (part / total * 100) if total > 0 else 0.0

    stats = {
        "Всего СЭМД загружено в РЭМД": total_all,
        "Успешно зарегистрировано": f"{total_success} ({percent(total_success, total_all):.1f}%)",
        "Не отправлено": f"{total_not_sent} ({percent(total_not_sent, total_all):.1f}%)",
        "Отказано в регистрации": f"{total_refused} ({percent(total_refused, total_all):.1f}%)",
        "Врачей с >500 СЭМД": total_employees_500
    }

    return stats

def get_date(df: pd.DataFrame) -> tuple[str, str]:
    """
    Возвращает минимальную и максимальную дату из столбца 'Дата создания СЭМД'
    в формате DD.MM.YYYY.
    """
    # Преобразуем в datetime, ошибки игнорируем
    df['Дата создания СЭМД'] = pd.to_datetime(df['Дата создания СЭМД'], errors='coerce')

    # Получаем границы диапазона
    min_date = df['Дата создания СЭМД'].min()
    max_date = df['Дата создания СЭМД'].max()

    # Если вдруг нет данных — возвращаем пустые строки
    if pd.isna(min_date) or pd.isna(max_date):
        return "", ""

    return min_date.strftime("%d.%m.%Y"), max_date.strftime("%d.%m.%Y")

function initTabulators() {
  // Находим все шаблоны с JSON (по ID, заканчивающемуся на -json)
  document.querySelectorAll("template[id$='-json']").forEach(template => {
    const id = template.id.replace("-json", ""); // например: statisticsTable-json → statisticsTable
    const container = document.getElementById(id);

    if (!container) {
      console.warn(`⚠️ Контейнер с ID '${id}' не найден`);
      return;
    }

    // Получаем строку JSON из шаблона
    const jsonString = template.innerHTML.trim();

    if (!jsonString) {
      console.error(`❌ Шаблон с ID '${template.id}' пуст`);
      return;
    }

    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (error) {
      console.error(`❌ Ошибка при парсинге JSON для '${id}':`, error);
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p class='text-muted'>Нет данных для отображения</p>";
      return;
    }

    // Автоматически генерируем колонки из ключей первой строки
    const columns = Object.keys(data[0]).map(key => ({
      title: key,
      field: key,
      headerFilter: true
    }));

    // Создаём таблицу
    new Tabulator(container, {
      data: data,
      columns: columns,
      height: 400,
      layout: "fitColumns",
      pagination: true,
      paginationSize: 100,
      placeholder: "Нет данных для отображения",
      responsiveLayout: "collapse",
    });
  });

  console.log(`✅ Таблица '${id}' отрисована`);
}


// Показ контента после загрузки и удаление прелоадера
function startPage() {
  try {
    console.log("Выполнение startPage")
    initTabulators();
  } catch (e) {
    console.error("🔥 Ошибка в startPage:", e);
  }

  const wrapper = document.getElementById("content-wrapper");
  const preloader = document.getElementById("preloader");

  if (wrapper) {
    wrapper.style.display = "block";
    setTimeout(() => {
      wrapper.style.opacity = "1";
      if (preloader) preloader.remove();
    }, 100);
  }
}


// Запуск после полной загрузки страницы
window.addEventListener("load", () => {
  setTimeout(() => {
    startPage();
  }, 50);
});
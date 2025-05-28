// Инициализация всех таблиц DataTables с фильтрами
function initDataTables() {
  console.log("⚙️ initDataTables стартанул");

  document.querySelectorAll("table[id]").forEach((table) => {
    const id = table.getAttribute("id");
    console.log("🧾 Обрабатываем таблицу:", id);

    // Пропускаем, если таблица уже инициализирована
    if ($.fn.DataTable.isDataTable(`#${id}`)) return;

    const dt = $(`#${id}`).DataTable({
      pageLength: 100,
      scrollY: "300px",
      scrollCollapse: true,
      autoWidth: false,
      scrollX: true,
      lengthMenu: [100],
      language: { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/ru.json" },
      dom: 't<"row mt-3"<"col-sm-6"l><"col-sm-6 text-end"p>>',
      orderCellsTop: true,
    });

    console.log("✅ DataTable инициализирован:", id);

    // Прячем пагинацию и length, если всё влезает на одну страницу
    const info = dt.page.info();
    if (info.recordsTotal <= info.length) {
      $(`#${id}_paginate`).hide();
      $(`#${id}_length`).hide();
    }

    // Добавляем вторую строку заголовка для фильтров
    $(`#${id} thead tr`).clone(true).appendTo(`#${id} thead`);
    $(`#${id} thead tr:eq(1) th`).each(function (i) {
      const column = dt.column(i);
      const uniqueValues = column.data().unique().toArray();

      const isNumeric = uniqueValues.every(val =>
        !isNaN(parseFloat(val.toString().replace(",", ".")))
      );

      // ======== Текстовый/категориальный фильтр ========
      if (!isNumeric) {
        const select = $('<select class="form-select form-select-sm" multiple></select>')
          .appendTo($(this).empty())
          .on("change", function () {
            const val = $(this).val();
            column.search(val && val.length ? val.join("|") : "", true, false).draw();
          });

        uniqueValues.sort().forEach((val) => {
          if (val && val.length <= 50) {
            select.append(`<option value="${val}">${val}</option>`);
          }
        });

        // Активируем Select2
        select.select2({ width: '100%' });
      } else {
        // ======== Числовой столбец: пока без фильтра ========
        $(this).empty();
      }
    });
  });
}

// Показ контента после загрузки и удаление прелоадера
function startPage() {
  const wrapper = document.getElementById("content-wrapper");
  const preloader = document.getElementById("preloader");

  if (!wrapper) {
    console.error("❌ wrapper не найден");
    return;
  }

  initDataTables();

  wrapper.style.display = "block";
  setTimeout(() => {
    wrapper.style.opacity = "1";
    if (preloader) preloader.remove();
  }, 100);
}

// Запуск после полной загрузки страницы
window.addEventListener("load", () => {
  setTimeout(startPage, 50);
});
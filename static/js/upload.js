function initDataTables() {
  document.querySelectorAll("table[id]").forEach((table) => {
    const id = table.getAttribute("id");
    if (!$.fn.DataTable.isDataTable(`#${id}`)) {
      const dt = $(`#${id}`).DataTable({
        pageLength: 100,
        scrollY: "300px",
        scrollCollapse: true,
        autoWidth: false,
        lengthMenu: [10, 25, 50, 100, 1000],
        language: { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/ru.json" },
        dom: 't<"row mt-3"<"col-sm-6"l><"col-sm-6 text-end"p>>',
        orderCellsTop: true,
        fixedHeader: { header: true }
      });

      $(`#${id} thead tr`).clone(true).appendTo(`#${id} thead`);
      $(`#${id} thead tr:eq(1) th`).each(function(i) {
        const column = dt.column(i);
        const select = $('<select class="form-select form-select-sm"><option value="">Все</option></select>')
          .appendTo($(this).empty())
          .on('change', function() {
            const val = $.fn.dataTable.util.escapeRegex($(this).val());
            column.search(val ? `^${val}$` : '', true, false).draw();
          });
        column.data().unique().sort().each(function(d) {
          if (d && d.length <= 50) select.append(`<option value="${d}">${d}</option>`);
        });
      });
    }
  });
}

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


window.addEventListener("load", () => {
  setTimeout(() => {
    startPage();
  }, 50);
});

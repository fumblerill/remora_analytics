const customColumnOrder = {
  statisticsTable: [
    "Отделение МО",
    "Сотрудник, сформировавший СЭМД",
    "СЭМД успешно зарегистрированных в РЭМД",
    "СЭМД отказано в регистрации в РЭМД",
    "Не отправлен"
  ],
  docPerfTable: [
    "Сотрудник, сформировавший СЭМД",
    "Количество СЭМД"
  ],
  errorsDictTable: [
    "Код ответа",
    "Рекомендуемые действия",
    "Описание"
  ]
};

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

    let columnKeys = Object.keys(data[0]);

    if (customColumnOrder[id]) {
      const defined = customColumnOrder[id];
      const rest = columnKeys.filter(k => !defined.includes(k));
      columnKeys = [...defined, ...rest];
    }

    const seen = new Set();
    const columns = columnKeys
      .filter(key => {
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(key => ({
        title: key,
        field: key,
        headerFilter: true
      }));

      const layoutMode = id === "rawTable" ? "fitData" : "fitColumns";

      new Tabulator(container, {
        data: data,
        columns: columns,
        height: 400,
        layout: layoutMode,
        responsiveLayout: false,  // отключаем автоматическое скрытие колонок
        pagination: true,
        paginationSize: 100,
        placeholder: "Нет данных для отображения",
      });

    // // Создаём таблицу
    // new Tabulator(container, {
    //   data: data,
    //   columns: columns,
    //   height: 400,
    //   layout: "fitColumns",
    //   pagination: true,
    //   paginationSize: 100,
    //   placeholder: "Нет данных для отображения",
    //   responsiveLayout: "collapse",
    // });
  });
}

function initCharts() {
  const barCanvas = document.getElementById('barChart');
  const pieCanvas = document.getElementById('pieChart');

  const { barLabels, barValues, pieLabels, pieValues } = window.chartData;

  const backgroundColors = [
    '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00',
    '#ffff33', '#a65628', '#f781bf', '#999999', '#66c2a5', '#fc8d62'
  ];
  const barColors = barLabels.map((_, i) => backgroundColors[i % backgroundColors.length]);

  const ctxBar = barCanvas.getContext('2d');
  if (window.barChartInstance) window.barChartInstance.destroy();
  window.barChartInstance = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: barLabels,
      datasets: [{
        data: barValues,
        backgroundColor: barColors,
        borderRadius: 4,
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'x',
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            generateLabels: (chart) =>
              chart.data.labels.map((label, i) => ({
                text: label,
                fillStyle: barColors[i],
                strokeStyle: barColors[i],
                index: i
              }))
          }
        },
        datalabels: { display: false }
      },
      scales: {
        x: { beginAtZero: false, ticks: { display: false }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    },
    plugins: [ChartDataLabels]
  });

  const ctxPie = pieCanvas.getContext('2d');
  if (window.pieChartInstance) window.pieChartInstance.destroy();
  window.pieChartInstance = new Chart(ctxPie, {
    type: 'pie',
    data: {
      labels: pieLabels,
      datasets: [{
        data: pieValues,
        backgroundColor: backgroundColors.slice(0, pieValues.length)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 20, bottom: 20 } },
      plugins: {
        legend: {
          position: 'right',
          labels: { padding: 20 }
        },
        datalabels: {
          color: '#000',
          font: { weight: 'bold' },
          formatter: (value, context) => {
            const data = context.chart.data.datasets[0].data;
            const total = data.reduce((a, b) => a + b, 0);
            return ((value / total) * 100).toFixed(1) + '%';
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// Показ контента после загрузки и удаление прелоадера
function startPage() {
  try {
    initTabulators();
    initCharts();
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
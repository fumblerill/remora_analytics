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

var minMaxFilterEditor = function(cell, onRendered, success, cancel, editorParams){
  var end;
  var container = document.createElement("span");

  var start = document.createElement("input");
  start.setAttribute("type", "number");
  start.setAttribute("placeholder", "Min");
  start.style.padding = "4px";
  start.style.width = "50%";
  start.style.boxSizing = "border-box";
  start.value = cell.getValue();

  function buildValues(){
    success({ start: start.value, end: end.value });
  }

  function keypress(e){
    if(e.keyCode == 13) buildValues();
    if(e.keyCode == 27) cancel();
  }

  end = start.cloneNode();
  end.setAttribute("placeholder", "Max");

  start.addEventListener("change", buildValues);
  start.addEventListener("blur", buildValues);
  start.addEventListener("keydown", keypress);

  end.addEventListener("change", buildValues);
  end.addEventListener("blur", buildValues);
  end.addEventListener("keydown", keypress);

  container.appendChild(start);
  container.appendChild(end);

  return container;
};

function minMaxFilterFunction(headerValue, rowValue, rowData, filterParams){
  if(rowValue != null && rowValue !== ""){
    if(headerValue.start != ""){
      if(headerValue.end != ""){
        return rowValue >= headerValue.start && rowValue <= headerValue.end;
      } else {
        return rowValue >= headerValue.start;
      }
    } else {
      if(headerValue.end != ""){
        return rowValue <= headerValue.end;
      }
    }
  }
  return true;
}

function initTabulators() {
  document.querySelectorAll("template[id$='-json']").forEach(template => {
    const id = template.id.replace("-json", "");
    const container = document.getElementById(id);

    if (!container) {
      console.warn(`⚠️ Контейнер с ID '${id}' не найден`);
      return;
    }

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


    const uniqueValuesByField = {};
    data.forEach(row => {
      Object.entries(row).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          if (!uniqueValuesByField[field]) uniqueValuesByField[field] = new Set();
          uniqueValuesByField[field].add(value);
        }
      });
    });

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
      .map(key => {
        // Определяем числовой ли столбец (по первому значению)
        const firstVal = data.find(row => row[key] !== undefined && row[key] !== null)?.[key];
        const isNumber = typeof firstVal === "number";

        if (isNumber) {
          // Числовой столбец — ставим кастомный фильтр мин-макс
          return {
            title: key,
            field: key,
            headerFilter: minMaxFilterEditor,
            headerFilterFunc: minMaxFilterFunction,
            headerFilterLiveFilter: false
          };
        } else {
          // Все остальные — фильтр список с уникальными значениями
          return {
            title: key,
            field: key,
            headerFilter: "list",
            headerFilterParams: {
              values: Array.from(uniqueValuesByField[key] || []),
              clearable: true
            },
            headerFilterLiveFilter: false
          };
        }
      });

    const layoutMode = id === "rawTable" ? "fitData" : "fitColumns";

    new Tabulator(container, {
      data,
      columns,
      height: 400,
      layout: layoutMode,
      responsiveLayout: false,
      pagination: true,
      paginationSize: 100,
      placeholder: "Нет данных для отображения",
    });
  });
}

function updateChartTheme(isDark) {
  const labelColor = isDark ? "#fff" : "#000";
  const gridColor = isDark ? "#444" : "#ccc";

  if (window.barChartInstance) {
    const barOptions = window.barChartInstance.options;
    barOptions.plugins.legend.labels.color = labelColor;
    barOptions.scales.x.ticks.color = labelColor;
    barOptions.scales.y.ticks.color = labelColor;
    barOptions.scales.x.grid.color = gridColor;
    barOptions.scales.y.grid.color = gridColor;
    window.barChartInstance.update();
  }

  if (window.pieChartInstance) {
    const pieOptions = window.pieChartInstance.options;
    pieOptions.plugins.legend.labels.color = labelColor;
    pieOptions.plugins.datalabels.color = labelColor;
    window.pieChartInstance.update();
  }
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
        label: 'Количество',
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
        legend: { display: false },
        datalabels: { display: false }
      },
      scales: {
        x: {
          ticks: { display: false },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: '#000' },
          grid: { color: '#ccc' }
        }
      }
    },
    plugins: [ChartDataLabels]
  });

  // кастомная легенда
  renderCustomLegend(barLabels, barColors);

  // Pie — как было
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
          labels: {
            color: "#000",
            padding: 20
          }
        },
        datalabels: {
          color: "#000",
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

function renderCustomLegend(labels, colors) {
  const container = document.getElementById('barLegend');
  if (!container) return;

  container.innerHTML = ''; // очищаем

  labels.forEach((label, i) => {
    const item = document.createElement('div');
    item.className = 'legend-item';

    const box = document.createElement('span');
    box.className = 'legend-box';
    box.style.backgroundColor = colors[i];

    const text = document.createElement('span');
    text.className = 'legend-label';
    text.textContent = label;

    item.appendChild(box);
    item.appendChild(text);
    container.appendChild(item);
  });
}

// Показ контента после загрузки и удаление прелоадера
function startPage() {
  try {
    initTabulators();
    initCharts();

    const currentTheme = localStorage.getItem("theme") || "light";
    updateChartTheme(currentTheme === "dark");
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

window.updateChartTheme = updateChartTheme;
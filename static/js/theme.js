// document.addEventListener("DOMContentLoaded", () => {
//   const toggleBtn = document.getElementById("themeToggleBtn");

//   const setTheme = (theme) => {
//     localStorage.setItem("theme", theme);
//     document.cookie = "theme=" + theme + "; path=/; max-age=31536000";
//     toggleBtn.innerText = theme === "dark" ? "🌙" : "☀️";

//     if (typeof updateChartTheme === "function") {
//       updateChartTheme(theme === "dark");
//     }
//   };

//   const theme = localStorage.getItem("theme") || "light";
//   setTheme(theme);

//   toggleBtn.addEventListener("click", () => {
//     const newTheme = localStorage.getItem("theme") === "dark" ? "light" : "dark";
//     setTheme(newTheme);
//     location.reload();
//   });
// });

// document.addEventListener("DOMContentLoaded", () => {
//   const toggleBtn = document.getElementById("themeToggleBtn");

//   const setTheme = (theme, animate = false) => {
//     localStorage.setItem("theme", theme);
//     document.cookie = "theme=" + theme + "; path=/; max-age=31536000";
//     toggleBtn.innerText = theme === "dark" ? "🌙" : "☀️";

//     if (typeof updateChartTheme === "function") {
//       updateChartTheme(theme === "dark");
//     }

//     // Если нужно — плавный переход
//     if (animate) {
//       const overlay = document.createElement("div");
//       overlay.id = "themeOverlay";
//       document.body.appendChild(overlay);
//       void overlay.offsetWidth; // форсируем reflow
//       overlay.classList.add("show");
//       setTimeout(() => location.reload(), 300);
//     }
//   };

//   const theme = localStorage.getItem("theme") || "light";
//   setTheme(theme);

//   toggleBtn.addEventListener("click", () => {
//     const newTheme = localStorage.getItem("theme") === "dark" ? "light" : "dark";
//     setTheme(newTheme, true);
//   });
// });

// document.addEventListener("DOMContentLoaded", () => {
//   const toggleBtn = document.getElementById("themeToggleBtn");

//   const setTheme = (theme) => {
//     localStorage.setItem("theme", theme);
//     document.cookie = "theme=" + theme + "; path=/; max-age=31536000";
//     toggleBtn.innerText = theme === "dark" ? "🌙" : "☀️";

//     if (typeof updateChartTheme === "function") {
//       updateChartTheme(theme === "dark");
//     }
//   };

//   const currentTheme = localStorage.getItem("theme") || "light";
//   setTheme(currentTheme);

//   toggleBtn.addEventListener("click", () => {
//     const newTheme = currentTheme === "dark" ? "light" : "dark";

//   // 1. Overlay с прозрачным затемнением и размытием
//   const overlay = document.createElement("div");
//   overlay.id = "themeOverlay";
//   overlay.style.position = "fixed";
//   overlay.style.inset = "0";
//   overlay.style.background = newTheme === "dark"
//     ? "rgba(18, 18, 18, 0.95)"      // чуть плотнее
//     : "rgba(255, 255, 255, 0.95)";
//   overlay.style.backdropFilter = "blur(4px)";   // меньше блюра — стекло, не мыло
//   overlay.style.boxShadow = "inset 0 0 50px rgba(0, 0, 0, 0.1)"; // чуть глубины
//   overlay.style.opacity = "0";
//   overlay.style.transition = "opacity 0.4s ease";
//   overlay.style.zIndex = "9999";
//   document.body.appendChild(overlay);

//   requestAnimationFrame(() => {
//     overlay.style.opacity = "1";
//   });

//     // 2. Перезагрузка после плавного затемнения
//     setTimeout(() => {
//       setTheme(newTheme);
//       location.reload();
//     }, 500);
//   });
// });

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("themeToggleBtn");

  const setTheme = (theme) => {
    localStorage.setItem("theme", theme);
    document.cookie = "theme=" + theme + "; path=/; max-age=31536000";
    toggleBtn.innerText = theme === "dark" ? "🌙" : "☀️";
    if (typeof updateChartTheme === "function") updateChartTheme(theme === "dark");
  };

  const currentTheme = localStorage.getItem("theme") || "light";
  setTheme(currentTheme);

  toggleBtn.addEventListener("click", () => {
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    const overlay = document.createElement("div");
    overlay.id = "themeOverlay";
    overlay.classList.add(newTheme);

    const spinner = document.createElement("div");
    spinner.id = "themeOverlaySpinner";
    overlay.appendChild(spinner);

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add("show");
    });

    setTimeout(() => {
      setTheme(newTheme);
      location.reload();
    }, 400);
  });
});
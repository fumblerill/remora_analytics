document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("themeToggleBtn");
  if (!toggleBtn) return;

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
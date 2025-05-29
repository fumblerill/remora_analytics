document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("themeToggleBtn");

  const setTheme = (theme) => {
    localStorage.setItem("theme", theme);
    document.cookie = "theme=" + theme + "; path=/; max-age=31536000";
    toggleBtn.innerText = theme === "dark" ? "🌙" : "☀️";

    if (typeof updateChartTheme === "function") {
      updateChartTheme(theme === "dark");
    }
  };

  const theme = localStorage.getItem("theme") || "light";
  setTheme(theme);

  toggleBtn.addEventListener("click", () => {
    const newTheme = localStorage.getItem("theme") === "dark" ? "light" : "dark";
    setTheme(newTheme);
    location.reload();
  });
});

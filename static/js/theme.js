document.addEventListener("DOMContentLoaded", () => {
    const themeLink = document.getElementById("themeStylesheet");
    const toggleBtn = document.getElementById("themeToggleBtn");
  
    const setTheme = (theme) => {
      themeLink.href = `/static/css/${theme}.css`;
      localStorage.setItem("theme", theme);
      toggleBtn.innerText = theme === "light" ? "☀️" : "🌙";
    };
  
    const currentTheme = localStorage.getItem("theme") || "light";
    setTheme(currentTheme);
  
    toggleBtn.addEventListener("click", () => {
      const newTheme = themeLink.href.includes("light.css") ? "dark" : "light";
      setTheme(newTheme);
    });
  });  
// Credenciales (puedes cambiarlas)
const USER = "naye";
const PASS = "0123";

// LOGIN
const form = document.getElementById("loginForm");

if (form) {
  form.addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("errorMsg");

    if (username === USER && password === PASS) {
      localStorage.setItem("auth", "true");
      localStorage.setItem("user", username);
      window.location.href = "dashboard.html";
    } else {
      errorMsg.textContent = "Usuario o contraseña incorrectos";
    }
  });
}

// PROTEGER DASHBOARD
if (window.location.pathname.includes("dashboard.html")) {
  const isAuth = localStorage.getItem("auth");

  if (!isAuth) {
    window.location.href = "login.html";
  }
}
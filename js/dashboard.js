document.addEventListener("DOMContentLoaded", () => {

  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("fileInput");
  const fileGrid = document.getElementById("fileGrid");
  const searchInput = document.getElementById("searchInput");
  const toggleTheme = document.getElementById("toggleTheme");

  // Mostrar nombre usuario
  document.getElementById("userName").textContent =
    localStorage.getItem("user") || "Admin";

  // Guardar tema
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }

  toggleTheme.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark") ? "dark" : "light"
    );
  });

  uploadBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      const fileData = {
        name: file.name,
        type: file.type,
        data: e.target.result
      };

      saveFile(fileData);
      renderFile(fileData);
    };

    reader.readAsDataURL(file);
  });

  function saveFile(file) {
    let files = JSON.parse(localStorage.getItem("files")) || [];
    files.push(file);
    localStorage.setItem("files", JSON.stringify(files));
  }

  function loadFiles() {
    let files = JSON.parse(localStorage.getItem("files")) || [];
    files.forEach(renderFile);
  }

  function renderFile(file) {
    const card = document.createElement("div");
    card.classList.add("file-card");

    if (file.type.startsWith("image")) {
      card.innerHTML = `
        <img src="${file.data}">
        <p>${file.name}</p>
        <button onclick="deleteFile('${file.name}')">Eliminar</button>
      `;
    } else if (file.type.startsWith("video")) {
      card.innerHTML = `
        <video src="${file.data}" controls></video>
        <p>${file.name}</p>
        <button onclick="deleteFile('${file.name}')">Eliminar</button>
      `;
    }

    fileGrid.appendChild(card);
  }

  window.deleteFile = function(name) {
    let files = JSON.parse(localStorage.getItem("files")) || [];
    files = files.filter(file => file.name !== name);
    localStorage.setItem("files", JSON.stringify(files));
    location.reload();
  }

  window.filterFolder = function(folder) {
    alert("Más adelante clasificaremos por carpeta: " + folder);
  }

  searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll(".file-card");

    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(value) ? "block" : "none";
    });
  });

  loadFiles();
});
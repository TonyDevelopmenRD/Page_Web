// ===== CONFIGURACIÓN =====
const CLOUDINARY_CLOUD = "dqvdhqvhz";
const CLOUDINARY_PRESET = "dashboard_uploads";
const JSONBIN_ID = "69fbee03c0954111d8e9e350";
const JSONBIN_KEY = "$2a$10$twBmtTophd1zEBMNgzzwb.CKPhwRCC19uH0YXjMKLYNAmJVA.jrAG";
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;

document.addEventListener("DOMContentLoaded", () => {

  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("fileInput");
  const fileGrid = document.getElementById("fileGrid");
  const searchInput = document.getElementById("searchInput");
  const toggleTheme = document.getElementById("toggleTheme");

  // Mostrar nombre usuario
  document.getElementById("userName").textContent =
    localStorage.getItem("user") || "Admin";

  // Tema
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

  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    showLoading(true);

    try {
      // 1 — Subir imagen a Cloudinary
      const cloudinaryURL = await uploadToCloudinary(file);

      // 2 — Guardar referencia en JSONBin
      const fileData = {
        name: file.name,
        type: file.type,
        url: cloudinaryURL,
        description: "",
        date: new Date().toISOString()
      };

      await saveToJSONBin(fileData);

      // 3 — Mostrar en pantalla
      renderFile(fileData);

    } catch (error) {
      alert("Error al subir el archivo: " + error.message);
    } finally {
      showLoading(false);
      fileInput.value = "";
    }
  });

  // ===== CLOUDINARY =====
  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`,
      { method: "POST", body: formData }
    );

    if (!response.ok) throw new Error("No se pudo subir a Cloudinary");

    const data = await response.json();
    return data.secure_url;
  }

  // ===== JSONBIN — LEER =====
  async function loadFromJSONBin() {
    const response = await fetch(JSONBIN_URL + "/latest", {
      headers: { "X-Master-Key": JSONBIN_KEY }
    });

    if (!response.ok) throw new Error("No se pudo leer la base de datos");

    const data = await response.json();
    return data.record.files || [];
  }

  // ===== JSONBIN — GUARDAR =====
  async function saveToJSONBin(fileData) {
    // Leer archivos actuales
    const files = await loadFromJSONBin();
    files.push(fileData);

    // Escribir lista actualizada
    const response = await fetch(JSONBIN_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_KEY
      },
      body: JSON.stringify({ files })
    });

    if (!response.ok) throw new Error("No se pudo guardar en la base de datos");
  }

  // ===== JSONBIN — ELIMINAR =====
  async function deleteFromJSONBin(name) {
    const files = await loadFromJSONBin();
    const updated = files.filter(f => f.name !== name);

    await fetch(JSONBIN_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_KEY
      },
      body: JSON.stringify({ files: updated })
    });
  }

  // ===== JSONBIN — ACTUALIZAR DESCRIPCIÓN =====
  async function updateDescription(name, description) {
    const files = await loadFromJSONBin();
    const updated = files.map(f =>
      f.name === name ? { ...f, description } : f
    );

    await fetch(JSONBIN_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_KEY
      },
      body: JSON.stringify({ files: updated })
    });
  }

  // ===== RENDER =====
  function renderFile(file) {
    const card = document.createElement("div");
    card.classList.add("file-card");
    card.setAttribute("data-name", file.name);

    const mediaHTML = file.type.startsWith("image")
      ? `<img src="${file.url}" alt="${file.name}">`
      : `<video src="${file.url}" controls></video>`;

    card.innerHTML = `
      <div class="file-thumb">
        ${mediaHTML}
      </div>
      <p class="file-name">${file.name}</p>
      <textarea
        class="file-desc"
        placeholder="Agregar descripción..."
      >${file.description || ""}</textarea>
      <div class="file-actions">
        <a class="btn-download" href="${file.url}" download="${file.name}" target="_blank">
          ⬇ Descargar
        </a>
        <button class="btn-delete" data-name="${file.name}">
          🗑 Eliminar
        </button>
      </div>
    `;

    // Guardar descripción al escribir (con debounce)
    const textarea = card.querySelector(".file-desc");
    let timeout;
    textarea.addEventListener("input", () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        updateDescription(file.name, textarea.value);
      }, 800);
    });

    // Eliminar
    card.querySelector(".btn-delete").addEventListener("click", async () => {
      if (!confirm(`¿Eliminar "${file.name}"?`)) return;
      showLoading(true);
      try {
        await deleteFromJSONBin(file.name);
        card.remove();
      } catch (e) {
        alert("Error al eliminar: " + e.message);
      } finally {
        showLoading(false);
      }
    });

    fileGrid.appendChild(card);
  }

  // ===== CARGAR AL INICIO =====
  async function loadFiles() {
    showLoading(true);
    try {
      const files = await loadFromJSONBin();
      fileGrid.innerHTML = "";
      files.forEach(renderFile);
    } catch (e) {
      fileGrid.innerHTML = `<p style="color:#ef4444">Error al cargar archivos. Verifica tu conexión.</p>`;
    } finally {
      showLoading(false);
    }
  }

  // ===== BUSCADOR =====
  searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll(".file-card");
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(value) ? "flex" : "none";
    });
  });

  // ===== CARPETAS =====
  window.filterFolder = function(folder) {
    alert("Más adelante clasificaremos por carpeta: " + folder);
  }

  // ===== LOADING =====
  function showLoading(show) {
    let loader = document.getElementById("loader");
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "loader";
      loader.innerHTML = `<div class="loader-spinner"></div><p>Cargando...</p>`;
      loader.style.cssText = `
        position:fixed; top:0; left:0; width:100%; height:100%;
        background:rgba(0,0,0,0.4); display:flex; flex-direction:column;
        align-items:center; justify-content:center; z-index:9999; color:white;
        font-family:'Inter',sans-serif; gap:12px;
      `;
      const spinner = loader.querySelector(".loader-spinner");
      spinner.style.cssText = `
        width:40px; height:40px; border:4px solid rgba(255,255,255,0.3);
        border-top-color:white; border-radius:50%;
        animation:spin 0.8s linear infinite;
      `;
      const style = document.createElement("style");
      style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
      document.body.appendChild(loader);
    }
    loader.style.display = show ? "flex" : "none";
  }

  loadFiles();
});
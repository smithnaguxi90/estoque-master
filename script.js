// === CONFIGURAÇÕES GERAIS ===
const API_URL = "http://localhost:3000/api";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const NUMBER_FORMAT = new Intl.NumberFormat("pt-BR");
const ITEMS_PER_PAGE = 10;

// --- Helpers ---
const createEl = (tag, className, text = "") => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
};

const showToast = (message, type = "success") => {
  const container = $("#toast-container");
  const toast = createEl("div", `toast toast-${type}`, message);
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

const getLocalDate = () => {
  const offset = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - offset).toISOString().split("T")[0];
};

// --- STATE MANAGEMENT ---
let state = {
  materials: [],
  movements: [],
  categories: [],
  currentSection: "dashboard",
  pagination: { search: 1, stock: 1, movement: 1 },
};

// --- API CALLS ---
const api = {
  async getMaterials() {
    const res = await fetch(`${API_URL}/materials`);
    return res.json();
  },
  async getCategories() {
    const res = await fetch(`${API_URL}/categories`);
    return res.json();
  },
  async getMovements() {
    const res = await fetch(`${API_URL}/movements`);
    return res.json();
  },
  async createMaterial(data) {
    const res = await fetch(`${API_URL}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao criar");
    return res.json();
  },
  async updateMaterial(id, data) {
    const res = await fetch(`${API_URL}/materials/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao atualizar");
    return res.json();
  },
  async createMovement(data) {
    const res = await fetch(`${API_URL}/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao movimentar");
    return res.json();
  },
  async createCategory(name) {
    const res = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },
  async deleteCategory(id) {
    await fetch(`${API_URL}/categories/${id}`, { method: "DELETE" });
  },
};

// --- CORE FUNCTIONS ---
const refreshData = async () => {
  try {
    const [mats, cats, movs] = await Promise.all([
      api.getMaterials(),
      api.getCategories(),
      api.getMovements(),
    ]);
    state.materials = mats;
    state.categories = cats;
    state.movements = movs;
    renderCurrentSection();
  } catch (err) {
    console.error(err);
    showToast(
      "Erro ao conectar ao servidor. Verifique se o Node.js está rodando.",
      "danger"
    );
  }
};

const renderCurrentSection = () => {
  if (state.currentSection === "dashboard") renderDashboard();
  if (state.currentSection === "search-material") renderSearchMaterial();
  if (state.currentSection === "stock-search") renderStockSearch();
  if (state.currentSection === "movement-search") renderMovementSearch();
  if (state.currentSection === "material-reports") renderReports();
  if (state.currentSection === "settings") renderSettings();

  renderCategorySelects();
};

// --- RENDERS ---
const renderCategorySelects = () => {
  const selects = [$("#material-category"), $("#search-category-filter")];
  selects.forEach((sel) => {
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = `<option value="${
      sel.id.includes("filter") ? "all" : ""
    }">${
      sel.id.includes("filter") ? "Todas as Categorias" : "Selecione"
    }</option>`;
    state.categories.forEach((c) => {
      const opt = createEl("option", "", c.name);
      opt.value = c.name;
      sel.appendChild(opt);
    });
    if (currentVal) sel.value = currentVal;
  });
};

const renderTable = (containerId, columns, data) => {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const table = createEl("table");
  const thead = createEl("thead");
  const trHead = createEl("tr");
  columns.forEach((col) => trHead.appendChild(createEl("th", "", col.header)));
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = createEl("tbody");
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${columns.length}" style="text-align:center; padding: 20px;">Nenhum registro encontrado.</td></tr>`;
  } else {
    data.forEach((row) => {
      const tr = createEl("tr");
      columns.forEach((col) => {
        const td = createEl("td");
        if (col.render) {
          const content = col.render(row);
          if (typeof content === "string") td.innerHTML = content;
          else td.appendChild(content);
        } else {
          td.textContent = row[col.key] || "";
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);
  container.appendChild(table);
};

// 1. DASHBOARD
const renderDashboard = () => {
  const active = state.materials.filter((m) => !m.isArchived);
  $("#total-items").textContent = NUMBER_FORMAT.format(
    active.reduce((acc, m) => acc + (m.quantity || 0), 0)
  );
  $("#low-stock").textContent = active.filter(
    (m) => (m.quantity || 0) < (m.min_quantity || 0) && m.quantity > 0
  ).length;

  const recent = active.slice(0, 5);
  renderTable(
    "recent-materials-container",
    [
      {
        header: "Material",
        render: (m) => {
          const div = createEl("div", "", "");
          div.style.display = "flex";
          div.style.alignItems = "center";
          if (m.image) {
            const img = createEl("img", "img-thumbnail");
            img.src = m.image;
            div.appendChild(img);
          }
          div.appendChild(document.createTextNode(m.name));
          return div;
        },
      },
      { header: "SKU", key: "sku" },
      { header: "Qtd", key: "quantity" },
      {
        header: "Status",
        render: (m) => getStatusBadge(m),
      },
    ],
    recent
  );
};

// 2. PESQUISA MATERIAL
const renderSearchMaterial = () => {
  const term = $("#search-material-input").value.toLowerCase();
  const cat = $("#search-category-filter").value;
  const showArchived = $("#search-show-archived").checked;

  let data = state.materials.filter((m) =>
    showArchived ? m.isArchived : !m.isArchived
  );
  if (cat !== "all") data = data.filter((m) => m.category === cat);
  if (term)
    data = data.filter(
      (m) => m.name.toLowerCase().includes(term) || m.sku.includes(term)
    );

  renderTable(
    "search-material-results-container",
    [
      { header: "Material", key: "name" },
      { header: "SKU", key: "sku" },
      { header: "Categoria", key: "category" },
      { header: "Qtd", key: "quantity" },
      {
        header: "Ações",
        render: (m) => {
          const btn = createEl(
            "button",
            "btn btn-sm btn-secondary",
            "Detalhes"
          );
          btn.onclick = () => openModal(m);
          return btn;
        },
      },
    ],
    data
  );
};

// 3. ESTOQUE (FILTROS)
const renderStockSearch = () => {
  const filter = $("#stock-status-filter").value;
  let data = state.materials.filter((m) => !m.isArchived);

  if (filter === "out") data = data.filter((m) => m.quantity === 0);
  if (filter === "critical")
    data = data.filter((m) => m.quantity < m.min_quantity);
  if (filter === "attention")
    data = data.filter(
      (m) => m.quantity < m.min_quantity + m.resupply_quantity
    );

  renderTable(
    "stock-search-results-container",
    [
      { header: "Material", key: "name" },
      { header: "Qtd", key: "quantity" },
      { header: "Mínimo", key: "min_quantity" },
      { header: "Status", render: (m) => getStatusBadge(m) },
    ],
    data
  );
};

// 4. MOVIMENTAÇÕES
const renderMovementSearch = () => {
  const date = $("#movement-search-date").value;
  let data = state.movements;
  if (date) data = data.filter((m) => m.date.startsWith(date));

  renderTable(
    "movement-search-results-container",
    [
      {
        header: "Data",
        render: (m) => new Date(m.date).toLocaleDateString("pt-BR"),
      },
      { header: "Material", key: "materialName" },
      {
        header: "Tipo",
        render: (m) =>
          `<span class="status ${
            m.type === "entrada" ? "status-success" : "status-danger"
          }">${m.type.toUpperCase()}</span>`,
      },
      { header: "Qtd", key: "quantity" },
      { header: "Motivo", key: "reason" },
    ],
    data
  );
};

// 5. RELATÓRIOS
const renderReports = () => {
  const active = state.materials.filter((m) => !m.isArchived);
  $("#report-total-materials").textContent = active.length;
  $("#report-out-of-stock").textContent = active.filter(
    (m) => m.quantity === 0
  ).length;
  $("#report-high-stock").textContent = active.filter(
    (m) => m.quantity > 50
  ).length;

  // Gráfico Categorias
  const counts = {};
  active.forEach((m) => (counts[m.category] = (counts[m.category] || 0) + 1));
  const max = Math.max(...Object.values(counts), 1);

  let chartHtml = "";
  for (const [cat, count] of Object.entries(counts)) {
    const width = (count / max) * 100;
    chartHtml += `
      <div class="chart-row">
        <div class="chart-label">${cat}</div>
        <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${width}%"></div></div>
        <div class="chart-value">${count}</div>
      </div>
    `;
  }
  $("#category-chart-container").innerHTML = chartHtml || "Sem dados.";

  // Top Movimentados
  const movCounts = {};
  state.movements.forEach(
    (m) =>
      (movCounts[m.materialName] =
        (movCounts[m.materialName] || 0) + m.quantity)
  );
  const sorted = Object.entries(movCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const tbody = $("#top-movements-report");
  tbody.innerHTML = "";
  sorted.forEach(([name, qtd]) => {
    tbody.innerHTML += `<tr><td>${name}</td><td>${qtd}</td></tr>`;
  });
};

// 6. CONFIGURAÇÕES
const renderSettings = () => {
  const list = $("#settings-category-list");
  list.innerHTML = "";
  state.categories.forEach((c) => {
    const tag = createEl("div", "category-tag");
    tag.innerHTML = `<span>${c.name}</span> <i class="fa fa-times" onclick="deleteCategory(${c.id})"></i>`;
    list.appendChild(tag);
  });
};

// --- UTILS INTERNOS ---
const getStatusBadge = (m) => {
  if (m.isArchived)
    return '<span class="status status-warning">Arquivado</span>';
  if (m.quantity === 0)
    return '<span class="status status-danger">Sem Estoque</span>';
  if (m.quantity < m.min_quantity)
    return '<span class="status status-danger">Crítico</span>';
  if (m.quantity < m.min_quantity + m.resupply_quantity)
    return '<span class="status status-warning">Ressuprimento</span>';
  return '<span class="status status-success">OK</span>';
};

// --- EVENTOS FORMULÁRIOS ---
let _tempImage = null;
let _editingId = null;

// Upload Imagem
$("#material-image").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    _tempImage = ev.target.result;
    $(
      "#form-image-preview"
    ).innerHTML = `<img src="${_tempImage}" style="width:100%;height:100%;object-fit:cover;">`;
  };
  reader.readAsDataURL(file);
});

// Submit Material (Criar ou Editar)
$("#material-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    name: $("#material-name").value,
    sku: $("#material-sku").value,
    category: $("#material-category").value,
    quantity: Number($("#material-quantity").value),
    minQuantity: Number($("#material-min-quantity").value),
    resupplyQuantity: Number($("#material-resupply-quantity").value),
    alertPercentage: Number($("#material-alert-percentage").value),
    description: $("#material-description").value,
    image: _tempImage,
  };

  try {
    if (_editingId) {
      await api.updateMaterial(_editingId, data);
      showToast("Material atualizado com sucesso!");
    } else {
      await api.createMaterial(data);
      showToast("Material criado com sucesso!");
    }
    resetMaterialForm();
    refreshData();
  } catch (err) {
    showToast("Erro ao salvar material", "danger");
  }
});

// Cancelar Form
$("#form-cancel").addEventListener("click", () => {
  resetMaterialForm();
  navigateTo("dashboard");
});

const resetMaterialForm = () => {
  $("#material-form").reset();
  _editingId = null;
  _tempImage = null;
  $("#form-image-preview").innerHTML = '<i class="fa fa-image fa-2x"></i>';
};

// Submit Movimentação
$("#movement-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const sku = $("#movement-sku-input").value;
  const mat = state.materials.find((m) => m.sku === sku);

  if (!mat) return showToast("Material não encontrado!", "danger");

  const type = document.querySelector(
    'input[name="movement-type"]:checked'
  ).value;
  const quantity = Number($("#movement-quantity").value);

  if (type === "saida" && mat.quantity < quantity) {
    return showToast("Estoque insuficiente para saída!", "danger");
  }

  try {
    await api.createMovement({
      materialId: mat.id,
      type,
      quantity,
      date: $("#movement-custom-date").value,
      reason: $("#movement-reason").value,
    });
    showToast("Movimentação registrada!");
    $("#movement-form").reset();
    $("#movement-custom-date").value = getLocalDate();
    refreshData();
  } catch (err) {
    showToast("Erro ao registrar movimentação", "danger");
  }
});

// Feedback de SKU na movimentação
$("#movement-sku-input").addEventListener("input", (e) => {
  const val = e.target.value;
  const mat = state.materials.find((m) => m.sku === val);
  const label = $("#movement-material-name");
  if (mat) {
    label.innerHTML = `<span class="success">${mat.name}</span> (Atual: <strong>${mat.quantity}</strong>)`;
  } else {
    label.innerHTML = '<span class="danger">Material não encontrado</span>';
  }
});

// Categorias
$("#add-category-btn").addEventListener("click", async () => {
  const name = $("#new-category-input").value;
  if (!name) return;
  try {
    await api.createCategory(name);
    $("#new-category-input").value = "";
    refreshData();
    showToast("Categoria adicionada!");
  } catch (err) {
    showToast("Erro ao adicionar categoria", "danger");
  }
});

window.deleteCategory = async (id) => {
  if (await showConfirm("Apagar", "Deseja remover esta categoria?")) {
    await api.deleteCategory(id);
    refreshData();
  }
};

// Modal Genérico
const showConfirm = (title, message, options = {}) => {
  return new Promise((resolve) => {
    const modal = $("#confirm-modal");
    $("#confirm-modal-title").textContent = title || "Confirmação";
    $("#confirm-modal-message").textContent = message || "Tem certeza?";
    const btnConfirm = $("#confirm-modal-btn-confirm");
    const btnCancel = $("#confirm-modal-btn-cancel");

    const cleanup = () => {
      modal.style.display = "none";
      btnConfirm.onclick = null;
      btnCancel.onclick = null;
    };

    modal.style.display = "flex";
    btnConfirm.onclick = () => {
      resolve(true);
      cleanup();
    };
    btnCancel.onclick = () => {
      resolve(false);
      cleanup();
    };
  });
};

// --- MODAL LÓGICA ---
const openModal = (m) => {
  const badge = getStatusBadge(m);
  $("#modal-body").innerHTML = `
    <div style="text-align:center; margin-bottom:1rem;">
      ${
        m.image
          ? `<img src="${m.image}" style="max-height:150px; border-radius:8px;">`
          : '<div style="height:100px; background:#eee; display:flex; align-items:center; justify-content:center; border-radius:8px;"><i class="fa fa-cube fa-3x" style="color:#ccc"></i></div>'
      }
    </div>
    <p><strong>Nome:</strong> ${m.name}</p>
    <p><strong>SKU:</strong> ${m.sku}</p>
    <p><strong>Categoria:</strong> ${m.category}</p>
    <p><strong>Quantidade:</strong> <span style="font-size:1.2rem; font-weight:bold;">${
      m.quantity
    }</span></p>
    <p><strong>Status:</strong> ${badge}</p>
    <div style="margin-top:10px; padding-top:10px; border-top:1px solid #eee;">
      <small>${m.description || "Sem descrição"}</small>
    </div>
  `;

  $("#edit-material").onclick = () => {
    closeModal();
    loadEditForm(m);
  };

  $("#archive-material").onclick = async () => {
    if (await showConfirm("Arquivar", `Deseja arquivar "${m.name}"?`)) {
      await api.updateMaterial(m.id, { ...m, isArchived: true });
      refreshData();
      closeModal();
      showToast("Material arquivado.");
    }
  };

  $("#material-modal").style.display = "flex";
};

const closeModal = () => {
  $(".modal").style.display = "none";
  $$(".modal").forEach((m) => (m.style.display = "none"));
};

const loadEditForm = (m) => {
  _editingId = m.id;
  $("#material-name").value = m.name;
  $("#material-sku").value = m.sku;
  $("#material-category").value = m.category;
  $("#material-quantity").value = m.quantity;
  $("#material-min-quantity").value = m.min_quantity;
  $("#material-resupply-quantity").value = m.resupply_quantity;
  $("#material-alert-percentage").value = m.alert_percentage;
  $("#material-description").value = m.description;

  if (m.image) {
    _tempImage = m.image;
    $(
      "#form-image-preview"
    ).innerHTML = `<img src="${m.image}" style="width:100%;height:100%;object-fit:cover;">`;
  } else {
    _tempImage = null;
    $("#form-image-preview").innerHTML = '<i class="fa fa-image fa-2x"></i>';
  }

  navigateTo("add-material");
};

// --- NAVEGAÇÃO E SIDEBAR ---
const navigateTo = (targetId) => {
  state.currentSection = targetId;
  $$(".content-section").forEach((s) => (s.style.display = "none"));
  const target = document.getElementById(targetId);
  if (target) target.style.display = "block";

  // Atualizar menu ativo
  $$(".nav-item").forEach((n) => n.classList.remove("active"));

  // Correção para garantir que o menu Dashboard fique ativo mesmo se clicado pelo logo
  const navItem = document.querySelector(
    `.nav-item[data-target="${targetId}"]`
  );
  if (navItem) navItem.classList.add("active");

  // Se estiver no mobile, fecha a sidebar ao navegar
  if (window.innerWidth <= 768) {
    closeSidebar();
  }

  renderCurrentSection();
};

// Toggle Sidebar Mobile
const openSidebar = () => {
  $("#sidebar").classList.add("active");
  $("#sidebar-overlay").classList.add("active");
};

const closeSidebar = () => {
  $("#sidebar").classList.remove("active");
  $("#sidebar-overlay").classList.remove("active");
};

$("#menu-toggle").addEventListener("click", openSidebar);
$("#close-sidebar").addEventListener("click", closeSidebar);
$("#sidebar-overlay").addEventListener("click", closeSidebar);

// Listeners Navegação
$$("[data-target]").forEach((el) => {
  if (!el.classList.contains("collapsible")) {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const target = el.getAttribute("data-target");
      navigateTo(target);
    });
  }
});

// Listener Submenus
$$(".collapsible").forEach((header) => {
  header.addEventListener("click", () => {
    const target = header.getAttribute("data-target");
    const ul = document.getElementById(target);
    const arrow = header.querySelector(".arrow");
    if (ul) {
      ul.classList.toggle("open");
      arrow.classList.toggle("rotate");
    }
  });
});

// Fechar modal
$$("[data-close]").forEach((btn) => btn.addEventListener("click", closeModal));

// Eventos de Filtro (Pesquisa)
$("#search-material-input").addEventListener("input", renderSearchMaterial);
$("#search-category-filter").addEventListener("change", renderSearchMaterial);
$("#search-show-archived").addEventListener("change", renderSearchMaterial);
$("#stock-status-filter").addEventListener("change", renderStockSearch);
$("#movement-search-date").addEventListener("change", renderMovementSearch);

// Inicialização
window.addEventListener("DOMContentLoaded", () => {
  $("#movement-custom-date").value = getLocalDate();
  refreshData();
});

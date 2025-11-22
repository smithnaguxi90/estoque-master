// === UTILS ===
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const NUMBER_FORMAT = new Intl.NumberFormat("pt-BR");
const ITEMS_PER_PAGE = 10;
const API_URL = "http://localhost:3000/api"; // Endereço do Backend

// Helper para data local
const getLocalDate = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const local = new Date(today.getTime() - offset * 60000);
  return local.toISOString().split("T")[0];
};

// Create Element Helper (Security)
const createEl = (tag, text = "", className = "", style = "") => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  if (style) el.style.cssText = style;
  return el;
};

const showToast = (message, type = "success", duration = 3000) => {
  const container = $("#toast-container");
  if (!container) return;
  const toast = createEl("div", message, `toast toast-${type}`);
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, duration);
};

const showConfirm = (title, message, options = {}) => {
  return new Promise((resolve) => {
    const modal = $("#confirm-modal");
    $("#confirm-modal-title").textContent = title || "Confirmação";
    $("#confirm-modal-message").textContent = message || "Tem certeza?";
    const btnConfirm = $("#confirm-modal-btn-confirm");
    const btnCancel = $("#confirm-modal-btn-cancel");
    btnConfirm.className = "btn";
    btnConfirm.classList.add(`btn-${options.confirmStyle || "primary"}`);
    btnConfirm.textContent = options.confirmText || "Confirmar";

    const cleanup = () => {
      modal.style.display = "none";
      btnConfirm.onclick = null;
      btnCancel.onclick = null;
    };
    modal.style.display = "flex";
    modal.classList.add("fade-in");
    btnConfirm.onclick = () => {
      resolve(true);
      cleanup();
    };
    btnCancel.onclick = () => {
      resolve(false);
      cleanup();
    };
    modal.querySelector(".modal-overlay").onclick = () => {
      resolve(false);
      cleanup();
    };
    modal.querySelector(".modal-close").onclick = () => {
      resolve(false);
      cleanup();
    };
  });
};

const exportTableToCSV = (rows, filename) => {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += rows.map((e) => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// === STATE ===
let state = {
  materials: [],
  movements: [],
  categories: [],
  currentSection: "dashboard",
  pagination: {
    recent: 1,
    search: 1,
    stock: 1,
    movement: 1,
  },
  sort: {
    search: { key: "name", asc: true },
    stock: { key: "name", asc: true },
  },
};

const DEFAULT_CATEGORIES = [
  "Carpetes",
  "Chaves",
  "Construção",
  "Equipamentos",
  "Estrutural",
  "Ferramentas",
  "Gesso",
  "Impermeabilização",
  "Marcenaria",
  "Marmoraria",
  "Materiais",
  "Pavimentação",
  "Persianas",
  "Pintura",
  "Piso Vinílicos",
  "Proteção",
  "Serralheria",
  "Tapeçaria",
  "Vidraçaria",
];

// Salva dados locais (apenas movimentações e categorias por enquanto,
// já que materiais vêm do servidor)
const saveLocalState = () => {
  try {
    localStorage.setItem(
      "estoqueMaster_movements",
      JSON.stringify(state.movements)
    );
    localStorage.setItem(
      "estoqueMaster_categories",
      JSON.stringify(state.categories)
    );
  } catch (e) {
    console.error(e);
  }
};

// === API FUNCTIONS ===

// Buscar materiais do servidor
const fetchMaterials = async () => {
  try {
    const response = await fetch(`${API_URL}/materials`);
    if (!response.ok) throw new Error("Erro na resposta da API");
    const data = await response.json();
    state.materials = data;
    renderDashboard(); // Atualiza a tela após carregar
  } catch (error) {
    console.error("Erro ao buscar materiais:", error);
    showToast("Erro ao conectar com o servidor.", "danger");
  }
};

// Criar material no servidor
const createMaterial = async (materialData) => {
  try {
    const response = await fetch(`${API_URL}/materials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(materialData),
    });

    if (!response.ok) throw new Error("Erro ao criar material");

    const result = await response.json();
    showToast("Material salvo com sucesso!", "success");

    // Recarregar lista
    await fetchMaterials();
    return true;
  } catch (error) {
    console.error("Erro ao criar material:", error);
    showToast("Erro ao salvar material.", "danger");
    return false;
  }
};

const initState = async () => {
  // Carregar dados locais
  const movs = localStorage.getItem("estoqueMaster_movements");
  state.movements = movs ? JSON.parse(movs) : [];

  const cats = localStorage.getItem("estoqueMaster_categories");
  state.categories = cats ? JSON.parse(cats) : DEFAULT_CATEGORIES;

  // Carregar dados do servidor
  await fetchMaterials();
};

initState();

// === RENDER HELPERS ===
let _currentModalMaterial = null;
let _tempImageBase64 = null;

const getResupplyAlertLevel = (m) => {
  const minQty = m.minQuantity || 0;
  const resupplyQty = m.resupplyQuantity || 0;
  if (resupplyQty === 0) return minQty;
  return minQty + resupplyQty * ((m.alertPercentage || 40) / 100);
};

const getMaterialStatus = (m) => {
  if (m.isArchived) return { text: "Arquivado", class: "status-warning" };
  if (m.quantity === 0) return { text: "Sem Estoque", class: "status-danger" };
  if (m.quantity < (m.minQuantity || 0))
    return { text: "Estoque Crítico", class: "status-danger" };
  if (m.quantity < getResupplyAlertLevel(m))
    return { text: "Ressuprimento", class: "status-warning" };
  return { text: "Em Estoque", class: "status-success" };
};

// === GENERIC TABLE RENDER ===
const renderTable = (
  containerId,
  columns,
  data,
  paginationKey,
  allowSort = false
) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  // Sort logic
  let processedData = [...data];
  if (allowSort && state.sort[paginationKey]) {
    const { key, asc } = state.sort[paginationKey];
    processedData.sort((a, b) => {
      let valA = a[key],
        valB = b[key];
      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });
  }

  // Pagination Logic
  const page = state.pagination[paginationKey] || 1;
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  state.pagination[paginationKey] = safePage;

  const start = (safePage - 1) * ITEMS_PER_PAGE;
  const pageData = processedData.slice(start, start + ITEMS_PER_PAGE);

  const table = createEl("table");
  const thead = createEl("thead");
  const trHead = createEl("tr");

  columns.forEach((col) => {
    const th = createEl("th", col.header);
    if (allowSort && col.sortKey) {
      th.style.cursor = "pointer";
      const icon = createEl("i", "", "fa fa-sort sort-icon");
      if (state.sort[paginationKey]?.key === col.sortKey) {
        icon.className = `fa fa-sort-${
          state.sort[paginationKey].asc ? "asc" : "desc"
        } sort-icon sort-active`;
      }
      th.appendChild(icon);
      th.onclick = () => {
        const current = state.sort[paginationKey];
        if (current.key === col.sortKey) {
          current.asc = !current.asc;
        } else {
          state.sort[paginationKey] = { key: col.sortKey, asc: true };
        }
        renderTable(containerId, columns, data, paginationKey, allowSort); // Re-render
      };
    }
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = createEl("tbody");
  if (pageData.length === 0) {
    const tr = createEl("tr");
    const td = createEl("td", "Nenhum registro encontrado.");
    td.colSpan = columns.length;
    td.style.textAlign = "center";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    pageData.forEach((row) => {
      const tr = createEl("tr");
      columns.forEach((col) => {
        const td = createEl("td");
        if (col.render) {
          const rendered = col.render(row);
          if (typeof rendered === "string") td.innerHTML = rendered;
          else if (rendered instanceof HTMLElement) td.appendChild(rendered);
        } else {
          const val = row[col.key];
          td.textContent = val !== undefined && val !== null ? val : "";
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);
  container.appendChild(table);

  // Controls
  if (totalPages > 1) {
    const controls = createEl("div", "", "pagination-controls");
    const btnPrev = createEl("button", "Anterior", "btn btn-secondary btn-sm");
    btnPrev.disabled = safePage === 1;
    btnPrev.onclick = () => {
      state.pagination[paginationKey]--;
      renderTable(containerId, columns, data, paginationKey, allowSort);
    };

    const info = createEl(
      "span",
      `Pág ${safePage} de ${totalPages}`,
      "page-info"
    );

    const btnNext = createEl("button", "Próximo", "btn btn-secondary btn-sm");
    btnNext.disabled = safePage === totalPages;
    btnNext.onclick = () => {
      state.pagination[paginationKey]++;
      renderTable(containerId, columns, data, paginationKey, allowSort);
    };

    controls.appendChild(btnPrev);
    controls.appendChild(info);
    controls.appendChild(btnNext);
    container.appendChild(controls);
  }
};

// === LOGIC ===
document.addEventListener("DOMContentLoaded", () => {
  const el = {
    sidebar: $("#sidebar"),
    menuToggle: $("#menu-toggle"),
    themeToggle: $("#theme-toggle"),
    dashboard: $("#dashboard"),
    addMaterial: $("#add-material"),
    searchMaterial: $("#search-material"),
    stockSearch: $("#stock-search"),
    stockMovement: $("#stock-movement"),
    movementSearch: $("#movement-search"),
    materialReports: $("#material-reports"),
    settings: $("#settings"),
    materialForm: $("#material-form"),
    totalItems: $("#total-items"),
    lowStock: $("#low-stock"),
    formCancel: $("#form-cancel"),
    searchMaterialInput: $("#search-material-input"),
    searchMaterialResults: $("#search-material-results"),
    stockStatusFilter: $("#stock-status-filter"),
    movementForm: $("#movement-form"),
    movementSkuInput: $("#movement-sku-input"),
    movementMaterialName: $("#movement-material-name"),
    movementQuantity: $("#movement-quantity"),
    movementReason: $("#movement-reason"),
    movementSearchDate: $("#movement-search-date"),
    movementCustomDate: $("#movement-custom-date"),
    reportTotalMaterials: $("#report-total-materials"),
    reportOutOfStock: $("#report-out-of-stock"),
    reportHighStock: $("#report-high-stock"),
    topMovementsReport: $("#top-movements-report"),
    resetDataBtn: $("#reset-data-btn"),
    exportDataBtn: $("#export-data-btn"),
    importFileInput: $("#import-file-input"),
    searchCategoryFilter: $("#search-category-filter"),
    searchShowArchived: $("#search-show-archived"),
    archiveMaterialBtn: $("#archive-material"),
    unarchiveMaterialBtn: $("#unarchive-material"),
    editMaterial: $("#edit-material"),
    categoryChartContainer: $("#category-chart-container"),
    btnThemeLight: $("#btn-theme-light"),
    btnThemeDark: $("#btn-theme-dark"),
    materialResupplyQuantity: $("#material-resupply-quantity"),
    materialAlertPercentage: $("#material-alert-percentage"),
    logoutBtn: $("#logout-btn"),
    btnExportSearch: $("#btn-export-search"),
    btnExportMovements: $("#btn-export-movements"),
    skuInputAdd: $("#material-sku"),
    skuFeedback: $("#sku-feedback"),
    settingsCategoryList: $("#settings-category-list"),
    newCategoryInput: $("#new-category-input"),
    addCategoryBtn: $("#add-category-btn"),
    materialImageInput: $("#material-image"),
    formImagePreview: $("#form-image-preview"),
  };

  // Fill Selects
  const renderCategorySelects = () => {
    const selects = [$("#material-category"), $("#search-category-filter")];
    selects.forEach((sel) => {
      if (!sel) return;
      const currentVal = sel.value;
      sel.innerHTML = `<option value="${
        sel.id === "search-category-filter" ? "all" : ""
      }">${
        sel.id === "search-category-filter"
          ? "Todas as Categorias"
          : "Selecione"
      }</option>`;
      state.categories.sort().forEach((cat) => {
        const opt = createEl("option", cat);
        opt.value = cat;
        sel.appendChild(opt);
      });
      sel.value = currentVal;
    });
  };
  renderCategorySelects();

  const renderSection = (sectionId) => {
    [
      el.dashboard,
      el.addMaterial,
      el.searchMaterial,
      el.stockSearch,
      el.stockMovement,
      el.movementSearch,
      el.materialReports,
      el.settings,
    ].forEach((s) => (s.style.display = "none"));
    if (sectionId === "dashboard") {
      el.dashboard.style.display = "block";
      renderDashboard();
    } else if (sectionId === "add-material") {
      el.addMaterial.style.display = "block";
      renderCategorySelects();
    } else if (sectionId === "search-material") {
      el.searchMaterial.style.display = "block";
      renderSearchMaterial();
    } else if (sectionId === "stock-search") {
      el.stockSearch.style.display = "block";
      renderStockSearch();
    } else if (sectionId === "stock-movement") {
      el.stockMovement.style.display = "block";
      el.movementForm.reset();
      el.movementCustomDate.value = getLocalDate(); // Data local
      el.movementMaterialName.textContent = "Digite o código do material.";
      el.movementMaterialName.className = "neutral";
    } else if (sectionId === "movement-search") {
      el.movementSearch.style.display = "block";
      renderMovementSearch();
    } else if (sectionId === "material-reports") {
      el.materialReports.style.display = "block";
      renderMaterialReports();
    } else if (sectionId === "settings") {
      el.settings.style.display = "block";
      renderSettings();
    }
    state.currentSection = sectionId;
    updateActiveNav(sectionId);
  };

  const renderDashboard = () => {
    const activeMaterials = state.materials.filter((m) => !m.isArchived);
    el.totalItems.textContent = NUMBER_FORMAT.format(
      activeMaterials.reduce((sum, m) => sum + m.quantity, 0)
    );
    el.lowStock.textContent = activeMaterials.filter(
      (m) => m.quantity < getResupplyAlertLevel(m) && m.quantity > 0
    ).length;

    // Recent table
    const recentData = [...activeMaterials].reverse().slice(0, 5);
    const cols = [
      {
        header: "Material",
        key: "name",
        render: (m) => {
          const div = createEl(
            "div",
            "",
            "",
            `display:flex;align-items:center;`
          );
          if (m.image) {
            const img = createEl("img", "", "img-thumbnail");
            img.src = m.image;
            div.appendChild(img);
          }
          div.appendChild(document.createTextNode(m.name));
          return div;
        },
      },
      { header: "Cód.", key: "sku" },
      { header: "Qtd.", key: "quantity" },
      {
        header: "Status",
        render: (m) => {
          const s = getMaterialStatus(m);
          return createEl("span", s.text, `status ${s.class}`);
        },
      },
      {
        header: "Ações",
        render: (m) => {
          const a = createEl("a", "Detalhes", "view-details");
          a.href = "#";
          a.onclick = (e) => {
            e.preventDefault();
            openMaterialModal(m);
          };
          return a;
        },
      },
    ];
    renderTable("recent-materials-container", cols, recentData, "recent");
  };

  const renderSearchMaterial = () => {
    const term = el.searchMaterialInput.value.toLowerCase();
    const category = el.searchCategoryFilter.value;
    const showArchived = el.searchShowArchived.checked;

    let results = state.materials.filter((m) =>
      showArchived ? m.isArchived : !m.isArchived
    );
    if (category !== "all")
      results = results.filter((m) => m.category === category);
    if (term)
      results = results.filter(
        (m) => m.name.toLowerCase().includes(term) || m.sku.includes(term)
      );

    const cols = [
      {
        header: "Material",
        key: "name",
        sortKey: "name",
        render: (m) => {
          const div = createEl(
            "div",
            "",
            "",
            `display:flex;align-items:center;`
          );
          if (m.image) {
            const img = createEl("img", "", "img-thumbnail");
            img.src = m.image;
            div.appendChild(img);
          }
          div.appendChild(document.createTextNode(m.name));
          return div;
        },
      },
      { header: "Cód.", key: "sku", sortKey: "sku" },
      { header: "Categoria", key: "category", sortKey: "category" },
      { header: "Qtd.", key: "quantity", sortKey: "quantity" },
      { header: "Mín.", key: "minQuantity" },
      {
        header: "Ações",
        render: (m) => {
          const a = createEl("a", "Detalhes", "view-details");
          a.href = "#";
          a.onclick = (e) => {
            e.preventDefault();
            openMaterialModal(m);
          };
          return a;
        },
      },
    ];
    renderTable(
      "search-material-results-container",
      cols,
      results,
      "search",
      true
    );
  };

  const renderStockSearch = () => {
    const filter = el.stockStatusFilter.value;
    const active = state.materials.filter((m) => !m.isArchived);
    let results = active;
    if (filter === "out") results = active.filter((m) => m.quantity === 0);
    else if (filter === "critical")
      results = active.filter((m) => m.quantity < (m.minQuantity || 0));
    else if (filter === "attention")
      results = active.filter((m) => m.quantity < getResupplyAlertLevel(m));

    const cols = [
      { header: "Material", key: "name", sortKey: "name" },
      { header: "Qtd. Atual", key: "quantity", sortKey: "quantity" },
      { header: "Qtd. Mínima", key: "minQuantity" },
      {
        header: "Status",
        render: (m) => {
          const s = getMaterialStatus(m);
          return createEl("span", s.text, `status ${s.class}`);
        },
      },
    ];
    renderTable("stock-search-results-container", cols, results, "stock", true);
  };

  const renderMovementSearch = () => {
    const date = el.movementSearchDate.value;
    let results = [...state.movements].reverse();
    if (date) results = results.filter((m) => m.date === date);

    const cols = [
      { header: "Data", key: "date" },
      { header: "Material", key: "materialName" },
      {
        header: "Tipo",
        key: "type",
        render: (m) =>
          createEl(
            "span",
            m.type,
            `status status-${m.type === "entrada" ? "success" : "danger"}`
          ),
      },
      { header: "Qtd.", key: "quantity" },
      { header: "Motivo", key: "reason" },
    ];
    renderTable("movement-search-results-container", cols, results, "movement");
  };

  const renderMaterialReports = () => {
    const active = state.materials.filter((m) => !m.isArchived);
    el.reportTotalMaterials.textContent = active.length;
    el.reportOutOfStock.textContent = active.filter(
      (m) => m.quantity === 0
    ).length;
    el.reportHighStock.textContent = active.filter(
      (m) => m.quantity > 20
    ).length;
    const catCounts = {};
    active.forEach(
      (m) => (catCounts[m.category] = (catCounts[m.category] || 0) + 1)
    );
    const max = Math.max(0, ...Object.values(catCounts));
    let chart = "";
    Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => {
        const pct = max > 0 ? (v / max) * 100 : 0;
        chart += `<div class="chart-row"><div class="chart-label">${k}</div><div class="chart-bar-background"><div class="chart-bar" style="width: ${pct}%"></div></div><div class="chart-value">${v}</div></div>`;
      });
    el.categoryChartContainer.innerHTML = chart || "<p>Sem dados.</p>";
    const movCount = {};
    state.movements.forEach(
      (m) =>
        (movCount[m.materialId] = (movCount[m.materialId] || 0) + m.quantity)
    );
    const sorted = Object.entries(movCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const fragment = document.createDocumentFragment();
    sorted.forEach(([id, total]) => {
      const m = state.materials.find((x) => x.id === Number(id));
      if (m) {
        const tr = createEl("tr");
        tr.appendChild(createEl("td", m.name));
        tr.appendChild(createEl("td", total));
        fragment.appendChild(tr);
      }
    });
    el.topMovementsReport.innerHTML = "";
    el.topMovementsReport.appendChild(fragment);
  };

  const renderSettings = () => {
    el.settingsCategoryList.innerHTML = "";
    state.categories.forEach((cat) => {
      const tag = createEl("div", "", "category-tag");
      tag.appendChild(createEl("span", cat));
      const icon = createEl("i", "", "fa fa-times");
      icon.onclick = () => {
        if (confirm(`Remover categoria "${cat}"?`)) {
          state.categories = state.categories.filter((c) => c !== cat);
          saveLocalState();
          renderSettings();
          renderCategorySelects();
        }
      };
      tag.appendChild(icon);
      el.settingsCategoryList.appendChild(tag);
    });
  };

  const updateActiveNav = (target) => {
    $$(".nav-item").forEach((item) => {
      if (item.getAttribute("data-target") === target)
        item.classList.add("active");
      else item.classList.remove("active");
    });
  };

  const closeModal = () => {
    const modal = $("#material-modal");
    modal.classList.remove("fade-in");
    setTimeout(() => (modal.style.display = "none"), 300);
  };

  // === LÓGICA DOS MENUS EXPANSÍVEIS (COLLAPSIBLE) ===
  $$(".nav-header.collapsible").forEach((header) => {
    header.addEventListener("click", () => {
      const targetId = header.getAttribute("data-target");
      const submenu = document.getElementById(targetId);
      const arrow = header.querySelector(".arrow");

      if (submenu) {
        submenu.classList.toggle("open");
        if (arrow) arrow.classList.toggle("rotate");
      }
    });
  });

  const openMaterialModal = (m) => {
    _currentModalMaterial = m;
    const { text, class: cls } = getMaterialStatus(m);
    const modalBody = $("#modal-body");
    modalBody.innerHTML = `
    <div style="display: flex; justify-content: center; margin-bottom: 1rem;">
       ${
         m.image
           ? `<img src="${m.image}" style="max-width: 150px; max-height: 150px; border-radius: 8px;">`
           : '<div style="width:100px;height:100px;background:var(--color-border);display:flex;align-items:center;justify-content:center;border-radius:8px;"><i class="fa fa-cube fa-3x" style="opacity:0.3"></i></div>'
       }
    </div>
    <p><strong>Nome:</strong> <span>${m.name}</span></p>
    <p><strong>CÓDIGO:</strong> <span>${m.sku}</span></p>
    <p><strong>Categoria:</strong> <span>${m.category}</span></p>
    <p><strong>Qtd. Atual:</strong> <span>${m.quantity}</span></p>
    <p><strong>Qtd. Mínima:</strong> <span>${m.minQuantity || 0}</span></p>
    <p><strong>Ressuprimento:</strong> <span>${
      m.resupplyQuantity || 0
    }</span></p>
    <p><strong>% Alerta:</strong> <span>${m.alertPercentage || 40}%</span></p>
    <p><strong>Status:</strong> <span class="status ${cls}">${text}</span></p>
    ${
      m.description
        ? `<p><strong>Descrição:</strong></p><p>${m.description}</p>`
        : ""
    }
  `;

    if (m.isArchived) {
      el.archiveMaterialBtn.style.display = "none";
      el.unarchiveMaterialBtn.style.display = "inline-flex";
      el.editMaterial.style.display = "none";
    } else {
      el.archiveMaterialBtn.style.display = "inline-flex";
      el.unarchiveMaterialBtn.style.display = "none";
      el.editMaterial.style.display = "inline-flex";
    }

    $("#material-modal").style.display = "flex";
    $("#material-modal").offsetHeight;
    $("#material-modal").classList.add("fade-in");
  };

  // Listeners
  document.addEventListener("click", (e) => {
    const navLink = e.target.closest("a[data-target]");
    if (navLink) {
      e.preventDefault();
      renderSection(navLink.getAttribute("data-target"));
    }
    if (e.target.hasAttribute("data-close")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
  el.menuToggle?.addEventListener("click", () =>
    el.sidebar.classList.add("open")
  );
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 768 &&
      !el.sidebar.contains(e.target) &&
      e.target !== el.menuToggle
    )
      el.sidebar.classList.remove("open");
  });

  // Theme
  const setTheme = (isDark) => {
    if (isDark) {
      document.body.classList.add("dark-theme");
      el.btnThemeDark.classList.add("active");
      el.btnThemeLight.classList.remove("active");
    } else {
      document.body.classList.remove("dark-theme");
      el.btnThemeLight.classList.add("active");
      el.btnThemeDark.classList.remove("active");
    }
    localStorage.setItem("dark-theme", isDark);
  };
  el.btnThemeLight.addEventListener("click", () => setTheme(false));
  el.btnThemeDark.addEventListener("click", () => setTheme(true));
  if (localStorage.getItem("dark-theme") === "true") setTheme(true);

  // Image Upload Logic (Resize to save space)
  el.materialImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 200; // Thumbnail size
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        _tempImageBase64 = canvas.toDataURL("image/jpeg", 0.7);
        el.formImagePreview.innerHTML = `<img src="${_tempImageBase64}" style="width:100%;height:100%;object-fit:cover;">`;
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Add Category Logic
  el.addCategoryBtn.addEventListener("click", () => {
    const val = el.newCategoryInput.value.trim();
    if (val && !state.categories.includes(val)) {
      state.categories.push(val);
      saveLocalState();
      renderSettings();
      renderCategorySelects();
      el.newCategoryInput.value = "";
      showToast("Categoria adicionada!", "success");
    }
  });

  // [NOVO] Feedback de SKU em tempo real
  el.skuInputAdd.addEventListener("input", () => {
    const val = el.skuInputAdd.value.trim();
    const exists = state.materials.some(
      (m) => m.sku === val && m.id !== Number($("#material-id").value)
    );
    if (exists) {
      el.skuInputAdd.style.borderColor = "var(--color-danger)";
      el.skuFeedback.style.display = "block";
    } else {
      el.skuInputAdd.style.borderColor = "var(--color-text-muted)";
      el.skuFeedback.style.display = "none";
    }
  });

  // Form Submit (UPDATED FOR API)
  el.materialForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = Number($("#material-id").value);
    const matData = {
      name: $("#material-name").value.trim(),
      sku: $("#material-sku").value.trim(),
      category: $("#material-category").value,
      quantity: Number($("#material-quantity").value),
      minQuantity: Number($("#material-min-quantity").value),
      resupplyQuantity: Number($("#material-resupply-quantity").value),
      alertPercentage: Number($("#material-alert-percentage").value),
      description: $("#material-description").value.trim(),
      image: _tempImageBase64,
    };

    // Check for existing SKU locally to avoid unnecessary request
    const exists = state.materials.find(
      (m) => m.sku === matData.sku && m.id !== id
    );
    if (exists) {
      showToast("Código já existe!", "danger");
      return;
    }

    let success = false;
    if (id) {
      // Note: Edit endpoint doesn't exist in server.js provided,
      // so we just handle creation for now or warn user.
      showToast("Edição não suportada pelo servidor atual.", "warning");
    } else {
      // Create new material via API
      success = await createMaterial(matData);
    }

    if (success) {
      el.materialForm.reset();
      el.skuInputAdd.style.borderColor = "var(--color-text-muted)";
      el.skuFeedback.style.display = "none";
      $("#material-min-quantity").value = 0;
      $("#material-resupply-quantity").value = 0;
      $("#material-alert-percentage").value = 40;
      el.formImagePreview.innerHTML = '<i class="fa fa-image fa-2x"></i>';
      _tempImageBase64 = null;
      renderSection("dashboard");
    }
  });

  el.formCancel.addEventListener("click", () => {
    el.materialForm.reset();
    el.formImagePreview.innerHTML = '<i class="fa fa-image fa-2x"></i>';
    _tempImageBase64 = null;
    renderSection("dashboard");
  });

  // Filters
  el.searchMaterialInput.addEventListener("input", () => {
    state.pagination.search = 1;
    renderSearchMaterial();
  });
  el.searchCategoryFilter.addEventListener("change", () => {
    state.pagination.search = 1;
    renderSearchMaterial();
  });
  el.searchShowArchived.addEventListener("change", () => {
    state.pagination.search = 1;
    renderSearchMaterial();
  });
  el.stockStatusFilter.addEventListener("change", () => {
    state.pagination.stock = 1;
    renderStockSearch();
  });
  el.movementSearchDate.addEventListener("change", () =>
    renderMovementSearch()
  );

  el.movementSkuInput.addEventListener("input", () => {
    const sku = el.movementSkuInput.value.trim();
    if (!sku) {
      el.movementMaterialName.textContent = "Digite o código.";
      el.movementMaterialName.className = "neutral";
      return;
    }
    const m = state.materials.find((x) => x.sku === sku && !x.isArchived);
    if (m) {
      el.movementMaterialName.textContent = `${m.name} (Qtd: ${m.quantity})`;
      el.movementMaterialName.className = "success";
    } else {
      el.movementMaterialName.textContent = "Não encontrado.";
      el.movementMaterialName.className = "danger";
    }
  });

  el.movementForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const sku = el.movementSkuInput.value.trim();
    const m = state.materials.find((x) => x.sku === sku && !x.isArchived);
    const type = document.querySelector(
      'input[name="movement-type"]:checked'
    )?.value;
    const qty = Number(el.movementQuantity.value);
    const customDate = el.movementCustomDate.value;

    if (!m) {
      showToast("Material inválido.", "danger");
      return;
    }
    if (type === "saida" && m.quantity < qty) {
      showToast("Estoque insuficiente.", "danger");
      return;
    }

    m.quantity += type === "entrada" ? qty : -qty;
    state.movements.push({
      id: Date.now(),
      materialId: m.id,
      materialName: m.name, // Denormalization for history safety
      type,
      quantity: qty,
      date: customDate || getLocalDate(), // Data local
      reason: el.movementReason.value.trim(),
    });
    saveLocalState();
    showToast("Movimentação registrada (localmente)!", "success");
    el.movementForm.reset();
    el.movementCustomDate.value = getLocalDate(); // Reset para data local
    el.movementMaterialName.textContent = "Digite o código.";
    el.movementMaterialName.className = "neutral";
    if (state.currentSection === "dashboard") renderDashboard();
  });

  // Modal Actions
  el.editMaterial.addEventListener("click", () => {
    const m = _currentModalMaterial;
    if (!m) return;
    $("#material-id").value = m.id;
    $("#material-name").value = m.name;
    $("#material-sku").value = m.sku;
    $("#material-category").value = m.category;
    $("#material-quantity").value = m.quantity;
    $("#material-min-quantity").value = m.minQuantity || 0;
    $("#material-resupply-quantity").value = m.resupplyQuantity || 0;
    $("#material-alert-percentage").value = m.alertPercentage || 40;
    $("#material-description").value = m.description || "";
    if (m.image) {
      _tempImageBase64 = m.image;
      el.formImagePreview.innerHTML = `<img src="${m.image}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      _tempImageBase64 = null;
      el.formImagePreview.innerHTML = '<i class="fa fa-image fa-2x"></i>';
    }
    closeModal();
    renderSection("add-material");
  });

  el.archiveMaterialBtn.addEventListener("click", async () => {
    const m = _currentModalMaterial;
    if (m) {
      const confirmed = await showConfirm(
        "Arquivar Item",
        `Deseja arquivar "${m.name}"?`,
        { confirmText: "Arquivar", confirmStyle: "danger" }
      );
      if (confirmed) {
        state.materials.find((x) => x.id === m.id).isArchived = true;
        // NOTE: Archive not supported by server.js yet
        showToast("Arquivado (apenas localmente)!", "success");
        renderSection(state.currentSection);
        closeModal();
      }
    }
  });

  el.unarchiveMaterialBtn.addEventListener("click", async () => {
    const m = _currentModalMaterial;
    if (m) {
      state.materials.find((x) => x.id === m.id).isArchived = false;
      // NOTE: Unarchive not supported by server.js yet
      showToast("Restaurado (apenas localmente)!", "success");
      renderSection(state.currentSection);
      closeModal();
    }
  });

  // Data Management
  const resetData = async () => {
    const confirmed = await showConfirm(
      "Redefinir Tudo",
      "Apagar todos os dados locais?",
      { confirmText: "Apagar", confirmStyle: "danger" }
    );
    if (confirmed) {
      localStorage.clear(); // Clear everything
      showToast("Dados locais redefinidos!", "success");
      setTimeout(() => location.reload(), 1000);
    }
  };
  el.resetDataBtn.addEventListener("click", resetData);

  el.logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const confirmed = await showConfirm("Sair", "Deseja sair da aplicação?", {
      confirmText: "Sair",
    });
    if (confirmed) location.reload();
  });

  el.exportDataBtn.addEventListener("click", () => {
    if (state.materials.length === 0) {
      showToast("Sem dados.", "warning");
      return;
    }
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "estoquemaster_backup.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Backup salvo!", "success");
  });

  el.importFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const confirmed = await showConfirm(
      "Importar Backup",
      "Substituir dados atuais?",
      { confirmText: "Importar", confirmStyle: "warning" }
    );
    if (confirmed) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.materials) {
            state = data; // Restore full state
            saveLocalState();
            showToast("Dados restaurados!", "success");
            setTimeout(() => location.reload(), 1000); // Reload to ensure fresh state
          }
        } catch (err) {
          showToast("Erro no arquivo.", "danger");
        }
      };
      reader.readAsText(file);
    } else {
      e.target.value = null;
    }
  });

  // Export CSV Helpers
  el.btnExportSearch.addEventListener("click", () => {
    const rows = [["Nome", "Codigo", "Categoria", "Qtd", "Minimo"]];
    const term = el.searchMaterialInput.value.toLowerCase();
    const category = el.searchCategoryFilter.value;
    const showArchived = el.searchShowArchived.checked;
    let results = state.materials.filter((m) =>
      showArchived ? m.isArchived : !m.isArchived
    );
    if (category !== "all")
      results = results.filter((m) => m.category === category);
    if (term)
      results = results.filter(
        (m) => m.name.toLowerCase().includes(term) || m.sku.includes(term)
      );
    results.forEach((m) =>
      rows.push([m.name, m.sku, m.category, m.quantity, m.minQuantity || 0])
    );
    exportTableToCSV(rows, "materiais.csv");
  });

  el.btnExportMovements.addEventListener("click", () => {
    const rows = [["Data", "Material", "Tipo", "Qtd", "Motivo"]];
    state.movements.forEach((m) => {
      rows.push([
        m.date,
        m.materialName || "N/A",
        m.type,
        m.quantity,
        m.reason,
      ]);
    });
    exportTableToCSV(rows, "movimentacoes.csv");
  });

  $("#print-modal").addEventListener("click", () => {
    const content = $("#modal-body").innerHTML;
    const win = window.open("", "_blank");
    win.document.write(
      `<html><head><title>Imprimir</title></head><body>${content}</body></html>`
    );
    win.document.close();
    win.print();
    win.close();
  });

  renderSection("dashboard");
  document.getElementById("material-submenu").classList.add("open");
  document
    .querySelector('[data-target="material-submenu"] .arrow')
    .classList.add("rotate");
});

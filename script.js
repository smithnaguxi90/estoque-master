// === UTILS ===
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const NUMBER_FORMAT = new Intl.NumberFormat("pt-BR");
const ITEMS_PER_PAGE = 10;
// Helper para data local (evita bug de fuso horário UTC)
const getLocalDate = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const local = new Date(today.getTime() - offset * 60000);
  return local.toISOString().split("T")[0];
};
// Helper para formatar data (YYYY-MM-DD para DD/MM/AAAA)
const formatDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};
// Helper de criação de elementos com escape e correções
const createEl = (tag, text = null, className = "", style = "") => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  // Verifica se text não é nulo nem undefined (aceita 0 e string vazia)
  if (text !== null && text !== undefined) el.textContent = text;
  if (style) el.style.cssText = style;
  return el;
};
// Função de escape HTML atualizada
const escapeHTML = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
    btnConfirm.classList.remove("btn-primary", "btn-danger");
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
// === DADOS INICIAIS ===
const DEFAULT_CATEGORIES = [
  "DEP. C4 - GÁS",
  "DEP. 01 - IMPERMEABILIZAÇÃO",
  "DEP. 02 - TINTA ESMALTE",
  "DEP. 03 - COLA FÓRMICA",
  "DEP. 04 - ÁLCOOL",
  "DEP. 12 - PISO VINÍLICO",
  "DEP. 25 - TINTA ACRÍLICA",
  "DEMAP - 01 ao 11",
  "Outros",
];
// Materiais extraídos das planilhas
const INITIAL_MATERIALS = [
  // DEP. C4 - GÁS
  {
    id: 1001,
    contractCode: "B.16.04.007",
    sku: "39201",
    name: "GÁS 13 KG",
    category: "DEP. C4 - GÁS",
    quantity: 27,
    minQuantity: 5,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 1002,
    contractCode: "B.16.04.006",
    sku: "39633",
    name: "BOTIJÁO DE GÁS P-13 (VASILHAME)",
    category: "DEP. C4 - GÁS",
    quantity: 30,
    minQuantity: 5,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 1003,
    contractCode: "***",
    sku: "***",
    name: "GÁS EM USO",
    category: "DEP. C4 - GÁS",
    quantity: 0,
    minQuantity: 0,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 1004,
    contractCode: "****",
    sku: "****",
    name: "GÁS VAZIO",
    category: "DEP. C4 - GÁS",
    quantity: 0,
    minQuantity: 0,
    alertPercentage: 40,
    isArchived: false,
  },
  // DEP. 01 - IMPERMEABILIZAÇÃO
  {
    id: 2001,
    contractCode: "B.02.05.009",
    sku: "39630",
    name: "BOCAL PARA ARREMATES EM RALOS, D=100MM",
    category: "DEP. 01 - IMPERMEABILIZAÇÃO",
    quantity: 39,
    minQuantity: 5,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 2002,
    contractCode: "B.02.05.010",
    sku: "39631",
    name: "BOCAL PARA ARREMATES EM RALOS, D=150MM",
    category: "DEP. 01 - IMPERMEABILIZAÇÃO",
    quantity: 17,
    minQuantity: 5,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 2003,
    contractCode: "B.02.05.008",
    sku: "39632",
    name: "BOCAL PARA ARREMATES EM RALOS, D=75MM",
    category: "DEP. 01 - IMPERMEABILIZAÇÃO",
    quantity: 37,
    minQuantity: 5,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 2004,
    contractCode: "B.02.04.002",
    sku: "39787",
    name: "EMULSÃO ASFÁLTICA PARA IMPRIMAÇÃO (BASE ÁGUA)",
    category: "DEP. 01 - IMPERMEABILIZAÇÃO",
    quantity: 13,
    minQuantity: 5,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 2005,
    contractCode: "B.02.03.001",
    sku: "20827",
    name: "IMPERMEABILIZANTE FLEXÍVEL BASE RESINA (5.000)",
    category: "DEP. 01 - IMPERMEABILIZAÇÃO",
    quantity: 265,
    minQuantity: 50,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 2006,
    contractCode: "B.02.03.002",
    sku: "19437",
    name: "IMPERMEABILIZANTE SEMIFLEXÍVEL (1.000)",
    category: "DEP. 01 - IMPERMEABILIZAÇÃO",
    quantity: 264,
    minQuantity: 50,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 2007,
    contractCode: "B.02.01.002",
    sku: "18389",
    name: "MANTA ANTIRAIZ",
    category: "DEP. 01 - IMPERMEABILIZAÇÃO",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 2008,
    contractCode: "B.02.05.003",
    sku: "39789",
    name: "PAPEL KRAFT PARA IMPERMEABILIZAÇÃO",
    category: "DEP. 01 - IMPERMEABILIZAÇÃO",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 2009,
    contractCode: "B.02.04.003",
    sku: "16493",
    name: "PRIMER ASFÁLTICO",
    category: "DEP. 01 - IMPERMEABILIZAÇÃO",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 2010,
    contractCode: "B.02.02.003",
    sku: "27574",
    name: "SELANTE BRANCO",
    category: "DEP. 01 - IMPERMEABILIZAÇÃO",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 2011,
    contractCode: "B.02.02.001",
    sku: "30314",
    name: "SELANTE CINZA",
    category: "DEP. 01 - IMPERMEABILIZAÇÃO",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 2012,
    contractCode: "B.02.02.002",
    sku: "27575",
    name: "SELANTE PRETO",
    category: "DEP. 01 - IMPERMEABILIZAÇÃO",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 2013,
    contractCode: "B.02.04.006",
    sku: "39685",
    name: "TINTA ASFÁLTICA ANTIRRAIZ",
    category: "DEP. 01 - IMPERMEABILIZAÇÃO",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  // DEP. 02 - TINTA ESMALTE
  {
    id: 3001,
    contractCode: "B.10.03.003",
    sku: "25068",
    name: "FUNDO PARA AÇO GALVANIZADO",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 67,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3002,
    contractCode: "SEM CONTRATO",
    sku: "27558",
    name: "REMOVEDOR EM GEL PARA TINTAS ESMALTES, TEXTURAS, VERNIZES E STAINS - GALÃO COM 4 QUILOS",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 20,
    minQuantity: 5,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3003,
    contractCode: "B.10.02.012",
    sku: "4121",
    name: "TINTA ESMALTE SINTÉTICO ACETINADO BRANCO GELO",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 77,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3004,
    contractCode: "B.10.02.011",
    sku: "4132",
    name: "TINTA ESMALTE SINTÉTICO ACETINADO BRANCO NEVE",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 87,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3005,
    contractCode: "B.10.02.006",
    sku: "4143",
    name: "TINTA ESMALTE SINTÉTICO ALTO BRILHO ALUMÍNIO",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 21,
    minQuantity: 5,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3006,
    contractCode: "B.10.02.007",
    sku: "29091",
    name: "TINTA ESMALTE SINTÉTICO ALTO BRILHO AMARELO TRATOR",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 67,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3007,
    contractCode: "B.10.02.008",
    sku: "29094",
    name: "TINTA ESMALTE SINTÉTICO ALTO BRILHO AZUL MAR",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 46,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3008,
    contractCode: "B.10.02.002",
    sku: "4092",
    name: "TINTA ESMALTE SINTÉTICO ALTO BRILHO BRANCO",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3009,
    contractCode: "B.10.02.003",
    sku: "29090",
    name: "TINTA ESMALTE SINTÉTICO ALTO BRILHO BRANCO GELO",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3010,
    contractCode: "B.10.02.005",
    sku: "37914",
    name: "TINTA ESMALTE SINTÉTICO ALTO BRILHO CINZA MÉDIO",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3011,
    contractCode: "B.10.02.009",
    sku: "4128",
    name: "TINTA ESMALTE SINTÉTICO ALTO BRILHO PRETO",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3012,
    contractCode: "B.10.02.001",
    sku: "27439",
    name: "TINTA ESMALTE SINTÉTICO ALTO BRILHO VERDE COLONIAL",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3013,
    contractCode: "B.10.02.010",
    sku: "4071",
    name: "TINTA ESMALTE SINTÉTICO ALTO BRILHO VERMELHO",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3014,
    contractCode: "B.10.02.022",
    sku: "14790",
    name: "TINTA ESMALTE SINTÉTICO FOSCO PRETO",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3015,
    contractCode: "B.10.03.001",
    sku: "35974",
    name: "TINTA ESMALTE SINTÉTICO GRAFITE ESCURO",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3016,
    contractCode: "B.10.02.023",
    sku: "29096",
    name: "TINTA ESMALTE SINTÉTICO MARTELADO CINZA CLARO",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3017,
    contractCode: "B.10.03.006",
    sku: "20914",
    name: "TINTA SPRAY BRANCO",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 3018,
    contractCode: "B.10.03.004",
    sku: "4159",
    name: "TINTA SPRAY PRETO FOSCO",
    category: "DEP. 02 - TINTA ESMALTE",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  // DEP. 03 - COLA FÓRMICA
  {
    id: 4001,
    contractCode: "B.05.06.001",
    sku: "4617",
    name: "ADESIVO DE CONTATO - COLA FÓRMICA",
    category: "DEP. 03 - COLA FÓRMICA",
    quantity: 3239,
    minQuantity: 500,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 4002,
    contractCode: "B.16.04.008",
    sku: "27039",
    name: "GASOLINA COMUM",
    category: "DEP. 03 - COLA FÓRMICA",
    quantity: 25,
    minQuantity: 5,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 4003,
    contractCode: "B.16.04.010",
    sku: "27040",
    name: "ÓLEO DIESEL",
    category: "DEP. 03 - COLA FÓRMICA",
    quantity: 10,
    minQuantity: 5,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 4004,
    contractCode: "B.16.04.005",
    sku: "1544",
    name: "QUEROSENE 900 ML",
    category: "DEP. 03 - COLA FÓRMICA",
    quantity: 329,
    minQuantity: 50,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 4005,
    contractCode: "B.05.06.002",
    sku: "1536",
    name: "SOLVENTE PARA ADESIVO DE CONTATO (REDUCOLA)",
    category: "DEP. 03 - COLA FÓRMICA",
    quantity: 1473,
    minQuantity: 200,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 4006,
    contractCode: "B.16.04.003",
    sku: "1538",
    name: "SOLVENTE THINNER",
    category: "DEP. 03 - COLA FÓRMICA",
    quantity: 4167,
    minQuantity: 500,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 4007,
    contractCode: "B.07.01.004",
    sku: "29098",
    name: "TINTA TRÁFEGO AMARELA",
    category: "DEP. 03 - COLA FÓRMICA",
    quantity: 7,
    minQuantity: 2,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 4008,
    contractCode: "B.07.01.005",
    sku: "29097",
    name: "TINTA TRÁFEGO BRANCA",
    category: "DEP. 03 - COLA FÓRMICA",
    quantity: 0,
    minQuantity: 2,
    alertPercentage: 40,
    isArchived: false,
  },
  // DEP. 04 - ÁLCOOL
  {
    id: 5001,
    contractCode: "B.16.04.001",
    sku: "5819",
    name: "ÁLCOOL",
    category: "DEP. 04 - ÁLCOOL",
    quantity: 3253,
    minQuantity: 500,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 5002,
    contractCode: "B.16.04.002",
    sku: "37697",
    name: "ÁLCOOL EM GEL 2L",
    category: "DEP. 04 - ÁLCOOL",
    quantity: 117,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  // DEP. 12 - PISO VINÍLICO
  {
    id: 6001,
    contractCode: "B.18.01.001",
    sku: "39957",
    name: "PERFIL PARA ARREMATE DE CARPETE",
    category: "DEP. 12 - PISO VINÍLICO",
    quantity: 210,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 6002,
    contractCode: "B.08.01.010",
    sku: "13722",
    name: "PISO AZUL",
    category: "DEP. 12 - PISO VINÍLICO",
    quantity: 107,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 6003,
    contractCode: "B.08.01.007",
    sku: "3046",
    name: "PISO CINZA",
    category: "DEP. 12 - PISO VINÍLICO",
    quantity: 542,
    minQuantity: 50,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 6004,
    contractCode: "B.08.01.009",
    sku: "3047",
    name: "PISO PRETO",
    category: "DEP. 12 - PISO VINÍLICO",
    quantity: 241,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 6005,
    contractCode: "B.08.01.003",
    sku: "35235",
    name: "PISO SEMIFLEXÍVEL MADEIRA",
    category: "DEP. 12 - PISO VINÍLICO",
    quantity: 3422,
    minQuantity: 500,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 6006,
    contractCode: "B.08.01.006",
    sku: "29864",
    name: "PISO VERDE-ITAMARATY",
    category: "DEP. 12 - PISO VINÍLICO",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 6007,
    contractCode: "B.08.01.001",
    sku: "37736",
    name: "PISO VINÍLICO AUTOPORTANTE COR CINZA ESCURO 50 CM X 50 CM",
    category: "DEP. 12 - PISO VINÍLICO",
    quantity: 0,
    minQuantity: 50,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 6008,
    contractCode: "B.08.01.004",
    sku: "35969",
    name: "RODAPÉ SEMIFLEXÍVEL",
    category: "DEP. 12 - PISO VINÍLICO",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  // DEP. 25 - TINTA ACRÍLICA
  {
    id: 7001,
    contractCode: "B.16.10.001",
    sku: "25742",
    name: "FITA CREPE 25 MM X 50 M",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 3252,
    minQuantity: 500,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7002,
    contractCode: "B.16.10.002",
    sku: "39894",
    name: "FITA CREPE 45 X 50M",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 2772,
    minQuantity: 300,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7003,
    contractCode: "B.10.06.001",
    sku: "35740",
    name: "GARFO PARA ROLO 23CM",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 840,
    minQuantity: 100,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7004,
    contractCode: "B.10.04.002",
    sku: "27573",
    name: "MASSA ACRÍLICA",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 42,
    minQuantity: 5,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7005,
    contractCode: "B.10.04.001",
    sku: "19335",
    name: "MASSA CORRIDA",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 418,
    minQuantity: 50,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7006,
    contractCode: "B.10.05.005",
    sku: "20664",
    name: "ROLO DE ESPUMA 15 CM",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 248,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7007,
    contractCode: "B.10.05.007",
    sku: "20662",
    name: "ROLO DE ESPUMA 5 CM",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 672,
    minQuantity: 50,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7008,
    contractCode: "B.10.05.006",
    sku: "20663",
    name: "ROLO DE ESPUMA 9 CM",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 396,
    minQuantity: 40,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7009,
    contractCode: "B.10.05.003",
    sku: "35976",
    name: "ROLO DE LÃ 15 CM",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 456,
    minQuantity: 50,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7010,
    contractCode: "B.10.05.001",
    sku: "20665",
    name: "ROLO DE LÃ 23 CM PARA TETO",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 84,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7011,
    contractCode: "B.10.05.004",
    sku: "26670",
    name: "ROLO DE LÃ 9 CM",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7012,
    contractCode: "B.10.05.002",
    sku: "29101",
    name: "ROLO PARA PINTURA EPÓXI",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7013,
    contractCode: "B.10.01.001",
    sku: "27650",
    name: "TINTA ACRÍLICA FOSCA BRANCO NEVE",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7014,
    contractCode: "B.10.01.004",
    sku: "27651",
    name: "TINTA ACRÍLICA FOSCA CONCRETO",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7015,
    contractCode: "B.10.01.002",
    sku: "23150",
    name: "TINTA ACRÍLICA SEMIBRILHO BRANCO GELO 18 L",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7016,
    contractCode: "B.10.01.003",
    sku: "22924",
    name: "TINTA ACRÍLICA SEMIBRILHO BRANCO NEVE 18 L",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7017,
    contractCode: "B.10.01.005",
    sku: "19342",
    name: "TINTA LÁTEX ACRÍLICA PISO CINZA",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7018,
    contractCode: "B.10.01.006",
    sku: "19341",
    name: "TINTA LÁTEX ACRÍLICA PISO PRETO",
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7019,
    contractCode: "B.10.05.009",
    sku: "4136",
    name: 'TRINCHA MACIA 1"',
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7020,
    contractCode: "B.10.05.010",
    sku: "4134",
    name: 'TRINCHA MACIA 1.1/2"',
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7021,
    contractCode: "B.10.05.011",
    sku: "4137",
    name: 'TRINCHA MACIA 2"',
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 7022,
    contractCode: "B.10.05.013",
    sku: "29102",
    name: 'TRINCHA PARA TINTA EPÓXI 3"',
    category: "DEP. 25 - TINTA ACRÍLICA",
    quantity: 0,
    minQuantity: 10,
    alertPercentage: 40,
    isArchived: false,
  },
  // DEMAP - 01 ao 11
  {
    id: 8001,
    contractCode: "B.04.05.012",
    sku: "2511",
    name: 'CANTONEIRA AÇO 1.1/2 x 1.1/2 x 3/16"',
    category: "DEMAP - 01 ao 11",
    quantity: 165,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8002,
    contractCode: "B.04.05.008",
    sku: "2512",
    name: 'CANTONEIRA AÇO 1.1/4 x 1.1/4 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 123,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8003,
    contractCode: "B.04.05.005",
    sku: "2514",
    name: 'CANTONEIRA AÇO 1 x 1 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 748,
    minQuantity: 50,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8004,
    contractCode: "B.04.05.019",
    sku: "2541",
    name: 'CANTONEIRA AÇO 2 x 2 x 1/4"',
    category: "DEMAP - 01 ao 11",
    quantity: 194,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8005,
    contractCode: "B.04.05.003",
    sku: "2563",
    name: 'CANTONEIRA AÇO 3/4 x 3/4 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 939,
    minQuantity: 50,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8006,
    contractCode: "INATIVO",
    sku: "2565",
    name: "PERFIL DE ALUMÍNIO TIPO U DE 3/8 POL X 6M",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8007,
    contractCode: "B.04.07.006",
    sku: "2596",
    name: 'PERFIL ALUMÍNIO "T" 3/4 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8008,
    contractCode: "B.04.05.009",
    sku: "2633",
    name: 'CANTONEIRA AÇO 1.1/4 x 1.1/4 x 3/16"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8009,
    contractCode: "B.05.02.004",
    sku: "2955",
    name: "COMPENSADO ROSA 10 MM 1,60 x 2,20m",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8010,
    contractCode: "B.05.01.002",
    sku: "2971",
    name: "PRANCHA FREIJÓ DE 3500 MM A 6000 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8011,
    contractCode: "B.01.08.001",
    sku: "2984",
    name: "CAIBRO 5 x 6 cm",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8012,
    contractCode: "B.05.03.003",
    sku: "3056",
    name: "LAMINADO OVO 1 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8013,
    contractCode: "B.04.06.002",
    sku: "3066",
    name: 'PERFIL CHATO 1/2 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8014,
    contractCode: "B.04.06.027",
    sku: "3078",
    name: 'PERFIL CHATO 2 x 1/4"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8015,
    contractCode: "B.04.06.007",
    sku: "3090",
    name: 'PERFIL CHATO 3/4 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8016,
    contractCode: "B.04.03.008",
    sku: "3474",
    name: 'TUBO REDONDO 1" Nº 13',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8017,
    contractCode: "INATIVO",
    sku: "3570",
    name: "TUBO INDUSTRIAL REDONDO, CHAPA 18, DE 7/8POL, BARRA COM 6M",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8018,
    contractCode: "B.04.03.001",
    sku: "3748",
    name: 'TUBO REDONDO 1/2" Nº 18',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8019,
    contractCode: "B.04.03.013",
    sku: "3762",
    name: 'TUBO REDONDO 2" Nº 13',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8020,
    contractCode: "B.04.03.003",
    sku: "3805",
    name: 'TUBO REDONDO 5/8" Nº 16',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8021,
    contractCode: "B.04.03.004",
    sku: "3812",
    name: 'TUBO REDONDO 3/4" Nº 18',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8022,
    contractCode: "B.12.01.011",
    sku: "4305",
    name: "EIXO GIRADOR PARA PERSIANA",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8023,
    contractCode: "B.04.08.040",
    sku: "4869",
    name: 'TIRANTE ROSCA 1/4"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8024,
    contractCode: "B.04.05.011",
    sku: "13625",
    name: 'CANTONEIRA AÇO 1.1/2 x 1.1/2 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8025,
    contractCode: "B.04.06.008",
    sku: "13626",
    name: 'PERFIL CHATO 3/4 x 3/16"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8026,
    contractCode: "B.04.06.010",
    sku: "13627",
    name: 'PERFIL CHATO 7/8 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8027,
    contractCode: "B.04.03.010",
    sku: "13628",
    name: 'TUBO REDONDO 1.1/2" Nº 16',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8028,
    contractCode: "B.04.06.003",
    sku: "13629",
    name: 'PERFIL CHATO 1/2 x 3/16"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8029,
    contractCode: "B.04.06.013",
    sku: "13630",
    name: 'PERFIL CHATO 1 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8030,
    contractCode: "B.04.06.025",
    sku: "13936",
    name: 'PERFIL CHATO 2 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8031,
    contractCode: "B.04.02.001",
    sku: "13937",
    name: "TUBO METALON 16 x 16 MM Nº 18",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8032,
    contractCode: "B.04.06.026",
    sku: "13938",
    name: 'PERFIL CHATO 2 x 3/16"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8033,
    contractCode: "B.04.03.009",
    sku: "14234",
    name: 'TUBO REDONDO 1.1/4" Nº 13',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8034,
    contractCode: "INATIVO",
    sku: "14348",
    name: "LAMINADO DE SUCUPIRA COM 20 A 40CM DE LARGURA E 2,5 A 3M DE COMPRIMENTO",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8035,
    contractCode: "B.01.08.002",
    sku: "14350",
    name: "SARRAFO 2,5 x 5 cm",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8036,
    contractCode: "INATIVO",
    sku: "14351",
    name: "LAMINADO DE IMBUIA COM 20 A 40CM DE LARGURA E 2,5 A 3M DE COMPRIMENTO",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8037,
    contractCode: "B.05.03.009",
    sku: "14407",
    name: "LAMINADO FREIJÓ",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8038,
    contractCode: "B.04.03.025",
    sku: "14433",
    name: 'FERRO REDONDO 3/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8039,
    contractCode: "B.04.05.004",
    sku: "14567",
    name: 'CANTONEIRA AÇO 7/8 x 7/8 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8040,
    contractCode: "B.05.03.008",
    sku: "14601",
    name: "LAMINADO PRETO 1 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8041,
    contractCode: "B.04.05.006",
    sku: "14836",
    name: 'CANTONEIRA AÇO 1 x 1 x 3/16"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8042,
    contractCode: "B.04.02.002",
    sku: "14838",
    name: "TUBO METALON 20 x 20 MM Nº 18",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8043,
    contractCode: "B.04.02.004",
    sku: "14924",
    name: "TUBO METALON 30 x 20 MM Nº 18",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8044,
    contractCode: "B.04.06.014",
    sku: "14943",
    name: 'PERFIL CHATO 1 x 3/16"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8045,
    contractCode: "B.04.02.028b",
    sku: "14944",
    name: 'FERRO QUADRADO 5/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8046,
    contractCode: "B.04.02.027b",
    sku: "14945",
    name: 'FERRO QUADRADO 3/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8047,
    contractCode: "B.04.03.024",
    sku: "14946",
    name: 'FERRO REDONDO 5/16"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8048,
    contractCode: "B.04.02.016",
    sku: "14947",
    name: "TUBO METALON 50 x 50 MM Nº 16",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8049,
    contractCode: "INATIVO",
    sku: "14950",
    name: "INATIVO",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8050,
    contractCode: "INATIVO",
    sku: "14951",
    name: "PERFIL DOBRADO 35MM DE LARGURA X 25MM DE ALTURA BARRA COM 3M",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8051,
    contractCode: "INATIVO",
    sku: "14953",
    name: "PERFIL DOBRADO 40MM DE LARGURA X 30MM DE ALTURA BARRA COM 3M",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8052,
    contractCode: "B.04.01.006",
    sku: "14955",
    name: "CHAPA DE AÇO COMUM Nº 18 DE 3,00 X 1,20",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8053,
    contractCode: "B.04.03.026",
    sku: "14957",
    name: 'FERRO REDONDO 1/2"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8054,
    contractCode: "B.04.02.014",
    sku: "14958",
    name: "TUBO METALON 50 x 30 MM Nº 16",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8055,
    contractCode: "B.04.02.007",
    sku: "15249",
    name: "TUBO METALON 40 x 20 MM Nº 18",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8056,
    contractCode: "B.04.02.009",
    sku: "15250",
    name: "TUBO METALON 40 x 40 MM Nº 18",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8057,
    contractCode: "B.05.02.003",
    sku: "15287",
    name: "COMPENSADO ROSA 06 MM 1,60 x 2,20m",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8058,
    contractCode: "INATIVO",
    sku: "15300",
    name: "PERFIL DOBRADO TIPO U, CHAPA 16, 35 X 35 X 35MM - BARRA COM 6 METROS",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8059,
    contractCode: "B.05.02.006",
    sku: "15348",
    name: "COMPENSADO ROSA 18 MM 1,60 x 2,20m",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8060,
    contractCode: "B.01.06.001",
    sku: "15349",
    name: "COMPENSADO RESINADO COLA FENÓLICA 12 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8061,
    contractCode: "B.05.02.008",
    sku: "15356",
    name: "COMPENSADO ROSA 20 MM 1,60 x 2,20m",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8062,
    contractCode: "B.04.02.005",
    sku: "15932",
    name: "TUBO METALON 30 x 30 MM Nº 18",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8063,
    contractCode: "B.04.02.003",
    sku: "15934",
    name: "TUBO METALON 25 x 25 MM Nº 18",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8064,
    contractCode: "B.04.06.022",
    sku: "15935",
    name: 'PERFIL CHATO 1.1/2 x 3/16"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8065,
    contractCode: "B.04.06.009",
    sku: "15936",
    name: 'PERFIL CHATO 3/4 x 1/4"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8066,
    contractCode: "B.04.01.003",
    sku: "15991",
    name: "CHAPA DE AÇO GALVANIZADO Nº 18 3,00 X 1,20",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8067,
    contractCode: "B.04.01.002",
    sku: "15993",
    name: "CHAPA DE AÇO GALVANIZADO Nº 24 3,00 X 1,20",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8068,
    contractCode: "B.04.01.001",
    sku: "15994",
    name: "CHAPA DE AÇO GALVANIZADO Nº 26 3,00 X 1,20",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8069,
    contractCode: "B.04.03.023",
    sku: "16412",
    name: 'FERRO REDONDO 1/4"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8070,
    contractCode: "B.04.07.007",
    sku: "16582",
    name: 'PERFIL ALUMÍNIO "T" 1/8 x 1"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8071,
    contractCode: "B.04.05.002",
    sku: "17367",
    name: 'CANTONEIRA AÇO 5/8 x 5/8 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8072,
    contractCode: "INATIVO",
    sku: "17368",
    name: "CANTONEIRA LAMINADA COM ABAS IGUAIS DE 2.1/2 X 3/16POL BARRA COM 6 METROS",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8073,
    contractCode: "B.04.01.008",
    sku: "17373",
    name: "CHAPA DE AÇO COMUM Nº 14 DE 3,00 X 1,20",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8074,
    contractCode: "INATIVO",
    sku: "17375",
    name: "FERRO CHATO DE 1 X 1/4POL BARRA COM 6 METROS",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8075,
    contractCode: "B.05.02.005",
    sku: "17527",
    name: "COMPENSADO ROSA 15 MM 1,60 x 2,20m",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8076,
    contractCode: "B.04.05.001",
    sku: "18222",
    name: 'CANTONEIRA AÇO 1/2 x 1/2 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8077,
    contractCode: "B.04.06.018",
    sku: "18223",
    name: 'PERFIL CHATO 1.1/4 x 3/16"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8078,
    contractCode: "B.04.06.020",
    sku: "18224",
    name: 'PERFIL CHATO 1.1/4 x 3/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8079,
    contractCode: "INATIVO",
    sku: "18235",
    name: "CANTONEIRA LAMINADA COM ABAS IGUAIS DE 2.1/2 X 1/4POL BARRA COM 6 METROS",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8080,
    contractCode: "B.05.02.007",
    sku: "18281",
    name: "COMPENSADO SARRAFEADO 18 MM 1,60 x 2,20m",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8081,
    contractCode: "B.05.09.015",
    sku: "18386",
    name: "TUBO CABIDEIRO OVAL EM AÇO",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8082,
    contractCode: "B.04.06.011",
    sku: "19160",
    name: 'PERFIL CHATO 7/8 x 3/16"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8083,
    contractCode: "B.05.03.007",
    sku: "19166",
    name: "LAMINADO ALMOND 1 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8084,
    contractCode: "B.04.04.036",
    sku: "20444",
    name: "PERFIL STANLEY",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8085,
    contractCode: "B.04.03.011",
    sku: "20668",
    name: 'TUBO REDONDO 1.1/2" Nº 13',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8086,
    contractCode: "B.04.06.032",
    sku: "20670",
    name: 'BAGUETE AÇO 3/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8087,
    contractCode: "INATIVO",
    sku: "20671",
    name: "BAGUETE DE AÇO TIPO RETO CHAPA 18 DE 1/2POL PEÇA COM 6 METROS",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8088,
    contractCode: "B.04.04.029b",
    sku: "20672",
    name: 'PERFIL AÇO "T" 1 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8089,
    contractCode: "B.05.01.003",
    sku: "20928",
    name: "PRANCHA IPÊ DE 3500 MM A 6000 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8090,
    contractCode: "B.05.01.001",
    sku: "20930",
    name: "PRANCHA CEDRINHO 3500 MM A 6000 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8091,
    contractCode: "B.05.02.002",
    sku: "20932",
    name: "COMPENSADO FREIJÓ 04 MM 1,60 x 2,75m",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8092,
    contractCode: "INATIVO",
    sku: "20933",
    name: "LAMINADO DE MOGNO DE 200MM A 400MM DE LARGURA X 1MM A 2MM DE ESPESSURA X 2500 A",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8093,
    contractCode: "B.04.06.021",
    sku: "21413",
    name: 'PERFIL CHATO 1.1/2 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8094,
    contractCode: "B.04.03.030",
    sku: "21414",
    name: 'AÇO TREFILADO 16 mm (5/8")',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8095,
    contractCode: "B.04.01.004",
    sku: "21415",
    name: "CHAPA DE AÇO GALVANIZADO Nº 16 3,00 X 1,20",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8096,
    contractCode: "B.04.01.007",
    sku: "21785",
    name: "CHAPA DE AÇO COMUM Nº 16 DE 3,00 X 1,20",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8097,
    contractCode: "B.04.04.031",
    sku: "22018",
    name: "PERFIL CADEIRINHA 40 x 25 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8098,
    contractCode: "INATIVO",
    sku: "22019",
    name: "PERFIL METÁLICO VENEZIANA LISA",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8099,
    contractCode: "B.04.04.028b",
    sku: "22285",
    name: 'PERFIL AÇO "T" 3/4 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8100,
    contractCode: "B.12.01.010",
    sku: "22949",
    name: "TRILHO METÁLICO PARA PERSIANA",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8101,
    contractCode: "INATIVO",
    sku: "23301",
    name: "PERFIL DE AÇO DOBRADO TIPO U 50,8 MM X 25,4 MM X 3,04 MM, C = 3000 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8102,
    contractCode: "B.04.02.018",
    sku: "23458",
    name: "TUBO METALON 60 x 60 MM Nº 16",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8103,
    contractCode: "INATIVO",
    sku: "24359",
    name: "LAMINADO JACARANDÁ",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8104,
    contractCode: "INATIVO",
    sku: "24361",
    name: "PRANCHA DE MADEIRA DE MOGNO",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8105,
    contractCode: "B.04.03.007",
    sku: "24367",
    name: 'TUBO REDONDO 1" Nº 16',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8106,
    contractCode: "INATIVO",
    sku: "24371",
    name: "TE DE AÇO 3/4POL X 1/8 BARRA 6M",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8107,
    contractCode: "B.05.03.002",
    sku: "24611",
    name: "LAMINADO GELO 1 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8108,
    contractCode: "B.04.04.034",
    sku: "25003",
    name: "PERFIL VENEZIANA ENRIJECIDO 70 x 19 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8109,
    contractCode: "B.04.04.030",
    sku: "25009",
    name: 'PERFIL TIPO "T" DOBRADO 100 MM X 30 MM',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8110,
    contractCode: "B.04.04.035",
    sku: "25010",
    name: "PERFIL MARCO RETO 150 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8111,
    contractCode: "B.04.04.013",
    sku: "25012",
    name: 'PERFIL DOBRADO "U" 93 x 40 x 93 MM Nº 14',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8112,
    contractCode: "B.04.04.005",
    sku: "25365",
    name: 'INATIVO - PERFIL "U" 35 x 25 MM',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8113,
    contractCode: "B.04.08.041",
    sku: "25638",
    name: 'INATIVO - TIRANTE ROSCA 3/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8114,
    contractCode: "B.04.02.023",
    sku: "25753",
    name: "TUBO METALON 80 x 40 MM Nº 14",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8115,
    contractCode: "B.04.02.022",
    sku: "25754",
    name: "TUBO METALON 60 x 40 MM Nº 14",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8116,
    contractCode: "B.04.06.006",
    sku: "25756",
    name: 'PERFIL CHATO 5/8 x 3/16"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8117,
    contractCode: "B.04.04.016",
    sku: "26486",
    name: 'PERFIL DOBRADO ENRIJECIDO "U" 75 x 40 x 15 MM Nº 13',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8118,
    contractCode: "B.04.01.005",
    sku: "26694",
    name: "CHAPA DE AÇO COMUM Nº 20 DE 3,00 X 1,20",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8119,
    contractCode: "B.04.02.012",
    sku: "27414",
    name: "METALON EM CHAPA 16 DE 40X40MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8120,
    contractCode: "B.05.03.001",
    sku: "27570",
    name: "LAMINADO BRANCO POLAR 1 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8121,
    contractCode: "B.04.04.011",
    sku: "27878",
    name: 'PERFIL DOBRADO "U" 75 x 40 x 75 MM Nº 14',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8122,
    contractCode: "INATIVO",
    sku: "27993",
    name: 'PERFIL DE ALUMÍNIO TIPO "U" DE 9,5 MM X 9,5 MM X 1,2 MM',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8123,
    contractCode: "B.04.04.032",
    sku: "28068",
    name: "PERFIL CADEIRINHA 40 x 30 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8124,
    contractCode: "B.04.04.004",
    sku: "28099",
    name: 'PERFIL DOBRADO "U" 35 x 20 x 35 MM Nº 16',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8125,
    contractCode: "INATIVO",
    sku: "28101",
    name: "INATIVO",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8126,
    contractCode: "B.04.05.023",
    sku: "28567",
    name: 'CANTONEIRA AÇO 3 x 3 x 1/4"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8127,
    contractCode: "B.05.02.001",
    sku: "29519",
    name: "COMPENSADO NATURAL 04 MM 1,60 x 2,20m",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8128,
    contractCode: "B.04.03.029",
    sku: "29763",
    name: 'AÇO TREFILADO 12 mm (1/2")',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8129,
    contractCode: "B.04.03.031",
    sku: "29764",
    name: 'AÇO TREFILADO 20 mm (3/4")',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8130,
    contractCode: "B.04.03.033",
    sku: "29765",
    name: 'AÇO TREFILADO 25 mm (1")',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8131,
    contractCode: "B.04.03.034",
    sku: "29766",
    name: 'AÇO TREFILADO 32 mm (1.1/4")',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8132,
    contractCode: "INATIVO",
    sku: "29783",
    name: "INATIVO",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8133,
    contractCode: "B.04.03.015",
    sku: "29805",
    name: 'TUBO REDONDO 3" Nº 13',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8134,
    contractCode: "B.04.03.005",
    sku: "29806",
    name: 'TUBO REDONDO 3/4" Nº 16',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8135,
    contractCode: "B.04.02.006",
    sku: "29809",
    name: "TUBO METALON 35 x 25 MM Nº 18",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8136,
    contractCode: "B.04.02.010",
    sku: "29810",
    name: "TUBO METALON 70 x 30 MM Nº 18",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8137,
    contractCode: "B.04.05.007",
    sku: "29811",
    name: 'CANTONEIRA AÇO 1 x 1 x 1/4"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8138,
    contractCode: "B.04.05.017",
    sku: "29812",
    name: 'CANTONEIRA AÇO 2 x 2 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8139,
    contractCode: "B.04.05.018",
    sku: "29813",
    name: 'CANTONEIRA AÇO 2 x 2 x 3/16"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8140,
    contractCode: "INATIVO",
    sku: "29816",
    name: 'CHAPA DE AÇO COMUM DE 2,00 M X 1,00 M X ¼"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8141,
    contractCode: "B.04.01.009",
    sku: "29818",
    name: "CHAPA DE AÇO COMUM Nº 11 DE 3,00 X 1,20",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8142,
    contractCode: "B.04.06.005",
    sku: "29820",
    name: 'PERFIL CHATO 5/8 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8143,
    contractCode: "B.04.06.017",
    sku: "29822",
    name: 'PERFIL CHATO 1.1/4 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8144,
    contractCode: "B.04.06.023",
    sku: "29823",
    name: 'PERFIL CHATO 1.1/2 x 1/4"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8145,
    contractCode: "B.04.05.028",
    sku: "29824",
    name: "CANTONEIRA ALUMÍNIO 1 x 1 x 1,5 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8146,
    contractCode: "B.04.04.015",
    sku: "30157",
    name: 'PERFIL DOBRADO "U" 100 x 50 x 100 MM Nº 14',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8147,
    contractCode: "B.04.04.018a",
    sku: "30159",
    name: 'PERFIL DOBRADO ENRIJECIDO "U" 127 x 50 x 17 MM Nº 13',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8148,
    contractCode: "B.04.06.033",
    sku: "30162",
    name: 'BAGUETE AÇO 1/2"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8149,
    contractCode: "B.04.04.039",
    sku: "30163",
    name: 'BAGUETE PRESSÃO 3/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8150,
    contractCode: "B.04.01.010",
    sku: "30353",
    name: 'CHAPA DE AÇO GROSSA 3/16" (4,76 MM) DE 3,00 X 1,20',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8151,
    contractCode: "B.05.03.006",
    sku: "30393",
    name: "LAMINADO AGRESTE 1 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8152,
    contractCode: "B.04.04.017",
    sku: "31526",
    name: 'PERFIL DOBRADO ENRIJECIDO "U" 100 x 50 x 17 MM Nº 13',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8153,
    contractCode: "INATIVO",
    sku: "31549",
    name: "LAMINADO DE LOURO-PRETO DE (200 MM A 400 MM) X (1 MM A 2 MM) X (2.500 MM A 3.000 MM)",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8154,
    contractCode: "B.04.01.011",
    sku: "31981",
    name: 'CHAPA DE AÇO GROSSA 1/4" (6,35 MM) DE 3,00 X 1,20',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8155,
    contractCode: "B.04.05.013",
    sku: "31983",
    name: 'CANTONEIRA AÇO 1.1/2 x 1.1/2 x 1/4"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8156,
    contractCode: "B.04.05.014",
    sku: "31984",
    name: 'CANTONEIRA AÇO 1.3/4 x 1.3/4 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8157,
    contractCode: "B.04.05.016",
    sku: "31986",
    name: 'CANTONEIRA AÇO 1.3/4 x 1.3/4 x 1/4"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8158,
    contractCode: "B.04.05.022",
    sku: "31988",
    name: 'CANTONEIRA AÇO 3 x 3 x 3/16"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8159,
    contractCode: "B.04.05.010",
    sku: "31996",
    name: 'CANTONEIRA AÇO 1.1/4 x 1.1/4 x 1/4"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8160,
    contractCode: "B.04.04.006",
    sku: "31998",
    name: 'PERFIL DOBRADO "U" 35 x 35 x 35 MM Nº 16',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8161,
    contractCode: "B.04.06.019",
    sku: "32000",
    name: 'PERFIL CHATO 1.1/4 x 1/4"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8162,
    contractCode: "B.04.08.042",
    sku: "32003",
    name: 'TIRANTE ROSCA 1/2"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8163,
    contractCode: "B.04.02.028a",
    sku: "32005",
    name: "TUBO METALON 100 x 100 MM Nº 14",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8164,
    contractCode: "B.04.02.025",
    sku: "32014",
    name: "TUBO METALON 100 x 40 MM Nº 14",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8165,
    contractCode: "B.04.05.024",
    sku: "32034",
    name: 'CANTONEIRA ALUMÍNIO 1/2 x 1/2 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8166,
    contractCode: "B.04.05.026",
    sku: "32037",
    name: 'CANTONEIRA ALUMÍNIO 3/4 x 3/4 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8167,
    contractCode: "B.04.05.027",
    sku: "32038",
    name: 'CANTONEIRA ALUMÍNIO 7/8 x 7/8 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8168,
    contractCode: "B.04.05.029",
    sku: "32039",
    name: 'CANTONEIRA ALUMÍNIO 1" X 1" X 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8169,
    contractCode: "B.04.05.030",
    sku: "32040",
    name: 'CANTONEIRA ALUMÍNIO 1.1/4 x 1.1/4 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8170,
    contractCode: "B.04.05.031",
    sku: "32041",
    name: 'CANTONEIRA ALUMÍNIO 1.1/2 x 1.1/2 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8171,
    contractCode: "B.06.01.001",
    sku: "35594",
    name: "PLACA DE GESSO ACARTONADO",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8172,
    contractCode: "B.06.03.001",
    sku: "35605",
    name: "PERFIL F530 PARA GESSO",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8173,
    contractCode: "B.06.03.003",
    sku: "35608",
    name: "MONTANTE PARA GESSO",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8174,
    contractCode: "B.06.03.004",
    sku: "35610",
    name: "PERFIL GUIA PARA GESSO",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8175,
    contractCode: "B.06.03.002",
    sku: "35612",
    name: "PERFIL CANTONEIRA PARA GESSO",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8176,
    contractCode: "B.06.03.005",
    sku: "35625",
    name: "TABICA PARA GESSO",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8177,
    contractCode: "B.04.07.004",
    sku: "35719",
    name: 'BAGUETE ALUMÍNIO 3/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8178,
    contractCode: "B.04.03.035",
    sku: "35720",
    name: 'LATÃO REDONDO 12 mm x 3 m (1/2")',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8179,
    contractCode: "B.04.03.037",
    sku: "35721",
    name: 'LATÃO REDONDO 20 mm x 3 m (3/4")',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8180,
    contractCode: "B.04.03.038",
    sku: "35722",
    name: 'LATÃO REDONDO 25 mm x 3 m (1")',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8181,
    contractCode: "B.04.03.039",
    sku: "35723",
    name: 'LATÃO REDONDO 32 mm x 3 m (1.1/4")',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8182,
    contractCode: "B.04.03.036",
    sku: "35724",
    name: 'LATÃO REDONDO 16 mm x 3 m (5/8")',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8183,
    contractCode: "B.04.03.040",
    sku: "35725",
    name: 'LATÃO SEXTAVADO 12 mm x 3 m (1/2")',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8184,
    contractCode: "B.04.03.042",
    sku: "35726",
    name: 'LATÃO SEXTAVADO 20 mm x 3 m (3/4")',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8185,
    contractCode: "B.04.03.043",
    sku: "35727",
    name: 'LATÃO SEXTAVADO 25 mm x 3 m (1")',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8186,
    contractCode: "B.04.03.044",
    sku: "35728",
    name: 'LATÃO SEXTAVADO 32 mm x 3 m (1.1/4")',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8187,
    contractCode: "B.04.03.041",
    sku: "35729",
    name: 'LATÃO SEXTAVADO 16 mm x 3 m (5/8")',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8188,
    contractCode: "B.01.08.003",
    sku: "35791",
    name: "SARRAFO 2,5 x 10 cm",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8189,
    contractCode: "B.01.07.002",
    sku: "35794",
    name: "VIGOTA 5,0 x 10 cm x 3 m",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8190,
    contractCode: "B.01.07.001",
    sku: "35799",
    name: "TÁBUA 2,5 x 25 cm",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8191,
    contractCode: "B.05.02.010",
    sku: "35808",
    name: "CHAPA DE MDF BRANCA",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8192,
    contractCode: "B.04.01.012",
    sku: "35824",
    name: 'CHAPA DE AÇO GROSSA 3/8" (9,53 MM) DE 3,00 X 1,20',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8193,
    contractCode: "B.04.06.028",
    sku: "36076",
    name: 'PERFIL CHATO 2 x 1/2"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8194,
    contractCode: "B.05.02.009",
    sku: "37273",
    name: "COMPENSADO PLASTIFICADO 18 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8195,
    contractCode: "B.04.06.001",
    sku: "37293",
    name: 'PERFIL CHATO 3/8 x 1/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8196,
    contractCode: "B.04.06.004",
    sku: "37294",
    name: 'PERFIL CHATO 1/2 x 1/4" ',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8197,
    contractCode: "B.04.06.012",
    sku: "37295",
    name: 'PERFIL CHATO 7/8 x 1/4" ',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8198,
    contractCode: "B.04.06.016",
    sku: "37296",
    name: 'PERFIL CHATO 1 x 3/8" ',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8199,
    contractCode: "B.04.06.024",
    sku: "37297",
    name: 'PERFIL CHATO 1.1/2 x 3/8"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8200,
    contractCode: "B.04.06.029",
    sku: "37298",
    name: 'PERFIL CHATO 2.1/2 X 1/4"',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8201,
    contractCode: "B.04.06.030",
    sku: "37299",
    name: 'PERFIL CHATO 2.1/2 x 1/2" ',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8202,
    contractCode: "B.04.06.031",
    sku: "37300",
    name: 'PERFIL CHATO 4 x 1/4" ',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8203,
    contractCode: "B.04.04.033",
    sku: "37422",
    name: "PERFIL CADEIRINHA FECHADA 100 X 30 MM",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8204,
    contractCode: "B.04.04.012",
    sku: "37659",
    name: 'PERFIL DE AÇO DOBRADO TIPO "U" DE 80 MM X 45 EM CHAPA Nº 16',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8205,
    contractCode: "B.04.03.016",
    sku: "38499",
    name: 'TUBO REDONDO INOX 1" Nº 16',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8206,
    contractCode: "B.04.03.018",
    sku: "38500",
    name: 'TUBO REDONDO INOX 1.1/2" Nº 16',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8207,
    contractCode: "B.04.03.020",
    sku: "38501",
    name: 'TUBO REDONDO INOX 2" Nº 16',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8208,
    contractCode: "B.04.03.017",
    sku: "38502",
    name: 'TUBO REDONDO INOX 1" Nº 13',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8209,
    contractCode: "B.04.03.019",
    sku: "38503",
    name: 'TUBO REDONDO INOX 1.1/2" Nº 13',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8210,
    contractCode: "B.04.03.021",
    sku: "38504",
    name: 'TUBO REDONDO INOX 2" Nº 13',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8211,
    contractCode: "B.05.03.004",
    sku: "39645",
    name: "LAMINADO CINZA ARGILA",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8212,
    contractCode: "B.05.03.005",
    sku: "39646",
    name: "LAMINADO VERDE CITRINO",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8213,
    contractCode: "B.04.03.022",
    sku: "39898",
    name: "TUBO EM ALUMÍNIO 1 POLEGADA",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8214,
    contractCode: "B.04.07.001",
    sku: "39949",
    name: "PERFIL CHATO EM ALUMÍNIO 1POL X 1/8POL BARRA COM 6 M",
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8215,
    contractCode: "B.04.04.010",
    sku: "39967",
    name: 'PERFIL DE AÇO DOBRADO TIPO "U" DE 50 MM X 45 MM EM CHAPA Nº 16',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  // === CORREÇÕES APLICADAS AQUI ===
  {
    id: 8216,
    contractCode: "B.04.07.002",
    sku: "24528",
    name: 'PERFIL DE ALUMÍNIO TIPO "U" - PU 5/8 X 5/8 - CÓDIGO DEMAP: 39996',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8217,
    contractCode: "B.04.07.005",
    sku: "30161",
    name: 'BAGUETE ALUMÍNIO 1/2" - CÓDIGO DEMAP: 39998',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
  {
    id: 8218,
    contractCode: "B.04.07.003",
    sku: "24527",
    name: 'PERFIL EM ALUMÍNIO TIPO "U" 5/8 X 1"- CÓDIGO DEMAP: 39999',
    category: "DEMAP - 01 ao 11",
    quantity: 0,
    minQuantity: 20,
    alertPercentage: 40,
    isArchived: false,
  },
];
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
const saveState = () => {
  try {
    localStorage.setItem(
      "estoqueMaster_materials",
      JSON.stringify(state.materials)
    );
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
    showToast("Erro ao salvar dados (Storage cheio?)", "danger");
  }
};
const initState = () => {
  const mats = localStorage.getItem("estoqueMaster_materials");
  state.materials = mats ? JSON.parse(mats) : INITIAL_MATERIALS;
  const movs = localStorage.getItem("estoqueMaster_movements");
  state.movements = movs ? JSON.parse(movs) : [];
  const cats = localStorage.getItem("estoqueMaster_categories");
  state.categories = cats ? JSON.parse(cats) : DEFAULT_CATEGORIES;
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
      if (typeof valA === "number" && typeof valB === "number") {
        return asc ? valA - valB : valB - valA;
      }
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
          ? "Todos os Departamentos"
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
      el.movementCustomDate.value = getLocalDate();
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
      { header: "Cód. Contrato", key: "contractCode" },
      { header: "Cód. Almox.", key: "sku" },
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
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.sku.includes(term) ||
          (m.contractCode && m.contractCode.toLowerCase().includes(term))
      );
    const cols = [
      { header: "Cód. Contrato", key: "contractCode", sortKey: "contractCode" },
      { header: "Cód. Almox.", key: "sku", sortKey: "sku" },
      {
        header: "Descrição",
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
      { header: "Departamento", key: "category", sortKey: "category" },
      { header: "Qtd.", key: "quantity", sortKey: "quantity" },
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
      { header: "Cód. Contrato", key: "contractCode", sortKey: "contractCode" },
      { header: "Cód. Almox.", key: "sku", sortKey: "sku" },
      { header: "Descrição", key: "name", sortKey: "name" },
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
      { header: "Data", key: "date", render: (m) => formatDate(m.date) },
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
  // Escaping helper for HTML content
  const escapeHTML = (str) => {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
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
        chart += `<div class="chart-row"><div class="chart-label">${escapeHTML(
          k
        )}</div><div class="chart-bar-background"><div class="chart-bar" style="width: ${pct}%"></div></div><div class="chart-value">${v}</div></div>`;
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
      icon.onclick = async () => {
        if (
          await showConfirm(
            "Remover Departamento",
            `Remover departamento "${cat}"?`,
            { confirmStyle: "danger" }
          )
        ) {
          state.categories = state.categories.filter((c) => c !== cat);
          saveState();
          renderSettings();
          renderCategorySelects();
          showToast("Departamento removido!", "success");
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
          <p><strong>Descrição:</strong> <span>${escapeHTML(m.name)}</span></p>
          <p><strong>CÓDIGO DO CONTRATO:</strong> <span>${escapeHTML(
            m.contractCode || "-"
          )}</span></p>
          <p><strong>CÓD. ALMOX.:</strong> <span>${escapeHTML(m.sku)}</span></p>
          <p><strong>Departamento:</strong> <span>${escapeHTML(
            m.category
          )}</span></p>
          <p><strong>Qtd. Atual:</strong> <span>${m.quantity}</span></p>
          <p><strong>Qtd. Mínima:</strong> <span>${
            m.minQuantity || 0
          }</span></p>
          <p><strong>Ressuprimento:</strong> <span>${
            m.resupplyQuantity || 0
          }</span></p>
          <p><strong>% Alerta:</strong> <span>${
            m.alertPercentage || 40
          }%</span></p>
          <p><strong>Status:</strong> <span class="status ${cls}">${text}</span></p>
          ${
            m.description
              ? `<p><strong>Observações:</strong></p><p>${escapeHTML(
                  m.description
                )}</p>`
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
      saveState();
      renderSettings();
      renderCategorySelects();
      el.newCategoryInput.value = "";
      showToast("Departamento adicionado!", "success");
    }
  });
  // [NOVO] Feedback de SKU em tempo real e Preenchimento Automático
  el.skuInputAdd.addEventListener("input", () => {
    const val = el.skuInputAdd.value.trim();
    const currentId = Number($("#material-id").value);
    // Procura por um material existente com esse código
    const found = state.materials.find((m) => m.sku === val);
    if (found) {
      // Preenche os campos automaticamente
      $("#material-name").value = found.name || "";
      $("#material-contract").value = found.contractCode || "";
      $("#material-category").value = found.category || "";
    }
    // Verifica se é duplicata (existe e não é o item que está sendo editado)
    const isDuplicate = found && found.id !== currentId;
    if (isDuplicate) {
      el.skuInputAdd.style.borderColor = "var(--color-danger)";
      el.skuFeedback.style.display = "block";
      el.skuFeedback.innerHTML =
        '<i class="fa fa-exclamation-circle"></i> Código já existe! Dados carregados.';
      el.skuFeedback.style.color = "var(--color-danger)";
    } else {
      el.skuInputAdd.style.borderColor = "var(--color-text-muted)";
      el.skuFeedback.style.display = "none";
    }
  });
  // Form Submit
  el.materialForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = Number($("#material-id").value);
    const mat = {
      id: id || Date.now(),
      name: $("#material-name").value.trim(),
      contractCode: $("#material-contract").value.trim(),
      sku: $("#material-sku").value.trim(),
      category: $("#material-category").value,
      quantity: Number($("#material-quantity").value),
      minQuantity: Number($("#material-min-quantity").value),
      resupplyQuantity: Number($("#material-resupply-quantity").value),
      alertPercentage: Number($("#material-alert-percentage").value),
      description: $("#material-description").value.trim(),
      image: _tempImageBase64,
      isArchived: false,
    };
    // If editing, preserve image and contract code if not changed/provided
    if (id) {
      const existing = state.materials.find((m) => m.id === id);
      if (existing) {
        if (!_tempImageBase64) mat.image = existing.image;
      }
    }
    const exists = state.materials.find(
      (m) => m.sku === mat.sku && m.id !== mat.id
    );
    if (exists) {
      showToast("Código já existe!", "danger");
      return;
    }
    const idx = state.materials.findIndex((m) => m.id === mat.id);
    if (idx >= 0) {
      mat.isArchived = state.materials[idx].isArchived;
      state.materials[idx] = mat;
      showToast("Atualizado!", "success");
    } else {
      state.materials.push(mat);
      showToast("Criado!", "success");
    }
    saveState();
    el.materialForm.reset();
    el.skuInputAdd.style.borderColor = "var(--color-text-muted)";
    el.skuFeedback.style.display = "none";
    $("#material-min-quantity").value = 0;
    $("#material-resupply-quantity").value = 0;
    $("#material-alert-percentage").value = 40;
    el.formImagePreview.innerHTML = '<i class="fa fa-image fa-2x"></i>';
    _tempImageBase64 = null;
    renderSection("dashboard");
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
      date: customDate || getLocalDate(), // CORREÇÃO: Data local
      reason: el.movementReason.value.trim(),
    });
    saveState();
    showToast("Movimentação registrada!", "success");
    el.movementForm.reset();
    el.movementCustomDate.value = getLocalDate(); // CORREÇÃO: Reset para data local
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
    $("#material-contract").value = m.contractCode || "";
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
        saveState();
        closeModal();
        showToast("Arquivado!", "success");
        renderSection(state.currentSection);
      }
    }
  });
  el.unarchiveMaterialBtn.addEventListener("click", async () => {
    const m = _currentModalMaterial;
    if (m) {
      state.materials.find((x) => x.id === m.id).isArchived = false;
      saveState();
      closeModal();
      showToast("Restaurado!", "success");
      renderSection(state.currentSection);
    }
  });
  // Data Management
  const resetData = async () => {
    const confirmed = await showConfirm(
      "Redefinir Dados",
      "Apagar todos os dados e recarregar padrão?",
      { confirmText: "Apagar", confirmStyle: "danger" }
    );
    if (confirmed) {
      localStorage.removeItem("estoqueMaster_materials");
      localStorage.removeItem("estoqueMaster_movements");
      // Não removemos categorias para manter a personalização se o user quiser, mas neste caso vamos resetar tudo para garantir
      localStorage.removeItem("estoqueMaster_categories");
      showToast("Redefinido!", "success");
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
            saveState();
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
    const rows = [
      ["Nome", "Cód. Contrato", "Codigo", "Categoria", "Qtd", "Minimo"],
    ];
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
      rows.push([
        m.name,
        m.contractCode || "",
        m.sku,
        m.category,
        m.quantity,
        m.minQuantity || 0,
      ])
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

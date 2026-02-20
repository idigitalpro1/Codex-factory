const API_BASE_CANDIDATES = [
  "http://localhost:8080/api/v1",
  "http://127.0.0.1:8080/api/v1",
  "http://[::1]:8080/api/v1",
];

let apiBase = window.API_BASE || null;
let activeBrand = new URLSearchParams(window.location.search).get("brand") || "";
let currentOffset = 0;
const PAGE_SIZE = 20;

async function probeApiBase(base) {
  const response = await fetch(`${base}/health`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    return false;
  }

  const payload = await response.json();
  return typeof payload === "object" && payload !== null;
}

async function resolveApiBase() {
  if (apiBase) {
    return apiBase;
  }

  for (const candidate of API_BASE_CANDIDATES) {
    try {
      if (await probeApiBase(candidate)) {
        apiBase = candidate;
        return apiBase;
      }
    } catch (_error) {
      // Continue to next candidate.
    }
  }

  // Production fallback: Plesk proxies /api/* to the backend container.
  apiBase = "/api/v1";
  return apiBase;
}

function detectSubdomainBrand() {
  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1" || !hostname.includes(".")) {
    return null;
  }
  const parts = hostname.split(".");
  // "monarch.5280.menu" → ["monarch","5280","menu"] → subdomain = "monarch"
  // "5280.menu"         → ["5280","menu"]           → no subdomain
  return parts.length >= 3 ? parts[0] : null;
}

async function fetchJson(path, options = {}) {
  if (!apiBase) {
    await resolveApiBase();
  }

  const response = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json();
}

async function loadHealth() {
  const health = document.getElementById("health");
  try {
    const data = await fetchJson("/health");
    health.textContent = JSON.stringify({ ...data, api_base: apiBase }, null, 2);
  } catch (error) {
    health.textContent = error.message;
  }
}

let brandData = [];

async function loadBrands() {
  const container = document.getElementById("brandButtons");
  try {
    const data = await fetchJson("/brands");
    brandData = data.items;
    container.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.className = "brand-btn";
    allBtn.textContent = "All";
    allBtn.addEventListener("click", () => selectBrand(""));
    container.appendChild(allBtn);

    data.items.forEach((brand) => {
      const btn = document.createElement("button");
      btn.className = "brand-btn";
      btn.style.borderBottom = `3px solid ${brand.primary_color}`;
      btn.textContent = `${brand.name} (${brand.counts.published})`;
      btn.addEventListener("click", () => selectBrand(brand.slug));
      container.appendChild(btn);
    });

    // Populate admin brand selects
    populateAdminBrands(data.items);
  } catch (error) {
    container.textContent = error.message;
  }
}

function selectBrand(slug) {
  activeBrand = slug;
  currentOffset = 0;

  const hero = document.querySelector(".hero");
  const heroTitle = hero.querySelector("h1");
  const heroSub = hero.querySelector("p");

  if (slug) {
    const brand = brandData.find((b) => b.slug === slug);
    if (brand) {
      heroTitle.textContent = brand.name;
      heroSub.textContent = brand.tagline;
      document.documentElement.style.setProperty("--brand-color", brand.primary_color);
      hero.style.background = `linear-gradient(135deg, ${brand.primary_color}, ${lighten(brand.primary_color)})`;
    }
  } else {
    heroTitle.textContent = "Next-Gen Digital Factory";
    heroSub.textContent = "Beta surface for empire-courier.com and VillagerMediaGroup.com";
    document.documentElement.style.setProperty("--brand-color", "var(--primary)");
    hero.style.background = "";
  }

  loadFeed(false);
}

function lighten(hex) {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 40);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 40);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 40);
  return `rgb(${r}, ${g}, ${b})`;
}

async function loadFeed(append) {
  const list = document.getElementById("feed");
  const heading = document.getElementById("feedHeading");
  const loadMore = document.getElementById("loadMore");

  const params = new URLSearchParams();
  if (activeBrand) params.set("brand", activeBrand);
  params.set("limit", PAGE_SIZE);
  params.set("offset", currentOffset);
  const query = `?${params.toString()}`;

  try {
    const data = await fetchJson(`/feed/articles${query}`);
    heading.textContent = activeBrand
      ? `${data.brand} — ${data.total} Articles`
      : `All Brands — ${data.total} Articles`;

    if (!append) {
      list.innerHTML = "";
    }

    data.articles.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${item.brand}</strong>: ${item.title}<br><small>${item.body || ""}</small>`;
      list.appendChild(li);
    });

    if (data.has_more) {
      currentOffset = data.next_offset;
      loadMore.style.display = "inline-block";
    } else {
      loadMore.style.display = "none";
    }
  } catch (error) {
    list.innerHTML = `<li>${error.message}</li>`;
    loadMore.style.display = "none";
  }
}

async function runMockAi() {
  const prompt = document.getElementById("prompt").value;
  const output = document.getElementById("aiOutput");

  try {
    const data = await fetchJson("/ai/mock", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
    output.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    output.textContent = error.message;
  }
}

// --- Admin Panel ---

function adminLog(data) {
  document.getElementById("adminLog").textContent = JSON.stringify(data, null, 2);
}

function populateAdminBrands(brands) {
  const createSelect = document.getElementById("adminBrand");
  const filterSelect = document.getElementById("adminBrandFilter");

  createSelect.innerHTML = "";
  brands.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.slug;
    opt.textContent = b.name;
    createSelect.appendChild(opt);
  });

  filterSelect.innerHTML = '<option value="">All Brands</option>';
  brands.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.slug;
    opt.textContent = b.name;
    filterSelect.appendChild(opt);
  });
}

async function adminCreateDraft() {
  const btn = document.getElementById("adminCreate");
  const brand = document.getElementById("adminBrand").value;
  const title = document.getElementById("adminTitle").value.trim();
  const body = document.getElementById("adminBody").value.trim();

  if (!title) {
    adminLog({ error: "Title is required" });
    return;
  }

  btn.disabled = true;
  try {
    const data = await fetchJson("/admin/articles", {
      method: "POST",
      body: JSON.stringify({ brand, title, body }),
    });
    adminLog(data);
    document.getElementById("adminTitle").value = "";
    document.getElementById("adminBody").value = "";
    await adminRefresh();
  } catch (error) {
    adminLog({ error: error.message });
  } finally {
    btn.disabled = false;
  }
}

async function adminPatch(id, updates) {
  try {
    const data = await fetchJson(`/admin/articles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    adminLog(data);
    await adminRefresh();
    await loadFeed(false);
    await loadBrands();
  } catch (error) {
    adminLog({ error: error.message });
  }
}

function renderAdminList(container, articles, showActions) {
  container.innerHTML = "";
  if (articles.length === 0) {
    container.textContent = "None";
    return;
  }

  articles.forEach((a) => {
    const div = document.createElement("div");
    div.className = "admin-item";

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${a.brand} · ${a.status} · ${a.updated_at}`;
    div.appendChild(meta);

    if (showActions) {
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.value = a.title;
      div.appendChild(titleInput);

      const bodyArea = document.createElement("textarea");
      bodyArea.rows = 2;
      bodyArea.value = a.body || "";
      div.appendChild(bodyArea);

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save";
      saveBtn.addEventListener("click", () => {
        saveBtn.disabled = true;
        adminPatch(a.id, { title: titleInput.value, body: bodyArea.value }).finally(
          () => (saveBtn.disabled = false)
        );
      });
      div.appendChild(saveBtn);

      const pubBtn = document.createElement("button");
      pubBtn.textContent = "Publish";
      pubBtn.className = "publish-btn";
      pubBtn.addEventListener("click", () => {
        pubBtn.disabled = true;
        adminPatch(a.id, { status: "published" }).finally(() => (pubBtn.disabled = false));
      });
      div.appendChild(pubBtn);
    } else {
      const titleEl = document.createElement("div");
      titleEl.innerHTML = `<strong>${a.title}</strong>`;
      div.appendChild(titleEl);
    }

    container.appendChild(div);
  });
}

async function adminRefresh() {
  const brandFilter = document.getElementById("adminBrandFilter").value;
  const params = new URLSearchParams();
  if (brandFilter) params.set("brand", brandFilter);

  try {
    params.set("status", "draft");
    const drafts = await fetchJson(`/admin/articles?${params.toString()}`);
    renderAdminList(document.getElementById("adminDrafts"), drafts.articles, true);

    params.set("status", "published");
    const published = await fetchJson(`/admin/articles?${params.toString()}`);
    renderAdminList(document.getElementById("adminPublished"), published.articles, false);
  } catch (error) {
    adminLog({ error: error.message });
  }
}

// --- Init ---

async function init() {
  await resolveApiBase();
  await loadHealth();
  await loadBrands();

  const subdomainSlug = detectSubdomainBrand();
  if (subdomainSlug && brandData.find((b) => b.slug === subdomainSlug)) {
    selectBrand(subdomainSlug);
  } else {
    await loadFeed(false);
  }

  await adminRefresh();
}

document.getElementById("runAi").addEventListener("click", runMockAi);
document.getElementById("loadMore").addEventListener("click", () => loadFeed(true));
document.getElementById("adminCreate").addEventListener("click", adminCreateDraft);
document.getElementById("adminRefresh").addEventListener("click", adminRefresh);
document.getElementById("adminBrandFilter").addEventListener("change", adminRefresh);

init();

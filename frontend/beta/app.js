const API_BASE_CANDIDATES = [
  "http://localhost:8080/api/v1",
  "http://127.0.0.1:8080/api/v1",
  "http://[::1]:8080/api/v1",
];

let apiBase = window.API_BASE || null;

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

  throw new Error("No reachable API base found on localhost/127.0.0.1/[::1].");
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

let activeBrand = new URLSearchParams(window.location.search).get("brand") || "";

async function loadFeed(brand) {
  if (brand !== undefined) {
    activeBrand = brand;
  }
  const list = document.getElementById("feed");
  const heading = document.getElementById("feedHeading");
  const query = activeBrand ? `?brand=${activeBrand}` : "";
  try {
    const data = await fetchJson(`/feed/articles${query}`);
    heading.textContent = activeBrand
      ? `${data.brand} — ${data.count} Articles`
      : `All Brands — ${data.count} Articles`;
    list.innerHTML = "";

    data.articles.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${item.brand}</strong>: ${item.title}<br><small>${item.summary}</small>`;
      list.appendChild(li);
    });
  } catch (error) {
    list.innerHTML = `<li>${error.message}</li>`;
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

async function init() {
  try {
    await resolveApiBase();
  } catch (error) {
    document.getElementById("health").textContent = error.message;
  }

  await loadHealth();
  await loadFeed();
}

document.getElementById("runAi").addEventListener("click", runMockAi);

document.querySelectorAll(".brand-btn").forEach((btn) => {
  btn.addEventListener("click", () => loadFeed(btn.dataset.brand));
});

init();

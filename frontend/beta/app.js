const API_BASE = window.API_BASE || "http://localhost:8080/api/v1";

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
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
    health.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    health.textContent = error.message;
  }
}

async function loadFeed() {
  const list = document.getElementById("feed");
  try {
    const data = await fetchJson("/feed/articles");
    list.innerHTML = "";

    data.items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.brand}: ${item.title}`;
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

document.getElementById("runAi").addEventListener("click", runMockAi);

loadHealth();
loadFeed();

const API = "http://127.0.0.1:8000";
let reasonChart = null;
let allReturns = [];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("today-label").textContent =
    new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  document.querySelectorAll(".nav-link").forEach(btn =>
    btn.addEventListener("click", () => showPage(btn.dataset.page))
  );
  document.querySelectorAll("[data-go]").forEach(btn =>
    btn.addEventListener("click", () => showPage(btn.dataset.go))
  );
  document.getElementById("return-form").addEventListener("submit", addReturn);
  document.getElementById("analyze-feedback-btn").addEventListener("click", analyzeFeedback);
  document.getElementById("search-input").addEventListener("input", renderHistory);
  document.getElementById("status-filter").addEventListener("change", renderHistory);
  document.getElementById("return-form").elements.return_date.value = new Date().toISOString().slice(0, 10);
  loadData();
});

function showPage(name) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(b => b.classList.toggle("active", b.dataset.page === name));
  document.getElementById(`${name}-page`).classList.add("active");
  const titles = { dashboard: "Dashboard", add: "Add Return", history: "Return History", autopsy: "Return Autopsy" };
  document.getElementById("page-title").textContent = titles[name];
  if (name === "history") renderHistory();
  if (name === "autopsy") renderAutopsy();
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" }, ...options
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.detail || "Something went wrong. Please try again.");
  }
  return response.status === 204 ? null : response.json();
}

async function loadData() {
  try {
    allReturns = await apiRequest("/returns");
    updateDashboard();
    renderHistory();
    renderAutopsy();
  } catch (error) {
    console.error(error);
    document.getElementById("quick-suggestion").textContent =
      "Cannot connect to the backend. Start the FastAPI server and refresh this page.";
  }
}

async function addReturn(event) {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());
  const message = document.getElementById("form-message");
  try {
    await apiRequest("/returns", { method: "POST", body: JSON.stringify(data) });
    message.textContent = "Return saved successfully!";
    form.reset();
    form.elements.return_date.value = new Date().toISOString().slice(0, 10);
    await loadData();
    setTimeout(() => showPage("history"), 500);
  } catch (error) {
    message.style.color = "#b56e93";
    message.textContent = error.message;
  }
}

function statusBadge(status) {
  return `<span class="status status-${status.toLowerCase()}">${escapeHtml(status)}</span>`;
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]
  );
}

function updateDashboard() {
  const count = status => allReturns.filter(r => r.status === status).length;
  document.getElementById("total-count").textContent = allReturns.length;
  document.getElementById("pending-count").textContent = count("Pending");
  document.getElementById("approved-count").textContent = count("Approved");
  document.getElementById("rejected-count").textContent = count("Rejected");

  const reasons = countReasons();
  const top = Object.entries(reasons).sort((a,b) => b[1] - a[1])[0];
  document.getElementById("top-reason").textContent = top ? top[0] : "—";
  document.getElementById("quick-suggestion").textContent = top
    ? suggestionFor(top[0]) : "Add return records to start discovering patterns.";

  const recent = [...allReturns].sort((a,b) => b.id - a.id).slice(0,5);
  document.getElementById("recent-table").innerHTML = recent.length ? recent.map(r => `
    <tr><td>${escapeHtml(r.product_name)}</td><td>${escapeHtml(r.order_id)}</td>
    <td>${escapeHtml(r.reason)}</td><td>${escapeHtml(r.return_date)}</td><td>${statusBadge(r.status)}</td></tr>`).join("")
    : '<tr><td colspan="5" class="empty-cell">No returns added yet.</td></tr>';

  const labels = Object.keys(reasons);
  const values = Object.values(reasons);
  const ctx = document.getElementById("reasonChart");
  if (reasonChart) reasonChart.destroy();
  reasonChart = new Chart(ctx, {
    type: "doughnut",
    data: { labels: labels.length ? labels : ["No data yet"], datasets: [{
      data: values.length ? values : [1],
      backgroundColor: ["#b99cde","#d7c4ef","#eadff7","#a88acb","#cbb5e6","#eee6f7","#9475bb","#dbcde9","#c3acdF"],
      borderWidth: 3, borderColor: "#fff", hoverOffset: 5
    }] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { boxWidth: 10, color: "#88799a", font: { size: 10 }, padding: 13 } } } }
  });
}

function countReasons() {
  return allReturns.reduce((acc, item) => {
    acc[item.reason] = (acc[item.reason] || 0) + 1;
    return acc;
  }, {});
}

function renderHistory() {
  const search = document.getElementById("search-input").value.toLowerCase();
  const status = document.getElementById("status-filter").value;
  const rows = allReturns.filter(r =>
    (`${r.product_name} ${r.order_id}`).toLowerCase().includes(search) &&
    (!status || r.status === status)
  );
  document.getElementById("history-table").innerHTML = rows.length ? rows.map(r => `
    <tr>
      <td>${escapeHtml(r.product_name)}</td><td>${escapeHtml(r.order_id)}</td>
      <td>${escapeHtml(r.reason)}</td><td>${escapeHtml(r.return_date)}</td>
      <td><select class="action-select" onchange="changeStatus(${r.id}, this.value)">
        ${["Pending","Approved","Rejected","Completed"].map(s => `<option ${r.status===s?"selected":""}>${s}</option>`).join("")}
      </select></td>
      <td><button class="delete-btn" onclick="deleteReturn(${r.id})">Delete</button></td>
    </tr>`).join("") : '<tr><td colspan="6" class="empty-cell">No matching returns found.</td></tr>';
}

async function changeStatus(id, status) {
  try {
    await apiRequest(`/returns/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await loadData();
  } catch (error) { alert(error.message); }
}
async function deleteReturn(id) {
  if (!confirm("Are you sure you want to delete this return?")) return;
  try {
    await apiRequest(`/returns/${id}`, { method: "DELETE" });
    await loadData();
  } catch (error) { alert(error.message); }
}

function suggestionFor(reason) {
  const tips = {
    "Damaged product": "Review packaging quality and handling during shipping.",
    "Defective product": "Check product quality before dispatch and inspect supplier batches.",
    "Wrong item delivered": "Improve product-picking and order verification.",
    "Wrong size": "Provide clearer size charts and product measurements.",
    "Not as described": "Make product descriptions and images more accurate.",
    "Poor quality": "Review materials and quality-control checks.",
    "Late delivery": "Review dispatch timelines and delivery partners.",
    "Changed mind": "Consider clearer product details to help customers decide."
  };
  return tips[reason] || "Review customer feedback to understand the issue.";
}

function renderAutopsy() {
  const reasons = countReasons();
  const top = Object.entries(reasons).sort((a,b) => b[1] - a[1])[0];
  document.getElementById("autopsy-reason").textContent = top ? top[0] : "—";
  document.getElementById("damaged-count").textContent = allReturns.filter(r => r.condition === "Damaged").length;
  document.getElementById("defective-count").textContent = allReturns.filter(r => r.condition === "Defective").length;

  const recommendations = Object.entries(reasons).sort((a,b) => b[1] - a[1]).slice(0,4);
  document.getElementById("recommendations").innerHTML = recommendations.length
    ? recommendations.map(([reason, total]) => `
      <div class="recommendation"><div class="rec-icon">✦</div><div>
        <strong>${escapeHtml(reason)} · ${total} return${total===1?"":"s"}</strong>
        <p>${escapeHtml(suggestionFor(reason))}</p>
      </div></div>`).join("")
    : '<div class="empty-state">Add a few returns to generate findings.</div>';
}


async function analyzeFeedback() {
  const feedback = document.getElementById("ai-feedback").value.trim();
  const status = document.getElementById("ai-status");
  const resultBox = document.getElementById("ai-result");
  const button = document.getElementById("analyze-feedback-btn");

  if (feedback.length < 5) {
    status.textContent = "Please enter at least 5 characters of feedback.";
    resultBox.innerHTML = "";
    return;
  }

  button.disabled = true;
  button.textContent = "Analysing...";
  status.textContent = "Connecting to Gemini AI...";
  resultBox.innerHTML = "";

  try {
    const analysis = await apiRequest("/analyze-feedback", {
      method: "POST",
      body: JSON.stringify({ feedback })
    });
    resultBox.innerHTML = `
      <div class="ai-result-grid">
        <div class="ai-result-item"><small>Identified issue</small><strong>${escapeHtml(analysis.issue)}</strong></div>
        <div class="ai-result-item"><small>Customer sentiment</small><strong>${escapeHtml(analysis.sentiment)}</strong></div>
        <div class="ai-result-item ai-wide"><small>AI summary</small><p>${escapeHtml(analysis.summary)}</p></div>
        <div class="ai-result-item ai-wide"><small>Recommended action</small><p>${escapeHtml(analysis.recommendation)}</p></div>
      </div>`;
    status.textContent = "Analysis complete.";
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "✦ Analyse with AI";
  }
}

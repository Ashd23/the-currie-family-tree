const directLine = [
  "Archibald Clayton Currie",
  "James Wiley Currie",
  "John Robert Currie",
  "Bobby Jean Currie",
  "Christopher Leon Currie",
  "Ashley Danielle Currie",
];

let familyData;
let allNodes = [];
let selectedNode;

const cleanText = (text) => text
  .replaceAll("â€œ", "“").replaceAll("â€", "”")
  .replaceAll("â€™", "’").replaceAll("â€“", "–").replaceAll("â€”", "—");

const assetUrl = (url) => url.startsWith("/archive-assets/") ? url.split("/").pop() : url;
const flatten = (node) => [node, ...node.children.flatMap(flatten)];
const isDirect = (node) => directLine.some((name) => node.name.startsWith(name));
const hasContent = (node) => node.info.length + node.files.length > 0;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

function branchHtml(node, depth = 0) {
  const open = depth < 2 || isDirect(node);
  return `<li class="branch">
    <div class="branch-row ${selectedNode?.id === node.id ? "selected" : ""} ${isDirect(node) ? "direct" : ""}">
      ${node.children.length ? `<button class="toggle" data-toggle="${escapeHtml(node.id)}">${open ? "−" : "+"}</button>` : `<span class="toggle-spacer"></span>`}
      <button class="person-button" data-person="${escapeHtml(node.id)}">
        <span>${escapeHtml(node.name)}</span>
        ${hasContent(node) ? `<small>${node.files.length ? `${node.files.length} record${node.files.length === 1 ? "" : "s"}` : "details"}</small>` : ""}
      </button>
    </div>
    ${node.children.length ? `<ul data-children="${escapeHtml(node.id)}" ${open ? "" : "hidden"}>${node.children.map((child) => branchHtml(child, depth + 1)).join("")}</ul>` : ""}
  </li>`;
}

function noteHtml(note) {
  return `<section class="note"><h3>${escapeHtml(note.title)}</h3>${
    cleanText(note.text).split(/\r?\n/).filter(Boolean).map((line) =>
      line.startsWith("http")
        ? `<a href="${escapeHtml(line)}" target="_blank" rel="noreferrer">Open evidence link</a>`
        : `<p>${escapeHtml(line.replace(/^-\s*/, ""))}</p>`
    ).join("")
  }</section>`;
}

function detailHtml(node) {
  const images = node.files.filter((file) => file.type === "image");
  const other = node.files.filter((file) => file.type !== "image");
  return `<article class="detail-card">
    <div class="eyebrow">${isDirect(node) ? "Direct Currie line" : "Family branch"}</div>
    <h2>${escapeHtml(node.name)}</h2>
    ${node.path ? `<p class="relationship-path">${escapeHtml(node.path.split("\\").slice(-3, -1).join("  ›  "))}</p>` : ""}
    ${node.info.map(noteHtml).join("")}
    ${images.length ? `<section><h3>Documents & photographs</h3><div class="document-grid">${
      images.map((file) => `<a class="document" href="${escapeHtml(assetUrl(file.url))}" target="_blank" rel="noreferrer">
        <img src="${escapeHtml(assetUrl(file.url))}" alt="${escapeHtml(file.name)}" loading="lazy">
        <span>${escapeHtml(file.name)}</span></a>`).join("")
    }</div></section>` : ""}
    ${other.length ? `<section><h3>Records & research links</h3><div class="record-list">${
      other.map((file) => `<a href="${escapeHtml(assetUrl(file.url))}" target="_blank" rel="noreferrer">
        <span class="record-icon">${file.type === "source" ? "↗" : "⌑"}</span>
        <span><strong>${escapeHtml(file.name)}</strong><small>${file.type === "source" ? "Open original research source" : "Open document"}</small></span>
      </a>`).join("")
    }</div></section>` : ""}
    ${!hasContent(node) ? `<div class="empty-note"><p>No individual document has been added for this person yet.</p>${node.children.length ? "<p>Their family members appear beneath this branch in the tree.</p>" : ""}</div>` : ""}
  </article>`;
}

function render() {
  const app = document.querySelector("#app");
  app.className = "";
  app.innerHTML = `
    <header class="hero"><div class="hero-inner">
      <p class="kicker">From North Carolina to Florida and beyond</p>
      <h1>The Currie Family Tree</h1>
      <p class="intro">A family archive of names, relationships, photographs, public records, and the stories preserved between them.</p>
      <div class="lineage-strip">${directLine.map((name, index) => {
        const node = allNodes.find((item) => item.name.startsWith(name));
        return `<button ${node ? `data-person="${escapeHtml(node.id)}"` : "disabled"}><small>${index === 0 ? "Earliest researched" : `Generation ${index + 1}`}</small><span>${escapeHtml(name)}</span></button>`;
      }).join("")}</div>
    </div></header>
    <div class="search-band"><div class="search-wrap">
      <label for="family-search">Find someone in the family</label>
      <input id="family-search" type="search" placeholder="Type a name…">
      <div id="results" class="results" hidden></div>
    </div><button id="mobile-tree-button" class="mobile-tree-button">Browse family branches</button></div>
    <div class="workspace">
      <aside id="tree-panel" class="tree-panel"><div class="panel-heading"><p class="eyebrow">Family branches</p><h2>Explore the tree</h2><p>Select any name to see the information and records saved with that branch.</p></div>
        <nav aria-label="Currie family tree"><ul class="tree-root">${familyData.tree.children.map((child) => branchHtml(child)).join("")}</ul></nav>
      </aside>
      <section class="content-panel"><div id="details">${detailHtml(selectedNode)}</div>
        <footer><div class="thistle">❦</div><p>Built from family knowledge and available records. Research notes mark details that still need confirmation.</p>
        <small>${familyData.stats.folders} family folders · ${familyData.stats.files} saved items · Archive updated ${familyData.generated}</small></footer>
      </section>
    </div>`;
  bindEvents();
}

function choose(id) {
  const node = allNodes.find((item) => item.id === id);
  if (!node) return;
  selectedNode = node;
  document.querySelector("#details").innerHTML = detailHtml(node);
  document.querySelectorAll(".branch-row").forEach((row) => row.classList.remove("selected"));
  const button = document.querySelector(`.person-button[data-person="${CSS.escape(id)}"]`);
  if (button) button.closest(".branch-row").classList.add("selected");
  document.querySelector("#tree-panel").classList.remove("open");
  document.querySelector("#mobile-tree-button").textContent = "Browse family branches";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindEvents() {
  document.querySelectorAll("[data-person]").forEach((button) => button.addEventListener("click", () => choose(button.dataset.person)));
  document.querySelectorAll("[data-toggle]").forEach((button) => button.addEventListener("click", () => {
    const list = document.querySelector(`[data-children="${CSS.escape(button.dataset.toggle)}"]`);
    list.hidden = !list.hidden;
    button.textContent = list.hidden ? "+" : "−";
  }));
  const mobileButton = document.querySelector("#mobile-tree-button");
  mobileButton.addEventListener("click", () => {
    const panel = document.querySelector("#tree-panel");
    panel.classList.toggle("open");
    mobileButton.textContent = panel.classList.contains("open") ? "Close family branches" : "Browse family branches";
  });
  const search = document.querySelector("#family-search");
  const results = document.querySelector("#results");
  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    if (!query) { results.hidden = true; return; }
    const matches = allNodes.filter((node) => node.name.toLowerCase().includes(query) || node.info.some((note) => note.text.toLowerCase().includes(query))).slice(0, 30);
    results.innerHTML = matches.length
      ? matches.map((node) => `<button data-result="${escapeHtml(node.id)}"><strong>${escapeHtml(node.name)}</strong><small>${escapeHtml(node.path.split("\\").slice(-2, -1)[0] || "Family archive")}</small></button>`).join("")
      : "<p>No matching family member found.</p>";
    results.hidden = false;
    results.querySelectorAll("[data-result]").forEach((button) => button.addEventListener("click", () => {
      search.value = ""; results.hidden = true; choose(button.dataset.result);
    }));
  });
}

fetch("family-data.json")
  .then((response) => {
    if (!response.ok) throw new Error("Family data could not be loaded.");
    return response.json();
  })
  .then((data) => {
    familyData = data;
    allNodes = flatten(data.tree);
    selectedNode = data.tree.children[0] || data.tree;
    render();
  })
  .catch(() => {
    document.querySelector("#app").innerHTML = "<p>The family archive could not be opened. Please try the link again.</p>";
  });

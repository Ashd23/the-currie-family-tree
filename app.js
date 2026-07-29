const directLine = [
  "Archibald Clayton Currie",
  "James Wiley Currie",
  "John Robert Currie",
  "Bobby Jean Currie",
];

let familyData;
let allNodes = [];
let selectedNode;

const cleanText = (text) =>
  text
    .replaceAll("â€œ", "“")
    .replaceAll("â€", "”")
    .replaceAll("â€™", "’")
    .replaceAll("â€“", "–")
    .replaceAll("â€”", "—");

const assetUrl = (url) =>
  url.startsWith("/archive-assets/") ? url.split("/").pop() : url;
const flatten = (node) => [node, ...node.children.flatMap(flatten)];
const isDirect = (node) =>
  directLine.some((name) => node.name.startsWith(name));
const isDocumentFolder = (node) => node.name.endsWith("Historical Documents");
const isNonFamilyPartner = (node) => node.name.startsWith("Boyfriend - ");
const visibleChildren = (node) =>
  node.children.filter(
    (child) => !isDocumentFolder(child) && !isNonFamilyPartner(child),
  );
const associatedFiles = (node) => {
  const files = [
    ...node.files,
    ...(node._documentFiles || []),
    ...node.children.filter(isDocumentFolder).flatMap((child) => child.files),
  ];
  return files.filter(
    (file, index) =>
      files.findIndex(
        (candidate) =>
          candidate.name === file.name && candidate.url === file.url,
      ) === index,
  );
};
const researchNotes = (node) => {
  const notes = [...node.info];
  if (node.name.startsWith("James Wiley Currie (1855-1925)")) {
    notes.unshift({
      title: "Parents and evidence",
      text: `James Wiley Currie was born 23 August 1855 and died 27 July 1925.

The current family tree identifies Archibald Clayton Currie and Lucy Caroline Scarbrough as his parents. FamilySearch places James with their children and connects the family to the 1860 and 1870 United States censuses.

A Richmond County cemetery transcription incorrectly describes James as a son of Archie M. Currie and Catherine Gibson. That statement is chronologically impossible: the same transcription dates Archie M. to 1867 and Catherine Gibson to 1871, twelve and sixteen years after James was born. It also lists their children in the later generation.

The cemetery statement is therefore treated as a transcription or identification error. The original 1860 census household image is still wanted as the strongest final confirmation.

https://ancestors.familysearch.org/en/LK6Y-CS4/lucy-ann-currie-1857-1872
https://ncgenweb.us/richmond/c_1.html`,
    });
  }
  if (node.name.startsWith("Archibald Clayton Currie (1825-1877)")) {
    notes.unshift({
      title: "Available research evidence",
      text: `The archive does not yet contain a downloaded original census image for Archibald and Lucy.

The saved research links connect them to their children and point to census and cemetery material that supports this family group.

These are research links rather than copies of original certificates. An original 1860 or 1870 census household image is still wanted for this couple.`,
    });
  }
  return notes;
};
const hasContent = (node) =>
  researchNotes(node).length + associatedFiles(node).length > 0;
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
const shortName = (node) =>
  node.name
    .replace(/\s+\((?:born\s+)?[^)]*\)/gi, "")
    .replace(
      /^(Former wife|First wife|Second wife|Wife|Spouse|Boyfriend|Former husband|Brooklyn's father)\s*-\s*/i,
      "",
    );
const initials = (name) =>
  name
    .replace(/\band\b/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
const findNode = (prefix) =>
  allNodes.find(
    (node) => node.name.startsWith(prefix) && !isDocumentFolder(node),
  );

function portraitHtml(node, size = "normal") {
  const name = shortName(node);
  return `<span class="family-portrait ${size}" aria-hidden="true">${escapeHtml(initials(name))}</span>`;
}

function lineageTreeHtml() {
  const nodes = directLine.map(findNode).filter(Boolean);
  const relationshipToNext = [
    "Their son",
    "Their son",
    "Their son",
    "Their son",
    "His daughter",
  ];
  return `<section class="family-showcase" aria-labelledby="lineage-title">
    <div class="section-heading">
      <p class="eyebrow">Shared family roots</p>
      <h2 id="lineage-title">The Currie family through the years</h2>
      <p>This shared family line ends with Bobby Jean and Shirley. Their six children's families branch together below.</p>
    </div>
    <div class="lineage-tree">${nodes
      .map(
        (node, index) => `
      <div class="lineage-generation">
        <button class="lineage-card" data-person="${escapeHtml(node.id)}">
          ${portraitHtml(node, index === 0 || index === nodes.length - 1 ? "accent" : "normal")}
          <span class="generation-label">${index === 0 ? "Earliest researched" : `Generation ${index + 1}`}</span>
          <strong>${escapeHtml(shortName(node))}</strong>
          <small>Open documents and details</small>
        </button>
        ${index < nodes.length - 1 ? `<span class="lineage-connector"><i></i><b>${relationshipToNext[index]}</b><i></i></span>` : ""}
      </div>`,
      )
      .join("")}</div>
  </section>`;
}

function labeledPersonHtml(prefix, relationship) {
  const node = findNode(prefix);
  if (!node) return "";
  return labeledNodeHtml(node, relationship);
}

function labeledNodeHtml(node, relationship) {
  return `<button class="labeled-person" data-person="${escapeHtml(node.id)}">
    ${portraitHtml(node, "small")}
    <span><small>${escapeHtml(relationship)}</small><strong>${escapeHtml(shortName(node))}</strong></span>
  </button>`;
}

function earlierGenerationsHtml() {
  const families = [
    findNode("Archibald Clayton Currie"),
    findNode("James Wiley Currie"),
    findNode("John Robert Currie"),
  ].filter(Boolean);
  return `<section class="earlier-generations" aria-labelledby="earlier-title">
    <div class="section-heading">
      <p class="eyebrow">The wider Currie family</p>
      <h2 id="earlier-title">Children and sibling branches</h2>
      <p>Each generation shows the couple's children. Children of the direct-line siblings are shown beneath their own parents.</p>
    </div>
    <div class="generation-tree-stack">${families
      .map((family) => {
        const children = visibleChildren(family);
        return `<article class="generation-family-tree">
          <div class="generation-root">${labeledNodeHtml(family, "Parents")}</div>
          <div class="generation-children">${children
            .map((child) => {
              const nextGeneration = isDirect(child);
              const grandchildren = nextGeneration
                ? []
                : visibleChildren(child);
              return `<div class="generation-child-branch">
                ${labeledNodeHtml(child, "Child")}
                ${
                  nextGeneration
                    ? `<div class="continues-label">Direct family line continues below</div>`
                    : grandchildren.length
                      ? `<div class="generation-grandchildren">${grandchildren
                          .map((grandchild) =>
                            labeledNodeHtml(grandchild, "Their child"),
                          )
                          .join("")}</div>`
                      : `<div class="no-descendants">No children listed</div>`
                }
              </div>`;
            })
            .join("")}</div>
        </article>`;
      })
      .join("")}</div>
  </section>`;
}

function familyBranchesHtml() {
  const bobbyShirley = findNode("Bobby Jean Currie (1938-2014)");
  if (!bobbyShirley) return "";
  const children = [
    ["Bobby J Currie", "Son"],
    ["Christopher Leon Currie", "Son"],
    ["Jaime Lee Currie", "Daughter"],
    ["Lonnie Jean Currie", "Son"],
    ["Robert Shawn Currie", "Son"],
    ["Scotty Ray Currie", "Son"],
  ];
  const branches = [
    {
      title: "Bobby J Currie's family",
      root: ["Bobby J Currie", "Son of Bobby Jean and Shirley"],
      families: [
        {
          parent: ["Chastin Currie Aldrich", "Daughter"],
          children: [
            ["Liam Aldrich", "Son"],
            ["Brayla Aldrich", "Daughter"],
            ["Waylon Aldrich", "Son"],
          ],
        },
        {
          parent: ["Amanda Marie Currie Gay", "Daughter"],
          children: [
            ["Lyndsay Gay", "Daughter"],
            ["Kyle Gay", "Son"],
          ],
        },
        {
          parent: ["Gabrielle Currie", "Daughter"],
          children: [["Hanna Fajikus", "Daughter"]],
        },
        {
          parent: ["Benjamin Jacob Currie", "Son"],
          children: [["Creed Currie", "Son"]],
        },
        {
          parent: ["Jonathan Currie", "Son"],
          children: [
            ["Grayson Currie", "Son with Gracie"],
            ["Weston Currie", "Son with Gracie"],
            ["Koda Currie", "Son with Gracie"],
            ["Noah Currie", "Son with Gracie"],
          ],
        },
      ],
    },
    {
      title: "Christopher Leon Currie's family",
      root: ["Christopher Leon Currie", "Son of Bobby Jean and Shirley"],
      families: [
        {
          parent: ["Ashley Danielle Currie", "Daughter"],
          children: [
            ["Colton Anthony Jordan", "Son"],
            ["Madliynn Elizabeth Jordan", "Daughter"],
            ["Brooklyn Avery Van", "Daughter"],
          ],
        },
        {
          parent: ["Christina Michelle Currie", "Daughter"],
          children: [
            ["Ayden Gabriel Mitchell", "Son"],
            ["Daymein Xavier Cole Mitchell", "Son"],
            ["Lyla Mae Currie", "Daughter"],
            ["Cooper Staipe England", "Son"],
            ["Ronin Omero England", "Son"],
          ],
        },
        {
          parent: ["Christopher Aaron Currie", "Son"],
          children: [
            ["Georgiana Rose Currie", "Daughter"],
            ["Christopher Giovanni Currie", "Son"],
            ["Graham Nicolas Currie", "Son"],
          ],
        },
      ],
    },
    {
      title: "Robert Shawn Currie's family",
      root: ["Robert Shawn Currie", "Son of Bobby Jean and Shirley"],
      families: [
        {
          parent: ["Brittnee Currie", "Daughter"],
          children: [["Miguel (born", "Son"]],
        },
        { parent: ["Alisha Currie", "Daughter"], children: [] },
        {
          parent: ["Shawnna Currie", "Daughter"],
          children: [["Reagan Ruiz", "Daughter"]],
        },
        {
          parent: ["Emily Currie", "Daughter"],
          children: [["Nico Fields", "Son"]],
        },
      ],
    },
  ];
  return `<section class="branch-showcase" aria-labelledby="branches-title">
    <div class="section-heading light">
      <p class="eyebrow">A growing family</p>
      <h2 id="branches-title">Bobby Jean &amp; Shirley's family</h2>
      <p>Their children, grandchildren, and great-grandchildren are shown together. Select any name to open that person's place in the archive.</p>
    </div>
    <div class="family-couple">
      <button data-person="${escapeHtml(bobbyShirley.id)}">${portraitHtml(bobbyShirley, "large")}<strong>${escapeHtml(shortName(bobbyShirley))}</strong><small>Parents of the six children below</small><span class="document-cta">Open family documents</span></button>
    </div>
    <h3 class="level-title">Their children</h3>
    <div class="children-level">${children.map(([name, relationship]) => labeledPersonHtml(name, relationship)).join("")}</div>
    <div class="branch-groups">${branches
      .map((branch) => {
        const branchRoot = findNode(branch.root[0]);
        return `<article class="branch-group">
          <div class="branch-title-row"><h3>${escapeHtml(branch.title)}</h3>${branchRoot ? `<button class="family-documents-button" data-person="${escapeHtml(branchRoot.id)}">Open family documents</button>` : ""}</div>
          <div class="branch-root">${labeledPersonHtml(...branch.root)}</div>
          <div class="branch-family-row">${branch.families
            .map(
              (family) => `<div class="parent-branch">
                ${labeledPersonHtml(...family.parent)}
                ${
                  family.children.length
                    ? `<div class="child-twigs">${family.children
                        .map(([name, relationship]) =>
                          labeledPersonHtml(name, relationship),
                        )
                        .join("")}</div>`
                    : `<div class="no-descendants">No children listed</div>`
                }
              </div>`,
            )
            .join("")}</div>
        </article>`;
      })
      .join("")}</div>
  </section>`;
}

function branchHtml(node, depth = 0) {
  const open = depth < 2 || isDirect(node);
  const children = visibleChildren(node);
  const files = associatedFiles(node);
  node._documentFiles = files.filter((file) => !node.files.includes(file));
  node.children = children;
  return `<li class="branch">
    <div class="branch-row ${selectedNode?.id === node.id ? "selected" : ""} ${isDirect(node) ? "direct" : ""}">
      ${node.children.length ? `<button class="toggle" data-toggle="${escapeHtml(node.id)}">${open ? "−" : "+"}</button>` : `<span class="toggle-spacer"></span>`}
      <button class="person-button" data-person="${escapeHtml(node.id)}">
        <span>${escapeHtml(node.name)}</span>
        ${hasContent(node) ? `<small>${files.length ? `${files.length} record${files.length === 1 ? "" : "s"}` : "details"}</small>` : ""}
      </button>
    </div>
    ${children.length ? `<ul data-children="${escapeHtml(node.id)}" ${open ? "" : "hidden"}>${children.map((child) => branchHtml(child, depth + 1)).join("")}</ul>` : ""}
  </li>`;
}

function noteHtml(note) {
  return `<section class="note"><h3>${escapeHtml(note.title)}</h3>${cleanText(
    note.text,
  )
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) =>
      line.startsWith("http")
        ? `<a href="${escapeHtml(line)}" target="_blank" rel="noreferrer">Open evidence link</a>`
        : `<p>${escapeHtml(line.replace(/^-\s*/, ""))}</p>`,
    )
    .join("")}</section>`;
}

function relationshipHtml(node) {
  if (!node.path) return "";
  const generations = node.path
    .split("\\")
    .slice(0, -1)
    .filter((name) => !name.endsWith("Historical Documents"));
  const parentFamily = generations.at(-1);
  const previousGeneration = generations.at(-2);
  if (!parentFamily) return "";
  return `<div class="relationship-path">
    <p><strong>Parent family:</strong> ${escapeHtml(parentFamily)}</p>
    ${previousGeneration ? `<p><strong>Previous generation:</strong> ${escapeHtml(previousGeneration)}</p>` : ""}
  </div>`;
}

function detailHtml(node) {
  const files = associatedFiles(node);
  const notes = researchNotes(node);
  const images = files.filter((file) => file.type === "image");
  const other = files.filter((file) => file.type !== "image");
  return `<article class="detail-card">
    <div class="eyebrow">${isDirect(node) ? "Direct Currie line" : "Family branch"}</div>
    <h2>${escapeHtml(node.name)}</h2>
    ${relationshipHtml(node)}
    ${notes.map(noteHtml).join("")}
    ${
      images.length
        ? `<section><h3>Documents & photographs</h3><div class="document-grid">${images
            .map(
              (
                file,
              ) => `<a class="document" href="${escapeHtml(assetUrl(file.url))}" target="_blank" rel="noreferrer">
        <img src="${escapeHtml(assetUrl(file.url))}" alt="${escapeHtml(file.name)}" loading="lazy">
        <span>${escapeHtml(file.name)}</span></a>`,
            )
            .join("")}</div></section>`
        : ""
    }
    ${
      other.length
        ? `<section><h3>Records & research links</h3><div class="record-list">${other
            .map(
              (
                file,
              ) => `<a href="${escapeHtml(assetUrl(file.url))}" target="_blank" rel="noreferrer">
        <span class="record-icon">${file.type === "source" ? "↗" : "⌑"}</span>
        <span><strong>${escapeHtml(file.name)}</strong><small>${file.type === "source" ? "Open original research source" : "Open document"}</small></span>
      </a>`,
            )
            .join("")}</div></section>`
        : ""
    }
    ${!hasContent(node) ? `<div class="empty-note"><p>No individual document has been added for this person yet.</p>${visibleChildren(node).length ? "<p>Their family members appear beneath this branch in the tree.</p>" : ""}</div>` : ""}
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
      <div class="hero-flourish" aria-hidden="true"><span></span><b>1730s</b><span></span><b>Today</b><span></span></div>
    </div></header>
    ${lineageTreeHtml()}
    ${earlierGenerationsHtml()}
    ${familyBranchesHtml()}
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
  document
    .querySelectorAll(".branch-row")
    .forEach((row) => row.classList.remove("selected"));
  const button = document.querySelector(
    `.person-button[data-person="${CSS.escape(id)}"]`,
  );
  if (button) button.closest(".branch-row").classList.add("selected");
  document.querySelector("#tree-panel").classList.remove("open");
  document.querySelector("#mobile-tree-button").textContent =
    "Browse family branches";
  document
    .querySelector("#details")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

function bindEvents() {
  document
    .querySelectorAll("[data-person]")
    .forEach((button) =>
      button.addEventListener("click", () => choose(button.dataset.person)),
    );
  document.querySelectorAll("[data-toggle]").forEach((button) =>
    button.addEventListener("click", () => {
      const list = document.querySelector(
        `[data-children="${CSS.escape(button.dataset.toggle)}"]`,
      );
      list.hidden = !list.hidden;
      button.textContent = list.hidden ? "+" : "−";
    }),
  );
  const mobileButton = document.querySelector("#mobile-tree-button");
  mobileButton.addEventListener("click", () => {
    const panel = document.querySelector("#tree-panel");
    panel.classList.toggle("open");
    mobileButton.textContent = panel.classList.contains("open")
      ? "Close family branches"
      : "Browse family branches";
  });
  const search = document.querySelector("#family-search");
  const results = document.querySelector("#results");
  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    if (!query) {
      results.hidden = true;
      return;
    }
    const matches = allNodes
      .filter(
        (node) =>
          node.name.toLowerCase().includes(query) ||
          node.info.some((note) => note.text.toLowerCase().includes(query)),
      )
      .slice(0, 30);
    results.innerHTML = matches.length
      ? matches
          .map(
            (node) =>
              `<button data-result="${escapeHtml(node.id)}"><strong>${escapeHtml(node.name)}</strong><small>${escapeHtml(node.path.split("\\").slice(-2, -1)[0] || "Family archive")}</small></button>`,
          )
          .join("")
      : "<p>No matching family member found.</p>";
    results.hidden = false;
    results.querySelectorAll("[data-result]").forEach((button) =>
      button.addEventListener("click", () => {
        search.value = "";
        results.hidden = true;
        choose(button.dataset.result);
      }),
    );
  });
}

fetch("family-data.json?version=20260728-4")
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
    document.querySelector("#app").innerHTML =
      "<p>The family archive could not be opened. Please try the link again.</p>";
  });

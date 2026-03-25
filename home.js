import { voices } from "./content/voices.js";
import { galleryItems } from "./content/gallery.js";

const LOCAL_GALLERY_KEY = "sokolgora.gallery.local.v1";
const ADMIN_MODE_KEY = "sokolgora.gallery.adminMode.v1";
const DIALOGUE_EMAIL = "sokolgora@gmail.com";

const circleHost = document.getElementById("voice-links");
const voiceGridHost = document.getElementById("voice-grid");

const galleryGridHost = document.getElementById("gallery-grid");
const galleryEmptyHost = document.getElementById("gallery-empty");
const gallerySearchInput = document.getElementById("gallery-search");

const gallerySourceButtons = Array.from(document.querySelectorAll("[data-gallery-filter]"));
const gallerySeriesHost = document.getElementById("gallery-series-filters");

const openPublishButton = document.getElementById("open-publish-panel");
const closePublishButton = document.getElementById("close-publish-panel");
const exportLocalButton = document.getElementById("export-local-gallery");
const adminToggleButton = document.getElementById("admin-mode-toggle");

const publishModal = document.getElementById("gallery-publish-modal");
const publishForm = document.getElementById("gallery-publish-form");
const publishStatus = document.getElementById("gallery-publish-status");
const publishPanelTitle = document.getElementById("publish-painting-title");
const publishSubmitButton = document.querySelector("#gallery-publish-form .gallery-submit-btn");
const imageFilenameInput = document.getElementById("gallery-image-filename");
const imageFileInput = document.getElementById("gallery-image-file");

const lightbox = document.getElementById("gallery-lightbox");
const lightboxImage = document.getElementById("gallery-lightbox-image");
const lightboxTitle = document.getElementById("gallery-lightbox-title");
const lightboxMeta = document.getElementById("gallery-lightbox-meta");
const lightboxClose = document.getElementById("gallery-lightbox-close");
const lightboxStage = document.getElementById("gallery-lightbox-stage");
const lightboxZoomIn = document.getElementById("gallery-zoom-in");
const lightboxZoomOut = document.getElementById("gallery-zoom-out");
const lightboxZoomReset = document.getElementById("gallery-zoom-reset");

let galleryQuery = "";
let gallerySourceFilter = "all";
let gallerySeriesFilter = "";

let adminMode = localStorage.getItem(ADMIN_MODE_KEY) === "1";
let editingLocalId = null;

let lightboxScale = 1;
let lightboxX = 0;
let lightboxY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSeries(value) {
  return String(value ?? "").trim();
}

function persistAdminMode() {
  localStorage.setItem(ADMIN_MODE_KEY, adminMode ? "1" : "0");
}

function readLocalGallery() {
  try {
    const raw = localStorage.getItem(LOCAL_GALLERY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalGallery(items) {
  localStorage.setItem(LOCAL_GALLERY_KEY, JSON.stringify(items));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

function getAllGalleryItems() {
  const localItems = readLocalGallery().map((item) => ({
    medium: "",
    dimensions: "",
    series: "",
    description: "",
    imageFilename: "",
    imageUrl: "",
    imageDataUrl: "",
    ...item,
    _source: "local",
  }));

  const publishedItems = galleryItems.map((item, index) => ({
    id: item.id || `published-${index + 1}`,
    medium: "",
    dimensions: "",
    series: "",
    description: "",
    imageFilename: "",
    imageUrl: "",
    imageDataUrl: "",
    ...item,
    _source: "published",
  }));

  return [...localItems, ...publishedItems];
}

function getAvailableSeries() {
  const unique = new Set();

  getAllGalleryItems().forEach((item) => {
    const series = normalizeSeries(item.series);
    if (series) unique.add(series);
  });

  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

function getVisibleGalleryItems() {
  const q = galleryQuery.trim().toLowerCase();

  return getAllGalleryItems().filter((item) => {
    if (gallerySourceFilter === "mine" && item._source !== "local") return false;

    const series = normalizeSeries(item.series);
    if (gallerySeriesFilter && series !== gallerySeriesFilter) return false;

    if (!q) return true;

    const haystack = [
      item.title,
      item.year,
      item.type,
      item.medium,
      item.dimensions,
      item.series,
      item.description,
      item.imageFilename,
      item.imageUrl,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

function getImageSrc(item) {
  if (item.imageDataUrl) return item.imageDataUrl;
  if (item.imageUrl && item.imageUrl.trim()) return item.imageUrl.trim();
  if (item.imageFilename && item.imageFilename.trim()) {
    return `./images/gallery/${item.imageFilename.trim()}`;
  }
  return "";
}

function getCardId(item) {
  const base = slugify(`${item.title}-${item.year || ""}`) || item.id || "work";
  return `gallery-${base}`;
}

function getWorkId(item) {
  return `${item._source}:${item.id}`;
}

function getWorkHref(item) {
  return `./work/?work=${encodeURIComponent(getWorkId(item))}`;
}

function buildShareUrl(item) {
  return new URL(getWorkHref(item), window.location.href.split("#")[0]).toString();
}

function applyLightboxTransform() {
  if (!lightboxImage) return;
  lightboxImage.style.transform = `translate(${lightboxX}px, ${lightboxY}px) scale(${lightboxScale})`;
  lightboxImage.style.cursor = lightboxScale > 1 ? "grab" : "default";
}

function resetLightboxZoom() {
  lightboxScale = 1;
  lightboxX = 0;
  lightboxY = 0;
  applyLightboxTransform();
}

function zoomLightbox(nextScale) {
  lightboxScale = Math.max(1, Math.min(5, nextScale));
  if (lightboxScale === 1) {
    lightboxX = 0;
    lightboxY = 0;
  }
  applyLightboxTransform();
}

function openLightbox(item) {
  const imageSrc = getImageSrc(item);
  if (!imageSrc || !lightbox || !lightboxImage || !lightboxTitle || !lightboxMeta) return;

  lightboxImage.src = imageSrc;
  lightboxImage.alt = `${item.title} (${item.year})`;
  lightboxTitle.textContent = item.title || "";
  lightboxMeta.textContent = [item.medium, item.dimensions, item.year, item.type].filter(Boolean).join(" · ");
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  resetLightboxZoom();
}

function closeLightbox() {
  if (!lightbox || !lightboxImage) return;
  lightbox.hidden = true;
  lightboxImage.src = "";
  if (publishModal?.hidden !== false) {
    document.body.style.overflow = "";
  }
  resetLightboxZoom();
}

function setPublishModeCreate() {
  editingLocalId = null;
  publishForm?.reset();
  if (publishPanelTitle) publishPanelTitle.textContent = "Publish Painting";
  if (publishSubmitButton) publishSubmitButton.textContent = "Add to My Gallery";
  if (publishStatus) publishStatus.textContent = "";
}

function setFormValue(name, value) {
  const field = publishForm?.elements?.namedItem(name);
  if (field && "value" in field) {
    field.value = value || "";
  }
}

function openEditLocalItem(id) {
  const item = readLocalGallery().find((entry) => entry.id === id);
  if (!item || !publishModal) return;

  editingLocalId = id;
  if (publishPanelTitle) publishPanelTitle.textContent = "Edit Painting";
  if (publishSubmitButton) publishSubmitButton.textContent = "Save Changes";
  if (publishStatus) publishStatus.textContent = "";

  setFormValue("title", item.title);
  setFormValue("year", item.year);
  setFormValue("type", item.type);
  setFormValue("medium", item.medium);
  setFormValue("dimensions", item.dimensions);
  setFormValue("series", item.series);
  setFormValue("description", item.description);
  setFormValue("imageFilename", item.imageFilename);
  setFormValue("imageUrl", item.imageUrl);

  if (imageFileInput) imageFileInput.value = "";

  publishModal.hidden = false;
  openPublishButton?.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function openPublishModal() {
  if (!adminMode || !publishModal || !openPublishButton) return;
  setPublishModeCreate();
  publishModal.hidden = false;
  openPublishButton.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closePublishModal() {
  if (!publishModal || !openPublishButton) return;
  publishModal.hidden = true;
  openPublishButton.setAttribute("aria-expanded", "false");
  if (lightbox?.hidden !== false) {
    document.body.style.overflow = "";
  }
  setPublishModeCreate();
}

function setActiveSourceButtons() {
  gallerySourceButtons.forEach((button) => {
    const filter = button.dataset.galleryFilter;
    const shouldHide = !adminMode && filter === "mine";
    button.hidden = shouldHide;

    if (!adminMode && gallerySourceFilter === "mine") {
      gallerySourceFilter = "all";
    }

    const active = filter === gallerySourceFilter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function syncAdminUI() {
  if (openPublishButton) {
    openPublishButton.hidden = !adminMode;
  }

  if (adminToggleButton) {
    adminToggleButton.textContent = adminMode ? "Admin On" : "Admin Off";
    adminToggleButton.classList.toggle("is-on", adminMode);
    adminToggleButton.setAttribute("aria-pressed", adminMode ? "true" : "false");
  }

  if (!adminMode && publishModal && !publishModal.hidden) {
    closePublishModal();
  }

  setActiveSourceButtons();
}

function renderSeriesFilters() {
  if (!gallerySeriesHost) return;

  const seriesList = getAvailableSeries();
  gallerySeriesHost.innerHTML = "";

  if (!seriesList.length) {
    gallerySeriesHost.hidden = true;
    gallerySeriesFilter = "";
    return;
  }

  if (gallerySeriesFilter && !seriesList.includes(gallerySeriesFilter)) {
    gallerySeriesFilter = "";
  }

  gallerySeriesHost.hidden = false;

  const allChip = document.createElement("button");
  allChip.type = "button";
  allChip.className = `gallery-series-chip ${gallerySeriesFilter === "" ? "is-active" : ""}`;
  allChip.textContent = "All Series";
  allChip.setAttribute("aria-pressed", gallerySeriesFilter === "" ? "true" : "false");
  allChip.addEventListener("click", () => {
    gallerySeriesFilter = "";
    renderSeriesFilters();
    renderGallery();
  });
  gallerySeriesHost.appendChild(allChip);

  seriesList.forEach((series) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `gallery-series-chip ${gallerySeriesFilter === series ? "is-active" : ""}`;
    chip.textContent = series;
    chip.setAttribute("aria-pressed", gallerySeriesFilter === series ? "true" : "false");
    chip.addEventListener("click", () => {
      gallerySeriesFilter = series;
      renderSeriesFilters();
      renderGallery();
    });
    gallerySeriesHost.appendChild(chip);
  });
}

function renderVoiceLinks() {
  if (!circleHost) return;
  circleHost.innerHTML = "";

  voices.forEach((voice) => {
    const link = document.createElement("a");
    link.className = "voice-link";
    link.href = `./voices/${voice.slug}/`;
    link.textContent = voice.letter;
    link.setAttribute("aria-label", `${voice.letter} — ${voice.title}`);
    link.title = `${voice.letter} — ${voice.title}`;
    link.style.setProperty("--voice", voice.color);
    circleHost.appendChild(link);
  });
}

function renderVoiceGrid() {
  if (!voiceGridHost) return;
  voiceGridHost.innerHTML = "";

  voices.forEach((voice) => {
    const card = document.createElement("article");
    card.className = "voice-card";
    card.style.setProperty("--voice-accent", voice.color);
    card.innerHTML = `
      <div class="voice-card-letter">${voice.letter}</div>
      <h3 class="voice-card-title">${escapeHtml(voice.title)}</h3>
      <p class="voice-card-copy">${escapeHtml(voice.summary)}</p>
      <a class="voice-card-link" href="./voices/${voice.slug}/" aria-label="Read more about ${voice.letter}">
        Read voice
      </a>
    `;
    voiceGridHost.appendChild(card);
  });
}

function buildGalleryCard(item) {
  const card = document.createElement("article");
  card.className = "gallery-card";
  card.id = getCardId(item);

  const media = document.createElement("button");
  media.className = "gallery-media";
  media.type = "button";
  media.setAttribute("aria-label", `Quick view ${item.title}`);

  const imageSrc = getImageSrc(item);

  if (imageSrc) {
    const img = document.createElement("img");
    img.className = "gallery-image";
    img.src = imageSrc;
    img.alt = `${item.title} (${item.year})`;
    img.loading = "lazy";
    img.onerror = () => {
      media.innerHTML = `<div class="gallery-placeholder">Image not found</div>`;
    };
    media.appendChild(img);
  } else {
    media.innerHTML = `<div class="gallery-placeholder">Add image filename or URL</div>`;
  }

  media.addEventListener("click", () => openLightbox(item));

  const metaLine = [item.medium, item.dimensions, item.year, item.type].filter(Boolean).join(" · ");

  const body = document.createElement("div");
  body.className = "gallery-body";
  body.innerHTML = `
    <h3 class="gallery-title">${escapeHtml(item.title)}</h3>
    ${metaLine ? `<p class="gallery-details">${escapeHtml(metaLine)}</p>` : ""}
    ${item.series ? `<p class="gallery-series">Series: ${escapeHtml(item.series)}</p>` : ""}
    ${item.description ? `<p class="gallery-description">${escapeHtml(item.description)}</p>` : ""}
    ${adminMode && item._source === "local" ? `<p class="gallery-source-line">My Gallery</p>` : ""}
  `;

  const actions = document.createElement("div");
  actions.className = "gallery-card-actions";

  const viewLink = document.createElement("a");
  viewLink.className = "gallery-action-link is-primary";
  viewLink.href = getWorkHref(item);
  viewLink.textContent = "View";
  actions.appendChild(viewLink);

  const dialogueLink = document.createElement("a");
  dialogueLink.className = "gallery-action-link";
  dialogueLink.href =
    `mailto:${encodeURIComponent(DIALOGUE_EMAIL)}` +
    `?subject=${encodeURIComponent(`Dialogue about ${item.title}`)}` +
    `&body=${encodeURIComponent(`Hello,\n\nI’m writing about "${item.title}"${item.year ? ` (${item.year})` : ""}.\n\n`)}`;
  dialogueLink.textContent = "Dialogue";
  actions.appendChild(dialogueLink);

  const shareButton = document.createElement("button");
  shareButton.className = "gallery-action-btn";
  shareButton.type = "button";
  shareButton.textContent = "Share";
  shareButton.setAttribute("data-share-url", buildShareUrl(item));
  shareButton.setAttribute("data-share-title", item.title);
  actions.appendChild(shareButton);

  if (adminMode && item._source === "local") {
    const editButton = document.createElement("button");
    editButton.className = "gallery-action-btn";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.setAttribute("data-edit-local-id", item.id);
    actions.appendChild(editButton);

    const upButton = document.createElement("button");
    upButton.className = "gallery-action-btn";
    upButton.type = "button";
    upButton.textContent = "Up";
    upButton.setAttribute("data-move-local-id", item.id);
    upButton.setAttribute("data-move-direction", "up");
    actions.appendChild(upButton);

    const downButton = document.createElement("button");
    downButton.className = "gallery-action-btn";
    downButton.type = "button";
    downButton.textContent = "Down";
    downButton.setAttribute("data-move-local-id", item.id);
    downButton.setAttribute("data-move-direction", "down");
    actions.appendChild(downButton);

    const deleteButton = document.createElement("button");
    deleteButton.className = "gallery-action-btn is-soft";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("data-delete-local-id", item.id);
    actions.appendChild(deleteButton);
  }

  body.appendChild(actions);
  card.appendChild(media);
  card.appendChild(body);

  return card;
}

function renderGallery() {
  if (!galleryGridHost || !galleryEmptyHost) return;

  const items = getVisibleGalleryItems();
  galleryGridHost.innerHTML = "";

  if (!items.length) {
    galleryEmptyHost.hidden = false;
    galleryEmptyHost.textContent = adminMode
      ? 'No paintings yet. Use “Publish Painting” to add your first work.'
      : "No paintings available yet.";
    return;
  }

  galleryEmptyHost.hidden = true;
  items.forEach((item) => galleryGridHost.appendChild(buildGalleryCard(item)));
}

async function handlePublishSubmit(event) {
  event.preventDefault();
  if (!publishForm || !publishStatus) return;

  const formData = new FormData(publishForm);
  const title = String(formData.get("title") || "").trim();
  const year = String(formData.get("year") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const medium = String(formData.get("medium") || "").trim();
  const dimensions = String(formData.get("dimensions") || "").trim();
  const series = String(formData.get("series") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();

  let imageFilename = String(formData.get("imageFilename") || "").trim();
  let imageDataUrl = "";

  const file = imageFileInput?.files?.[0];
  if (file) {
    imageDataUrl = await fileToDataUrl(file);
    if (!imageFilename) imageFilename = file.name;
  }

  if (!title || !year || !type) {
    publishStatus.textContent = "Please fill Title, Year, and Type.";
    return;
  }

  const items = readLocalGallery();
  const existingItem = editingLocalId
    ? items.find((entry) => entry.id === editingLocalId)
    : null;

  if (existingItem && !imageFileInput?.files?.[0]) {
    imageDataUrl = existingItem.imageDataUrl || "";
  }

  const nextItem = {
    id: editingLocalId || `local-${Date.now()}`,
    title,
    year,
    type,
    medium,
    dimensions,
    series,
    description,
    imageFilename,
    imageUrl,
    imageDataUrl,
  };

  if (editingLocalId && existingItem) {
    const index = items.findIndex((entry) => entry.id === editingLocalId);
    if (index !== -1) items[index] = nextItem;
    publishStatus.textContent = "Painting updated.";
  } else {
    items.push(nextItem);
    publishStatus.textContent = "Painting added to My Gallery.";
    gallerySourceFilter = "mine";
  }

  writeLocalGallery(items);

  syncAdminUI();
  renderSeriesFilters();
  renderGallery();
  closePublishModal();
}

function exportLocalGallery() {
  const locals = readLocalGallery();

  if (!locals.length) {
    if (publishStatus) publishStatus.textContent = "No local items to copy yet.";
    return;
  }

  const snippet = locals
    .map((item) => {
      return `{
  title: ${JSON.stringify(item.title)},
  year: ${JSON.stringify(item.year)},
  type: ${JSON.stringify(item.type)},
  medium: ${JSON.stringify(item.medium || "")},
  dimensions: ${JSON.stringify(item.dimensions || "")},
  series: ${JSON.stringify(item.series || "")},
  description: ${JSON.stringify(item.description || "")},
  imageFilename: ${JSON.stringify(item.imageFilename || "")},
  imageUrl: ${JSON.stringify(item.imageUrl || "")}
}`;
    })
    .join(",\n\n");

  navigator.clipboard.writeText(snippet)
    .then(() => {
      if (publishStatus) publishStatus.textContent = "Local gallery JSON copied.";
    })
    .catch(() => {
      if (publishStatus) publishStatus.textContent = "Could not copy JSON.";
    });
}

async function handleShare(button) {
  const url = button.getAttribute("data-share-url") || window.location.href;
  const title = button.getAttribute("data-share-title") || document.title;

  try {
    if (navigator.share) {
      await navigator.share({ title, url });
    } else {
      await navigator.clipboard.writeText(url);
      if (publishStatus) publishStatus.textContent = "Artwork link copied.";
    }
  } catch {
    if (publishStatus) publishStatus.textContent = "Could not share artwork link.";
  }
}

renderVoiceLinks();
renderVoiceGrid();
syncAdminUI();
renderSeriesFilters();
renderGallery();

gallerySearchInput?.addEventListener("input", (event) => {
  galleryQuery = String(event.target.value || "");
  renderGallery();
});

gallerySourceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    gallerySourceFilter = button.dataset.galleryFilter || "all";
    syncAdminUI();
    renderGallery();
  });
});

openPublishButton?.addEventListener("click", openPublishModal);
closePublishButton?.addEventListener("click", closePublishModal);
exportLocalButton?.addEventListener("click", exportLocalGallery);
publishForm?.addEventListener("submit", handlePublishSubmit);

adminToggleButton?.addEventListener("click", () => {
  adminMode = !adminMode;
  persistAdminMode();
  syncAdminUI();
  renderSeriesFilters();
  renderGallery();
});

imageFileInput?.addEventListener("change", () => {
  const file = imageFileInput.files?.[0];
  if (file && imageFilenameInput && !imageFilenameInput.value.trim()) {
    imageFilenameInput.value = file.name;
  }
});

galleryGridHost?.addEventListener("click", async (event) => {
  const shareButton = event.target.closest("[data-share-url]");
  if (shareButton) {
    await handleShare(shareButton);
    return;
  }

  const editButton = event.target.closest("[data-edit-local-id]");
  if (editButton) {
    const id = editButton.getAttribute("data-edit-local-id");
    if (id) openEditLocalItem(id);
    return;
  }

  const moveButton = event.target.closest("[data-move-local-id]");
  if (moveButton) {
    const id = moveButton.getAttribute("data-move-local-id");
    const direction = moveButton.getAttribute("data-move-direction");
    const items = readLocalGallery();
    const index = items.findIndex((item) => item.id === id);

    if (index !== -1) {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < items.length) {
        const temp = items[index];
        items[index] = items[targetIndex];
        items[targetIndex] = temp;
        writeLocalGallery(items);
        if (publishStatus) publishStatus.textContent = "Gallery order updated.";
        renderSeriesFilters();
        renderGallery();
      }
    }
    return;
  }

  const deleteButton = event.target.closest("[data-delete-local-id]");
  if (deleteButton) {
    const id = deleteButton.getAttribute("data-delete-local-id");
    const next = readLocalGallery().filter((item) => item.id !== id);
    writeLocalGallery(next);
    if (publishStatus) publishStatus.textContent = "Local item removed.";
    renderSeriesFilters();
    renderGallery();
  }
});

lightboxZoomIn?.addEventListener("click", () => zoomLightbox(lightboxScale + 0.25));
lightboxZoomOut?.addEventListener("click", () => zoomLightbox(lightboxScale - 0.25));
lightboxZoomReset?.addEventListener("click", resetLightboxZoom);
lightboxClose?.addEventListener("click", closeLightbox);

lightboxStage?.addEventListener("wheel", (event) => {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -0.2 : 0.2;
  zoomLightbox(lightboxScale + delta);
}, { passive: false });

lightboxImage?.addEventListener("mousedown", (event) => {
  if (lightboxScale <= 1) return;
  isDragging = true;
  dragStartX = event.clientX - lightboxX;
  dragStartY = event.clientY - lightboxY;
  lightboxImage.style.cursor = "grabbing";
});

window.addEventListener("mousemove", (event) => {
  if (!isDragging || !lightboxImage) return;
  lightboxX = event.clientX - dragStartX;
  lightboxY = event.clientY - dragStartY;
  applyLightboxTransform();
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  if (lightboxImage) {
    lightboxImage.style.cursor = lightboxScale > 1 ? "grab" : "default";
  }
});

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

publishModal?.addEventListener("click", (event) => {
  if (event.target === publishModal) closePublishModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox && !lightbox.hidden) {
    closeLightbox();
    return;
  }

  if (event.key === "Escape" && publishModal && !publishModal.hidden) {
    closePublishModal();
  }
});

import { voices } from "./content/voices.js";
import { galleryItems } from "./content/gallery.js";

const LOCAL_GALLERY_KEY = "sokolgora.gallery.local.v1";
const DIALOGUE_EMAIL = "sokolgora@gmail.com";

const circleHost = document.getElementById("voice-links");
const voiceGridHost = document.getElementById("voice-grid");

const galleryGridHost = document.getElementById("gallery-grid");
const galleryEmptyHost = document.getElementById("gallery-empty");
const gallerySearchInput = document.getElementById("gallery-search");
const galleryFilterButtons = Array.from(document.querySelectorAll("[data-gallery-filter]"));

const openPublishButton = document.getElementById("open-publish-panel");
const closePublishButton = document.getElementById("close-publish-panel");
const exportLocalButton = document.getElementById("export-local-gallery");

const publishModal = document.getElementById("gallery-publish-modal");
const publishForm = document.getElementById("gallery-publish-form");
const publishStatus = document.getElementById("gallery-publish-status");
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
let galleryFilter = "all";

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

function getVisibleGalleryItems() {
  const q = galleryQuery.trim().toLowerCase();

  return getAllGalleryItems().filter((item) => {
    if (galleryFilter === "mine" && item._source !== "local") return false;

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

function buildShareUrl(item) {
  const url = new URL(window.location.href);
  url.hash = getCardId(item);
  return url.toString();
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

function openPublishModal() {
  if (!publishModal || !openPublishButton) return;
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
}

function setActiveFilterButton() {
  galleryFilterButtons.forEach((button) => {
    const active = button.dataset.galleryFilter === galleryFilter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
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
  media.setAttribute("aria-label", `Open ${item.title}`);

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
    ${item._source === "local" ? `<p class="gallery-source-line">My Gallery</p>` : ""}
  `;

  const actions = document.createElement("div");
  actions.className = "gallery-card-actions";

  if (imageSrc) {
    const viewButton = document.createElement("button");
    viewButton.className = "gallery-action-link is-primary";
    viewButton.type = "button";
    viewButton.textContent = "View";
    viewButton.addEventListener("click", () => openLightbox(item));
    actions.appendChild(viewButton);
  }

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

  if (item._source === "local") {
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

  if (items.length === 0) {
    galleryEmptyHost.hidden = false;
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

  const nextItem = {
    id: `local-${Date.now()}`,
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

  const items = readLocalGallery();
  items.unshift(nextItem);
  writeLocalGallery(items);

  publishForm.reset();
  publishStatus.textContent = "Painting added to My Gallery.";
  galleryFilter = "mine";
  setActiveFilterButton();
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
setActiveFilterButton();
renderGallery();

gallerySearchInput?.addEventListener("input", (event) => {
  galleryQuery = String(event.target.value || "");
  renderGallery();
});

galleryFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    galleryFilter = button.dataset.galleryFilter || "all";
    setActiveFilterButton();
    renderGallery();
  });
});

openPublishButton?.addEventListener("click", openPublishModal);
closePublishButton?.addEventListener("click", closePublishModal);
exportLocalButton?.addEventListener("click", exportLocalGallery);
publishForm?.addEventListener("submit", handlePublishSubmit);

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

  const deleteButton = event.target.closest("[data-delete-local-id]");
  if (deleteButton) {
    const id = deleteButton.getAttribute("data-delete-local-id");
    const next = readLocalGallery().filter((item) => item.id !== id);
    writeLocalGallery(next);
    if (publishStatus) publishStatus.textContent = "Local item removed.";
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

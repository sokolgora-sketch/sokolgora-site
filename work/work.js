import { galleryItems } from "../content/gallery.js";

const LOCAL_GALLERY_KEY = "sokolgora.gallery.local.v1";
const DIALOGUE_EMAIL = "sokolgora@gmail.com";

const page = document.getElementById("work-page");
const empty = document.getElementById("work-empty");
const image = document.getElementById("work-image");
const title = document.getElementById("work-title");
const meta = document.getElementById("work-meta");
const series = document.getElementById("work-series");
const description = document.getElementById("work-description");
const openImage = document.getElementById("work-open-image");
const dialogue = document.getElementById("work-dialogue");
const share = document.getElementById("work-share");
const prevLink = document.getElementById("work-prev");
const nextLink = document.getElementById("work-next");

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

function getWorkId(item) {
  return `${item._source}:${item.id}`;
}

function getWorkHref(item) {
  return `./?work=${encodeURIComponent(getWorkId(item))}`;
}

function getImageSrc(item) {
  if (item.imageDataUrl) return item.imageDataUrl;
  if (item.imageUrl && item.imageUrl.trim()) return item.imageUrl.trim();
  if (item.imageFilename && item.imageFilename.trim()) {
    return `../images/gallery/${item.imageFilename.trim()}`;
  }
  return "";
}

function showNotFound() {
  page.hidden = true;
  empty.hidden = false;
  document.title = "Work not found | Sokol Gora";
}

function renderWork(item, items, index) {
  const imageSrc = getImageSrc(item);
  const metaLine = [item.medium, item.dimensions, item.year, item.type].filter(Boolean).join(" · ");

  document.title = `${item.title} | Sokol Gora`;

  title.textContent = item.title || "";
  meta.textContent = metaLine || "";
  image.src = imageSrc;
  image.alt = `${item.title} (${item.year || ""})`;

  openImage.href = imageSrc || "#";

  if (item.series) {
    series.hidden = false;
    series.textContent = `Series: ${item.series}`;
  } else {
    series.hidden = true;
    series.textContent = "";
  }

  if (item.description) {
    description.hidden = false;
    description.textContent = item.description;
  } else {
    description.hidden = true;
    description.textContent = "";
  }

  dialogue.href =
    `mailto:${encodeURIComponent(DIALOGUE_EMAIL)}` +
    `?subject=${encodeURIComponent(`Dialogue about ${item.title}`)}` +
    `&body=${encodeURIComponent(`Hello,\n\nI’m writing about "${item.title}"${item.year ? ` (${item.year})` : ""}.\n\n`)}`;

  share.addEventListener("click", async () => {
    const url = window.location.href;
    const shareTitle = item.title || document.title;

    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url });
      } else {
        await navigator.clipboard.writeText(url);
        share.textContent = "Link Copied";
        window.setTimeout(() => {
          share.textContent = "Share";
        }, 1200);
      }
    } catch {
      // do nothing
    }
  });

  const prevItem = index > 0 ? items[index - 1] : null;
  const nextItem = index < items.length - 1 ? items[index + 1] : null;

  if (prevItem) {
    prevLink.hidden = false;
    prevLink.href = getWorkHref(prevItem);
    prevLink.textContent = `Previous: ${prevItem.title}`;
  } else {
    prevLink.hidden = true;
  }

  if (nextItem) {
    nextLink.hidden = false;
    nextLink.href = getWorkHref(nextItem);
    nextLink.textContent = `Next: ${nextItem.title}`;
  } else {
    nextLink.hidden = true;
  }

  empty.hidden = true;
  page.hidden = false;
}

const params = new URLSearchParams(window.location.search);
const workId = params.get("work");

if (!workId) {
  showNotFound();
} else {
  const items = getAllGalleryItems();
  const index = items.findIndex((item) => getWorkId(item) === workId);

  if (index === -1) {
    showNotFound();
  } else {
    renderWork(items[index], items, index);
  }
}

import { voicesBySlug } from "/content/voices.js";

const root = document.getElementById("voice-page");

if (root) {
  const slug = root.dataset.voiceSlug;
  const voice = voicesBySlug[slug];

  if (voice) {
    document.title = `${voice.letter} — ${voice.title} | Sokol Gora`;
    root.style.setProperty("--voice-color", voice.color);

    const letter = root.querySelector('[data-field="letter"]');
    const title = root.querySelector('[data-field="title"]');
    const subtitle = root.querySelector('[data-field="subtitle"]');
    const body = root.querySelector('[data-field="body"]');
    const footer = root.querySelector('[data-field="footer"]');

    if (letter) letter.textContent = voice.letter;
    if (title) title.textContent = voice.title;
    if (subtitle) subtitle.textContent = voice.subtitle;
    if (body) body.textContent = voice.body;
    if (footer) footer.textContent = voice.footerLabel;
  } else {
    root.innerHTML = `
      <a class="back-link" href="/">← Home</a>
      <p class="voice-not-found">Voice entry not found.</p>
    `;
  }
}

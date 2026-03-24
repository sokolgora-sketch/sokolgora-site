import { voices } from "./content/voices.js";

const circleHost = document.getElementById("voice-links");
const gridHost = document.getElementById("voice-grid");

if (circleHost) {
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

if (gridHost) {
  voices.forEach((voice) => {
    const card = document.createElement("article");
    card.className = "voice-card";
    card.style.setProperty("--voice-accent", voice.color);
    card.innerHTML = `
      <div class="voice-card-letter">${voice.letter}</div>
      <h3 class="voice-card-title">${voice.title}</h3>
      <p class="voice-card-copy">${voice.summary}</p>
      <a class="voice-card-link" href="./voices/${voice.slug}/" aria-label="Read more about ${voice.letter}">
        Read voice
      </a>
    `;
    gridHost.appendChild(card);
  });
}

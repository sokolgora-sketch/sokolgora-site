import { voices } from "./content/voices.js";

const host = document.getElementById("voice-links");

if (host) {
  voices.forEach((voice) => {
    const link = document.createElement("a");
    link.className = "voice-link";
    link.href = `./voices/${voice.slug}/`;
    link.textContent = voice.letter;
    link.setAttribute("aria-label", `${voice.letter} — ${voice.title}`);
    link.style.setProperty("--voice", voice.color);
    host.appendChild(link);
  });
}

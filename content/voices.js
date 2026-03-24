export const voices = [
  {
    slug: "a",
    letter: "A",
    title: "The First Opening",
    subtitle: "A is the first cry of existence.",
    summary: "The first cry of existence, the beginning that breaks silence.",
    color: "#ef4444",
    footerLabel: "VOICE OF BEGINNING",
    body:
      "A is the beginning. It is the first opening of the mouth, the first breath that breaks silence, the first force that announces life. In my work, A stands for origin, fire, courage, and emergence. It is the voice that enters without hesitation and makes space for everything that follows. A carries the energy of arrival: the first spark, the first gesture, the first mark on an empty surface. It is direct, warm, and alive. Before form becomes refined, before thought becomes language, there is A — the sound of life declaring itself.",
  },
  {
    slug: "e",
    letter: "E",
    title: "Expansion",
    subtitle: "E is the voice that stretches the world outward.",
    summary: "The force that stretches inner impulse into visible form.",
    color: "#f97316",
    footerLabel: "VOICE OF EXPANSION",
    body:
      "If A begins, E expands. It is the movement from seed to horizon, from inner impulse to visible form. E carries the energy of growth, connection, and transformation. In my artistic and linguistic world, E is the voice that opens paths and builds relation between things that were once separate. It is not only movement, but meaningful movement — the unfolding of what was hidden inside the beginning. E holds warmth, rhythm, and development. It reminds me that creation is never a single act. It continues by widening, reaching, and becoming more than it first appeared to be.",
  },
  {
    slug: "i",
    letter: "I",
    title: "Illumination",
    subtitle: "I is the line of light that brings clarity.",
    summary: "The line of light that brings clarity, focus, and understanding.",
    color: "#eab308",
    footerLabel: "VOICE OF ILLUMINATION",
    body:
      "I is the voice of light, attention, and understanding. Where A begins and E expands, I reveals. It sharpens perception and gives direction to thought. In the symbolic structure behind my work, I is linked to clarity, insight, precision, and the disciplined search for meaning. It is a bright and focused force — not loud, but exact. I helps us notice what is true, what is hidden, and what deserves to be seen clearly. It turns feeling into awareness and movement into understanding. I is the light within language, the narrow beam that allows knowledge to take form.",
  },
  {
    slug: "o",
    letter: "O",
    title: "The Mediator",
    subtitle: "O is the fourth voice — the center, the circle, the balance.",
    summary: "The fourth voice, the circle of balance that holds the others together.",
    color: "#22c55e",
    footerLabel: "VOICE OF BALANCE",
    body:
      "O holds the voices together. It is the green mediator, the fourth voice, and the balance point between opposing forces. In Udha e Zërave, O is the circle that contains without imprisoning, the form that stabilizes without controlling. It is the nest of the Source, the resting place of harmony, and the structure that prevents creation from collapsing into chaos. O does not rush forward like the first impulse, and it does not disappear into distance. It remains centered. In my work, O represents continuity, breathing space, and the intelligence of balance. It is the quiet form that allows all other voices to exist together.",
  },
  {
    slug: "u",
    letter: "U",
    title: "Depth",
    subtitle: "U is the voice of depth, support, and living foundation.",
    summary: "The foundation below form, the quiet support that sustains life.",
    color: "#3b82f6",
    footerLabel: "VOICE OF DEPTH",
    body:
      "U is the voice that holds from below. It moves like water, roots like earth, and supports what rises above it. In my symbolic language, U stands for depth, belonging, nourishment, and quiet endurance. It does not seek attention, yet everything depends on it. U gives weight to beauty and foundation to growth. It reminds me that not all strength is visible. Some strength is silent, patient, and sustaining. U is the force that allows life to continue without spectacle. It is the deep rhythm beneath expression, the support beneath form, and the steady presence that keeps creation alive.",
  },
  {
    slug: "y",
    letter: "Y",
    title: "Mystery",
    subtitle: "Y is the voice of choice, mystery, and the road not yet known.",
    summary: "The threshold of choice, possibility, and the unknown path.",
    color: "#4f46e5",
    footerLabel: "VOICE OF MYSTERY",
    body:
      "Y lives at the edge of certainty. It is the voice of mystery, imagination, decision, and possibility. In the Seven Voices, Y carries the feeling of standing between paths, sensing that more than one future is possible. It is not confusion, but openness. It invites exploration without demanding immediate conclusion. In my work, Y represents vision, experimentation, and the courage to move toward what has not yet been fully named. It belongs to the threshold — the place where instinct, doubt, wonder, and discovery meet. Y asks us to remain awake in uncertainty and to treat the unknown not as emptiness, but as potential.",
  },
  {
    slug: "e-umlaut",
    letter: "Ë",
    title: "Return",
    subtitle: "Ë is the voice of tenderness, memory, and sacred return.",
    summary: "The voice of tenderness, memory, healing, and reconciliation.",
    color: "#c026d3",
    footerLabel: "VOICE OF RETURN",
    body:
      "Ë is the voice of emotional depth, care, and reconciliation. If A is the first cry, Ë is the answering presence that gives that cry meaning. In my work, Ë carries memory, tenderness, healing, and completion. It does not erase pain, but transforms it into understanding. It gathers what has been scattered and brings harmony after rupture. Ë is gentle, but not weak. It is the force that returns us to what is essential: feeling, connection, and inner truth. Within the Seven Voices, Ë is the quiet chamber of return — the place where what was broken can be gathered again and held with care.",
  },
];

export const voicesBySlug = Object.fromEntries(
  voices.map((voice) => [voice.slug, voice])
);

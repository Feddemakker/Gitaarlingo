// =====================================================================
//  Gitaarlingo – het "brein" van de app
//  Regels die beginnen met // zijn uitleg; de computer slaat ze over.
// =====================================================================


// ---------- 1. De zes snaren ----------
// Van dik (laag) naar dun (hoog), zoals in standaardstemming.
// freq = hoe snel de snaar trilt (Hertz). Hoger getal = hogere toon.
// kleurnaam en plek gebruikt de "leraar-stem" om de snaar aan te wijzen.
// Houd je de gitaar gewoon vast, dan zit de dikste snaar het dichtst bij je gezicht.
const SNAREN = [
  { naam: "E", freq: 82.41,  kleur: "#ff1f4b", dikte: 34, kleurnaam: "rode",   plek: "de dikste" },
  { naam: "A", freq: 110.00, kleur: "#ff8a00", dikte: 29, kleurnaam: "oranje", plek: "de tweede" },
  { naam: "D", freq: 146.83, kleur: "#ffd000", dikte: 25, kleurnaam: "gele",   plek: "de derde" },
  { naam: "G", freq: 196.00, kleur: "#00c853", dikte: 21, kleurnaam: "groene", plek: "de vierde" },
  { naam: "B", freq: 246.94, kleur: "#2979ff", dikte: 17, kleurnaam: "blauwe", plek: "de vijfde" },
  { naam: "e", freq: 329.63, kleur: "#b620e0", dikte: 14, kleurnaam: "paarse", plek: "de dunste" },
];

// De twee spelers met hun eigen gitaar. Ze spelen om de beurt.
const SPELERS = [
  { emoji: "🧑", naam: "Grote gitaar" },
  { emoji: "👧", naam: "Kleine gitaar" },
];

// Alle snaren los (zonder vingers) samen = een vrolijke strum
const LOSSE_SNAREN = SNAREN.map(s => s.freq);

// Twee akkoorden die maar één toon verschillen (de G-snaar):
//  E  = blij   (G-snaar op de 1e fret: G#)
//  Em = sip    (G-snaar los: G)
const AKKOORDEN = {
  blij: [82.41, 123.47, 164.81, 207.65, 246.94, 329.63], // E
  sip:  [82.41, 123.47, 164.81, 196.00, 246.94, 329.63], // Em
};

// Alle eilanden op een rij. Per eiland:
//  scherm     = de id van het scherm in index.html (null = komt nog)
//  start      = wat er gebeurt als je het eiland opent
//  luister    = wat de 🔊-knop laat horen
//  opdrachten = hoeveel opdrachtjes goed voor een ster
const EILANDEN = [
  { scherm: "stemhut",   start: () => startStemhut(),
    luister: () => speelToon(SNAREN[stemSnaar].freq) },
  { scherm: "regenboog", start: () => startRegenboog(), opdrachten: 4,
    luister: () => speelToon(SNAREN[doelSnaar].freq) },
  { scherm: "palm",      start: () => nieuwePalmOpdracht(), opdrachten: 3,
    luister: () => { if (!wachten) speelPalmVoorbeeld(); } },
  { scherm: "kasteel",   start: () => nieuweKasteelOpdracht(), opdrachten: 3,
    luister: () => speelAkkoord(AKKOORDEN[kasteelDoel]) },
  { scherm: null }, // 🎵 Liedjesstrand: bouwen we later
];


// ---------- 2. Voortgang onthouden ----------
// We bewaren alleen op dit apparaat (localStorage). Niets gaat naar internet.
function laadVoortgang() {
  try {
    // "-v2": het nieuwe pad met 5 eilanden begint met een schone lei
    const opgeslagen = JSON.parse(localStorage.getItem("gitaarlingo-v2"));
    if (opgeslagen) return opgeslagen;
  } catch (e) { /* lukt het niet, dan beginnen we gewoon opnieuw */ }
  return { open: 1, klaar: [] }; // open = hoeveel eilanden open zijn
}

function bewaarVoortgang() {
  try {
    localStorage.setItem("gitaarlingo-v2", JSON.stringify(voortgang));
  } catch (e) { /* geen ramp: dan onthouden we het alleen nu even */ }
}

let voortgang = laadVoortgang();


// ---------- 3. Geluid maken ----------
// De browser heeft een ingebouwde "geluidsmachine" (Web Audio).
// Die mag pas starten nadat iemand ergens op tikt.
let geluid = null;

function geluidsmachine() {
  if (!geluid) geluid = new (window.AudioContext || window.webkitAudioContext)();
  if (geluid.state === "suspended") geluid.resume();
  return geluid;
}

// Speel één getokkelde snaar: hard begin, daarna langzaam zachter.
// sterkte = hoe hard (0 tot 1)
function speelToon(freq, duur = 2.0, sterkte = 0.5) {
  const ctx = geluidsmachine();
  const nu = ctx.currentTime;
  stilVoor(duur * 1000); // de microfoon mag de app zelf niet horen

  // Volumeknop die we laten wegsterven
  const volume = ctx.createGain();
  volume.gain.setValueAtTime(0.0001, nu);
  volume.gain.exponentialRampToValueAtTime(sterkte, nu + 0.01); // tok!
  volume.gain.exponentialRampToValueAtTime(0.0001, nu + duur);  // uitsterven

  // Filter maakt de klank zachter en warmer, net als een echte snaar
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(freq * 8, nu);
  filter.frequency.exponentialRampToValueAtTime(freq * 2, nu + 0.5);

  // Een paar trillingen samen: de grondtoon en zachtere boventonen
  [[1, "triangle", 1], [2, "sine", 0.4], [3, "sine", 0.15]].forEach(([keer, vorm, kracht]) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = vorm;
    osc.frequency.value = freq * keer;
    g.gain.value = kracht;
    osc.connect(g).connect(filter);
    osc.start(nu);
    osc.stop(nu + duur);
  });

  filter.connect(volume).connect(ctx.destination);
}

// Speel een akkoord: alle tonen vlak na elkaar, zoals een strum met je duim
function speelAkkoord(tonen) {
  tonen.forEach((freq, i) => setTimeout(() => speelToon(freq, 2.5, 0.18), i * 30));
}

// Vrolijk deuntje bij een goed antwoord
function speelJippie() {
  [523, 659, 784].forEach((f, i) => setTimeout(() => speelToon(f, 0.5), i * 110));
}

// Zacht "boing" bij een fout (niet eng, gewoon "probeer nog eens")
function speelBoing() {
  const ctx = geluidsmachine();
  const nu = ctx.currentTime;
  stilVoor(500);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(300, nu);
  osc.frequency.exponentialRampToValueAtTime(150, nu + 0.3);
  g.gain.setValueAtTime(0.25, nu);
  g.gain.exponentialRampToValueAtTime(0.0001, nu + 0.35);
  osc.connect(g).connect(ctx.destination);
  osc.start(nu);
  osc.stop(nu + 0.4);
}


// ---------- 3b. De leraar praat ----------
// De browser heeft een ingebouwde voorleesstem. We kiezen een Nederlandse.
function zeg(tekst) {
  if (!window.speechSynthesis) return; // deze browser kan niet praten
  speechSynthesis.cancel();            // stop wat er nog gezegd werd
  const zin = new SpeechSynthesisUtterance(tekst);
  zin.lang = "nl-NL";
  // Liefst een Nederlandse stem die óp de computer zelf werkt (localService),
  // zodat er geen tekst naar internet gaat.
  const stemmen = speechSynthesis.getVoices().filter(s => s.lang.toLowerCase().startsWith("nl"));
  const stem = stemmen.find(s => s.localService) || stemmen[0];
  if (stem) zin.voice = stem;
  zin.rate = 0.95;  // iets rustiger praten
  zin.pitch = 1.1;  // iets vrolijker
  speechSynthesis.speak(zin);
}

function stopPraten() {
  if (window.speechSynthesis) speechSynthesis.cancel();
}


// ---------- 4. Schermen wisselen en kleine hulpjes ----------
function toonScherm(id) {
  document.querySelectorAll(".scherm").forEach(s => s.classList.remove("actief"));
  document.getElementById(id).classList.add("actief");
}

// Start een animatie (opnieuw), ook als hij net al liep
function animeer(element, naam) {
  element.classList.remove(naam);
  void element.offsetWidth; // trucje: de browser "vergeet" de oude animatie
  element.classList.add(naam);
}

// Korte melding in beeld
function toonMelding(tekst) {
  const m = document.createElement("div");
  m.textContent = tekst;
  m.style.cssText = "position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);" +
    "background:#fff;padding:20px 40px;border-radius:30px;font-size:2.5rem;" +
    "box-shadow:0 8px 0 rgba(0,0,0,.2);z-index:20";
  document.body.appendChild(m);
  setTimeout(() => m.remove(), 1500);
}


// ---------- 5. De kaart ----------
const eilandKnoppen = document.querySelectorAll(".eiland");
const poppetje = document.getElementById("poppetje");

// Zet de eilanden op open/dicht/klaar en het poppetje op de goede plek
function tekenKaart() {
  eilandKnoppen.forEach((knop, nr) => {
    knop.classList.toggle("open", nr < voortgang.open);
    knop.classList.toggle("dicht", nr >= voortgang.open);
    knop.classList.toggle("klaar", voortgang.klaar.includes(nr));
  });
  document.getElementById("aantal-sterren").textContent = voortgang.klaar.length;
  zetPoppetje(voortgang.open - 1);
}

// Poppetje staat bij het eiland met nummer nr
function zetPoppetje(nr) {
  const eiland = eilandKnoppen[nr];
  poppetje.style.left = eiland.style.left;
  poppetje.style.top = eiland.style.top;
}

// Poppetje huppelt naar een nieuw eiland
function loopNaar(nr) {
  poppetje.classList.add("loopt");
  zetPoppetje(nr);
  setTimeout(() => {
    poppetje.classList.remove("loopt");
    tekenKaart(); // nu pas gaat het nieuwe eiland zichtbaar open
    speelJippie();
  }, 1500);
}

// Wat gebeurt er als je op een eiland tikt?
eilandKnoppen.forEach((knop, nr) => {
  knop.addEventListener("click", () => {
    geluidsmachine(); // geluid "wakker maken" bij de eerste tik
    if (nr >= voortgang.open) {
      speelBoing(); // dit eiland is nog dicht
      return;
    }
    startEiland(nr);
  });
});

// Knop om opnieuw te beginnen (vraagt eerst even of je het zeker weet)
document.getElementById("opnieuw").addEventListener("click", () => {
  if (confirm("Opnieuw beginnen?")) {
    voortgang = { open: 1, klaar: [] };
    bewaarVoortgang();
    tekenKaart();
  }
});


// ---------- 6. Regels die voor ALLE eilanden gelden ----------
let huidigEiland = null; // op welk eiland ben je nu (0, 1 of 2)
let goed = 0;            // hoeveel opdrachtjes al goed
let wachten = false;     // even niet tikken tijdens het "goed!"-moment

function startEiland(nr) {
  const eiland = EILANDEN[nr];
  if (!eiland.scherm) {          // dit eiland bestaat nog niet
    toonMelding("🚧 Binnenkort!");
    return;
  }
  huidigEiland = nr;
  goed = 0;
  wachten = false;
  toonScherm(eiland.scherm);
  tekenBollen();
  eiland.start();
}

// De bolletjes bovenin het scherm van het huidige eiland bijwerken
function tekenBollen() {
  const eiland = EILANDEN[huidigEiland];
  const vak = document.querySelector(`#${eiland.scherm} .voortgang`);
  if (!vak) return; // dit eiland heeft geen bolletjes

  // Nog niet genoeg bolletjes? Maak ze aan.
  if (vak.children.length !== eiland.opdrachten) {
    vak.innerHTML = "";
    for (let i = 0; i < eiland.opdrachten; i++) {
      const bol = document.createElement("span");
      bol.className = "bol";
      vak.appendChild(bol);
    }
  }
  [...vak.children].forEach((bol, i) => bol.classList.toggle("vol", i < goed));
}

// Laat zien wie er aan de beurt is (in het huidige scherm)
function toonBeurt(speler) {
  const vak = document.querySelector(`#${EILANDEN[huidigEiland].scherm} .beurt`);
  vak.textContent = `${SPELERS[speler].emoji} ${SPELERS[speler].naam}`;
}

// Zet de microfoon aan. Lukt dat niet, dan zie je uitleg hoe je het oplost.
async function zetMicrofoonAan() {
  const gelukt = await startMicrofoon();
  if (!gelukt) document.getElementById("mic-fout").classList.remove("verborgen");
  return gelukt;
}

document.getElementById("mic-terug").addEventListener("click", () => {
  document.getElementById("mic-fout").classList.add("verborgen");
  gaTerugNaarKaart();
});

// Een opdrachtje is goed! Daarna: volgende opdracht, of een ster.
function opdrachtGoed(volgendeOpdracht) {
  goed++;
  tekenBollen();
  wachten = true;
  setTimeout(speelJippie, 400);
  setTimeout(() => {
    wachten = false;
    if (goed >= EILANDEN[huidigEiland].opdrachten) {
      verdienSter(huidigEiland);
    } else {
      volgendeOpdracht();
    }
  }, 1300);
}

// Niet goed: iets schudt "nee" en je mag het nog eens proberen
function opdrachtFout(element) {
  animeer(element, "fout");
  setTimeout(speelBoing, 250);
}

// Alle terug-knoppen: stop wat er nog speelt en ga naar de kaart
function gaTerugNaarKaart() {
  stopPalm();
  stopPraten();
  luisterNaar(null); // de microfoon hoeft niet meer te luisteren
  toonScherm("kaart");
}

document.querySelectorAll(".terug-knop").forEach(knop => {
  knop.addEventListener("click", gaTerugNaarKaart);
});


// ---------- 7. Hulpjes voor het luisteren naar de echte gitaar ----------
// Hoeveel "centen" zit toon a naast toon b? 100 centen = 1 halve toon.
function centen(a, b) {
  return 1200 * Math.log2(a / b);
}

// Welke losse snaar is dit? Geeft 0 t/m 5 terug, of null als het geen snaar is.
function welkeSnaar(freq) {
  let beste = null;
  let kleinsteAfstand = 200; // verder dan 2 halve tonen weg = geen snaar
  SNAREN.forEach((snaar, nr) => {
    const afstand = Math.abs(centen(freq, snaar.freq));
    if (afstand < kleinsteAfstand) {
      kleinsteAfstand = afstand;
      beste = nr;
    }
  });
  return beste;
}

// Het middelste getal uit een rijtje (handig: één rare meting telt dan niet)
function mediaan(rij) {
  const gesorteerd = [...rij].sort((a, b) => a - b);
  return gesorteerd[Math.floor(gesorteerd.length / 2)];
}


// ---------- 8. Eiland 1: Stemhut ----------
// Stem eerst de grote, dan de kleine gitaar. Snaar voor snaar.
const stemSnarenVak = document.getElementById("stem-snaren");
const naald = document.getElementById("naald");
const stemHint = document.getElementById("stem-hint");
const gitaarBadges = document.querySelectorAll(".gitaar-badge");

let stemGitaar = 0;      // 0 = grote gitaar, 1 = kleine gitaar
let stemSnaar = 0;       // welke snaar stemmen we nu (0 t/m 5)
let stemGoedTeller = 0;  // hoe lang klinkt de snaar al goed?
let stemMetingen = [];   // de laatste paar metingen
let laatsteTip = 0;      // wanneer zei de leraar voor het laatst een tip?
let gestemd = [];        // welke snaren zijn klaar (true/false)

const ZUIVER = 7;        // binnen 7 centen = goed gestemd
const VASTHOUDEN = 12;   // zo vaak achter elkaar goed (±0,6 seconde)

// Maak de 6 rondjes één keer aan. Tik erop = die snaar stemmen.
SNAREN.forEach((snaar, nr) => {
  const knop = document.createElement("button");
  knop.className = "stem-snaar";
  knop.style.background = snaar.kleur;
  knop.textContent = snaar.naam;
  knop.addEventListener("click", () => kiesStemSnaar(nr));
  stemSnarenVak.appendChild(knop);
});

async function startStemhut() {
  stemGitaar = 0;
  gestemd = [false, false, false, false, false, false];
  tekenGitaren();
  toonBeurt(stemGitaar);
  if (!(await zetMicrofoonAan())) return;
  luisterNaar(stemLuister);
  kiesStemSnaar(0);
}

function tekenGitaren() {
  gitaarBadges.forEach((badge, nr) => {
    badge.classList.toggle("nu", nr === stemGitaar);
    badge.classList.toggle("klaar", nr < stemGitaar);
  });
}

function kiesStemSnaar(nr) {
  stemSnaar = nr;
  stemGoedTeller = 0;
  stemMetingen = [];
  [...stemSnarenVak.children].forEach((knop, i) => {
    knop.classList.toggle("nu", i === nr);
    knop.classList.toggle("gestemd", gestemd[i]);
  });
  toonNaald(null);
  const snaar = SNAREN[nr];
  stemHint.textContent = "🎸 ?";
  zeg(`${SPELERS[stemGitaar].naam}. Speel de ${snaar.kleurnaam} snaar. Dat is ${snaar.plek}.`);
}

// Zet de naald op de meter. centen = null: geen toon, naald in het midden.
function toonNaald(cent) {
  naald.classList.toggle("weg", cent === null);
  const plek = cent === null ? 0 : Math.max(-50, Math.min(50, cent)); // -50 tot +50
  naald.style.left = 50 + plek + "%";
}

// Dit gebeurt elke keer als de microfoon iets hoort
function stemLuister({ freq }) {
  if (wachten) return;
  if (!freq) {            // stilte: opnieuw beginnen met tellen
    stemMetingen = [];
    return;
  }

  // Hoeveel zit deze toon naast de toon die het moet zijn?
  let cent = centen(freq, SNAREN[stemSnaar].freq);
  // Een octaaf (1200 centen) hoger of lager is dezelfde toon: die tellen we mee
  while (cent > 600) cent -= 1200;
  while (cent < -600) cent += 1200;

  stemMetingen.push(cent);
  if (stemMetingen.length > 5) stemMetingen.shift(); // alleen de laatste 5
  if (stemMetingen.length < 3) return;               // eerst even luisteren

  const midden = mediaan(stemMetingen);
  toonNaald(midden);

  if (Math.abs(midden) <= ZUIVER) {
    stemHint.textContent = "✅ Goed zo!";
    stemGoedTeller++;
    if (stemGoedTeller >= VASTHOUDEN) snaarGestemd();
  } else {
    stemGoedTeller = Math.max(0, stemGoedTeller - 1);
    const teLaag = midden < 0;
    stemHint.textContent = teLaag ? "⬆️ Te laag: draai strakker" : "⬇️ Te hoog: draai losser";
    // De leraar zegt het hardop, maar niet te vaak
    if (performance.now() - laatsteTip > 7000) {
      laatsteTip = performance.now();
      zeg(teLaag ? "Een beetje te laag. Draai het knopje zo dat de snaar strakker wordt."
                 : "Een beetje te hoog. Draai het knopje zo dat de snaar losser wordt.");
    }
  }
}

function snaarGestemd() {
  wachten = true;
  gestemd[stemSnaar] = true;
  stemSnarenVak.children[stemSnaar].classList.add("gestemd");
  speelJippie();
  setTimeout(() => {
    wachten = false;
    volgendeStemSnaar();
  }, 1200);
}

// Door naar de volgende snaar, of naar de volgende gitaar
function volgendeStemSnaar() {
  const nogTeDoen = gestemd.findIndex((klaar, i) => !klaar && i > stemSnaar);
  if (nogTeDoen !== -1) {
    kiesStemSnaar(nogTeDoen);
  } else {
    gitaarKlaar();
  }
}

function gitaarKlaar() {
  if (stemGitaar === 0) {
    // Grote gitaar klaar: nu de kleine
    stemGitaar = 1;
    gestemd = [false, false, false, false, false, false];
    tekenGitaren();
    toonBeurt(stemGitaar);
    zeg("Super! De grote gitaar is gestemd. Nu de kleine gitaar.");
    wachten = true;
    setTimeout(() => { wachten = false; kiesStemSnaar(0); }, 3500);
  } else {
    // Allebei gestemd: ster!
    luisterNaar(null);
    zeg("Hoera! Allebei de gitaren zijn gestemd.");
    verdienSter(huidigEiland);
  }
}

// ⏭ Lukt een snaar niet? Dan mag je hem overslaan.
document.getElementById("stem-overslaan").addEventListener("click", () => {
  if (!wachten) volgendeStemSnaar();
});


// ---------- 9. Eiland 2: Regenboogsnaren ----------
// Speel op je échte gitaar de snaar met dezelfde kleur als de stip.
const snarenVak = document.getElementById("snaren");
const doelStip = document.getElementById("doel-stip");
let doelSnaar = null;       // welke snaar moet je spelen (0 t/m 5)
let regenBeurt = 0;         // wie is er aan de beurt (0 of 1)
let laatstGehoord = null;    // de snaar die we net hoorden (klinkt misschien nog na)
let nieuweAanslag = false;  // is er sindsdien opnieuw een snaar aangeslagen?
let gehoordReeks = [];      // de laatste snaren die de microfoon hoorde

// Maak de 6 snaren één keer aan. Tik erop = hoor hoe die snaar moet klinken.
SNAREN.forEach((snaar, nr) => {
  const knop = document.createElement("button");
  knop.className = "snaar";
  knop.innerHTML = `<div class="lijn" style="height:${snaar.dikte}px; background:${snaar.kleur}"></div>`;
  knop.addEventListener("pointerdown", () => {
    speelToon(snaar.freq);
    animeer(knop, "trilt");
  });
  snarenVak.appendChild(knop);
});

async function startRegenboog() {
  regenBeurt = 0;
  doelSnaar = null;
  laatstGehoord = null;
  if (!(await zetMicrofoonAan())) return;
  luisterNaar(regenboogLuister);
  nieuweRegenboogOpdracht();
}

// Kies een willekeurige snaar (niet dezelfde als net)
function nieuweRegenboogOpdracht() {
  let nieuw;
  do {
    nieuw = Math.floor(Math.random() * SNAREN.length);
  } while (nieuw === doelSnaar);
  doelSnaar = nieuw;
  gehoordReeks = [];

  doelStip.style.background = SNAREN[doelSnaar].kleur;
  snarenVak.classList.add("heeft-doel");
  [...snarenVak.children].forEach((knop, i) => knop.classList.toggle("doel", i === doelSnaar));
  toonBeurt(regenBeurt);
  const snaar = SNAREN[doelSnaar];
  zeg(`${SPELERS[regenBeurt].naam}. Speel de ${snaar.kleurnaam} snaar. Dat is ${snaar.plek}.`);
}

// Dit gebeurt elke keer als de microfoon iets hoort
function regenboogLuister({ freq, aanslag }) {
  if (wachten) return;
  if (aanslag) {
    nieuweAanslag = true;
    gehoordReeks = [];
  }
  if (!freq) return;

  const nr = welkeSnaar(freq);
  if (nr === null) return;

  // Klinkt de vorige snaar nog na, en is er niet opnieuw aangeslagen? Niet meetellen.
  if (nr === laatstGehoord && !nieuweAanslag) return;

  // Pas als we 3 keer achter elkaar dezelfde snaar horen, weten we het zeker
  gehoordReeks.push(nr);
  const laatste3 = gehoordReeks.slice(-3);
  if (laatste3.length === 3 && laatste3.every(n => n === nr)) {
    hoorSnaar(nr);
  }
}

// De app heeft snaar nr gehoord. Was dat de goede?
function hoorSnaar(nr) {
  if (wachten) return;
  laatstGehoord = nr;
  nieuweAanslag = false;
  gehoordReeks = [];
  const knop = snarenVak.children[nr];
  animeer(knop, "trilt");
  knop.classList.add("gehoord");
  setTimeout(() => knop.classList.remove("gehoord"), 1300);

  if (nr === doelSnaar) {
    opdrachtGoed(() => {
      regenBeurt = 1 - regenBeurt; // nu is de ander aan de beurt
      nieuweRegenboogOpdracht();
    });
  } else {
    opdrachtFout(knop);
    setTimeout(() => zeg(`Dat was de ${SNAREN[nr].kleurnaam} snaar. Probeer het nog een keer.`), 500);
  }
}


// ---------- 10. Eiland 3: Palmritme ----------
// Luister hoe vaak de gitaar tokkelt (elke tokkel = een kokosnoot),
// en tokkel daarna zelf even vaak op de grote knop.
const kokosVak = document.getElementById("kokosnoten");
const tokkelKnop = document.getElementById("tokkel");

let palmRitme = [];    // wachttijden tussen de tokkels, bv. [0, 400, 800]
let palmTeller = 0;    // hoe vaak heb jij al getokkeld
let palmBeurt = false; // mag jij nu tokkelen?
let palmKlok = null;   // wekker: "is het kind klaar met tokkelen?"
let palmTimers = [];   // alle geplande tokkels van het voorbeeld

function nieuwePalmOpdracht() {
  // Kies 2, 3 of 4 tokkels (niet hetzelfde aantal als net)
  let aantal;
  do {
    aantal = 2 + Math.floor(Math.random() * 3);
  } while (aantal === palmRitme.length);

  // Maak een ritme: tussen de tokkels soms kort (0,4 s) en soms lang (0,8 s) wachten
  palmRitme = [];
  for (let i = 0; i < aantal; i++) {
    palmRitme.push(i === 0 ? 0 : (Math.random() < 0.5 ? 400 : 800));
  }

  // Zet het juiste aantal kokosnoten neer
  kokosVak.innerHTML = "";
  palmRitme.forEach(() => {
    const noot = document.createElement("span");
    noot.className = "kokosnoot";
    noot.textContent = "🥥";
    kokosVak.appendChild(noot);
  });

  speelPalmVoorbeeld();
}

// De gitaar doet het ritme voor; elke tokkel laat een kokosnoot springen
function speelPalmVoorbeeld() {
  stopPalm();
  palmBeurt = false;
  palmTeller = 0;
  tokkelKnop.classList.remove("jouw-beurt");
  const noten = kokosVak.querySelectorAll(".kokosnoot");
  noten.forEach(n => n.classList.remove("aan"));

  let tijd = 500; // even wachten voor we beginnen
  palmRitme.forEach((wacht, i) => {
    tijd += wacht;
    palmTimers.push(setTimeout(() => {
      speelAkkoord(LOSSE_SNAREN);
      springKokosnoot(noten[i]);
    }, tijd));
  });

  // Klaar met voordoen: nu ben jij aan de beurt
  palmTimers.push(setTimeout(() => {
    palmBeurt = true;
    tokkelKnop.classList.add("jouw-beurt");
  }, tijd + 900));
}

// Kokosnoot springt even op en wordt daarna weer dof
function springKokosnoot(noot) {
  noot.classList.add("aan");
  setTimeout(() => noot.classList.remove("aan"), 250);
}

// Stop alle geplande geluiden van Palmritme (bv. als je terug gaat)
function stopPalm() {
  palmTimers.forEach(clearTimeout);
  palmTimers = [];
  clearTimeout(palmKlok);
}

tokkelKnop.addEventListener("pointerdown", tokkel);

// Eén keer tokkelen (met de vinger, de muis of de spatiebalk)
function tokkel() {
  speelAkkoord(LOSSE_SNAREN);
  if (!palmBeurt || wachten) return;

  palmTeller++;
  const noten = kokosVak.querySelectorAll(".kokosnoot");
  if (palmTeller <= noten.length) {
    noten[palmTeller - 1].classList.add("aan"); // blijft aan: zo zie je hoe ver je bent
  }

  // Na elke tokkel zetten we de wekker opnieuw.
  // Gaat hij af (1,3 s niks gedaan)? Dan kijken we of het klopt.
  clearTimeout(palmKlok);
  palmKlok = setTimeout(controleerPalm, 1300);
}

function controleerPalm() {
  palmBeurt = false;
  tokkelKnop.classList.remove("jouw-beurt");

  if (palmTeller === palmRitme.length) {
    opdrachtGoed(nieuwePalmOpdracht);
  } else {
    opdrachtFout(kokosVak);
    setTimeout(speelPalmVoorbeeld, 1000); // nog een keer voordoen
  }
}



// ---------- 11. Eiland 4: Akkoordkasteel ----------
// Luister naar het akkoord: klinkt het blij (E) of verdrietig (Em)?
let kasteelDoel = null; // "blij" of "sip"

function nieuweKasteelOpdracht() {
  kasteelDoel = Math.random() < 0.5 ? "blij" : "sip";
  setTimeout(() => speelAkkoord(AKKOORDEN[kasteelDoel]), 400);
}

document.querySelectorAll(".keuze").forEach(knop => {
  knop.addEventListener("click", () => kiesAkkoord(knop));
});

// Je kiest blij of sip (met de vinger, de muis of de pijltjestoetsen)
function kiesAkkoord(knop) {
  if (wachten) return;
  const gekozen = knop.dataset.soort; // "blij" of "sip"

  if (gekozen === kasteelDoel) {
    knop.classList.add("goed");
    setTimeout(() => knop.classList.remove("goed"), 1300);
    opdrachtGoed(nieuweKasteelOpdracht);
  } else {
    // Laat horen hoe jouw keuze klinkt, zodat je het verschil leert
    speelAkkoord(AKKOORDEN[gekozen]);
    opdrachtFout(knop);
  }
}


// ---------- Luisterknoppen (👂 en 🔊) ----------
// Wat je hoort, hangt af van het eiland (zie "luister" in EILANDEN bovenaan).
document.querySelectorAll(".luister-knop").forEach(knop => {
  knop.addEventListener("click", () => EILANDEN[huidigEiland].luister());
});


// ---------- 12. Ster verdienen ----------
let nieuwEiland = null; // naar welk eiland loopt het poppetje straks

function verdienSter(eilandNr) {
  if (!voortgang.klaar.includes(eilandNr)) voortgang.klaar.push(eilandNr);

  // Volgende eiland openen (als dat er is en nog dicht was)
  nieuwEiland = null;
  const volgende = eilandNr + 1;
  if (volgende < EILANDEN.length && voortgang.open <= volgende) {
    voortgang.open = volgende + 1;
    nieuwEiland = volgende;
  }
  bewaarVoortgang();

  // Alle eilanden klaar? Dan een beker in plaats van alleen "Super!"
  const speelbaar = EILANDEN.filter(e => e.scherm).length;
  const allesKlaar = voortgang.klaar.length === speelbaar;
  document.querySelector("#feest p").textContent = allesKlaar ? "🏆 Kampioen!" : "Super!";

  document.getElementById("feest").classList.remove("verborgen");
  speelJippie();
  setTimeout(speelJippie, 400);
}

// Op de groene pijl tikken: terug naar de kaart, poppetje gaat lopen
document.getElementById("verder").addEventListener("click", () => {
  document.getElementById("feest").classList.add("verborgen");
  toonScherm("kaart");
  if (nieuwEiland !== null) {
    // Eerst de kaart tekenen alsof het nieuwe eiland nog dicht is,
    // daarna laten we het poppetje ernaartoe lopen.
    voortgang.open--;
    tekenKaart();
    voortgang.open++;
    setTimeout(() => loopNaar(nieuwEiland), 400);
  } else {
    tekenKaart();
  }
});


// ---------- 13. Toetsenbord (voor op de laptop) ----------
// Laat een knop er even "ingedrukt" uitzien, alsof je erop klikte
function drukIn(knop) {
  knop.classList.add("ingedrukt");
  setTimeout(() => knop.classList.remove("ingedrukt"), 150);
}

// Welk scherm is nu zichtbaar? (bv. "kaart" of "palm")
function actiefScherm() {
  return document.querySelector(".scherm.actief").id;
}

// "keydown" = er wordt een toets ingedrukt. e.key zegt welke.
document.addEventListener("keydown", (e) => {
  if (e.repeat) return; // toets ingedrukt houden telt maar één keer
  geluidsmachine();     // geluid "wakker maken"

  // Zorg dat de browser niet óók nog iets doet met de toets
  // (spatie zou anders de pagina laten scrollen).
  if (document.activeElement) document.activeElement.blur();

  const scherm = actiefScherm();
  const toets = e.key;

  // Feestje in beeld? Enter of spatie = verder
  if (!document.getElementById("feest").classList.contains("verborgen")) {
    if (toets === "Enter" || toets === " ") {
      e.preventDefault();
      const knop = document.getElementById("verder");
      drukIn(knop);
      knop.click();
    }
    return;
  }

  // Op de kaart: Enter = speel het eiland waar het poppetje staat
  if (scherm === "kaart") {
    if (toets === "Enter" || toets === " ") {
      e.preventDefault();
      startEiland(voortgang.open - 1);
    }
    return;
  }

  // Op elk eiland: Esc = terug, Enter = luisteren
  const knopIn = (klasse) => document.querySelector(`#${scherm} .${klasse}`);
  if (toets === "Escape") {
    drukIn(knopIn("terug-knop"));
    knopIn("terug-knop").click();
    return;
  }
  if (toets === "Enter") {
    e.preventDefault();
    drukIn(knopIn("luister-knop"));
    knopIn("luister-knop").click();
    return;
  }

  // Toetsen die per eiland verschillen
  // Testen zonder gitaar: toets 1 t/m 6 = doen alsof je die snaar speelt
  if (scherm === "regenboog" && /^[1-6]$/.test(toets)) { // is het een cijfer 1 t/m 6?
    hoorSnaar(Number(toets) - 1);                         // toets "1" = snaar 0
  }
  if (scherm === "palm" && toets === " ") {
    e.preventDefault();
    drukIn(tokkelKnop);
    tokkel();
  }
  if (scherm === "kasteel" && (toets === "ArrowLeft" || toets === "ArrowRight")) {
    e.preventDefault();
    const knop = document.querySelector(toets === "ArrowLeft" ? '.keuze[data-soort="blij"]'
                                                               : '.keuze[data-soort="sip"]');
    drukIn(knop);
    kiesAkkoord(knop);
  }
});


// ---------- 14. Start! ----------
tekenKaart();

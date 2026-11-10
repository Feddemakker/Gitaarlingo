// =====================================================================
//  Gitaarlingo – het "brein" van de app
//  Regels die beginnen met // zijn uitleg; de computer slaat ze over.
// =====================================================================


// ---------- 1. De zes snaren ----------
// Van dik (laag) naar dun (hoog), zoals in standaardstemming.
// freq = hoe snel de snaar trilt (Hertz). Hoger getal = hogere toon.
const SNAREN = [
  { naam: "E", freq: 82.41,  kleur: "#ff1f4b", dikte: 34 }, // rood
  { naam: "A", freq: 110.00, kleur: "#ff8a00", dikte: 29 }, // oranje
  { naam: "D", freq: 146.83, kleur: "#ffd000", dikte: 25 }, // geel
  { naam: "G", freq: 196.00, kleur: "#00c853", dikte: 21 }, // groen
  { naam: "B", freq: 246.94, kleur: "#2979ff", dikte: 17 }, // blauw
  { naam: "e", freq: 329.63, kleur: "#b620e0", dikte: 14 }, // paars
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

// Elk eiland hoort bij een scherm (de id in index.html)
const EILAND_SCHERMEN = ["regenboog", "palm", "kasteel"];
const OPDRACHTEN_PER_STER = 3;


// ---------- 2. Voortgang onthouden ----------
// We bewaren alleen op dit apparaat (localStorage). Niets gaat naar internet.
function laadVoortgang() {
  try {
    const opgeslagen = JSON.parse(localStorage.getItem("gitaarlingo"));
    if (opgeslagen) return opgeslagen;
  } catch (e) { /* lukt het niet, dan beginnen we gewoon opnieuw */ }
  return { open: 1, klaar: [] }; // open = hoeveel eilanden open zijn
}

function bewaarVoortgang() {
  try {
    localStorage.setItem("gitaarlingo", JSON.stringify(voortgang));
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

// Elk eiland heeft een eigen "eerste opdracht"-functie (staan verderop)
const EILAND_STARTERS = [
  () => nieuweRegenboogOpdracht(),
  () => nieuwePalmOpdracht(),
  () => nieuweKasteelOpdracht(),
];

function startEiland(nr) {
  huidigEiland = nr;
  goed = 0;
  wachten = false;
  toonScherm(EILAND_SCHERMEN[nr]);
  tekenBollen();
  EILAND_STARTERS[nr]();
}

// De 3 bolletjes bovenin het scherm van het huidige eiland bijwerken
function tekenBollen() {
  const bollen = document.querySelectorAll(`#${EILAND_SCHERMEN[huidigEiland]} .bol`);
  bollen.forEach((bol, i) => bol.classList.toggle("vol", i < goed));
}

// Een opdrachtje is goed! Daarna: volgende opdracht, of een ster.
function opdrachtGoed(volgendeOpdracht) {
  goed++;
  tekenBollen();
  wachten = true;
  setTimeout(speelJippie, 400);
  setTimeout(() => {
    wachten = false;
    if (goed >= OPDRACHTEN_PER_STER) {
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
document.querySelectorAll(".terug-knop").forEach(knop => {
  knop.addEventListener("click", () => {
    stopPalm();
    toonScherm("kaart");
  });
});


// ---------- 7. Eiland 1: Regenboogsnaren ----------
// Tik op de snaar met dezelfde kleur als de stip.
const snarenVak = document.getElementById("snaren");
const doelStip = document.getElementById("doel-stip");
let doelSnaar = null; // welke snaar moet je aantikken (0 t/m 5)

// Maak de 6 snaren één keer aan
SNAREN.forEach((snaar, nr) => {
  const knop = document.createElement("button");
  knop.className = "snaar";
  // De gekleurde balk, en een toetsplaatje (1 t/m 6) voor op de laptop
  knop.innerHTML = `<kbd class="toets">${nr + 1}</kbd>` +
    `<div class="lijn" style="height:${snaar.dikte}px; background:${snaar.kleur}"></div>`;
  // "pointerdown" reageert direct bij aanraken (sneller dan "click")
  knop.addEventListener("pointerdown", () => tikSnaar(nr, knop));
  snarenVak.appendChild(knop);
});

// Kies een willekeurige snaar (niet dezelfde als net)
function nieuweRegenboogOpdracht() {
  let nieuw;
  do {
    nieuw = Math.floor(Math.random() * SNAREN.length);
  } while (nieuw === doelSnaar);
  doelSnaar = nieuw;
  doelStip.style.background = SNAREN[doelSnaar].kleur;
  setTimeout(() => speelToon(SNAREN[doelSnaar].freq), 300); // laat de toon alvast horen
}

function tikSnaar(nr, knop) {
  speelToon(SNAREN[nr].freq);
  animeer(knop, "trilt");
  if (wachten) return;

  if (nr === doelSnaar) {
    knop.classList.add("goed");
    setTimeout(() => knop.classList.remove("goed"), 1300);
    opdrachtGoed(nieuweRegenboogOpdracht);
  } else {
    opdrachtFout(knop);
  }
}



// ---------- 8. Eiland 2: Palmritme ----------
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



// ---------- 9. Eiland 3: Akkoordkasteel ----------
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


// ---------- Luisterknoppen (👂) ----------
// Elk eiland heeft een 👂-knop. Wat je hoort, hangt af van het eiland.
const LUISTEREN = [
  () => speelToon(SNAREN[doelSnaar].freq),            // Regenboogsnaren: de toon
  () => { if (!wachten) speelPalmVoorbeeld(); },      // Palmritme: het ritme
  () => speelAkkoord(AKKOORDEN[kasteelDoel]),         // Akkoordkasteel: het akkoord
];

document.querySelectorAll(".luister-knop").forEach(knop => {
  knop.addEventListener("click", () => LUISTEREN[huidigEiland]());
});


// ---------- 10. Ster verdienen ----------
let nieuwEiland = null; // naar welk eiland loopt het poppetje straks

function verdienSter(eilandNr) {
  if (!voortgang.klaar.includes(eilandNr)) voortgang.klaar.push(eilandNr);

  // Volgende eiland openen (als dat er is en nog dicht was)
  nieuwEiland = null;
  const volgende = eilandNr + 1;
  if (volgende < EILAND_SCHERMEN.length && voortgang.open <= volgende) {
    voortgang.open = volgende + 1;
    nieuwEiland = volgende;
  }
  bewaarVoortgang();

  // Alle eilanden klaar? Dan een beker in plaats van alleen "Super!"
  const allesKlaar = voortgang.klaar.length === EILAND_SCHERMEN.length;
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


// ---------- 11. Toetsenbord (voor op de laptop) ----------
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
  if (scherm === "regenboog" && /^[1-6]$/.test(toets)) { // is het een cijfer 1 t/m 6?
    const nr = Number(toets) - 1;             // toets "1" = snaar 0
    tikSnaar(nr, snarenVak.children[nr]);
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


// ---------- 12. Start! ----------
tekenKaart();

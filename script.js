// =====================================================================
//  Gitaarlingo – het "brein" van de app
//  Regels die beginnen met // zijn uitleg; de computer slaat ze over.
// =====================================================================


// ---------- 1. De zes snaren ----------
// Van dik (laag) naar dun (hoog), zoals in standaardstemming.
// freq = hoe snel de snaar trilt (Hertz). Hoger getal = hogere toon.
const SNAREN = [
  { naam: "E", freq: 82.41,  kleur: "#e53935", dikte: 34 }, // rood
  { naam: "A", freq: 110.00, kleur: "#fb8c00", dikte: 29 }, // oranje
  { naam: "D", freq: 146.83, kleur: "#fdd835", dikte: 25 }, // geel
  { naam: "G", freq: 196.00, kleur: "#43a047", dikte: 21 }, // groen
  { naam: "B", freq: 246.94, kleur: "#1e88e5", dikte: 17 }, // blauw
  { naam: "e", freq: 329.63, kleur: "#8e24aa", dikte: 14 }, // paars
];

const AANTAL_EILANDEN = 3;
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
function speelToon(freq, duur = 2.0) {
  const ctx = geluidsmachine();
  const nu = ctx.currentTime;

  // Volumeknop die we laten wegsterven
  const volume = ctx.createGain();
  volume.gain.setValueAtTime(0.0001, nu);
  volume.gain.exponentialRampToValueAtTime(0.5, nu + 0.01);  // tok!
  volume.gain.exponentialRampToValueAtTime(0.0001, nu + duur); // uitsterven

  // Filter maakt de klank zachter en warmer, net als een echte snaar
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(freq * 8, nu);
  filter.frequency.exponentialRampToValueAtTime(freq * 2, nu + 0.5);

  // Twee trillingen samen: de grondtoon en een zachtere boventoon
  [[1, "triangle", 1], [2, "sine", 0.4], [3, "sine", 0.15]].forEach(([keer, vorm, sterkte]) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = vorm;
    osc.frequency.value = freq * keer;
    g.gain.value = sterkte;
    osc.connect(g).connect(filter);
    osc.start(nu);
    osc.stop(nu + duur);
  });

  filter.connect(volume).connect(ctx.destination);
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


// ---------- 4. Schermen wisselen ----------
function toonScherm(id) {
  document.querySelectorAll(".scherm").forEach(s => s.classList.remove("actief"));
  document.getElementById(id).classList.add("actief");
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
      speelBoing(); // dicht eiland
      return;
    }
    if (nr === 0) {
      startRegenboog();
    } else {
      // Eiland 2 en 3 bouwen we later
      toonMelding("🚧 Binnenkort!");
    }
  });
});

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

// Knop om opnieuw te beginnen (vraagt eerst even of je het zeker weet)
document.getElementById("opnieuw").addEventListener("click", () => {
  if (confirm("Opnieuw beginnen?")) {
    voortgang = { open: 1, klaar: [] };
    bewaarVoortgang();
    tekenKaart();
  }
});


// ---------- 6. Eiland 1: Regenboogsnaren ----------
const snarenVak = document.getElementById("snaren");
const doelStip = document.getElementById("doel-stip");
const bollen = document.querySelectorAll(".bol");

let doel = null;   // welke snaar moet je nu aantikken (0 t/m 5)
let goed = 0;      // hoeveel opdrachtjes al goed
let wachten = false; // even niet tikken tijdens het "goed!"-moment

// Maak de 6 snaren één keer aan
SNAREN.forEach((snaar, nr) => {
  const knop = document.createElement("button");
  knop.className = "snaar";
  knop.innerHTML = `<div class="lijn" style="height:${snaar.dikte}px; background:${snaar.kleur}"></div>`;
  // "pointerdown" reageert direct bij aanraken (sneller dan "click")
  knop.addEventListener("pointerdown", () => tikSnaar(nr, knop));
  snarenVak.appendChild(knop);
});

function startRegenboog() {
  goed = 0;
  tekenBollen();
  toonScherm("regenboog");
  nieuweOpdracht();
}

// Kies een willekeurige snaar (niet dezelfde als net)
function nieuweOpdracht() {
  let nieuw;
  do {
    nieuw = Math.floor(Math.random() * SNAREN.length);
  } while (nieuw === doel);
  doel = nieuw;
  doelStip.style.background = SNAREN[doel].kleur;
  setTimeout(() => speelToon(SNAREN[doel].freq), 300); // laat de toon alvast horen
}

function tekenBollen() {
  bollen.forEach((bol, i) => bol.classList.toggle("vol", i < goed));
}

// Iemand tikt op snaar nr
function tikSnaar(nr, knop) {
  speelToon(SNAREN[nr].freq);
  trillen(knop);
  if (wachten) return;

  if (nr === doel) {
    // Goed!
    goed++;
    tekenBollen();
    knop.classList.add("goed");
    wachten = true;
    setTimeout(speelJippie, 400);
    setTimeout(() => {
      knop.classList.remove("goed");
      wachten = false;
      if (goed >= OPDRACHTEN_PER_STER) {
        verdienSter(0);
      } else {
        nieuweOpdracht();
      }
    }, 1300);
  } else {
    // Niet goed: snaar schudt "nee", en je mag het nog eens proberen
    knop.classList.remove("fout");
    void knop.offsetWidth; // trucje om de animatie opnieuw te starten
    knop.classList.add("fout");
    setTimeout(speelBoing, 250);
  }
}

// Laat een snaar even trillen
function trillen(knop) {
  knop.classList.remove("trilt");
  void knop.offsetWidth;
  knop.classList.add("trilt");
}

document.getElementById("luister").addEventListener("click", () => {
  speelToon(SNAREN[doel].freq);
});

document.getElementById("terug").addEventListener("click", () => {
  toonScherm("kaart");
});


// ---------- 7. Ster verdienen ----------
let nieuwEiland = null; // naar welk eiland loopt het poppetje straks

function verdienSter(eilandNr) {
  if (!voortgang.klaar.includes(eilandNr)) voortgang.klaar.push(eilandNr);

  // Volgende eiland openen (als dat er is en nog dicht was)
  nieuwEiland = null;
  const volgende = eilandNr + 1;
  if (volgende < AANTAL_EILANDEN && voortgang.open <= volgende) {
    voortgang.open = volgende + 1;
    nieuwEiland = volgende;
  }
  bewaarVoortgang();

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


// ---------- 8. Start! ----------
tekenKaart();

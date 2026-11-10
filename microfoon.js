// =====================================================================
//  Gitaarlingo – het "oor" van de app
//  Luistert via de microfoon en rekent uit welke toon er klinkt.
//  Alles gebeurt op dit apparaat zelf: er gaat geen geluid naar internet.
// =====================================================================

let micMeter = null;      // de "geluidsmeter" van de browser
let micBuffer = null;     // hierin komt steeds een stukje geluid (±0,1 seconde)
let luisteraar = null;    // de functie die hoort wat de microfoon hoort
let vorigVolume = 0;      // hoe hard was het de vorige keer?
let nietLuisterenTot = 0; // tijdstip tot wanneer we even niet luisteren
let gemisteAanslag = false; // snaar aangeslagen terwijl we even niet luisterden?

const STILTE = 0.006;     // zachter dan dit = stilte

// Zet de microfoon aan. De browser vraagt de eerste keer om toestemming.
// Geeft true terug als het gelukt is, false als het niet mag of niet kan.
async function startMicrofoon() {
  if (micMeter) return true; // staat al aan

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
  let stroom;
  try {
    stroom = await navigator.mediaDevices.getUserMedia({
      audio: {
        // Deze "verbeteringen" zijn voor praten, niet voor muziek: uit ermee
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
  } catch (fout) {
    return false; // geen toestemming, of geen microfoon
  }

  const ctx = geluidsmachine(); // staat in script.js
  const bron = ctx.createMediaStreamSource(stroom);
  micMeter = ctx.createAnalyser();
  micMeter.fftSize = 4096;
  bron.connect(micMeter);
  micBuffer = new Float32Array(micMeter.fftSize);

  setInterval(meet, 50); // 20 keer per seconde luisteren
  return true;
}

// Vertel wie er moet luisteren. luisterNaar(null) = niemand.
function luisterNaar(functie) {
  luisteraar = functie;
}

// Even niet luisteren (bv. als de app zelf geluid maakt of praat),
// anders hoort de microfoon de luidspreker van de app zelf.
function stilVoor(milliseconden) {
  nietLuisterenTot = Math.max(nietLuisterenTot, performance.now() + milliseconden);
}

// Dit gebeurt 20 keer per seconde
function meet() {
  micMeter.getFloatTimeDomainData(micBuffer);

  // Hoe hard is het? (het "gemiddelde" van het geluid)
  let som = 0;
  for (const waarde of micBuffer) som += waarde * waarde;
  const volume = Math.sqrt(som / micBuffer.length);

  // Is er net een snaar aangeslagen? Dan wordt het ineens veel harder.
  const aanslag = volume > STILTE && volume > vorigVolume * 1.3 + 0.002;
  vorigVolume = volume;

  toonVolume(volume);

  if (!luisteraar) return;
  const appPraat = window.speechSynthesis && speechSynthesis.speaking;
  if (appPraat) stilVoor(300); // na het praten nog heel even wachten
  if (performance.now() < nietLuisterenTot) {
    // Even niet luisteren... maar onthoud wél of er intussen een snaar werd aangeslagen
    if (aanslag) gemisteAanslag = true;
    return;
  }

  const freq = volume > STILTE ? zoekToon(micBuffer, micMeter.context.sampleRate) : null;
  luisteraar({ freq, volume, aanslag: aanslag || gemisteAanslag });
  gemisteAanslag = false;
}

// Het balkje naast 🎤 laat zien hoe hard de microfoon het geluid hoort
function toonVolume(volume) {
  // Omrekenen naar 0–100%. (Zacht geluid telt extra mee, net als bij je oor.)
  const procent = Math.max(0, Math.min(1, (Math.log10(volume + 1e-6) + 3) / 2)) * 100;
  document.querySelectorAll(".mic-vulling").forEach(v => v.style.width = procent + "%");
}

// ---------------------------------------------------------------------
// Welke toon is dit? (het "YIN"-rekenrecept)
// Idee: een toon herhaalt zich steeds. We zoeken na hoeveel tijd het
// geluid weer op zichzelf lijkt. Die tijd zegt hoe hoog de toon is.
// Geeft het aantal trillingen per seconde (Hertz) terug, of null.
// ---------------------------------------------------------------------
function zoekToon(buffer, meetSnelheid) {
  // 1. Elke 2 metingen samenvoegen: half zo veel rekenwerk, nog steeds precies genoeg
  const n = Math.floor(buffer.length / 2);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = (buffer[2 * i] + buffer[2 * i + 1]) / 2;
  const snelheid = meetSnelheid / 2;

  // We zoeken tonen tussen 70 en 1100 Hertz (een gitaar zit daartussen)
  const kortst = Math.floor(snelheid / 1100);
  const langst = Math.ceil(snelheid / 70);
  const breedte = n - langst;

  // 2. Voor elke "verschuiving": hoe veel lijkt het geluid op zichzelf?
  //    (klein getal = lijkt veel op elkaar)
  const verschil = new Float32Array(langst + 1);
  for (let schuif = 1; schuif <= langst; schuif++) {
    let s = 0;
    for (let i = 0; i < breedte; i++) {
      const v = x[i] - x[i + schuif];
      s += v * v;
    }
    verschil[schuif] = s;
  }

  // 3. Eerlijk maken, zodat korte en lange verschuivingen te vergelijken zijn
  const eerlijk = new Float32Array(langst + 1);
  eerlijk[0] = 1;
  let totaal = 0;
  for (let schuif = 1; schuif <= langst; schuif++) {
    totaal += verschil[schuif];
    eerlijk[schuif] = totaal > 0 ? (verschil[schuif] * schuif) / totaal : 1;
  }

  // 4. Zoek de eerste verschuiving die duidelijk "past"
  let beste = -1;
  for (let schuif = kortst; schuif <= langst; schuif++) {
    if (eerlijk[schuif] < 0.15) {
      while (schuif + 1 <= langst && eerlijk[schuif + 1] < eerlijk[schuif]) schuif++;
      beste = schuif;
      break;
    }
  }
  if (beste < 1) return null; // geen duidelijke toon (ruis, praten, ...)

  // 5. Nog wat preciezer: kijk naar de buren en schat het echte dal
  const a = eerlijk[beste - 1];
  const b = eerlijk[beste];
  const c = beste + 1 <= langst ? eerlijk[beste + 1] : b;
  let bijstelling = (a - c) / (2 * (a - 2 * b + c)) || 0;
  bijstelling = Math.max(-1, Math.min(1, bijstelling)); // nooit meer dan 1 stapje

  return snelheid / (beste + bijstelling);
}

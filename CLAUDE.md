# Gitaarlingo

Een spelletjes-app waarin een ouder (volwassene, grote gitaar) en een dochter
van 6 jaar (kleine gitaar) samen gitaar leren. Speelt op een tablet in de browser.

## Over de gebruiker
- De ontwikkelaar is een beginner zonder programmeerervaring en wil leren.
- Leg elke stap kort en eenvoudig uit, in het Nederlands.
- Teksten in de app zijn Nederlands.

## Techniek
- Alleen gewone HTML, CSS en JavaScript. Geen frameworks, geen build-stap.
- Bestanden: `index.html` (structuur), `style.css` (uiterlijk), `script.js` (gedrag).
- Geluid via de Web Audio API van de browser (geen geluidsbestanden nodig).
- Plaatjes zijn emoji's of eigen SVG; niets van externe servers laden.
- Voortgang wordt alleen lokaal bewaard (localStorage op het apparaat zelf).
- Code met duidelijke Nederlandse uitleg-commentaar, zodat de beginner het kan volgen.

## Ontwerpregels
- Kindvriendelijk: grote knoppen, felle vrolijke kleuren, weinig tekst.
- Werkt met aanraken (tablet) en ook met muis.
- Geen reclame, geen tracking, geen externe diensten, geen accounts.

## Spelopzet
- Een kronkelpad met eilandjes. Alleen het eerste eiland is open.
- Na 3 goede opdrachtjes op een eiland: een ster, het poppetje loopt naar het
  volgende eiland en dat eiland gaat open.
- Eiland 1 "Regenboogsnaren": de 6 snaren als dikke gekleurde balken; tik erop
  en je hoort de toon (E2, A2, D3, G3, B3, E4 — standaardstemming).
- Eiland 2 "Palmritme": de gitaar tokkelt 2–4 keer (elke tokkel laat een
  kokosnoot springen); daarna tokkel je zelf even vaak op de grote knop.
- Eiland 3 "Akkoordkasteel": luister naar een akkoord en kies blij 😊 (E)
  of verdrietig 😢 (Em). Bij fout hoor je hoe jouw keuze klinkt.
- Alle eilanden gebruiken dezelfde regels in script.js (`startEiland`,
  `opdrachtGoed`, `opdrachtFout`). Een nieuw eiland = nieuw scherm in
  index.html + een "nieuwe opdracht"-functie in `EILAND_STARTERS`.

## Testen
- Open `index.html` in een browser, of start een simpele server:
  `python3 -m http.server 8000` en ga naar http://localhost:8000

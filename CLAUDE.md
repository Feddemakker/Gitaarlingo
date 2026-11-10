# Gitaarlingo

Een spelletjes-app waarin een ouder (volwassene, grote gitaar) en een dochter
van 6 jaar (kleine gitaar) samen gitaar leren op hun ÉCHTE gitaren.
De app is de gitaarleraar: hij legt uit (met stem), luistert via de microfoon
en geeft feedback. Claude helpt daarnaast in het gesprek als leraar en bouwt
nieuwe lessen. Eerst op de laptop (Edge, Windows), later op een tablet.
Geen AI/externe dienst in de app zelf.

## Over de gebruiker
- De ontwikkelaar is een beginner zonder programmeerervaring en wil leren.
- Leg elke stap kort en eenvoudig uit, in het Nederlands.
- Teksten in de app zijn Nederlands.

## Techniek
- Alleen gewone HTML, CSS en JavaScript. Geen frameworks, geen build-stap.
- Bestanden: `index.html` (structuur), `style.css` (uiterlijk), `script.js` (gedrag),
  `microfoon.js` (luisteren + toonherkenning met het YIN-recept).
- Microfoon via getUserMedia, alles lokaal. Terwijl de app zelf geluid maakt of
  praat luistert hij niet (`stilVoor`), anders hoort hij zichzelf.
- Stem: `zeg(tekst)` met de ingebouwde voorleesstem (liefst een lokale nl-stem).
- Geluid via de Web Audio API van de browser (geen geluidsbestanden nodig).
- Plaatjes zijn emoji's of eigen SVG; niets van externe servers laden.
- Voortgang wordt alleen lokaal bewaard (localStorage op het apparaat zelf).
- Code met duidelijke Nederlandse uitleg-commentaar, zodat de beginner het kan volgen.

- Lettertype Fredoka staat lokaal in `lettertype/` (Open Font License).
- Kleuren staan als variabelen bovenaan `style.css` (`:root`).

## Laptop en toetsenbord
- Eerst testen op de laptop; de tablet blijft ook werken.
- Toetsen: Enter = spelen/luisteren/verder, Esc = terug,
  1–6 = snaren (testen zonder gitaar), spatie = tokkelen, ← → = blij/sip.
- Toetsplaatjes (`<kbd class="toets">`) zijn alleen zichtbaar als er een muis is.

## Ontwerpregels
- Kindvriendelijk: grote knoppen, felle vrolijke kleuren, weinig tekst.
- Werkt met aanraken (tablet) en ook met muis.
- Geen reclame, geen tracking, geen externe diensten, geen accounts.

## Spelopzet
- Kronkelpad met 5 eilanden. Alleen het eerste is open. Ster = volgende eiland open.
- Twee spelers om de beurt: 🧑 Grote gitaar en 👧 Kleine gitaar (`SPELERS`).
  Gitaren: standaardstemming E A D G B E (ook de kleine gitaar).
- Eiland 0 "Stemhut" 🔧 (echte gitaar): eerst grote, dan kleine gitaar stemmen,
  snaar voor snaar, met een meter (te laag / goed / te hoog). Beide klaar = ster.
- Eiland 1 "Regenboogsnaren" 🌈 (echte gitaar): de leraar noemt een kleur,
  je speelt die losse snaar; 4 goed (om de beurt) = ster.
- Eiland 2 "Palmritme" 🌴 en 3 "Akkoordkasteel" 🏰: nog schermspelletjes
  (tikken op het scherm). VOLGENDE STAP: ombouwen naar echte gitaar
  (meetokkelen op de maat; eerste akkoord Em, dan E).
- Eiland 4 "Liedjesstrand" 🎵: nog leeg (eerste liedje).
- Alle eilanden staan in de lijst `EILANDEN` bovenin script.js (scherm, start,
  luister, opdrachten). Gedeelde regels: `startEiland`, `opdrachtGoed`, `opdrachtFout`.

## Testen
- Zonder gitaar: op Regenboogsnaren doen toetsen 1–6 alsof je die snaar speelt.
- Automatisch testen kan met een nep-microfoon in Playwright (getUserMedia
  vervangen door een MediaStreamDestination met nep-getokkelde snaren).
- Open `index.html` in een browser, of start een simpele server:
  `python3 -m http.server 8000` en ga naar http://localhost:8000

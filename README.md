# 🎪 Spielplatzradar (Framework-freie Version)

Echtzeitkoordinierung mit Freunden auf dem Spielplatz – reines HTML/CSS/JavaScript,
kein React, kein Tailwind, kein Build-Schritt. Nur eine externe Abhängigkeit:
das Firebase SDK (für die geteilten Check-ins).

## 📁 Struktur

```
spielplatzradar/
├── index.html          Onboarding-Formular / Weiterleitung
├── live.html            Live-Tab (Check-in/-out)
├── spielplaetze.html    Spielplätze-Tab
├── ich.html              Profil-Tab
├── manifest.json
├── firebase-config.js    Deine Zugangsdaten (siehe unten)
├── firebase-rules.json   Zum Kopieren in die Firebase Console
├── css/
│   └── style.css        Gesamtes Styling, kein Tailwind
├── js/
│   ├── gemeinsam.js      Von allen Seiten genutzt: Profil, Formatierung,
│   │                     Firebase-Anbindung, Toast, Fehleranzeige
│   ├── live.js            Nur für live.html
│   ├── spielplaetze.js    Nur für spielplaetze.html
│   └── ich.js              Nur für ich.html
└── assets/
    └── icon-*.png
```

**Warum mehrere HTML-Seiten statt einer App?** Jede Seite ist eigenständig und
lädt nur das JavaScript, das sie wirklich braucht. Ein Fehler auf der
Spielplätze-Seite kann die Live-Seite nicht kaputt machen. Und im Browser
lässt sich jede Seite einzeln und unabhängig debuggen.

## 🔥 Firebase einrichten

Unverändert zur vorherigen Version - siehe die Schritte weiter unten.

### 1. Projekt anlegen
1. [console.firebase.google.com](https://console.firebase.google.com) → "Projekt hinzufügen"
2. Namen vergeben, Analytics kann deaktiviert bleiben

### 2. Realtime Database aktivieren
1. Build → Realtime Database → "Datenbank erstellen"
2. Standort z. B. `europe-west1`
3. Erstmal "Testmodus" - Regeln passen wir gleich an

### 3. Sicherheitsregeln setzen
1. Tab "Regeln" → Inhalt von `firebase-rules.json` reinkopieren → "Veröffentlichen"

> ⚠️ Kein Login in dieser App - die Regeln erlauben Lesen/Schreiben für jeden,
> der die Datenstruktur kennt. Für den privaten Kreis okay, aber keine echte
> Zugriffskontrolle.

### 4. Web-App registrieren
1. Projekteinstellungen → "Deine Apps" → Web-Icon (`</>`) → App registrieren
2. Das erscheinende `firebaseConfig`-Objekt kopieren

### 5. Config einfügen
1. `firebase-config.js` öffnen, Platzhalter durch deine echten Werte ersetzen
2. Speichern, zu GitHub pushen

## 🚀 GitHub Pages

1. Alle Dateien/Ordner in dein Repo hochladen (Struktur wie oben beibehalten)
2. Settings → Pages → Branch `main`, Ordner `/ (root)`
3. Nach 1-2 Minuten ist die Seite live unter `https://dein-username.github.io/spielplatzradar/`

## 📱 Zur iOS Home Screen hinzufügen

1. URL in Safari öffnen → Share-Button → "Zum Home-Bildschirm"
2. Öffnet danach vollbildig ohne Adressleiste

## 🛠️ Wartung & Weiterentwicklung

**Neue Seite hinzufügen?**
1. Neue `.html`-Datei anlegen, Kopfbereich/Navigation aus einer bestehenden Seite kopieren
2. `<script src="./js/gemeinsam.js"></script>` einbinden für Profil/Firebase-Helfer
3. Eigene `js/deinename.js` für die Seiten-spezifische Logik

**Design ändern?**
- Alles zentral in `css/style.css`, sortiert nach Variablen → Basis → Layout → Komponenten
- Farben über die `--farbe-*`-Variablen ganz oben anpassen

**Neues Datenfeld in Firebase?**
- In `js/gemeinsam.js` gibt es `pfadCheckins()` / `pfadSpielplaetze()` - neue
  Pfade nach dem gleichen Muster ergänzen

**Icons?**
- Reines Inline-SVG direkt im HTML bzw. in den `icon()`-Funktionen der
  jeweiligen `.js`-Datei - keine externe Bibliothek nötig. Weitere Icons
  findest du z. B. auf [lucide.dev](https://lucide.dev) (SVG-Pfad kopieren)

## 🐛 Troubleshooting

**Leere Seite?**
Die eingebaute Fehleranzeige (`zeigeFehlerAufBildschirm` in `gemeinsam.js`)
zeigt JavaScript-Fehler direkt auf dem Bildschirm an - auch ohne
Browser-Konsole (z. B. auf dem iPad). Einfach abwarten oder Seite neu laden,
der Fehlertext erscheint automatisch als orange Box.

**"Firebase not defined" o. Ä.?**
Prüfe, ob `firebase-config.js` mit echten Werten befüllt ist (keine
Platzhalter wie `DEIN_API_KEY` mehr).

**Check-ins erscheinen nicht bei anderen?**
Prüfe in der Firebase Console unter "Realtime Database", ob unter
`gruppen/{dein-gruppen-code}/checkins` tatsächlich Daten ankommen. Falls
nicht: Firebase-Regeln nochmal gegen `firebase-rules.json` prüfen.

---

**Viel Spaß beim Koordinieren! 🎪**

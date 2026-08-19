# 🎪 Spielplatzradar

Echtzeitkoordinierung mit Freunden auf dem Spielplatz – ohne Server, ohne Login, kein Problem.

## ⚡ Quickstart: GitHub Pages aktivieren

1. **Repo erstellen**
   - Gehe zu github.com und erstelle ein neues Repository
   - Name: `spielplatzradar` (oder beliebig)
   - Öffentlich (public)
   - README nicht nötig, überschreib die Datei später

2. **Dateien hochladen**
   - Lade alle Dateien aus diesem Ordner in dein Repo hoch:
     - `index.html`
     - `manifest.json`
     - `assets/icon-*.png` (alle drei Icons)
   - Struktur sollte so aussehen:
     ```
     spielplatzradar/
     ├── index.html
     ├── manifest.json
     ├── assets/
     │   ├── icon-512.png
     │   ├── icon-192.png
     │   └── icon-180.png
     └── README.md
     ```

3. **GitHub Pages aktivieren**
   - Gehe zu deinem Repo → **Settings**
   - Links: **Pages**
   - Unter "Build and deployment":
     - **Source**: `Deploy from a branch`
     - **Branch**: `main` (oder `master`)
     - **Folder**: `/ (root)`
   - **Save** klicken
   - Warte 1-2 Minuten

4. **Live gehen**
   - Deine App läuft jetzt unter: `https://dein-username.github.io/spielplatzradar/`

---

## 📱 Zur iOS Home Screen hinzufügen (PWA)

1. **In Safari öffnen**
   - Öffne die URL in Safari auf deinem iPhone/iPad
   - Tipp: `Share`-Button (unten)
   - Wähle **"Zum Home-Bildschirm"**
   - Bestätige

2. **Fertig!**
   - Das Icon erscheint auf deinem Home Screen
   - Öffnet **vollbildig ohne Safari-Adressleiste**
   - Funktioniert offline-first (einmal geöffnet)

### Optional: Android
- Gleiches Vorgehen: **Chrome** → **Menü** (drei Punkte) → **"Zum Home-Bildschirm"**

---

## 🔥 Firebase einrichten (5 Minuten)

Die App braucht eine **Firebase Realtime Database**, um Check-ins live zwischen Geräten zu teilen.

### 1. Projekt anlegen
1. Gehe zu [console.firebase.google.com](https://console.firebase.google.com)
2. **"Projekt hinzufügen"** → Namen vergeben (z. B. `spielplatzradar`)
3. Google Analytics kannst du deaktivieren (nicht nötig)
4. **"Projekt erstellen"** klicken, kurz warten

### 2. Realtime Database aktivieren
1. Im Menü links: **Build → Realtime Database**
2. **"Datenbank erstellen"**
3. Standort wählen (z. B. `europe-west1` für Europa)
4. Sicherheitsregeln: erstmal **"Testmodus"** wählen (wir passen die Regeln gleich danach an)

### 3. Sicherheitsregeln setzen
1. Im Realtime-Database-Bereich: Tab **"Regeln"**
2. Inhalt der Datei `firebase-rules.json` aus diesem Ordner reinkopieren
3. **"Veröffentlichen"**

> ⚠️ **Wichtig zu wissen:** Diese App hat keinen Login. Die Regeln erlauben Lesen/Schreiben für jeden, der die Gruppen-Struktur kennt. Das ist für den privaten Familien-/Freundeskreis-Gebrauch okay (kein sensibler Datenschutzfall), aber **nicht** für Daten, bei denen es auf echte Zugriffskontrolle ankommt. Der Gruppen-Code ist "Sicherheit durch Unbekanntheit", keine echte Authentifizierung.

### 4. Web-App registrieren & Config kopieren
1. Zurück zur Projektübersicht (Zahnrad oben links → **Projekteinstellungen**)
2. Unten bei "Deine Apps": **Web-Icon (`</>`)** klicken
3. Namen vergeben (z. B. `spielplatzradar-web`), **"App registrieren"**
4. Es erscheint ein `firebaseConfig`-Objekt – das komplett kopieren

### 5. Config in die App einfügen
1. Öffne `index.html` in diesem Ordner
2. Suche nach `const firebaseConfig = {`
3. Ersetze die Platzhalter-Werte durch deine echten Werte aus Schritt 4
4. Datei speichern, zu GitHub pushen

Fertig – die App ist jetzt live mit deiner eigenen Firebase-Datenbank verbunden.

---

## 🔧 Technische Details

### Speicher: zwei Ebenen

**Lokal (auf deinem Gerät, via `localStorage`):**
- Dein Name
- Dein Gruppen-Code
- Deine Geräte-ID (`deviceId`)

**Geteilt (Firebase Realtime Database, alle in der Gruppe sehen es):**
- Check-ins (mit Ablaufzeiten)
- Liste der bekannten Spielplätze

### Warum Firebase statt eigenem Server?
- Kostenlos für diese Nutzungsgröße (Spark-Plan: 1 GB Daten, 10 GB Traffic/Monat)
- Kein eigener Server, keine Wartung, kein Backend-Code nötig
- **Echtzeit-Updates**: Sobald jemand eincheckt, sehen es alle anderen sofort – kein Warten auf den nächsten Abruf
- Die App zeigt oben rechts einen "Live"-Status, wenn die Verbindung zu Firebase steht

### Datenstruktur in Firebase
```
gruppen/
  {groupId}/
    checkins/
      {deviceId}: { name, playgroundName, checkedInAt, expiresAt }
    spielplaetze/
      {autoId}: { name, addedBy }
```

**Wichtiger Design-Punkt:** Jeder Check-in liegt unter der `deviceId` des jeweiligen Geräts als Schlüssel. Dadurch schreibt jedes Gerät ausschließlich seinen eigenen Eintrag – zwei Personen, die gleichzeitig einchecken, können sich nicht mehr gegenseitig überschreiben (das war im alten `window.storage`-Ansatz mit einer gemeinsamen Liste ein Risiko).

### Kein Polling mehr
Die alte 20-Sekunden-Abfrage ist komplett entfallen. Firebase informiert die App per `onValue`-Listener sofort über Änderungen (Push statt Pull).

---

## 🛠️ Weiterentwicklung & Wartung

Die App ist **für Anfänger wartbar** – hier die Struktur:

```html
<!-- index.html -->
<head>
  <!-- PWA Meta-Tags und Icons -->
</head>
<body>
  <!-- React App hier -->
  <script>
    // 1. Konstanten (REFRESH_INTERVAL, Farben, etc.)
    // 2. Hilfsfunktionen (Zeit formatieren, IDs erzeugen, etc.)
    // 3. Speicher-Wrapper (um window.storage)
    // 4. UI-Komponenten (Toast, Header, etc.)
    // 5. Größere Bildschirme (Tabs: Live, Spielplätze, Ich)
    // 6. Hauptapp mit State-Management
  </script>
</body>
```

### Typische Änderungen:

**🎨 Design ändern?**
- Farben: Ändere die `bg-emerald-600`, `text-stone-900` etc. (Tailwind-Klassen)
- Icons: `lucide` ist eingebunden – schau [lucide.dev](https://lucide.dev) für mehr Icons

**📱 Verhalten ändern?**
- Check-in-Dauer: Ändere `DAUER_OPTIONEN_STUNDEN` oder `STANDARD_DAUER_STUNDEN`
- Refresh-Intervall: Ändere `REFRESH_INTERVAL_MS` (in Millisekunden)

**💾 Neuer Speicher-Schlüssel?**
- Neue Daten? Einfach `speichereGeteilteListe()` oder `speichereProfil()` nutzen
- Der Schlüssel muss immer mit `groupId` verknüpft sein, damit jede Gruppe ihre Daten behält

---

## 📋 Checkliste vor Deployment

- [ ] Icon-Bilder sind in `assets/` vorhanden (3 Größen)
- [ ] `manifest.json` hat korrekte Pfade (prüfe `start_url` und `scope`)
- [ ] `index.html` lädt React/Tailwind/lucide über CDN (prüfe die `<script>`-Tags)
- [ ] GitHub Pages ist aktiviert (Settings → Pages)
- [ ] URL funktioniert im Browser
- [ ] PWA-Icon erscheint auf iOS Home Screen

---

## 🐛 Troubleshooting

**"App lädt nicht"**
- Prüfe Browser-Konsole (F12 → Console)
- Stelle sicher, dass die CDN-URLs erreichbar sind (Internetverbindung ok?)

**"Check-ins verschwinden"**
- Das ist normal, wenn `window.storage` nicht unterstützt wird
- Prüfe, ob du im Published-Artefakt (claude.ai-Link) oder auf GitHub Pages bist
- Auf GitHub Pages funktioniert `window.storage` leider nicht – nutze stattdessen `localStorage`

**"Icon nicht auf Home Screen"**
- Prüfe, dass die Icon-Dateien in `assets/` existieren
- Manifest-Link in `<head>` richtig?
- Auf iOS: Evtl. Cache löschen (Einstellungen → Safari → Verlauf & Website-Daten löschen)

---

## 📝 Lizenz

Frei nutzbar, nach Lust und Laune verändern.

---

**Viel Spaß beim Koordinieren! 🎪**

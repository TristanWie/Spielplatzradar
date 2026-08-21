/* ============================================================================
 * SPIELPLATZRADAR - gemeinsam.js
 *
 * Wird auf JEDER Seite als erstes eigenes Skript geladen (nach den externen
 * <script src="..."> für Firebase). Enthält alles, was mehrere Seiten
 * gemeinsam brauchen:
 *
 *   - Sichtbare Fehleranzeige (kein Konsolenzugriff nötig, z. B. auf iPad)
 *   - Profil-Verwaltung (localStorage, geräteweit)
 *   - Hilfsfunktionen (IDs, Zeit-Formatierung, Gruppen-Code säubern)
 *   - Firebase-Pfade & Initialisierung
 *   - Toast-Meldungen
 *   - Verbindungsstatus-Anzeige
 *   - Weiterleitung, falls kein Profil vorhanden ist
 *
 * DATENHALTUNG:
 * - Profil (Name, Gruppen-Code, Geräte-ID)  -> localStorage, nur dieses Gerät
 * - Check-ins & Spielplätze                 -> Firebase Realtime Database,
 *                                              geteilt innerhalb der Gruppe
 * ==========================================================================*/

// ---- Sichtbare Fehleranzeige ------------------------------------------------
// Zeigt JavaScript-Fehler direkt auf dem Bildschirm an, statt nur in der
// (auf iPad z. B. nicht erreichbaren) Browser-Konsole.

function zeigeFehlerAufBildschirm(titel, details) {
  if (document.getElementById("spielplatzradar-fehleranzeige")) return;
  const box = document.createElement("div");
  box.id = "spielplatzradar-fehleranzeige";
  box.className = "fehleranzeige";
  box.innerHTML =
    "<strong style='font-size:16px;'>⚠️ " + titel + "</strong><br><br>" +
    "<span></span><br><br>" +
    "<span style='color:#9a3412;'>Am besten ein Foto davon machen oder abtippen und weitergeben.</span>";
  box.querySelector("span").textContent = details;
  document.body.appendChild(box);
}

window.addEventListener("error", function (event) {
  zeigeFehlerAufBildschirm(
    "JavaScript-Fehler",
    (event.message || "Unbekannter Fehler") +
      "\n\nDatei: " + (event.filename || "?") +
      "\nZeile: " + (event.lineno || "?") + ", Spalte: " + (event.colno || "?")
  );
});

window.addEventListener("unhandledrejection", function (event) {
  const grund = event.reason && event.reason.message ? event.reason.message : String(event.reason);
  zeigeFehlerAufBildschirm("Fehler bei einer asynchronen Aktion (z. B. Firebase)", grund);
});

// ---- Konstanten -------------------------------------------------------------

const DAUER_OPTIONEN_STUNDEN = [1, 2, 3, 4];
const STANDARD_DAUER_STUNDEN = 3;
const PROFILE_KEY = "spielplatzradar-profil";
const ANZAHL_AVATAR_FARBEN = 6;

// ---- Kleine Hilfsfunktionen --------------------------------------------------

function neueId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
}

function saeubereGruppenCode(code) {
  const bereinigt = code
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return bereinigt || "gruppe";
}

function formatiereVergangeneZeit(isoString) {
  const minuten = Math.max(0, Math.round((Date.now() - new Date(isoString).getTime()) / 60000));
  if (minuten < 1) return "gerade eben";
  if (minuten < 60) return "seit " + minuten + " Min";
  const stunden = Math.floor(minuten / 60);
  const restMinuten = minuten % 60;
  return "seit " + stunden + " Std" + (restMinuten ? " " + restMinuten + " Min" : "");
}

function formatiereVerbleibendeZeit(expiresAtIso) {
  const diffMs = new Date(expiresAtIso).getTime() - Date.now();
  if (diffMs <= 0) return "läuft gleich ab";
  const minuten = Math.round(diffMs / 60000);
  if (minuten < 60) return "noch " + minuten + " Min";
  const stunden = Math.floor(minuten / 60);
  const restMinuten = minuten % 60;
  return "noch " + stunden + " Std" + (restMinuten ? " " + restMinuten + " Min" : "");
}

function avatarFarbeFuerName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return "avatar-" + (hash % ANZAHL_AVATAR_FARBEN);
}

function initialenFuerName(name) {
  const teile = name.trim().split(/\s+/);
  const erste = (teile[0] && teile[0][0]) || "?";
  const zweite = teile.length > 1 ? teile[teile.length - 1][0] : "";
  return (erste + zweite).toUpperCase();
}

// ---- Profil: lokal auf dem Gerät (localStorage) ------------------------------

function ladeProfil() {
  try {
    const roh = localStorage.getItem(PROFILE_KEY);
    return roh ? JSON.parse(roh) : null;
  } catch (fehler) {
    return null;
  }
}

function speichereProfil(profil) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profil));
    return true;
  } catch (fehler) {
    console.error("Spielplatzradar: Fehler beim Speichern (Profil):", fehler);
    return false;
  }
}

function loescheProfil() {
  try {
    localStorage.removeItem(PROFILE_KEY);
    return true;
  } catch (fehler) {
    return false;
  }
}

// Für Seiten, die ein Profil voraussetzen (live/spielplaetze/ich):
// Leitet auf die Startseite um, falls noch kein Profil existiert.
// Gibt das Profil zurück, falls vorhanden (sonst null - Aufrufer sollte
// direkt danach return machen, die Umleitung läuft im Hintergrund an).
function erzwingeProfilOderWeiterleiten() {
  const profil = ladeProfil();
  if (!profil) {
    window.location.href = "./index.html";
    return null;
  }
  return profil;
}

// ---- Firebase: Initialisierung & Pfade ---------------------------------------
// Voraussetzung: firebase-config.js und die Firebase-SDK-<script>-Tags sind
// VOR diesem Skript in der HTML-Datei eingebunden.

let firebaseDb = null;

function initialisiereFirebase() {
  if (firebaseDb) return firebaseDb;
  firebase.initializeApp(firebaseConfig);
  firebaseDb = firebase.database();
  return firebaseDb;
}

function pfadCheckins(groupId) {
  return initialisiereFirebase().ref("gruppen/" + groupId + "/checkins");
}

function pfadSpielplaetze(groupId) {
  return initialisiereFirebase().ref("gruppen/" + groupId + "/spielplaetze");
}

// Wandelt Firebase-Objekt { key: value, ... } in ein Array [{ id, ...value }] um
function objektZuArray(objekt) {
  if (!objekt) return [];
  return Object.keys(objekt).map(function (id) {
    return Object.assign({ id: id }, objekt[id]);
  });
}

// Ruft callback(true/false) auf, sobald sich der Verbindungsstatus ändert,
// und aktualisiert nebenbei ein Element mit der ID "verbindungsstatus"
// (falls auf der Seite vorhanden).
function verbindungsstatusUeberwachen() {
  const element = document.getElementById("verbindungsstatus");
  initialisiereFirebase()
    .ref(".info/connected")
    .on("value", function (snapshot) {
      const verbunden = snapshot.val() === true;
      if (!element) return;
      element.classList.toggle("live", verbunden);
      element.textContent = verbunden ? "Live" : "...";
    });
}

// ---- Toast-Meldungen ---------------------------------------------------------

function zeigeToast(nachricht) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.style.display = "none";
    document.body.appendChild(toast);
  }
  toast.textContent = nachricht;
  toast.style.display = "block";
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(function () {
    toast.style.display = "none";
  }, 2000);
}

// ---- Kopfbereich & Navigation -------------------------------------------------

// Trägt den Gruppennamen in den Kopfbereich ein (Element mit id="gruppenname")
// und markiert in der unteren Navigation den aktiven Tab per data-tab-Attribut.
function initialisiereKopfUndNav(profil, aktiverTab) {
  const gruppenname = document.getElementById("gruppenname");
  if (gruppenname && profil) gruppenname.textContent = profil.code;

  document.querySelectorAll(".nav-eintrag").forEach(function (el) {
    el.classList.toggle("aktiv", el.dataset.tab === aktiverTab);
  });
}

/* ============================================================================
 * SPIELPLATZRADAR - live.js (nur für live.html)
 *
 * Aufbau nach dem immer gleichen Muster:
 *   1. Zustand (state) - was die Seite gerade weiß
 *   2. render() - baut #inhalt komplett neu aus dem aktuellen Zustand
 *   3. Firebase-Listener - aktualisieren den Zustand und rufen render() auf
 *   4. Aktionen (beiCheckIn, beiCheckOut, ...) - schreiben nach Firebase
 *
 * Jede Änderung (egal ob von Firebase oder von einem Klick) läuft über
 * render() - dadurch ist die Anzeige immer ein direktes Abbild des Zustands.
 * ==========================================================================*/

(function () {
  const profil = erzwingeProfilOderWeiterleiten();
  if (!profil) return; // Weiterleitung läuft bereits, hier nichts mehr tun

  // ---- Zustand --------------------------------------------------------------

  let checkins = [];
  let spielplaetze = [];

  // Lokaler Zustand des Eincheck-Formulars (noch nicht gespeichert)
  const formular = {
    ausgewaehlterSpielplatz: "",
    freiText: "",
    dauerStunden: STANDARD_DAUER_STUNDEN,
  };

  // ---- Kleine HTML-Escape-Hilfsfunktion --------------------------------------
  // Namen/Spielplatznamen kommen von Nutzer:innen - beim Einbauen in innerHTML
  // müssen sie escaped werden, damit niemand versehentlich (oder absichtlich)
  // HTML/Skript einschleusen kann.

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ---- Rendern ----------------------------------------------------------------

  function render() {
    const container = document.getElementById("inhalt");
    const jetzt = Date.now();
    const eigenerCheckin = checkins.find(function (c) { return c.id === profil.deviceId; });
    const andereAktive = checkins.filter(function (c) {
      return c.id !== profil.deviceId && new Date(c.expiresAt).getTime() > jetzt;
    });

    let html = "";

    if (!eigenerCheckin) {
      html += renderEincheckFormular();
    } else {
      html += renderEigenerCheckin(eigenerCheckin);
    }

    if (andereAktive.length > 0) {
      html += renderAndereListe(andereAktive);
    } else if (!eigenerCheckin) {
      html +=
        '<div class="leer-hinweis">' +
        icon("mapPin", 32) +
        "<p>Noch niemand eingecheckt</p></div>";
    }

    container.innerHTML = html;
    bindeEreignisseFuerFormular();
  }

  function renderEincheckFormular() {
    let optionen = '<option value="">-- Auswählen oder neuer Name --</option>';
    spielplaetze.forEach(function (sp) {
      const ausgewaehlt = sp.name === formular.ausgewaehlterSpielplatz ? " selected" : "";
      optionen += '<option value="' + escapeHtml(sp.name) + '"' + ausgewaehlt + ">" + escapeHtml(sp.name) + "</option>";
    });

    let dauerKnoepfe = "";
    DAUER_OPTIONEN_STUNDEN.forEach(function (d) {
      const aktivKlasse = d === formular.dauerStunden ? " aktiv" : "";
      dauerKnoepfe += '<button type="button" class="dauer-knopf' + aktivKlasse + '" data-dauer="' + d + '">' + d + "h</button>";
    });

    const kannEinchecken = formular.ausgewaehlterSpielplatz || formular.freiText;

    return (
      '<div class="karte stapel">' +
      "<div>" +
      '<label for="eingabe-spielplatz">Spielplatz</label>' +
      '<select id="eingabe-spielplatz">' + optionen + "</select>" +
      "</div>" +
      (!formular.ausgewaehlterSpielplatz
        ? '<input type="text" id="eingabe-freitext" placeholder="Oder hier einen neuen Namen eingeben" value="' +
          escapeHtml(formular.freiText) + '" />'
        : "") +
      "<div>" +
      '<label>Wie lange?</label>' +
      '<div class="dauer-raster">' + dauerKnoepfe + "</div>" +
      "</div>" +
      '<button id="knopf-einchecken" class="btn btn-primaer"' + (kannEinchecken ? "" : " disabled") + ">" +
      icon("plus", 20) + " Einchecken</button>" +
      "</div>"
    );
  }

  function renderEigenerCheckin(checkin) {
    let verlaengernKnoepfe = "";
    [1, 2, 3, 4].forEach(function (d) {
      verlaengernKnoepfe +=
        '<button class="dauer-knopf" data-verlaengern="' + d + '" style="background:white;color:var(--farbe-primaer-dunkel)">+' + d + "h</button>";
    });

    return (
      '<div class="eigener-checkin">' +
      '<div class="eigener-checkin-kopf">' +
      "<div>" +
      '<p class="label">Du bist auf</p>' +
      "<h2>" + escapeHtml(checkin.playgroundName) + "</h2>" +
      '<p class="zeit">' + formatiereVerbleibendeZeit(checkin.expiresAt) + "</p>" +
      "</div>" +
      '<button id="knopf-checkout" class="btn-icon" style="background:white">' + icon("x", 20, "#dc2626") + "</button>" +
      "</div>" +
      '<div class="stapel-klein">' +
      '<div style="font-size:12px;color:var(--farbe-primaer-dunkel);font-weight:500;">Verlängern um:</div>' +
      '<div class="dauer-raster">' + verlaengernKnoepfe + "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function renderAndereListe(liste) {
    let eintraege = "";
    liste.forEach(function (checkin) {
      eintraege +=
        '<div class="teilnehmer-eintrag">' +
        '<div class="avatar ' + avatarFarbeFuerName(checkin.name) + '">' + escapeHtml(initialenFuerName(checkin.name)) + "</div>" +
        "<div>" +
        '<div class="teilnehmer-name">' + escapeHtml(checkin.name) + "</div>" +
        '<div class="teilnehmer-details">' + escapeHtml(checkin.playgroundName) + "</div>" +
        '<div class="teilnehmer-zeit">' + formatiereVergangeneZeit(checkin.checkedInAt) + "</div>" +
        "</div></div>";
    });
    return (
      '<div>' +
      '<div class="abschnitt-titel">' + icon("users", 18) + "Wer ist noch da?</div>" +
      '<div class="stapel-klein">' + eintraege + "</div>" +
      "</div>"
    );
  }

  // Kleine Icon-Bibliothek (nur die hier gebrauchten, als reines SVG - keine
  // externe Abhängigkeit nötig).
  function icon(name, groesse, farbe) {
    const pfade = {
      mapPin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
      plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
      x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    };
    const stil = farbe ? ' style="color:' + farbe + '"' : "";
    return (
      '<svg width="' + groesse + '" height="' + groesse + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' + stil + ">" + pfade[name] + "</svg>"
    );
  }

  // ---- Ereignisse des Formulars (nach jedem render() neu verbinden) -----------

  function bindeEreignisseFuerFormular() {
    const selectEl = document.getElementById("eingabe-spielplatz");
    if (selectEl) {
      selectEl.addEventListener("change", function (e) {
        formular.ausgewaehlterSpielplatz = e.target.value;
        render();
      });
    }

    const freitextEl = document.getElementById("eingabe-freitext");
    if (freitextEl) {
      freitextEl.addEventListener("input", function (e) {
        formular.freiText = e.target.value;
        // Kein render() hier - würde bei jedem Tastendruck den Cursor
        // zurückspringen lassen. Der Wert wird trotzdem gemerkt und beim
        // naechsten noetigen Render (z.B. Klick auf Dauer) mit ausgegeben.
      });
    }

    document.querySelectorAll("[data-dauer]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        formular.dauerStunden = Number(btn.dataset.dauer);
        render();
      });
    });

    const eincheckenBtn = document.getElementById("knopf-einchecken");
    if (eincheckenBtn) {
      eincheckenBtn.addEventListener("click", function () {
        const freitextEl = document.getElementById("eingabe-freitext");
        const name = formular.ausgewaehlterSpielplatz || (freitextEl ? freitextEl.value : formular.freiText);
        beiCheckIn(name, formular.dauerStunden);
      });
    }

    const checkoutBtn = document.getElementById("knopf-checkout");
    if (checkoutBtn) checkoutBtn.addEventListener("click", beiCheckOut);

    document.querySelectorAll("[data-verlaengern]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        beiVerlaengern(Number(btn.dataset.verlaengern));
      });
    });
  }

  // ---- Aktionen (schreiben nach Firebase) --------------------------------------

  function beiCheckIn(spielplatzName, dauerStunden) {
    const name = (spielplatzName || "").trim();
    if (!name) return;

    const existiertBereits = spielplaetze.some(function (sp) {
      return sp.name.toLowerCase() === name.toLowerCase();
    });
    const schreibVorgaenge = [];
    if (!existiertBereits) {
      schreibVorgaenge.push(pfadSpielplaetze(profil.groupId).push({ name: name, addedBy: profil.name }));
    }

    const jetzt = new Date();
    schreibVorgaenge.push(
      pfadCheckins(profil.groupId).child(profil.deviceId).set({
        name: profil.name,
        playgroundName: name,
        checkedInAt: jetzt.toISOString(),
        expiresAt: new Date(jetzt.getTime() + dauerStunden * 60 * 60 * 1000).toISOString(),
      })
    );

    Promise.all(schreibVorgaenge).then(function () {
      formular.ausgewaehlterSpielplatz = "";
      formular.freiText = "";
      zeigeToast("Eingecheckt auf " + name);
    });
  }

  function beiCheckOut() {
    pfadCheckins(profil.groupId).child(profil.deviceId).remove().then(function () {
      zeigeToast("Ausgecheckt");
    });
  }

  function beiVerlaengern(stunden) {
    const eigenerCheckin = checkins.find(function (c) { return c.id === profil.deviceId; });
    if (!eigenerCheckin) return;
    const neuesAblaufdatum = new Date(
      new Date(eigenerCheckin.expiresAt).getTime() + stunden * 60 * 60 * 1000
    ).toISOString();
    pfadCheckins(profil.groupId).child(profil.deviceId).update({ expiresAt: neuesAblaufdatum }).then(function () {
      zeigeToast("+" + stunden + " Std verlängert");
    });
  }

  // ---- Start ------------------------------------------------------------------

  initialisiereKopfUndNav(profil, "live");
  verbindungsstatusUeberwachen();

  pfadCheckins(profil.groupId).on("value", function (snapshot) {
    checkins = objektZuArray(snapshot.val());
    render();
  });

  pfadSpielplaetze(profil.groupId).on("value", function (snapshot) {
    spielplaetze = objektZuArray(snapshot.val());
    render();
  });

  // Zeitangaben ("noch 12 Min", "seit 3 Min") halten sich sonst nicht von
  // selbst aktuell, da sie nur bei Firebase-Änderungen neu berechnet würden.
  setInterval(render, 30000);
})();

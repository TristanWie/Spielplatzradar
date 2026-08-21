/* ============================================================================
 * SPIELPLATZRADAR - spielplaetze.js (nur für spielplaetze.html)
 * Gleiches Muster wie live.js: Zustand -> render() -> Firebase-Listener -> Aktionen
 * ==========================================================================*/

(function () {
  const profil = erzwingeProfilOderWeiterleiten();
  if (!profil) return;

  let spielplaetze = [];

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function render() {
    const container = document.getElementById("inhalt");

    let eingabeHtml =
      '<div class="eingabe-zeile">' +
      '<input type="text" id="eingabe-neuer-spielplatz" placeholder="Neuer Spielplatz..." />' +
      '<button id="knopf-hinzufuegen" class="btn btn-primaer" style="width:auto;padding:10px 16px">' +
      icon("plus", 20) + "</button></div>";

    let listeHtml = "";
    if (spielplaetze.length === 0) {
      listeHtml =
        '<div class="leer-hinweis">' + icon("map", 32) + "<p>Noch keine Spielplätze hinzugefügt</p></div>";
    } else {
      let eintraege = "";
      spielplaetze.forEach(function (sp) {
        eintraege +=
          '<div class="spielplatz-eintrag">' +
          "<div>" +
          '<div class="name">' + escapeHtml(sp.name) + "</div>" +
          '<div class="hinzugefuegt">hinzugefügt von ' + escapeHtml(sp.addedBy) + "</div>" +
          "</div>" +
          '<button class="btn-icon" data-entfernen="' + sp.id + '" style="color:#dc2626">' + icon("trash", 18) + "</button>" +
          "</div>";
      });
      listeHtml = '<div class="stapel-klein">' + eintraege + "</div>";
    }

    container.innerHTML = eingabeHtml + listeHtml;
    bindeEreignisse();
  }

  function icon(name, groesse) {
    const pfade = {
      plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
      map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
      trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    };
    return (
      '<svg width="' + groesse + '" height="' + groesse + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + pfade[name] + "</svg>"
    );
  }

  function bindeEreignisse() {
    const eingabeEl = document.getElementById("eingabe-neuer-spielplatz");
    const hinzufuegenBtn = document.getElementById("knopf-hinzufuegen");

    function absenden() {
      const wert = eingabeEl.value.trim();
      if (wert) beiSpielplatzHinzufuegen(wert);
    }

    if (hinzufuegenBtn) hinzufuegenBtn.addEventListener("click", absenden);
    if (eingabeEl) {
      eingabeEl.addEventListener("keypress", function (e) {
        if (e.key === "Enter") absenden();
      });
    }

    document.querySelectorAll("[data-entfernen]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        beiSpielplatzEntfernen(btn.dataset.entfernen);
      });
    });
  }

  function beiSpielplatzHinzufuegen(name) {
    const bereinigt = name.trim();
    if (!bereinigt) return;
    const existiertBereits = spielplaetze.some(function (sp) {
      return sp.name.toLowerCase() === bereinigt.toLowerCase();
    });
    if (existiertBereits) {
      zeigeToast("Gibt es schon");
      return;
    }
    pfadSpielplaetze(profil.groupId).push({ name: bereinigt, addedBy: profil.name }).then(function () {
      zeigeToast("Spielplatz hinzugefügt");
    });
  }

  function beiSpielplatzEntfernen(id) {
    pfadSpielplaetze(profil.groupId).child(id).remove();
  }

  // ---- Start ------------------------------------------------------------------

  initialisiereKopfUndNav(profil, "spielplaetze");
  verbindungsstatusUeberwachen();

  pfadSpielplaetze(profil.groupId).on("value", function (snapshot) {
    spielplaetze = objektZuArray(snapshot.val());
    render();
  });
})();

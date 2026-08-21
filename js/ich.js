/* ============================================================================
 * SPIELPLATZRADAR - ich.js (nur für ich.html)
 * Einfachste Seite: Formular mit vorhandenen Werten füllen, bei Speichern
 * zurück in localStorage schreiben. Kein Firebase-Zustand nötig hier.
 * ==========================================================================*/

(function () {
  const profil = erzwingeProfilOderWeiterleiten();
  if (!profil) return;

  initialisiereKopfUndNav(profil, "ich");
  verbindungsstatusUeberwachen();

  document.getElementById("eingabe-name").value = profil.name;
  document.getElementById("eingabe-code").value = profil.code;

  document.getElementById("knopf-speichern").addEventListener("click", function () {
    const neuerName = document.getElementById("eingabe-name").value.trim();
    const neuerCode = document.getElementById("eingabe-code").value.trim();
    if (!neuerName || !neuerCode) return;

    const aktualisiertesProfil = Object.assign({}, profil, {
      name: neuerName,
      code: neuerCode,
      groupId: saeubereGruppenCode(neuerCode),
    });
    speichereProfil(aktualisiertesProfil);
    document.getElementById("gruppenname").textContent = aktualisiertesProfil.code;
    zeigeToast("Profil aktualisiert");
  });

  document.getElementById("knopf-verlassen").addEventListener("click", function () {
    loescheProfil();
    window.location.href = "./index.html";
  });
})();

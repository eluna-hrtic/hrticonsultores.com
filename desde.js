/* HRTIC · precios «desde» de las páginas por caso de uso (web v1.33, 13/10/2026). Usa tarifario.js, copia exacta del tarifario de la
   plataforma: el monto escrito en la página es el respaldo sin JavaScript y se reemplaza por el cálculo del tarifario vigente (precio mínimo
   del plan con esos módulos, con IGV). */
(function () {
  "use strict";
  var T = window.HRTarifario; if (!T) return;
  function soles(x) { return "S/ " + Number(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  Array.prototype.forEach.call(document.querySelectorAll("[data-desde]"), function (e) {
    var r = T.cotizar(e.getAttribute("data-desde").split(","), 1);
    if (r && r.ok) e.textContent = soles(r.total);
  });
})();

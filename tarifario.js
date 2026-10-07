/* HRTIC · Tarifario «Arma tu plan» (v1.19, 06/10/2026). Fuente única de precios: la usa /admin y se copia tal cual a la web
 * (hrticonsultores.com/assets/js/tarifario.js). Montos en S/ por trabajador al mes, SIN IGV.
 * Derivado del tarifario por paquetes del 03/10/2026 (35 % debajo de la mediana del mercado): el precio de cada módulo es la
 * diferencia entre un paquete y el anterior, así que Asistencia + los módulos de un paquete = el precio exacto de ese paquete.
 * Decisiones de Ernesto (06/10/2026): Asistencia siempre incluida; mínimo S/ 170, salvo micro (S/ 99 con solo Asistencia y hasta
 * 10 trabajadores); mínimo proporcional en planes mixtos; la factura nunca baja al pasar de tramo. */
(function (g) {
  "use strict";
  var TRAMOS = [ // [desde, hasta]
    [1, 20], [21, 50], [51, 100], [101, 200], [201, 500], [501, Infinity]
  ];
  var ETIQUETAS_TRAMO = ["1 a 20", "21 a 50", "51 a 100", "101 a 200", "201 a 500", "501 a más"];
  // Precio por trabajador al mes en cada tramo (null = no disponible en ese tramo). Mínimo: lo que suma a la factura mínima.
  var MODULOS = [
    { k: "asistencia", n: "Control de asistencia", grupo: "Base", base: true, minimo: 170,
      d: "Marcación por celular, equipo fijo, QR y rostro; horas extra, turnos, permisos, tableros y reportes",
      p: [7.90, 4.50, 3.80, 3.40, 3.20, 2.90] },
    { k: "personas", n: "Administración de personas", grupo: "Personas", minimo: 0,
      d: "Legajo digital, contratos y adendas con firma electrónica, disciplina, solicitudes, políticas con acuse y documentos ISO",
      p: [5.10, 4.00, 4.70, 4.70, 4.40, 4.20] },
    { k: "planilla", n: "Planilla y boletas", grupo: "Planilla", minimo: 0,
      d: "Planilla, gratificación, CTS, liquidación, quinta, boletas firmadas y archivos de la PLAME",
      p: [8.10, 3.70, 3.70, 2.90, 2.70, 2.40] },
    { k: "seleccion", n: "Selección", grupo: "Talento", minimo: 76,
      d: "Vacantes con postulación desde el celular, filtros, pruebas, entrevista por competencias y ranking",
      p: [4.60, 2.80, 1.60, 1.50, 1.40, 1.30] },
    { k: "induccion", n: "Inducción", grupo: "Talento", minimo: 28,
      d: "Plan de 12 actividades con base legal y verificación automática",
      p: [1.70, 1.10, 0.70, 0.50, 0.50, 0.50] },
    { k: "desempeno", n: "Desempeño (Nine Box)", grupo: "Talento", minimo: 76,
      d: "Objetivos, evaluación 90° a 360°, apuntes de incidentes, actas 1:1, Nine Box y calibración",
      p: [4.60, 2.80, 1.60, 1.50, 1.40, 1.30] },
    { k: "cumplimiento", n: "Cumplimiento laboral", grupo: "Integral", minimo: 133,
      d: "Autodiagnóstico de 17 obligaciones con evidencia, semáforo, plan de acción y multa potencial SUNAFIL",
      p: [2.40, 1.40, 0.90, 0.80, 0.70, 0.70] },
    { k: "clima", n: "Clima y convivencia", grupo: "Integral", minimo: 132,
      d: "Encuesta anónima con eNPS, evaluación anual de hostigamiento, buzón y canal de denuncias",
      p: [2.30, 1.40, 0.80, 0.70, 0.70, 0.60] },
    { k: "corporativo", n: "Corporativo", grupo: "Corporativo", minimo: 735,
      d: "Varias razones sociales con cupo único, API y webhooks, marca blanca y auditoría anual de cumplimiento (desde 51 trabajadores)",
      p: [null, null, 1.80, 1.60, 1.50, 1.40] }
  ];
  // Paquetes de referencia (03/10/2026): sirven para nombrar el plan y para las pruebas.
  var PAQUETES = [
    { k: "Asistencia", m: ["asistencia"], p: [7.90, 4.50, 3.80, 3.40, 3.20, 2.90], minimo: 170 },
    { k: "Personas", m: ["asistencia", "personas"], p: [13.00, 8.50, 8.50, 8.10, 7.60, 7.10], minimo: 170 },
    { k: "Planilla", m: ["asistencia", "personas", "planilla"], p: [21.10, 12.20, 12.20, 11.00, 10.30, 9.50], minimo: 170 },
    { k: "Talento", m: ["asistencia", "personas", "planilla", "seleccion", "induccion", "desempeno"], p: [32.00, 18.90, 16.10, 14.50, 13.60, 12.60], minimo: 350 },
    { k: "Integral", m: ["asistencia", "personas", "planilla", "seleccion", "induccion", "desempeno", "cumplimiento", "clima"], p: [36.70, 21.70, 17.80, 16.00, 15.00, 13.90], minimo: 615 },
    { k: "Corporativo", m: ["asistencia", "personas", "planilla", "seleccion", "induccion", "desempeno", "cumplimiento", "clima", "corporativo"], p: [null, null, 19.60, 17.60, 16.50, 15.30], minimo: 1350 }
  ];
  var MICRO = { minimo: 99, hasta: 10 }; // solo Asistencia y hasta 10 trabajadores
  var IGV = 0.18;
  var INCLUIDO = [
    "Implementación asistida por HRTIC",
    "Agente de cumplimiento: 30 consultas al mes (paquete adicional de 50 consultas por S/ 15 + IGV)",
    "Importador de datos de otros sistemas (Excel, CSV, T-Registro y PLAME)",
    "Boletas de otro sistema con firma y constancia (con Personas o Planilla)",
    "Documentos ISO e indicadores de capital humano (con Personas)"
  ];

  function r2(x) { return Math.round(x * 100 + 1e-9) / 100; }
  function tramoDe(n) { for (var i = 0; i < TRAMOS.length; i++) if (n >= TRAMOS[i][0] && n <= TRAMOS[i][1]) return i; return -1; }
  function modulo(k) { for (var i = 0; i < MODULOS.length; i++) if (MODULOS[i].k === k) return MODULOS[i]; return null; }
  function normalizar(lista) {
    var out = ["asistencia"];
    (lista || []).forEach(function (k) { if (modulo(k) && out.indexOf(k) < 0) out.push(k); });
    return MODULOS.map(function (m) { return m.k; }).filter(function (k) { return out.indexOf(k) >= 0; });
  }
  function tarifa(mods, t) { // S/ por trabajador en el tramo t con esos módulos (los no disponibles en el tramo no suman)
    var s = 0; mods.forEach(function (k) { var v = modulo(k).p[t]; if (v != null) s += v; }); return r2(s);
  }
  function nombrePlan(mods) {
    for (var i = PAQUETES.length - 1; i >= 0; i--) {
      var p = PAQUETES[i]; if (p.m.length === mods.length && p.m.every(function (k) { return mods.indexOf(k) >= 0; })) return "Paquete " + p.k;
    }
    return "Plan a la medida";
  }

  /** Cotización mensual. modulos: claves (Asistencia se agrega siempre); n: trabajadores activos. */
  function cotizar(modulos, n) {
    n = Math.floor(Number(n));
    if (!(n >= 1)) return { ok: false, error: "Indica el número de trabajadores (1 o más)." };
    var mods = normalizar(modulos), t = tramoDe(n), avisos = [];
    if (mods.indexOf("corporativo") >= 0 && n <= 50) { mods = mods.filter(function (k) { return k !== "corporativo"; }); avisos.push("Corporativo se contrata desde 51 trabajadores: no se incluyó."); }
    var porTrab = tarifa(mods, t), bruto = r2(porTrab * n), piso = 0, pisoDe = null;
    for (var i = 0; i < t; i++) { // la factura nunca baja al pasar de tramo: piso = tramo anterior completo
      var v = r2(TRAMOS[i][1] * tarifa(mods, i)); if (v > piso) { piso = v; pisoDe = TRAMOS[i][1]; }
    }
    var micro = mods.length === 1 && n <= MICRO.hasta;
    var minimo = micro ? MICRO.minimo : mods.reduce(function (s, k) { return s + modulo(k).minimo; }, 0);
    var sub = Math.max(bruto, piso, minimo), regla = sub === bruto ? "tarifa" : (sub === piso && piso >= minimo ? "piso" : "minimo");
    var igv = r2(sub * IGV);
    return {
      ok: true, n: n, tramo: ETIQUETAS_TRAMO[t], modulos: mods, plan: nombrePlan(mods), por_trabajador: porTrab,
      detalle: mods.map(function (k) { var m = modulo(k); return { k: k, n: m.n, por_trabajador: m.p[t], subtotal: r2((m.p[t] || 0) * n) }; }),
      bruto: bruto, piso: piso, piso_de: pisoDe, minimo: minimo, micro: micro, regla: regla,
      subtotal: r2(sub), igv: igv, total: r2(sub + igv), efectivo_por_trabajador: r2(sub / n), avisos: avisos
    };
  }
  /** Precio «desde» (con y sin IGV) para la web. */
  function desde() { return { sin_igv: MICRO.minimo, con_igv: r2(MICRO.minimo * (1 + IGV)) }; }
  function soles(x) { return "S/ " + Number(x).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  g.HRTarifario = { VERSION: "2026-10-06", TRAMOS: TRAMOS, ETIQUETAS_TRAMO: ETIQUETAS_TRAMO, MODULOS: MODULOS, PAQUETES: PAQUETES,
    MICRO: MICRO, IGV: IGV, INCLUIDO: INCLUIDO, cotizar: cotizar, desde: desde, tramoDe: tramoDe, normalizar: normalizar, soles: soles };
})(typeof window !== "undefined" ? window : globalThis);

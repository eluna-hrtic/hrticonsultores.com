/* HRTIC · Tarifario «Arma tu plan» (v1.27, 08/10/2026). Fuente única de precios: la usa /admin y se copia tal cual a la web
 * (hrticonsultores.com/assets/js/tarifario.js). Montos en S/ por trabajador al mes, SIN IGV.
 * Estructura del 06/10/2026 (v1.19): el precio de cada módulo es la diferencia entre un paquete y el anterior, así que Asistencia + los
 * módulos de un paquete = el precio exacto de ese paquete; Asistencia siempre incluida; mínimo proporcional en planes mixtos; la factura
 * nunca baja al pasar de tramo.
 * Decisión de Ernesto del 08/10/2026 (opción B): precio por trabajador 20 % debajo de la mediana del mercado (antes 35 %: cada módulo
 * × 0,80/0,65, redondeado a 0,10; Personas de 51 a 100 queda en 5,70 para que el paquete no suba al pasar de 21-50 a 51-100); mínimo
 * mensual S/ 290 (antes 170) y microempresa S/ 149 (antes 99, solo Asistencia y hasta 10 trabajadores). Implementación S/ 490 + IGV
 * (pago único), sin costo con pago anual adelantado. Plan Archivo general por tramo al año y Plan Archivo SST S/ 180 al año. */
(function (g) {
  "use strict";
  var TRAMOS = [ // [desde, hasta]
    [1, 20], [21, 50], [51, 100], [101, 200], [201, 500], [501, Infinity]
  ];
  var ETIQUETAS_TRAMO = ["1 a 20", "21 a 50", "51 a 100", "101 a 200", "201 a 500", "501 a más"];
  // Precio por trabajador al mes en cada tramo (null = no disponible en ese tramo). Mínimo: lo que suma a la factura mínima.
  var MODULOS = [
    { k: "asistencia", n: "Control de asistencia", grupo: "Base", base: true, minimo: 290,
      d: "Marcación por celular, equipo fijo, QR y rostro; horas extra, turnos, permisos, tableros y reportes",
      p: [9.70, 5.50, 4.70, 4.20, 3.90, 3.60] },
    { k: "personas", n: "Administración de personas", grupo: "Personas", minimo: 0,
      d: "Legajo digital, contratos y adendas con firma electrónica, disciplina, solicitudes, políticas con acuse y documentos ISO",
      p: [6.30, 4.90, 5.70, 5.80, 5.40, 5.20] },
    { k: "planilla", n: "Planilla y boletas", grupo: "Planilla", minimo: 0,
      d: "Planilla, gratificación, CTS, liquidación, quinta, boletas firmadas y archivos de la PLAME",
      p: [10.00, 4.60, 4.60, 3.60, 3.30, 3.00] },
    { k: "seleccion", n: "Selección", grupo: "Talento", minimo: 76,
      d: "Vacantes con postulación desde el celular, filtros, pruebas, entrevista por competencias y ranking",
      p: [5.70, 3.40, 2.00, 1.80, 1.70, 1.60] },
    { k: "induccion", n: "Inducción", grupo: "Talento", minimo: 28,
      d: "Plan de 12 actividades con base legal y verificación automática",
      p: [2.10, 1.40, 0.90, 0.60, 0.60, 0.60] },
    { k: "desempeno", n: "Desempeño (Nine Box)", grupo: "Talento", minimo: 76,
      d: "Objetivos, evaluación 90° a 360°, apuntes de incidentes, actas 1:1, Nine Box y calibración",
      p: [5.70, 3.40, 2.00, 1.80, 1.70, 1.60] },
    { k: "cumplimiento", n: "Cumplimiento laboral", grupo: "Integral", minimo: 133,
      d: "Autodiagnóstico de 17 obligaciones con evidencia, semáforo, plan de acción y multa potencial SUNAFIL",
      p: [3.00, 1.70, 1.10, 1.00, 0.90, 0.90] },
    { k: "clima", n: "Clima y convivencia", grupo: "Integral", minimo: 132,
      d: "Encuesta anónima con eNPS, evaluación anual de hostigamiento, buzón y canal de denuncias",
      p: [2.80, 1.70, 1.00, 0.90, 0.90, 0.70] },
    { k: "corporativo", n: "Corporativo", grupo: "Corporativo", minimo: 735,
      d: "Varias razones sociales con cupo único, API y webhooks, marca blanca y auditoría anual de cumplimiento (desde 51 trabajadores)",
      p: [null, null, 2.20, 2.00, 1.80, 1.70] }
  ];
  // Paquetes de referencia (estructura del 03/10/2026, precios del 08/10/2026): sirven para nombrar el plan y para las pruebas.
  var PAQUETES = [
    { k: "Asistencia", m: ["asistencia"], p: [9.70, 5.50, 4.70, 4.20, 3.90, 3.60], minimo: 290 },
    { k: "Personas", m: ["asistencia", "personas"], p: [16.00, 10.40, 10.40, 10.00, 9.30, 8.80], minimo: 290 },
    { k: "Planilla", m: ["asistencia", "personas", "planilla"], p: [26.00, 15.00, 15.00, 13.60, 12.60, 11.80], minimo: 290 },
    { k: "Talento", m: ["asistencia", "personas", "planilla", "seleccion", "induccion", "desempeno"], p: [39.50, 23.20, 19.90, 17.80, 16.60, 15.60], minimo: 470 },
    { k: "Integral", m: ["asistencia", "personas", "planilla", "seleccion", "induccion", "desempeno", "cumplimiento", "clima"], p: [45.30, 26.60, 22.00, 19.70, 18.40, 17.20], minimo: 735 },
    { k: "Corporativo", m: ["asistencia", "personas", "planilla", "seleccion", "induccion", "desempeno", "cumplimiento", "clima", "corporativo"], p: [null, null, 24.20, 21.70, 20.20, 18.90], minimo: 1470 }
  ];
  var MICRO = { minimo: 149, hasta: 10 }; // solo Asistencia y hasta 10 trabajadores
  var IGV = 0.18;
  // Implementación (pago único, S/ sin IGV): sin costo si el cliente paga el año adelantado.
  var IMPLEMENTACION = { monto: 490, anual: 0 };
  // Plan Archivo (S/ al año, sin IGV) al terminar el servicio: general = consulta de solo lectura hasta 5 años después del último registro
  // (D.S. 004-2006-TR, art. 6; D.S. 001-98-TR, art. 21), por tramo de trabajadores; SST = custodia de los registros de SST hasta su último
  // plazo (D.S. 005-2012-TR, art. 35: 10 o 20 años).
  var PLAN_ARCHIVO = { general: [[50, 360], [200, 720], [Infinity, 1200]], sst: 180 };
  var INCLUIDO = [
    "Acompañamiento de HRTIC en la configuración y la carga del personal",
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
  /** Plan Archivo general (S/ al año, sin IGV) según el número de trabajadores al terminar el servicio. */
  function planArchivo(n) {
    n = Math.max(1, Math.floor(Number(n)) || 1);
    for (var i = 0; i < PLAN_ARCHIVO.general.length; i++) if (n <= PLAN_ARCHIVO.general[i][0]) return PLAN_ARCHIVO.general[i][1];
    return PLAN_ARCHIVO.general[PLAN_ARCHIVO.general.length - 1][1];
  }
  /** Precio «desde» (con y sin IGV) para la web. */
  function desde() { return { sin_igv: MICRO.minimo, con_igv: r2(MICRO.minimo * (1 + IGV)) }; }
  function soles(x) { return "S/ " + Number(x).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  g.HRTarifario = { VERSION: "2026-10-08", TRAMOS: TRAMOS, ETIQUETAS_TRAMO: ETIQUETAS_TRAMO, MODULOS: MODULOS, PAQUETES: PAQUETES,
    MICRO: MICRO, IGV: IGV, INCLUIDO: INCLUIDO, IMPLEMENTACION: IMPLEMENTACION, PLAN_ARCHIVO: PLAN_ARCHIVO, planArchivo: planArchivo,
    cotizar: cotizar, desde: desde, tramoDe: tramoDe, normalizar: normalizar, soles: soles };
})(typeof window !== "undefined" ? window : globalThis);

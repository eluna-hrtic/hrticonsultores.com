/* HRTIC · calculadora de beneficios sociales · v1.0 · 23/09/2026
   Cálculo orientativo de la liquidación al cese. Normas: D.S. 001-97-TR (CTS), Ley 27735 y D.S. 005-2002-TR
   (gratificaciones), Ley 30334 (bonificación extraordinaria), D. Leg. 713 y D.S. 012-92-TR (vacaciones),
   D.S. 003-97-TR, arts. 10, 38 y 76 (indemnización), TUO D.S. 013-2013-PRODUCE (micro y pequeña empresa).
   Todo se calcula en el navegador: no se envía ningún dato. */
(function () {
  "use strict";

  var RMV = 1130;               // D.S. 006-2024-TR, vigente desde el 01/01/2025 (revisar cuando se publique el alza)
  var ASIGNACION = RMV * 0.10;  // Ley 25129

  // ---------- fechas (en UTC para no depender de la zona horaria del navegador) ----------
  function fecha(txt) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(txt || "");
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  }
  function dia(y, mes, d) { return new Date(Date.UTC(y, mes, d)); }
  function masDias(f, n) { return new Date(f.getTime() + n * 86400000); }
  function finDeMes(y, mes) { return dia(y, mes + 1, 0).getUTCDate(); }
  function masMeses(f, n) {
    var y = f.getUTCFullYear(), mes = f.getUTCMonth() + n, d = f.getUTCDate();
    var yy = y + Math.floor(mes / 12), mm = ((mes % 12) + 12) % 12;
    return dia(yy, mm, Math.min(d, finDeMes(yy, mm)));
  }
  function difDias(a, b) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

  /* Tiempo entre dos fechas, ambas incluidas: meses completos y días sueltos. */
  function tiempo(desde, hasta) {
    if (hasta < desde) return { meses: 0, dias: 0 };
    var m = 0;
    while (masDias(masMeses(desde, m + 1), -1) <= hasta) m++;
    var dias = difDias(masMeses(desde, m), hasta) + 1;
    return { meses: m, dias: Math.max(0, dias) };
  }

  /* Meses calendario completos laborados entre dos fechas (gratificación: no se cuentan los días). */
  function mesesCalendario(desde, hasta) {
    var n = 0, y = desde.getUTCFullYear(), mes = desde.getUTCMonth();
    for (var k = 0; k < 13; k++) {
      var ini = dia(y, mes, 1), fin = dia(y, mes, finDeMes(y, mes));
      if (ini > hasta) break;
      if (ini >= desde && fin <= hasta) n++;
      mes++; if (mes === 12) { mes = 0; y++; }
    }
    return n;
  }

  function r2(x) { return Math.round((x + 1e-9) * 100) / 100; }

  // ---------- cálculo ----------
  function calcular(d) {
    var ingreso = fecha(d.ingreso), cese = fecha(d.cese), notas = [], conceptos = [];
    if (!ingreso || !cese) return { error: "Ingresa la fecha de ingreso y la fecha de cese." };
    if (cese < ingreso) return { error: "La fecha de cese no puede ser anterior a la de ingreso." };
    var sueldo = +d.sueldo || 0, variables = +d.variables || 0;
    if (sueldo <= 0) return { error: "Ingresa tu remuneración mensual." };
    var reg = d.regimen || "general", mype = reg !== "general";
    var af = d.asignacion ? ASIGNACION : 0;          // en la MYPE no es obligatoria: se suma solo si la pagan
    var rc = sueldo + af + variables;               // remuneración computable mensual
    var factor = reg === "pequena" ? 0.5 : 1;       // pequeña empresa: la mitad (15 días de CTS, media gratificación)
    var tasaBonif = d.eps ? 0.0675 : 0.09;
    var total = tiempo(ingreso, cese);
    var anios = Math.floor(total.meses / 12), mesesSueltos = total.meses % 12;
    var cesY = cese.getUTCFullYear(), cesM = cese.getUTCMonth(), cesD = cese.getUTCDate();

    if (d.menosDe4h) {
      notas.push("Con una jornada menor de 4 horas diarias en promedio no corresponde la CTS (D.S. 001-97-TR, art. 4) y la protección contra el despido arbitrario tiene reglas propias. Te conviene revisar tu caso en una consulta.");
    }
    if (mype && d.asignacion) {
      notas.push("En la micro y pequeña empresa la asignación familiar no es obligatoria. La calculadora la suma porque indicas que la recibes: si se paga, forma parte de tu remuneración.");
    }
    if (!d.menosDe4h && sueldo < RMV) {
      notas.push("Tu remuneración es menor que la mínima vital (S/ " + RMV.toFixed(2) + "). Si trabajas jornada completa, tu empleador debe pagarte al menos ese monto.");
    }

    // Gratificación de julio pendiente (cese entre el 1 y el 14 de julio, antes del pago).
    function gratificacion(desde, hasta) {
      var meses = mesesCalendario(desde, hasta);
      return { meses: meses, monto: meses >= 1 ? rc * factor / 6 * meses : 0 };
    }

    // 1. CTS trunca
    var cts = 0, detCts = "";
    if (reg !== "micro" && !d.menosDe4h && (total.meses >= 1)) {
      var iniSem = cesM >= 4 && cesM <= 9 ? dia(cesY, 4, 1) : (cesM >= 10 ? dia(cesY, 10, 1) : dia(cesY - 1, 10, 1));
      if (iniSem < ingreso) iniSem = ingreso;
      var tCts = tiempo(iniSem, cese);
      // Sexto de la gratificación percibida en el semestre de CTS (art. 18).
      var sexto = 0, pagoJul = dia(cesY, 6, 15), pagoDic = dia(iniSem.getUTCFullYear(), 11, 15);
      if (cesM >= 4 && cesM <= 9 && cese >= pagoJul && iniSem <= pagoJul) {
        var gJul = gratificacion(ingreso > dia(cesY, 0, 1) ? ingreso : dia(cesY, 0, 1), dia(cesY, 5, 30));
        sexto = gJul.monto / 6;
      } else if ((cesM >= 10 || cesM <= 3) && cese >= pagoDic && iniSem <= pagoDic) {
        var yD = pagoDic.getUTCFullYear();
        var gDic = gratificacion(ingreso > dia(yD, 6, 1) ? ingreso : dia(yD, 6, 1), dia(yD, 11, 31));
        sexto = gDic.monto / 6;
      }
      var rcCts = rc + sexto;
      cts = (rcCts * factor) / 12 * tCts.meses + (rcCts * factor) / 360 * tCts.dias;
      detCts = tCts.meses + " mes(es) y " + tCts.dias + " día(s) desde el " + fmtFecha(iniSem) +
               "; remuneración computable " + soles(rcCts) + (sexto ? " (incluye 1/6 de la gratificación)" : "") +
               (reg === "pequena" ? "; pequeña empresa: 15 remuneraciones diarias por año" : "");
      if ((cesM === 4 || cesM === 10) && cesD <= 15) {
        notas.push("Cesaste en la primera quincena de " + (cesM === 4 ? "mayo" : "noviembre") + ": revisa que tu empleador haya depositado la CTS del semestre anterior. La calculadora asume que sí.");
      }
    } else if (reg === "micro") {
      detCts = "La microempresa no paga CTS (TUO D.S. 013-2013-PRODUCE).";
    } else if (total.meses < 1) {
      detCts = "Con menos de un mes de servicios no hay CTS (D.S. 001-97-TR, art. 2).";
    }
    conceptos.push({ id: "cts", nombre: "CTS trunca", monto: r2(cts), detalle: detCts });

    // 2. Gratificación trunca + bonificación extraordinaria
    var grat = 0, bonif = 0, detGrat = "";
    if (reg !== "micro") {
      var iniG = cesM <= 5 ? dia(cesY, 0, 1) : dia(cesY, 6, 1);
      if (iniG < ingreso) iniG = ingreso;
      var g = gratificacion(iniG, cese);
      grat = g.monto;
      var yaDic = cesM === 11 && cesD >= 15;   // la gratificación de diciembre se paga hasta el 15
      if (yaDic) {
        if (d.diciembrePagada === false) {
          g = gratificacion(iniG, dia(cesY, 11, 31));
          grat = g.monto;
        } else {
          g = { meses: 0, monto: 0 };
          grat = 0;
        }
      }
      detGrat = yaDic && d.diciembrePagada !== false ? "Cesaste después del 15 de diciembre: la gratificación de diciembre ya debió pagarse completa, así que no queda trunca de ese semestre" :
                g.meses + " mes(es) calendario completo(s) del semestre" + (g.meses < 1 ? ": se necesita al menos un mes íntegro (D.S. 005-2002-TR)" : "") +
                (reg === "pequena" ? "; pequeña empresa: media remuneración por semestre" : "");
      if (cesM === 6 && cesD < 15 && !d.julioPagada && ingreso <= dia(cesY, 5, 30)) {
        var gj = gratificacion(ingreso > dia(cesY, 0, 1) ? ingreso : dia(cesY, 0, 1), dia(cesY, 5, 30));
        if (gj.monto > 0) {
          grat += gj.monto;
          detGrat += ". Se suma la gratificación de enero a junio (" + gj.meses + " mes(es)), porque cesaste antes del pago de julio";
        }
      }
      bonif = grat * tasaBonif;
    } else {
      detGrat = "La microempresa no paga gratificaciones (TUO D.S. 013-2013-PRODUCE).";
    }
    conceptos.push({ id: "grat", nombre: "Gratificación trunca", monto: r2(grat), detalle: detGrat });
    conceptos.push({ id: "bonif", nombre: "Bonificación extraordinaria (" + (d.eps ? "6.75 %" : "9 %") + ")", monto: r2(bonif),
                     detalle: reg === "micro" ? "No corresponde." : "Ley 30334: se paga junto con la gratificación, también la trunca." });

    // 3. Vacaciones truncas y vacaciones ganadas sin gozar
    var diasAnio = mype ? 15 : 30, vacT = 0, detVac = "";
    var aniv = ingreso, n = 0;
    while (masMeses(ingreso, 12 * (n + 1)) <= cese) n++;
    aniv = masMeses(ingreso, 12 * n);
    var tVac = tiempo(aniv, cese);
    if (total.meses >= 1 && !d.menosDe4h) {
      var rv = rc * diasAnio / 30;
      vacT = rv / 12 * tVac.meses + rv / 360 * tVac.dias;
      detVac = tVac.meses + " mes(es) y " + tVac.dias + " día(s) de récord desde el " + fmtFecha(aniv) + " (" + diasAnio + " días por año)";
    } else {
      detVac = total.meses < 1 ? "Se necesita al menos un mes de servicios (D.S. 012-92-TR, art. 23)." : "Revisa tu caso: jornada menor de 4 horas.";
    }
    conceptos.push({ id: "vac", nombre: "Vacaciones truncas", monto: r2(vacT), detalle: detVac });
    var pend = Math.max(0, +d.vacPendientes || 0), venc = Math.min(pend, Math.max(0, +d.vacVencidos || 0));
    if (pend > 0) {
      conceptos.push({ id: "vacpend", nombre: "Vacaciones ganadas sin gozar", monto: r2(rc / 30 * pend), detalle: pend + " día(s) × remuneración diaria" });
    }
    if (venc > 0) {
      conceptos.push({ id: "indvac", nombre: "Indemnización vacacional", monto: r2(rc / 30 * venc),
                       detalle: venc + " día(s) de un periodo que venció sin gozarse (D. Leg. 713, art. 23)" });
    }

    // 4. Indemnización
    var ind = 0, detInd = "", motivo = d.motivo || "renuncia";
    var enPrueba = total.meses < 3 || (total.meses === 3 && total.dias === 0);
    if (motivo === "despido" || motivo === "despido-modal") {
      if (enPrueba) {
        detInd = "Con 3 meses o menos de servicios no se supera el periodo de prueba: no hay indemnización por despido arbitrario (D.S. 003-97-TR, arts. 10 y 38), salvo que el despido sea nulo.";
      } else if (motivo === "despido-modal") {
        var fin = fecha(d.finContrato);
        if (reg !== "general") {
          detInd = "Para contratos a plazo fijo en la micro y pequeña empresa, revisa tu caso en una consulta.";
        } else if (!fin || fin <= cese) {
          detInd = "Ingresa la fecha en que vencía tu contrato (posterior al cese).";
        } else {
          var falta = tiempo(masDias(cese, 1), fin);
          ind = Math.min(1.5 * rc * (falta.meses + falta.dias / 30), 12 * rc);
          detInd = "1.5 remuneraciones por cada mes que faltaba (" + falta.meses + " mes(es) y " + falta.dias + " día(s)), tope 12 (D.S. 003-97-TR, art. 76)";
        }
      } else {
        var fr = anios + mesesSueltos / 12 + total.dias / 360;
        if (reg === "general") {
          ind = Math.min(1.5 * rc * fr, 12 * rc);
          detInd = "1.5 remuneraciones ordinarias por año, con dozavos y treintavos; tope 12 (D.S. 003-97-TR, art. 38). Base: sueldo bruto con los conceptos remunerativos regulares";
        } else {
          var rd = rc / 30, porAnio = reg === "pequena" ? 20 : 10, tope = reg === "pequena" ? 120 : 90;
          ind = Math.min(porAnio * rd * fr, tope * rd);
          detInd = porAnio + " remuneraciones diarias por año, tope " + tope + " (TUO D.S. 013-2013-PRODUCE)";
        }
      }
      conceptos.push({ id: "ind", nombre: "Indemnización por despido arbitrario", monto: r2(ind), detalle: detInd });
    }

    var suma = 0;
    conceptos.forEach(function (c) { suma += c.monto; });
    notas.push("Es un cálculo orientativo. No incluye descuentos (AFP u ONP e impuesto), horas extras, utilidades, remuneraciones pendientes ni lo que diga tu contrato o un convenio colectivo.");
    return { conceptos: conceptos, total: r2(suma), rc: r2(rc), asignacion: r2(af),
             servicio: anios + " año(s), " + mesesSueltos + " mes(es) y " + total.dias + " día(s)", notas: notas };
  }

  function fmtFecha(f) {
    return ("0" + f.getUTCDate()).slice(-2) + "/" + ("0" + (f.getUTCMonth() + 1)).slice(-2) + "/" + f.getUTCFullYear();
  }
  function soles(x) {
    return "S/ " + x.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // ---------- formulario ----------
  function iniciar() {
    var form = document.getElementById("form-calculadora");
    if (!form) return;
    var salida = document.getElementById("calc-salida");
    var campo = function (n) { return form.elements[n]; };
    function visibles() {
      var reg = campo("regimen").value, motivo = campo("motivo").value, cese = fecha(campo("cese").value);
      form.querySelectorAll(".solo-general").forEach(function (el) { el.hidden = reg !== "general"; });
      form.querySelectorAll(".solo-modal").forEach(function (el) { el.hidden = motivo !== "despido-modal"; });
      var julio = !!cese && cese.getUTCMonth() === 6 && cese.getUTCDate() < 15 && reg !== "micro";
      form.querySelectorAll(".solo-julio").forEach(function (el) { el.hidden = !julio; });
      var dic = !!cese && cese.getUTCMonth() === 11 && cese.getUTCDate() >= 15 && reg !== "micro";
      form.querySelectorAll(".solo-diciembre").forEach(function (el) { el.hidden = !dic; });
    }
    function mostrar() {
      var d = {
        regimen: campo("regimen").value, ingreso: campo("ingreso").value, cese: campo("cese").value,
        sueldo: campo("sueldo").value, variables: campo("variables").value, asignacion: campo("asignacion").checked,
        eps: campo("eps").checked, motivo: campo("motivo").value, finContrato: campo("finContrato").value,
        vacPendientes: campo("vacPendientes").value, vacVencidos: campo("vacVencidos").value,
        menosDe4h: campo("menosDe4h").checked, julioPagada: campo("julioPagada").checked,
        diciembrePagada: !campo("diciembreNoPagada").checked
      };
      var r = calcular(d);
      if (r.error) {
        salida.innerHTML = '<p class="aviso aviso-error" role="alert">' + r.error + "</p>";
        return;
      }
      var filas = r.conceptos.map(function (c) {
        return "<tr><td><strong>" + c.nombre + "</strong><br><span class=\"calc-nota\">" + c.detalle + "</span></td><td class=\"num\">" + soles(c.monto) + "</td></tr>";
      }).join("");
      salida.innerHTML =
        '<span class="kicker">Resultado estimado</span>' +
        '<p class="total">' + soles(r.total) + "</p>" +
        '<p class="calc-nota">Tiempo de servicios: ' + r.servicio + " · Remuneración computable: " + soles(r.rc) + "</p>" +
        '<div class="tabla-scroll"><table class="tabla-guia"><thead><tr><th>Concepto</th><th class="num">Monto</th></tr></thead><tbody>' +
        filas + "</tbody></table></div>" +
        r.notas.map(function (t) { return '<p class="calc-nota">' + t + "</p>"; }).join("") +
        '<p><a class="boton boton-primario" href="consultas.html?servicio=escrita#registrar">Que un especialista revise mi liquidación</a></p>';
      salida.focus();
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: "calculo-liquidacion-" + d.regimen, title: "Cálculo de liquidación", event: true });
      }
    }
    form.addEventListener("change", visibles);
    form.addEventListener("submit", function (e) { e.preventDefault(); mostrar(); });
    visibles();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calcular: calcular, tiempo: tiempo, mesesCalendario: mesesCalendario };
  } else {
    window.HRTICcalc = { calcular: calcular };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
  }
})();

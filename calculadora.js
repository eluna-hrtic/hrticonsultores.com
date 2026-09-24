/* HRTIC · calculadora de beneficios sociales · v1.2 · 24/09/2026 (indemnización MYPE solo por dozavos; costo laboral del empleador)
   Cálculo orientativo de la liquidación al cese. Normas: D.S. 001-97-TR (CTS), Ley 27735 y D.S. 005-2002-TR
   (gratificaciones), Ley 30334 (bonificación extraordinaria), D. Leg. 713 y D.S. 012-92-TR (vacaciones),
   D.S. 003-97-TR, arts. 10, 38 y 76 (indemnización), TUO D.S. 013-2013-PRODUCE (micro y pequeña empresa).
   Todo se calcula en el navegador: no se envía ningún dato. */
(function () {
  "use strict";

  var RMV = 1130;               // D.S. N.º 006-2024-TR, vigente desde el 01/01/2025 (revisar cuando se publique el alza)
  var ASIGNACION = RMV * 0.10;  // Ley N.º 25129

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
      notas.push("Con una jornada menor de 4 horas diarias en promedio no corresponde la CTS (D.S. N.º 001-97-TR, art. 4) y la protección contra el despido arbitrario tiene reglas propias. Te conviene revisar tu caso en una consulta.");
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
      detCts = "La microempresa no paga CTS (TUO D.S. N.º 013-2013-PRODUCE).";
    } else if (total.meses < 1) {
      detCts = "Con menos de un mes de servicios no hay CTS (D.S. N.º 001-97-TR, art. 2).";
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
                g.meses + " mes(es) calendario completo(s) del semestre" + (g.meses < 1 ? ": se necesita al menos un mes íntegro (D.S. N.º 005-2002-TR)" : "") +
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
      detGrat = "La microempresa no paga gratificaciones (TUO D.S. N.º 013-2013-PRODUCE).";
    }
    conceptos.push({ id: "grat", nombre: "Gratificación trunca", monto: r2(grat), detalle: detGrat });
    conceptos.push({ id: "bonif", nombre: "Bonificación extraordinaria (" + (d.eps ? "6.75 %" : "9 %") + ")", monto: r2(bonif),
                     detalle: reg === "micro" ? "No corresponde." : "Ley N.º 30334: se paga junto con la gratificación, también la trunca." });

    // 3. Vacaciones: cada año completo de servicios da derecho a 30 días (15 en la MYPE). Si ese descanso no se goza
    //    dentro del año siguiente, además se debe la indemnización vacacional (D. Leg. N.º 713, art. 23). Los días que el
    //    trabajador ya gozó se imputan a los periodos más antiguos; si superan lo ganado, se descuentan del récord trunco.
    var diasAnio = mype ? 15 : 30, rdv = rc / 30, vacT = 0, detVac = "";
    var gozados = Math.max(0, Math.floor(+d.vacGozadas || 0)), resto = gozados;
    var diasPend = 0, diasVenc = 0, detPer = [];
    if (!d.menosDe4h) {
      for (var i = 1; i <= anios; i++) {
        var usa = Math.min(resto, diasAnio); resto -= usa;
        var queda = diasAnio - usa;
        var iniPer = masMeses(ingreso, 12 * (i - 1)), finPer = masDias(masMeses(ingreso, 12 * i), -1);
        var limite = masDias(masMeses(ingreso, 12 * (i + 1)), -1);   // último día para gozarlo
        var vencido = cese > limite;
        if (queda > 0) {
          if (vencido) diasVenc += queda; else diasPend += queda;
          detPer.push(fmtFecha(iniPer) + " al " + fmtFecha(finPer) + ": " + queda + " día(s) " +
                      (vencido ? "vencidos (no se gozaron hasta el " + fmtFecha(limite) + ")" : "pendientes"));
        }
      }
      if (total.meses >= 1) {
        var diasTrunco = diasAnio * (mesesSueltos / 12 + total.dias / 360);
        var desc = Math.min(resto, diasTrunco);
        vacT = rdv * (diasTrunco - desc);
        detVac = mesesSueltos + " mes(es) y " + total.dias + " día(s) de récord desde el " + fmtFecha(masMeses(ingreso, 12 * anios)) +
                 " (" + diasAnio + " días por año; D. Leg. N.º 713, art. 22)" +
                 (desc > 0 ? ". Se descuentan " + (Math.round(desc * 100) / 100) + " día(s) de vacaciones adelantadas" : "");
      } else {
        detVac = "Se necesita al menos un mes de servicios (D.S. N.º 012-92-TR, art. 23).";
      }
    } else {
      detVac = "Con una jornada menor de 4 horas diarias no hay descanso vacacional (D.S. N.º 012-92-TR, art. 11).";
    }
    conceptos.push({ id: "vac", nombre: "Vacaciones truncas", monto: r2(vacT), detalle: detVac });
    if (diasPend + diasVenc > 0) {
      conceptos.push({ id: "vacpend", nombre: "Vacaciones ganadas y no gozadas", monto: r2(rdv * (diasPend + diasVenc)),
                       detalle: (diasPend + diasVenc) + " día(s) × remuneración diaria de " + soles(rdv) + ". " + detPer.join("; ") });
    }
    if (diasVenc > 0) {
      conceptos.push({ id: "indvac", nombre: "Indemnización vacacional", monto: r2(rdv * diasVenc),
                       detalle: diasVenc + " día(s) de descanso no gozado dentro del año siguiente a cuando se ganó (D. Leg. N.º 713, art. 23, literal c)" });
      notas.push("La indemnización vacacional no corresponde a gerentes o representantes de la empresa que decidieron no gozar su descanso (D.S. N.º 012-92-TR, art. 24).");
    }
    if (gozados > 0 && diasPend + diasVenc === 0 && anios > 0) {
      notas.push("Con los " + gozados + " día(s) que indicas haber gozado, no quedan vacaciones pendientes de años completos.");
    }

    // 4. Indemnización
    var ind = 0, detInd = "", motivo = d.motivo || "renuncia";
    var enPrueba = total.meses < 3 || (total.meses === 3 && total.dias === 0);
    if (motivo === "despido" || motivo === "despido-modal") {
      if (enPrueba) {
        detInd = "Con 3 meses o menos de servicios no se supera el periodo de prueba: no hay indemnización por despido arbitrario (D.S. N.º 003-97-TR, arts. 10 y 38), salvo que el despido sea nulo.";
      } else if (motivo === "despido-modal") {
        var fin = fecha(d.finContrato);
        if (reg !== "general") {
          detInd = "Para contratos a plazo fijo en la micro y pequeña empresa, revisa tu caso en una consulta.";
        } else if (!fin || fin <= cese) {
          detInd = "Ingresa la fecha en que vencía tu contrato (posterior al cese).";
        } else {
          var falta = tiempo(masDias(cese, 1), fin);
          ind = Math.min(1.5 * rc * (falta.meses + falta.dias / 30), 12 * rc);
          detInd = "1.5 remuneraciones por cada mes que faltaba (" + falta.meses + " mes(es) y " + falta.dias + " día(s)), tope 12 (D.S. N.º 003-97-TR, art. 76)";
        }
      } else {
        // Régimen general: dozavos y treintavos (D.S. 003-97-TR, art. 38). MYPE: solo dozavos, es decir, meses completos
        // (TUO D.S. 013-2013-PRODUCE, art. 56; igual en la Ley 32353, art. 50.2). Corrección del 24/09/2026.
        var fr = anios + mesesSueltos / 12 + (reg === "general" ? total.dias / 360 : 0);
        if (reg === "general") {
          ind = Math.min(1.5 * rc * fr, 12 * rc);
          detInd = "1.5 remuneraciones ordinarias por año, con dozavos y treintavos; tope 12 (D.S. N.º 003-97-TR, art. 38). Base: sueldo bruto con los conceptos remunerativos regulares";
        } else {
          var rd = rc / 30, porAnio = reg === "pequena" ? 20 : 10, tope = reg === "pequena" ? 120 : 90;
          ind = Math.min(porAnio * rd * fr, tope * rd);
          detInd = porAnio + " remuneraciones diarias por año, con dozavos por los meses completos (los días sueltos no se pagan), tope " + tope + " (TUO D.S. N.º 013-2013-PRODUCE, art. 56)";
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

  // ---------- costo laboral anual del empleador (v1.2, 24/09/2026) ----------
  /* Lo que la empresa paga en un año por un trabajador a jornada completa con remuneración fija, según el régimen.
     Bases verificadas el 24/09/2026:
     - Gratificaciones: Ley 27735, art. 5 (dos al año); pequeña empresa, media remuneración cada una (TUO D.S. 013-2013-PRODUCE, art. 50).
     - Bonificación extraordinaria: el aporte a EsSalud sobre la gratificación (Ley 30334, art. 3): 9 %, o 6.75 % con EPS.
     - CTS: por semestre, 1/12 de la remuneración computable por mes, que incluye 1/6 de la gratificación del semestre
       (D.S. 001-97-TR, arts. 18 y 21). Al año: rc × (1 + 1/6). Pequeña empresa: 15 remuneraciones diarias por año (TUO, art. 50).
     - EsSalud: 9 % de la remuneración, con base mínima de la RMV (Ley 26790, art. 6, literal a). No se aplica a la
       gratificación ni a la CTS (Ley 30334, art. 1; D.S. 001-97-TR).
     - Microempresa: sin CTS ni gratificaciones. SIS microempresas: S/ 15 mensuales por trabajador (TUO, art. 64.2; gob.pe/SIS).
     - Vida Ley desde el primer día (D. Leg. 688, art. 1, modificado por el D.U. 044-2019) y SCTR en actividades de riesgo
       (Ley 26790, art. 19): la prima la fija la aseguradora; se suma solo si se ingresa su tasa.
     - Las vacaciones se pagan dentro de las 12 remuneraciones: no son un costo adicional salvo que se cubra al trabajador.
     No incluye utilidades, horas extras, movilidad ni otros conceptos variables. */
  var SIS_MICRO = 15;
  function costoLaboral(d) {
    var sueldo = +d.sueldo || 0;
    if (sueldo <= 0) return { error: "Ingresa la remuneración mensual del puesto." };
    var reg = d.regimen || "general", notas = [], filas = [];
    if (sueldo < RMV) return { error: "La remuneración no puede ser menor que la mínima vital (S/ " + RMV.toFixed(2) + ") para una jornada completa (TUO D.S. N.º 013-2013-PRODUCE, art. 52; en el régimen general, la RMV vigente)." };
    var af = d.asignacion ? ASIGNACION : 0, rc = sueldo + af;
    var salud = d.salud || (reg === "micro" ? "sis" : "essalud");
    if (reg !== "micro" && salud === "sis") salud = "essalud";
    var tasaBonif = salud === "eps" ? 0.0675 : 0.09;
    var remAnual = 12 * rc;
    filas.push({ id: "rem", nombre: "12 remuneraciones", monto: r2(remAnual),
                 detalle: soles(sueldo) + (af ? " + asignación familiar " + soles(af) + " (Ley N.º 25129)" : "") + " × 12. Incluyen el mes de vacaciones (" + (reg === "general" ? "30" : "15") + " días; " + (reg === "general" ? "D. Leg. N.º 713" : "TUO D.S. N.º 013-2013-PRODUCE, art. 55") + ")." });
    var grat = 0, bonif = 0, cts = 0;
    if (reg === "general") {
      grat = 2 * rc;
      cts = rc * (1 + 1 / 6);
      filas.push({ id: "grat", nombre: "Gratificaciones de julio y diciembre", monto: r2(grat), detalle: "Una remuneración cada una (Ley N.º 27735, art. 5)." });
    } else if (reg === "pequena") {
      grat = rc;
      cts = 0.5 * (rc + (rc / 2) / 6);
      filas.push({ id: "grat", nombre: "Gratificaciones de julio y diciembre", monto: r2(grat), detalle: "Media remuneración cada una (TUO D.S. N.º 013-2013-PRODUCE, art. 50)." });
    } else {
      filas.push({ id: "grat", nombre: "Gratificaciones", monto: 0, detalle: "La microempresa no paga gratificaciones ni CTS (TUO D.S. N.º 013-2013-PRODUCE, art. 50)." });
    }
    if (grat) {
      bonif = grat * tasaBonif;
      filas.push({ id: "bonif", nombre: "Bonificación extraordinaria (" + (salud === "eps" ? "6.75 %" : "9 %") + ")", monto: r2(bonif),
                   detalle: "El aporte a EsSalud sobre la gratificación, pagado al trabajador (Ley N.º 30334, art. 3)." });
      filas.push({ id: "cts", nombre: "CTS (depósitos de mayo y noviembre)", monto: r2(cts),
                   detalle: reg === "general" ? "Una remuneración computable al año, con 1/6 de la gratificación (D.S. N.º 001-97-TR, arts. 18 y 21)."
                                              : "15 remuneraciones diarias al año, con 1/6 de la gratificación (TUO D.S. N.º 013-2013-PRODUCE, art. 50; D.S. N.º 001-97-TR)." });
    }
    var saludMonto, saludDet;
    if (salud === "sis") {
      saludMonto = 12 * SIS_MICRO;
      saludDet = "SIS microempresas: S/ 15.00 al mes por trabajador (TUO D.S. N.º 013-2013-PRODUCE, art. 64.2). Si el trabajador está en EsSalud, elige esa opción.";
    } else {
      var base = Math.max(rc, RMV);
      saludMonto = 12 * 0.09 * base;
      saludDet = "9 % de " + soles(base) + " al mes; la base no puede ser menor que la RMV (Ley N.º 26790, art. 6). La gratificación y la CTS no pagan EsSalud (Ley N.º 30334, art. 1)" +
                 (salud === "eps" ? ". Con EPS el total sigue siendo 9 %: 6.75 % a EsSalud y 2.25 % como crédito para la EPS; el plan de la EPS puede costar más" : "") + ".";
    }
    filas.push({ id: "salud", nombre: salud === "sis" ? "Seguro de salud (SIS microempresas)" : "EsSalud (9 %)", monto: r2(saludMonto), detalle: saludDet });
    var vida = 0, sctr = 0;
    var tVida = +d.tasaVida || 0, tSctr = +d.tasaSctr || 0;
    if (tVida > 0) {
      vida = 12 * rc * tVida / 100;
      filas.push({ id: "vida", nombre: "Seguro Vida Ley (" + tVida + " % según póliza)", monto: r2(vida), detalle: "Obligatorio desde el primer día de trabajo (D. Leg. N.º 688, art. 1, modificado por el D.U. N.º 044-2019)." });
    } else if (reg === "micro") {
      notas.push("En la microempresa, el seguro de vida no figura entre los derechos del régimen especial: el TUO D.S. N.º 013-2013-PRODUCE, art. 50, lo reconoce solo a la pequeña empresa. Si la empresa lo contrata, ingresa su prima para sumarla.");
    } else {
      notas.push("Falta el Seguro Vida Ley: es obligatorio desde el primer día (D. Leg. N.º 688, art. 1, modificado por el D.U. N.º 044-2019" + (reg === "pequena" ? "; TUO D.S. N.º 013-2013-PRODUCE, art. 50" : "") + "). Su prima la fija la aseguradora: ingrésala para sumarla.");
    }
    if (tSctr > 0) {
      sctr = 12 * rc * tSctr / 100;
      filas.push({ id: "sctr", nombre: "SCTR (" + tSctr + " % según póliza)", monto: r2(sctr), detalle: "Solo en actividades de riesgo (Ley N.º 26790, art. 19)." });
    }
    var total = 0;
    filas.forEach(function (f) { total += f.monto; });
    total = r2(total);
    notas.push("No incluye utilidades (empresas de más de 20 trabajadores), horas extras, movilidad, bonos, ni lo que diga un convenio colectivo. Los aportes a la AFP o a la ONP los paga el trabajador: se descuentan de su remuneración y no son un costo adicional para la empresa.");
    if (reg !== "general") notas.push("El régimen MYPE solo se aplica si la empresa está inscrita en el REMYPE. La Ley N.º 32353 mantiene estos mismos montos (arts. 44, 49 y 50) y rige al día siguiente de publicado su reglamento.");
    if (reg === "general" && d.asignacion === false) notas.push("Si el trabajador tiene hijos menores de 18 años, o mayores que siguen estudios superiores (hasta seis años después de cumplir 18), le corresponde asignación familiar: marca la casilla para sumarla (Ley N.º 25129; D.S. N.º 035-90-TR, art. 6).");
    return { filas: filas, total: total, mensual: r2(total / 12), sobre: r2(total / remAnual * 100), rc: r2(rc), regimen: reg, notas: notas };
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
        vacGozadas: campo("vacGozadas").value,
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

  function iniciarCosto() {
    var form = document.getElementById("form-costo");
    if (!form) return;
    var salida = document.getElementById("costo-salida");
    function visibles() {
      var reg = form.elements.regimen.value;
      form.querySelectorAll(".solo-micro").forEach(function (el) { el.hidden = reg !== "micro"; });
      form.querySelectorAll(".no-micro").forEach(function (el) { el.hidden = reg === "micro"; });
    }
    form.addEventListener("change", visibles);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var reg = form.elements.regimen.value;
      var r = costoLaboral({
        regimen: reg, sueldo: form.elements.sueldo.value, asignacion: form.elements.asignacion.checked,
        salud: reg === "micro" ? form.elements.saludMicro.value : (form.elements.eps.checked ? "eps" : "essalud"),
        tasaVida: form.elements.tasaVida.value, tasaSctr: form.elements.tasaSctr.value
      });
      if (r.error) { salida.innerHTML = '<p class="aviso aviso-error" role="alert">' + r.error + "</p>"; return; }
      var filas = r.filas.map(function (f) {
        return "<tr><td><strong>" + f.nombre + "</strong><br><span class=\"calc-nota\">" + f.detalle + "</span></td><td class=\"num\">" + soles(f.monto) + "</td></tr>";
      }).join("");
      salida.innerHTML =
        '<span class="kicker">Costo laboral anual estimado</span>' +
        '<p class="total">' + soles(r.total) + "</p>" +
        '<p class="calc-nota">En promedio, ' + soles(r.mensual) + " al mes: " + r.sobre.toFixed(1) + " % de las 12 remuneraciones.</p>" +
        '<div class="tabla-scroll"><table class="tabla-guia"><thead><tr><th>Concepto al año</th><th class="num">Monto</th></tr></thead><tbody>' +
        filas + "</tbody></table></div>" +
        r.notas.map(function (t) { return '<p class="calc-nota">' + t + "</p>"; }).join("") +
        '<p><a class="boton boton-primario" href="/empresas.html#linea-02">Revisar la estructura salarial con HRTIC</a></p>';
      salida.focus();
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: "calculo-costo-laboral-" + reg, title: "Cálculo de costo laboral", event: true });
      }
    });
    visibles();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calcular: calcular, costoLaboral: costoLaboral, tiempo: tiempo, mesesCalendario: mesesCalendario };
  } else {
    window.HRTICcalc = { calcular: calcular, costoLaboral: costoLaboral };
    var arrancar = function () { iniciar(); iniciarCosto(); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar); else arrancar();
  }
})();

/* ==========================================================================
   Arraviva — comportamiento del sitio
   Sin librerías externas:
   1. Selector de idioma (ES / EN)
   2. Menú móvil (hamburguesa)
   3. Reveals suaves al hacer scroll (fade + slide, escalonados)
   4. Motion de firma: la raíz/enredadera se "dibuja y crece" con el scroll
   Todo el movimiento respeta prefers-reduced-motion.
   ========================================================================== */

(function () {
  "use strict";

  /* ¿El usuario pidió menos movimiento? Entonces desactivamos las animaciones
     y mostramos todo estático (accesibilidad). */
  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* 1. SELECTOR DE IDIOMA                                               */
  /* ------------------------------------------------------------------ */
  /*
     El español es el texto por defecto del HTML. El inglés vive en data-en
     (o data-en-html si lleva etiquetas como <em>). Al cargar guardamos el
     español original para poder alternar. Recordamos la elección.
  */
  var translatables = document.querySelectorAll("[data-en], [data-en-html]");

  var META = {
    es: {
      title: "Arraviva — Partner tecnológico de crecimiento",
      description:
        "Arraviva ordena tu operación, automatiza lo repetitivo y suma IA para que tu negocio crezca sin depender de nadie."
    },
    en: {
      title: "Arraviva — Growth technology partner",
      description:
        "Arraviva organizes your operation, automates the repetitive and adds AI so your business grows without depending on anyone."
    }
  };

  translatables.forEach(function (el) {
    if (el.hasAttribute("data-en-html")) {
      el.setAttribute("data-es-html", el.innerHTML);
    } else {
      el.setAttribute("data-es", el.innerHTML);
    }
  });

  function setLanguage(lang) {
    if (lang !== "es" && lang !== "en") lang = "es";

    translatables.forEach(function (el) {
      if (el.hasAttribute("data-en-html")) {
        el.innerHTML =
          lang === "en"
            ? el.getAttribute("data-en-html")
            : el.getAttribute("data-es-html");
      } else {
        el.innerHTML =
          lang === "en" ? el.getAttribute("data-en") : el.getAttribute("data-es");
      }
    });

    document.documentElement.lang = lang;
    document.title = META[lang].title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", META[lang].description);

    document.querySelectorAll(".lang__btn").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang") === lang);
    });

    try {
      localStorage.setItem("arraviva-lang", lang);
    } catch (e) {
      /* localStorage puede fallar en modo privado — no es crítico */
    }

    // El texto traducido cambia de largo: reajustamos los paneles abiertos.
    refreshOpenPanels();
  }

  document.querySelectorAll(".lang__btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setLanguage(btn.getAttribute("data-lang"));
    });
  });

  var saved;
  try {
    saved = localStorage.getItem("arraviva-lang");
  } catch (e) {
    saved = null;
  }
  var initial =
    saved ||
    (navigator.language && navigator.language.indexOf("en") === 0 ? "en" : "es");
  setLanguage(initial);

  /* ------------------------------------------------------------------ */
  /* 2b. ACORDEÓN DE PREGUNTAS FRECUENTES                                */
  /* ------------------------------------------------------------------ */
  /*
     Cada pregunta es un botón con aria-expanded (accesible con teclado y
     lectores de pantalla). La respuesta se despliega animando su altura:
     medimos el alto real del contenido (scrollHeight) y lo aplicamos como
     max-height, para que la transición sea suave y exacta.
  */
  var faqButtons = [].slice.call(document.querySelectorAll(".faq__btn"));

  function openPanel(panel) {
    panel.classList.add("is-open");
    panel.style.maxHeight = panel.scrollHeight + "px";
  }
  function closePanel(panel) {
    panel.classList.remove("is-open");
    panel.style.maxHeight = "";
  }

  faqButtons.forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    btn.addEventListener("click", function () {
      var isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
      if (isOpen) closePanel(panel);
      else openPanel(panel);
    });
  });

  /* Si cambia el idioma, el texto cambia de largo: recalculamos la altura
     de los paneles que estén abiertos para que no se corte la respuesta. */
  function refreshOpenPanels() {
    // Puede llamarse antes de que exista el acordeón (al fijar el idioma inicial)
    if (!faqButtons) return;
    faqButtons.forEach(function (btn) {
      if (btn.getAttribute("aria-expanded") !== "true") return;
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
    });
  }
  // Al redimensionar la ventana el texto también re-fluye.
  window.addEventListener("resize", refreshOpenPanels);

  /* ------------------------------------------------------------------ */
  /* 2. MENÚ MÓVIL                                                       */
  /* ------------------------------------------------------------------ */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 3. REVEALS AL HACER SCROLL (fade + slide, escalonados)             */
  /* ------------------------------------------------------------------ */
  var reveals = [].slice.call(document.querySelectorAll(".reveal"));

  if (reduceMotion || !("IntersectionObserver" in window)) {
    // Sin animación: mostramos todo directamente.
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    /* Escalonado discreto: a cada elemento le damos un pequeño retardo según
       su orden dentro del mismo contenedor (así una fila de tarjetas entra
       una tras otra, no todas de golpe). */
    var counters = new Map();
    reveals.forEach(function (el) {
      var parent = el.parentNode;
      var i = counters.get(parent) || 0;
      counters.set(parent, i + 1);
      el.style.transitionDelay = Math.min(i, 4) * 80 + "ms";
    });

    var revObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
    );

    reveals.forEach(function (el) {
      revObserver.observe(el);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 3b. BARRIDO DE COLOR EN SECCIONES OSCURAS                          */
  /* ------------------------------------------------------------------ */
  /*
     Cuando una sección oscura entra en pantalla, su fondo "barre" de
     izquierda a derecha (clip-path). Solo si hay JS y no se pidió menos
     movimiento; si no, las secciones se ven completas (fallback seguro).
  */
  var wipes = [].slice.call(document.querySelectorAll(".wipe"));
  if (wipes.length && !reduceMotion) {
    wipes.forEach(function (el) {
      el.classList.add("wipe--armed"); // recorta el fondo hasta que entre
    });
    // Comprobación por posición (determinista): cuando el borde superior de la
    // sección entra ~85% del viewport, se abre. Nunca queda oculta.
    function checkWipes() {
      var vh = window.innerHeight;
      var pending = false;
      wipes.forEach(function (el) {
        if (el.classList.contains("wipe--in")) return;
        if (el.getBoundingClientRect().top < vh * 0.85) {
          el.classList.add("wipe--in"); // barre y se abre
        } else {
          pending = true;
        }
      });
      return pending;
    }
    var wticking = false;
    function onWipeScroll() {
      if (wticking) return;
      wticking = true;
      requestAnimationFrame(function () {
        checkWipes();
        wticking = false;
      });
    }
    window.addEventListener("scroll", onWipeScroll, { passive: true });
    window.addEventListener("resize", onWipeScroll);
    checkWipes(); // estado inicial
  }

  /* ------------------------------------------------------------------ */
  /* 5. INCLINACIÓN SUTIL DE TARJETAS SIGUIENDO EL CURSOR              */
  /* ------------------------------------------------------------------ */
  /*
     Un tilt 3D muy leve (máx. 4°) que sigue al cursor, además del "flotar".
     La transición CSS (0.25s) lo suaviza para que se sienta lento y sereno.
     Se desactiva con prefers-reduced-motion y en pantallas táctiles/pequeñas.
  */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    var tiltCards = [].slice.call(document.querySelectorAll(".card, .step"));
    var MAX_TILT = 4;
    tiltCards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateX(" +
          (-py * MAX_TILT).toFixed(2) +
          "deg) rotateY(" +
          (px * MAX_TILT).toFixed(2) +
          "deg) translateY(-3px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = ""; // vuelve al estado en reposo (CSS)
      });
    });
  }
})();

/* =========================================================================
   CAPTURA DE LEADS — formulario de contacto → webhook n8n → Airtable
   -------------------------------------------------------------------------
   CONFIGURAR: pega abajo la URL del webhook de producción de n8n.
   Mientras esté vacía, el formulario avisa al visitante y ofrece el correo.
   ========================================================================= */
(function () {
  "use strict";

  /* ===== CONFIG ===== */
  var WEBHOOK_URL = "https://proyecto-1-ensayo-n8n.o5q4ky.easypanel.host/webhook/lead-arraviva";
  var EMAIL_FALLBACK = "founder@arraviva.com";  // se muestra solo si el envío falla
  /* ================== */

  var form = document.getElementById("contactForm");
  if (!form) return;

  var statusEl = document.getElementById("formStatus");
  var submitBtn = form.querySelector('button[type="submit"]');
  var btnHTML = submitBtn ? submitBtn.innerHTML : "";

  function isEN() {
    return document.documentElement.lang === "en";
  }

  function setStatus(msg, tipo) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "form-status form-status--" + tipo;
    statusEl.hidden = false;
  }

  /* --- Tracking: se captura al cargar y sobrevive la navegación --- */
  function capturarTracking() {
    var guardado = null;
    try {
      guardado = JSON.parse(sessionStorage.getItem("arraviva-tracking") || "null");
    } catch (e) { /* sessionStorage bloqueado */ }

    var params = new URLSearchParams(window.location.search);
    var actual = {
      utm_source: params.get("utm_source") || "",
      utm_content: params.get("utm_content") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_medium: params.get("utm_medium") || "",
      full_url: window.location.href,
      referrer: document.referrer || ""
    };

    // La primera visita manda: no sobrescribir la fuente original con una navegación interna
    if (guardado && guardado.utm_source) return guardado;
    if (!actual.utm_source && guardado) return guardado;

    try {
      sessionStorage.setItem("arraviva-tracking", JSON.stringify(actual));
    } catch (e) { /* ignorar */ }
    return actual;
  }

  var tracking = capturarTracking();

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Honeypot: si viene relleno es un bot. Fingimos éxito y no enviamos nada.
    var hp = form.querySelector('[name="bot-field"]');
    if (hp && hp.value.trim() !== "") {
      setStatus(isEN() ? "Thank you." : "Gracias.", "ok");
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!WEBHOOK_URL) {
      setStatus(
        isEN()
          ? "Form not configured yet. Please write to " + EMAIL_FALLBACK
          : "El formulario aún no está configurado. Escríbenos a " + EMAIL_FALLBACK,
        "error"
      );
      return;
    }

    var datos = {};
    new FormData(form).forEach(function (valor, clave) {
      datos[clave] = typeof valor === "string" ? valor.trim() : valor;
    });
    delete datos["bot-field"];

    // El flujo de n8n espera 'empresa'; en la web el campo se llama 'negocio'
    datos.empresa = datos.negocio || "";
    datos.consentimiento = form.querySelector('[name="consentimiento"]').checked;
    datos.idioma = isEN() ? "en" : "es";
    datos.utm_source = tracking.utm_source;
    datos.utm_content = tracking.utm_content;
    datos.utm_campaign = tracking.utm_campaign;
    datos["Tracking Data"] = JSON.stringify(tracking);

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = isEN() ? "Sending…" : "Enviando…";
    }
    setStatus(isEN() ? "Sending…" : "Enviando…", "sending");

    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        form.reset();
        setStatus(
          isEN()
            ? "Thanks. We'll get back to you within 24 hours."
            : "Gracias. Te respondemos en menos de 24 horas.",
          "ok"
        );
        if (submitBtn) submitBtn.innerHTML = btnHTML;
      })
      .catch(function () {
        setStatus(
          isEN()
            ? "Something went wrong. Please write to " + EMAIL_FALLBACK
            : "Algo falló al enviar. Escríbenos a " + EMAIL_FALLBACK,
          "error"
        );
        if (submitBtn) submitBtn.innerHTML = btnHTML;
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
})();

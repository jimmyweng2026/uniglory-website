// Reusable WCAG contrast audit for the UniGlory Energy site.
//
// Usage (serve the built site, then load this file from a copy of index.html):
//   1. cp tools/contrast-audit.js dist/__contrast.js
//   2. inject into a copy of dist/index.html, right before </body>:
//        <style>.reveal{opacity:1 !important;transform:none !important}</style>
//        <script src="/__contrast.js"></script>
//   3. open that page in Chrome and read the `data-contrast` attribute:
//        Chrome --headless --dump-dom "http://localhost:PORT/__contrast.html"
//
// The reveal override is only needed so that sections which fade in on scroll
// are measurable; it does not change any colour.
(function () {
  function parseColor(value) {
    var m = /rgba?\(([^)]+)\)/.exec(value);
    if (!m) return null;
    var parts = m[1]
      .replace(/\//g, " ")
      .split(/[,\s]+/)
      .filter(function (s) {
        return s.length;
      })
      .map(parseFloat);
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts.length > 3 ? parts[3] : 1,
    };
  }

  function channel(v) {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }

  function luminance(c) {
    return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
  }

  function composite(fg, bg) {
    return {
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    };
  }

  function ratio(a, b) {
    var l1 = luminance(a);
    var l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  function hex(c) {
    function part(v) {
      var s = Math.round(v).toString(16);
      return s.length === 1 ? "0" + s : s;
    }
    return "#" + part(c.r) + part(c.g) + part(c.b);
  }

  function effectiveBackground(el) {
    var layers = [];
    var node = el;
    while (node && node.nodeType === 1) {
      var cs = getComputedStyle(node);
      if (cs.backgroundImage !== "none") return null; // gradient or photo
      var bg = parseColor(cs.backgroundColor);
      if (bg && bg.a > 0) {
        layers.push(bg);
        if (bg.a >= 0.999) break;
      }
      node = node.parentElement;
    }
    var base = { r: 255, g: 255, b: 255, a: 1 };
    for (var i = layers.length - 1; i >= 0; i--) base = composite(layers[i], base);
    return base;
  }

  function describe(el) {
    var cls = String(el.className || "").trim().split(/\s+/)[0];
    return el.tagName.toLowerCase() + (cls ? "." + cls : "");
  }

  function run() {
    var results = [];
    var skipped = 0;

    Array.prototype.forEach.call(document.querySelectorAll("body *"), function (el) {
      var hasText = false;
      for (var i = 0; i < el.childNodes.length; i++) {
        var n = el.childNodes[i];
        if (n.nodeType === 3 && n.textContent.trim()) hasText = true;
      }
      if (!hasText) return;

      var cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) === 0) return;

      var rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      var bg = effectiveBackground(el);
      if (!bg) {
        skipped++;
        return;
      }

      var color = parseColor(cs.color);
      if (!color) return;
      var fg = color.a < 1 ? composite(color, bg) : color;

      var size = parseFloat(cs.fontSize);
      var weight = parseInt(cs.fontWeight, 10) || 400;
      var isLarge = size >= 24 || (size >= 18.66 && weight >= 700);
      var required = isLarge ? 3 : 4.5;
      var value = ratio(fg, bg);

      results.push({
        el: describe(el),
        text: el.textContent.trim().slice(0, 30),
        size: Math.round(size * 10) / 10,
        weight: weight,
        required: required,
        ratio: Math.round(value * 100) / 100,
        fg: hex(fg),
        bg: hex(bg),
        pass: value >= required,
      });
    });

    var fails = results.filter(function (r) {
      return !r.pass;
    });
    fails.sort(function (a, b) {
      return a.ratio - b.ratio;
    });

    // Group identical element + colour combinations so the report is readable.
    var groups = {};
    fails.forEach(function (r) {
      var key = r.el + " " + r.fg + " on " + r.bg + " " + r.size + "px";
      if (!groups[key]) {
        groups[key] = { el: r.el, fg: r.fg, bg: r.bg, size: r.size, required: r.required, ratio: r.ratio, count: 0, sample: r.text };
      }
      groups[key].count++;
    });

    document.body.setAttribute(
      "data-contrast",
      JSON.stringify({
        checked: results.length,
        skipped: skipped,
        failures: fails.length,
        groups: Object.keys(groups).map(function (k) {
          return groups[k];
        }).sort(function (a, b) {
          return a.ratio - b.ratio;
        }),
      }),
    );
  }

  window.addEventListener("load", function () {
    setTimeout(run, 1200);
  });
})();

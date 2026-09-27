/* 等字体完成后再做一次确定性排版；最多缩小 15%，放不下交给导出器报错。 */
(function () {
  var MAX_SHRINK_RATIO = 0.15;
  var STEP = 0.5;
  // Chromium's Range rectangles may extend ~3 px beyond a line box for font ascenders/descenders.
  var EPSILON = 4;

  function overflows(el) {
    var style = window.getComputedStyle(el);
    var clipsX = style.overflowX === 'hidden' || style.overflowX === 'clip';
    var clipsY = style.overflowY === 'hidden' || style.overflowY === 'clip';
    if ((clipsX && el.scrollWidth > el.clientWidth + 1) ||
        (clipsY && el.scrollHeight > el.clientHeight + 1)) return true;
    var bounds = el.getBoundingClientRect();
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (!node.textContent || !node.textContent.trim()) continue;
      var ancestor = node.parentElement;
      var belongsToNestedFit = false;
      while (ancestor && ancestor !== el) {
        if (ancestor.hasAttribute('data-fit')) { belongsToNestedFit = true; break; }
        ancestor = ancestor.parentElement;
      }
      if (belongsToNestedFit) continue;
      var range = document.createRange();
      range.selectNodeContents(node);
      var rects = range.getClientRects();
      for (var i = 0; i < rects.length; i++) {
        var rect = rects[i];
        if (rect.width === 0 && rect.height === 0) continue;
        if (rect.left < bounds.left - EPSILON || rect.top < bounds.top - EPSILON ||
            rect.right > bounds.right + EPSILON || rect.bottom > bounds.bottom + EPSILON) {
          el.dataset.fitDebug = [bounds.left, bounds.top, bounds.right, bounds.bottom,
            rect.left, rect.top, rect.right, rect.bottom].map(function (value) { return Math.round(value * 10) / 10; }).join(',');
          return true;
        }
      }
    }
    return false;
  }

  function fit(el) {
    var targets = [el];
    function collect(parent) {
      Array.prototype.forEach.call(parent.children || [], function (child) {
        if (child.hasAttribute && child.hasAttribute('data-fit')) return;
        targets.push(child);
        collect(child);
      });
    }
    collect(el);
    var originalSizes = targets.map(function (node) {
      return parseFloat(window.getComputedStyle(node).fontSize) || 16;
    });
    var start = Math.max.apply(Math, originalSizes);
    var min = start * (1 - MAX_SHRINK_RATIO);
    var size = start;
    var parent = el.parentElement;
    if (!parent) return;
    el.dataset.fitStart = String(start);
    if (!el.dataset.fitField) el.dataset.fitField = el.className || el.tagName.toLowerCase();

    function setScale(nextSize) {
      var ratio = nextSize / start;
      targets.forEach(function (node, index) {
        node.style.fontSize = (originalSizes[index] * ratio) + 'px';
      });
    }

    setScale(size);
    while (overflows(el) && size - STEP >= min) {
      size -= STEP;
      setScale(size);
    }

    el.dataset.fitEnd = String(size);
    el.dataset.fitDone = '1';
    if (overflows(el)) {
      el.dataset.fitOverflow = '1';
      el.dataset.fitMeasured = el.scrollWidth + 'x' + el.scrollHeight + '/' + el.clientWidth + 'x' + el.clientHeight;
    }
    else delete el.dataset.fitOverflow;
  }

  function nextFrame() {
    return new Promise(function (resolve) { requestAnimationFrame(resolve); });
  }

  async function renderReady() {
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      await nextFrame();
      var elements = document.querySelectorAll('[data-fit]');
      for (var i = 0; i < elements.length; i++) fit(elements[i]);
      await nextFrame();
      document.documentElement.dataset.renderReady = '1';
    } catch (error) {
      document.documentElement.dataset.renderError = String(error && error.message || error);
    }
  }

  renderReady();
})();

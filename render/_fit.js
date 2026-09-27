/* _fit.js — 文字自适应缩放（字数 ↔ 图片空间）
   用法：给需要自动缩放的文本元素加 data-fit 属性。
   原理：页面加载时检测元素是否超出父容器（scrollHeight/scrollWidth 溢出），
   超出则逐步缩小字号（每次 0.5px，上限 60 次），只缩不放，不破坏设计字号。

   保护（2026-08-20）：card-definition 等模板的 title 在 .body(flex:1 justify-content:center) 内，
   部分渲染场景下 maxH 测量异常小，60 次循环耗尽后 fontSize 跌到 ~13px 仍"溢出"。
   加 min 保护：fontSize 不低于初始值的 50%（最小 20px），保证可读。
   触发保护说明：宁可文字微溢，也不缩到不可读；模板设计字号（5.2vh≈43px）4 字短词不溢出。 */
(function () {
  function fit(el) {
    var parent = el.parentElement;
    if (!parent) return;
    var maxH = parent.clientHeight - 8;   // 可用高度（留 8px 容差）
    var maxW = parent.clientWidth - 6;    // 可用宽度
    var initFs = parseFloat(window.getComputedStyle(el).fontSize) || 16;
    var minFs = Math.max(20, initFs * 0.5);   // 最小字号保护
    var fs = initFs;
    var guard = 0;
    while (guard < 60 && (el.scrollHeight > maxH || el.scrollWidth > maxW)) {
      fs -= 0.5;
      if (fs < minFs) { el.style.fontSize = minFs + 'px'; break; }
      el.style.fontSize = fs + 'px';
      guard++;
    }
  }
  var els = document.querySelectorAll('[data-fit]');
  for (var i = 0; i < els.length; i++) fit(els[i]);
})();

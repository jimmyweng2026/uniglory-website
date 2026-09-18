/*
 * media-audit.js — 找出"加载成功但没有任何像素"的图片。
 *
 * 为什么需要它：一张损坏或残缺的图片文件可以正常加载（img.complete === true、
 * naturalWidth 正确），但绘制出来是空的。此时页面只会留下一块空白，控制台不报错，
 * 视觉上却像"这里本来就该是空的"——极难发现。
 *
 * 用法（注入到页面里，再读 body[data-media]）：
 *   1. 把本文件复制到 dist/__media.js
 *   2. 在 dist/<page>.html 的 </body> 前插入
 *        <style>.reveal{opacity:1 !important;transform:none !important}</style>
 *        <script src="/__media.js"></script>
 *      （!important 是必需的：无头模式下 CSS transition 不推进，
 *        只加 .visible 类读到的 opacity 仍是 0）
 *   3. Chrome --dump-dom，然后解析 data-media
 *
 * 输出：{"total":n,"empty":[{"src":...,"size":"WxH"}]}
 * empty 不为空即表示有坏资源，必须修复或去掉对应的 <source>/src。
 */
window.addEventListener("load", function () {
	setTimeout(function () {
		var results = [];
		document.querySelectorAll("img").forEach(function (img) {
			var entry = {
				src: (img.getAttribute("src") || "").split("/").pop(),
				size: img.naturalWidth + "x" + img.naturalHeight,
				empty: null,
			};
			try {
				var canvas = document.createElement("canvas");
				canvas.width = 64;
				canvas.height = 64;
				var ctx = canvas.getContext("2d");
				ctx.drawImage(img, 0, 0, 64, 64);
				var data = ctx.getImageData(0, 0, 64, 64).data;
				var sum = 0;
				for (var i = 0; i < data.length; i += 4) {
					sum += data[i] + data[i + 1] + data[i + 2];
				}
				entry.empty = sum === 0;
			} catch (error) {
				entry.empty = "error: " + String(error).slice(0, 60);
			}
			results.push(entry);
		});
		document.body.setAttribute(
			"data-media",
			JSON.stringify({
				total: results.length,
				empty: results.filter(function (r) {
					return r.empty !== false;
				}),
			}),
		);
	}, 1800);
});

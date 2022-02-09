// H5P seems to re-assign this variable so we can't make it constant
// eslint-disable-next-line no-var
var H5P = H5P || {};

/**
 * Yoinked from https://stackoverflow.com/a/33063222.
 * @param {HTMLCanvasElement} canvas
 * @param {MouseEvent} evt
 * @returns Mouse position relative to the canvas.
 */
const getMousePosition = (canvas, evt) => {
	const rect = canvas.getBoundingClientRect();
	return {
		x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
		y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height,
	};
};

H5P.DrawingBoard = (function (_$) {
	/**
	 * @param {Object} options
	 * @param {string} options.description
	 * @param {number} id
	 */
	function C(options, id) {
		this.options = options;
		this.id = id;
	}

	C.prototype.colors = {
		red: 'rgba(255, 0, 0, 1)',
		green: 'rgba(0, 255, 0, 1)',
		blue: 'rgba(0, 0, 255, 1)',
	};

	/**
	 * @memberof C
   	 * @param {JQuery<HTMLElement>} $container
   	 */
	C.prototype.attach = function ($container) {
		$container.addClass('h5p-drawing-board');
		if (this.options.description) {
			$container.append(
				`<h1 class="drawing-board-title">${this.options.description}</h1>`,
			);
		}

		$container.append(
			`<canvas id="drawing-canvas-${this.id}" class="drawing-board-canvas"></canvas>`,
		);

		/** @type {HTMLCanvasElement} */
		const canvas = document.getElementById(`drawing-canvas-${this.id}`);
		const ctx = canvas.getContext('2d');

		canvas.onclick = e => {
			const {x, y} = getMousePosition(canvas, e);
			console.log(`click at: ${x} ${y}`);
			ctx.beginPath();
			ctx.arc(x, y, 10, 0, 2 * Math.PI);
			ctx.fill();
		};
	};

	return C;
})(H5P.jQuery);

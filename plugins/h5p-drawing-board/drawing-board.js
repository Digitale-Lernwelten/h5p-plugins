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

		let brushSize = 2;
		let color = this.colors.red;

		$container.append(`
			<div id="control-container-${this.id}" class="drawing-board-controls">
				<button id="clear-button-${this.id}">Löschen</button>
				<button id="decrease-brush-size-large-${this.id}">&minus;&minus;</button>
				<button id="decrease-brush-size-${this.id}">&minus;</button>
				<p id="brush-size-text-${this.id}">${brushSize}</p>
				<button id="increase-brush-size-${this.id}">&plus;</button>
				<button id="increase-brush-size-large-${this.id}">&plus;&plus;</button>
				<button class="red active" id="red-${this.id}">Rot</button>
				<button class="blue" id="blue-${this.id}">Blau</button>
				<button class="green" id="green-${this.id}">Grün</button>
			</div>
		`);
		const clearButton = document.getElementById(`clear-button-${this.id}`);
		const decreaseBrushSizeButton = document.getElementById(`decrease-brush-size-${this.id}`);
		const decreaseBrushSizeLargeButton = document.getElementById(`decrease-brush-size-large-${this.id}`);
		const increaseBrushSizeButton = document.getElementById(`increase-brush-size-${this.id}`);
		const increaseBrushSizeLargeButton = document.getElementById(`increase-brush-size-large-${this.id}`);
		const brushSizeText = document.getElementById(`brush-size-text-${this.id}`);

		const addToBrushSize = n => {
			if (brushSize + n < 1) {
				return;
			}

			brushSize += n;
			brushSizeText.innerHTML = `${brushSize}`;
		};

		increaseBrushSizeButton.onclick = () => addToBrushSize(1);
		increaseBrushSizeLargeButton.onclick = () => addToBrushSize(5);
		decreaseBrushSizeButton.onclick = () => addToBrushSize(-1);
		decreaseBrushSizeLargeButton.onclick = () => addToBrushSize(-5);

		const redButton = document.getElementById(`red-${this.id}`);
		const blueButton = document.getElementById(`blue-${this.id}`);
		const greenButton = document.getElementById(`green-${this.id}`);

		const setColor = c => {
			color = c;
		};

		redButton.onclick = () => {
			setColor(this.colors.red);
			redButton.classList.add('active');
			greenButton.classList.remove('active');
			blueButton.classList.remove('active');
		};

		blueButton.onclick = () => {
			setColor(this.colors.blue);
			redButton.classList.remove('active');
			blueButton.classList.add('active');
			greenButton.classList.remove('active');
		};

		greenButton.onclick = () => {
			setColor(this.colors.green);
			redButton.classList.remove('active');
			blueButton.classList.remove('active');
			greenButton.classList.add('active');
		};

		$container.append(
			`<canvas id="drawing-canvas-${this.id}" class="drawing-board-canvas" height=500></canvas>`,
		);

		/** @type {HTMLCanvasElement} */
		const canvas = document.getElementById(`drawing-canvas-${this.id}`);
		// necessary to avoid blurryness
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;
		const ctx = canvas.getContext('2d');
		// crank quality
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';

		const clearCanvas = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = 'rgba(255,255,255,1)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		};

		clearButton.onclick = clearCanvas;
		clearCanvas();

		let isDrawing = false;

		canvas.onmousedown = e => {
			if (e.button === 0) {
				isDrawing = true;
			}
		};

		let prevX = 0;
		let prevY = 0;

		canvas.onmousemove = e => {
			const {x, y} = getMousePosition(canvas, e);
			if (isDrawing) {
				ctx.fillStyle = this.colors.red;
				ctx.beginPath();
				ctx.lineCap = 'round';
				ctx.lineWidth = brushSize;
				ctx.strokeStyle = color;
				ctx.moveTo(prevX, prevY);
				ctx.lineTo(x, y);
				ctx.stroke();
				ctx.closePath();
			}

			prevX = x;
			prevY = y;
		};

		canvas.onmouseup = e => {
			if (e.button === 0) {
				isDrawing = false;
			}
		};

		$container.append(`
			<div class="help-container">
				<p>Um das Bild zu speichern, Rechtsklick auf die Zeichenfläche -> Bild speichern als...</p>
			</div>
		`);
	};

	return C;
})(H5P.jQuery);

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
	 * @param {string} options.header
	 * @param {string} options.description
	 * @param {string} options.subDescription
	 * @param {number} id
	 */
	function C(options, id) {
		this.options = options;
		this.id = id;
	}

	C.prototype.coreColors = [
		'#000000',
		'#FFFFFF',
		'#E2E4E7',
		'#AAAFB7',
		'#3E444D',
		'#FF0000',
		'#FFFF00',
		'#00ff00',
		'#002BFF',
	];

	C.prototype.extendedColors = [
		'#CFE2EC',
		'#D8C7D3',
		'#DEE6CD',
		'#FFEAC7',
		'#B1D3D6',
		'#257DA7',
		'#A4247C',
		'#77952E',
		'#D69834',
		'#2595A7',
		'#1E3E51',
		'#5B184A',
		'#4E641A',
		'#684200',
		'#0A5E65',
	];

	C.prototype.clearActiveColors = () => {
		document.querySelectorAll('.color-button.active')
			.forEach(e => e.classList.remove('active'));
	};

	C.prototype.clearActiveThickness = () => {
		document.querySelectorAll('.thickness-container>div.active')
			.forEach(e => e.classList.remove('active'));
	};

	/**
	 * @memberof C
   	 * @param {JQuery<HTMLElement>} $container
   	 */
	C.prototype.attach = function ($container) {
		$container.addClass('h5p-drawing-board');
		const {header, description, subDescription} = this.options;
		if (header) {
			$container.append(
				`<h1 class="drawing-board-title">${header}</h1>`,
			);
		}

		if (description) {
			$container.append(
				`<p class="drawing-board-description">${description}</p>`,
			);
		}

		const {id} = this;
		$container.append(`
			<div id="control-container-${id}" class="drawing-board-controls">
				<div id="pen-button-${id}" class="tool-button pen-button active"></div>
				<div id="eraser-button-${id}" class="tool-button eraser-button"></div>
				<div id="thickness-container-${id}" class="thickness-container">
					<div id="thic-${id}" class="active" />
					<div id="thicc-${id}" />
					<div id="thiccc-${id}" />
					<div id="thicccc-${id}" />
				</div>
				<div id="color-container-${id}" class="color-container">
					<div id="core-colors-${id}" class="core-colors"></div>
					<div id="extended-colors-${id}" class="extended-colors"></div>
				</div>
			</div>
		`);
		let color = this.coreColors[0];

		let lastColor = color;

		const penButton = document.getElementById(`pen-button-${id}`);
		penButton.onclick = () => {
			eraserButton.classList.remove('active');
			penButton.classList.add('active');
			color = lastColor;
		};

		const eraserButton = document.getElementById(`eraser-button-${id}`);
		eraserButton.onclick = () => {
			penButton.classList.remove('active');
			eraserButton.classList.add('active');
			lastColor = color;
			color = '#FFFFFF';
		};

		const thicknessButtons = [
			document.getElementById(`thic-${id}`),
			document.getElementById(`thicc-${id}`),
			document.getElementById(`thiccc-${id}`),
			document.getElementById(`thicccc-${id}`),
		];
		const brushThicknesses = [3, 8, 12, 20];
		let brushSize = brushThicknesses[0];
		thicknessButtons.forEach((t, i) => {
			t.onclick = () => {
				this.clearActiveThickness();
				brushSize = brushThicknesses[i];
				t.classList.add('active');
			};
		});

		const coreColorDiv = document.getElementById(`core-colors-${id}`);

		this.coreColors.forEach((c, i) => {
			const d = document.createElement('div');
			d.classList.add('color-button');
			if (i === 0) {
				d.classList.add('active');
			}

			d.style.backgroundColor = c;
			d.onclick = () => {
				color = c;
				this.clearActiveColors();
				d.classList.add('active');
				penButton.classList.add('active');
				eraserButton.classList.remove('active');
			};

			coreColorDiv.appendChild(d);
		});

		const extendedColorDiv = document.getElementById(`extended-colors-${id}`);

		this.extendedColors.forEach(c => {
			const d = document.createElement('div');
			d.style.backgroundColor = c;
			d.classList.add('color-button');
			d.onclick = () => {
				color = c;
				this.clearActiveColors();
				d.classList.add('active');
				penButton.classList.add('active');
				eraserButton.classList.remove('active');
			};

			extendedColorDiv.appendChild(d);
		});

		$container.append(
			`<canvas id="drawing-canvas-${id}" class="drawing-board-canvas" height=500></canvas>`,
		);

		/** @type {HTMLCanvasElement} */
		const canvas = document.getElementById(`drawing-canvas-${id}`);
		// necessary to avoid blurryness
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;
		const ctx = canvas.getContext('2d');
		// ctx.translate(0.5, 0.5);
		// crank quality
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';

		const clearCanvas = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = 'rgba(255,255,255,1)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		};

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

		if (subDescription) {
			$container.append(`
				<div class="help-container">
					<p>${subDescription}</p>
				</div>
			`);
		}
	};

	return C;
})(H5P.jQuery);

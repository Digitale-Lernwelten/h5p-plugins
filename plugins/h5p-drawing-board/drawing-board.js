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
	 * @param {boolean} options.hideText
	 * @param {Object | undefined} options.image
	 * @param {string | undefined} options.backgroundColor
	 * @param {string} options.fileName
	 * @param {boolean} options.devMode
	 * @param {string} options.buttonNew
	 * @param {string} options.buttonSave
	 * @param {string} options.buttonFulls
	 * @param {number} id
	 */
	function C(options, id) {
		this.options = options;
		this.id = id;
	}

	C.prototype.coreColors = [
		'#000000',
		'#E2E4E7',
		'#FF0000',
		'#FFFFFF',
		'#AAAFB7',
		'#FFFF00',
		'#00ff00',
		'#3E444D',
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

	C.prototype.timenow = function () {
		const pad = (n, s = 2) => (`${new Array(s).fill(0)}${n}`).slice(-s);
		const d = new Date();

		return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
	};

	C.prototype.log = function (...msg) {
		if (this.options.devMode) {
			console.log(`[${this.timenow()}]: `, ...msg);
		}
	};

	/**
	 * @memberof C
   	 * @param {JQuery<HTMLElement>} $container
   	 */
	C.prototype.attach = async function ($container) {
		const version = '0.0.2';
		const {majorVersion, minorVersion} = this.libraryInfo;
		this.log(`initializing H5P Drawing Board (v${version} | ${majorVersion}.${minorVersion})`);
		$container.addClass('h5p-drawing-board');
		const {header, description, hideText, buttonNew, buttonSave, buttonFulls, buttonFullsExit} = this.options;
		const {id} = this;
		const {hostname} = window.location;
		const LOCAL_STORAGE_KEY = `h5p-drawing-board-canvas-storage-${version}-${hostname}-${id}`;
		this.log(`using localstorage key: ${LOCAL_STORAGE_KEY}`);
		this.log(`initial container size: ${$container.width()}x${$container.height()}`);
		if (!hideText) {
			if (header) {
				this.log('appending header');
				$container.append(
					`<h1 id="drawing-board-title-${id}" class="drawing-board-title">${header}</h1>`,
				);
			}

			if (description) {
				this.log('appending description');
				$container.append(
					`<p id="drawing-board-description-${id}" class="drawing-board-description">${description}</p>`,
				);
			}
		}

		const title = document.getElementById(`drawing-board-title-${id}`);
		const descr = document.getElementById(`drawing-board-description-${id}`);

		$container.append(`
			<div id="control-container-${id}" class="drawing-board-controls">
				<div id="pen-button-${id}" class="tool-button pen-button active"></div>
				<div id="eraser-button-${id}" class="tool-button eraser-button"></div>
				<div id="thickness-container-${id}" class="thickness-container">
					<div id="thick-1-${id}" class="active" />
					<div id="thick-2-${id}" />
					<div id="thick-3-${id}" />
					<div id="thick-4-${id}" />
				</div>
				<div id="color-container-${id}" class="color-container">
					<div id="core-colors-${id}" class="core-colors"></div>
					<div id="extended-colors-${id}" class="extended-colors"></div>
				</div>
			</div>
		`);

		let color = this.coreColors[0];

		let lastColor = color;
		let isEraser = false;
		let mode = 'pen';

		const penButton = document.getElementById(`pen-button-${id}`);
		penButton.onclick = () => {
			eraserButton.classList.remove('active');
			penButton.classList.add('active');
			color = lastColor;
			isEraser = false;
			mode = 'pen';
			this.log(`swapped to ${mode} eraser`);
		};

		const eraserButton = document.getElementById(`eraser-button-${id}`);
		eraserButton.onclick = () => {
			penButton.classList.remove('active');
			eraserButton.classList.add('active');
			lastColor = color;
			color = '#FFFFFF';
			isEraser = true;
			mode = 'eraser';
			this.log(`swapped to ${mode} eraser`);
		};

		const thicknessButtons = [
			document.getElementById(`thick-1-${id}`),
			document.getElementById(`thick-2-${id}`),
			document.getElementById(`thick-3-${id}`),
			document.getElementById(`thick-4-${id}`),
		];
		const brushThicknesses = [3, 8, 12, 20];
		let brushSize = brushThicknesses[0];
		thicknessButtons.forEach((t, i) => {
			t.onclick = () => {
				this.clearActiveThickness();
				brushSize = brushThicknesses[i];
				t.classList.add('active');
				this.log(`switched to thickness: ${i}`);
				if (mode === 'eraser') {
					isEraser = true;
				}
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
			if (c === '#00ff00') {
				d.style.visibility = 'hidden';
			}

			d.onclick = () => {
				color = c;
				isEraser = false;
				mode = 'pen';
				this.log(`switched color to: ${c}`);
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
				isEraser = false;
				mode = 'pen';
				color = c;
				this.log(`switched color to: ${c}`);
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
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;
		const ctx = canvas.getContext('2d');
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';

		const drawBackgroundImage = async () => {
			if (this.options.image) {
				const backgroundImagePath = H5P.getPath(this.options.image.path, id);
				canvas.style.background = `url(${backgroundImagePath})`;
				canvas.style.backgroundSize = 'contain';
				canvas.style.backgroundRepeat = 'no-repeat';

				// scale image to canvas
				// then adjust canvas to properly fit image
				const t = new Image();
				t.src = backgroundImagePath;
				await t.decode();
				const fac = canvas.width / t.width;
				const w = Math.ceil(t.width * fac);
				const h = Math.ceil(t.height * fac);
				canvas.width = w;
				canvas.height = h;
				this.log(`resizing canvas to ${w}x${h}`);
			} else if (this.options.backgroundColor) {
				canvas.style.backgroundColor = this.options.backgroundColor;
			} else {
				ctx.fillStyle = 'rgba(255, 255, 255, 1)';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}
		};

		const clearCanvas = async () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			await drawBackgroundImage();
		};

		const loadImage = async () => {
			const storedCanvas = localStorage.getItem(LOCAL_STORAGE_KEY);
			await drawBackgroundImage();
			this.trigger('resize');
			if (storedCanvas !== null) {
				this.log('using stored canvas');
				const img = new Image();
				img.src = storedCanvas;
				await img.decode();
				ctx.drawImage(img, 0, 0);
				this.trigger('resize');
			}
		};

		await loadImage();

		const saveCanvas = () => {
			localStorage.setItem(LOCAL_STORAGE_KEY, canvas.toDataURL());
			this.log('saved canvas to storage');
		};

		const clearStorage = () => {
			localStorage.removeItem(LOCAL_STORAGE_KEY);
			this.log('deleted canvas from storage');
		};

		let isDrawing = false;

		canvas.onmousedown = e => {
			if (e.button === 0) {
				isDrawing = true;
				this.log('[mouse]: enabled drawing mode');
			}
		};

		let prevX = 0;
		let prevY = 0;
		canvas.ontouchstart = e => {
			e.preventDefault();
			isDrawing = true;
			const {x, y} = getMousePosition(canvas, e.touches[0]);
			prevX = x;
			prevY = y;
			this.log('[touch]: enabled drawing mode');
		};

		/**
		 * @param {number} x
		 * @param {number} y
		 */
		const draw = (x, y) => {
			this.log(`draw call: (${prevX.toFixed(3)}, ${prevY.toFixed(3)}) => (${x.toFixed(3)}, ${y.toFixed(3)})`);
			ctx.beginPath();
			ctx.lineCap = 'round';
			ctx.lineWidth = brushSize;
			ctx.strokeStyle = color;
			ctx.moveTo(prevX, prevY);
			ctx.lineTo(x, y);
			ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
			ctx.stroke();
			ctx.closePath();
		};

		canvas.onmousemove = e => {
			const {x, y} = getMousePosition(canvas, e);
			if (isDrawing) {
				draw(x, y);
			}

			prevX = x;
			prevY = y;
		};

		canvas.ontouchmove = e => {
			e.preventDefault();
			const {x, y} = getMousePosition(canvas, e.touches[0]);
			if (isDrawing) {
				draw(x, y);
			}

			prevX = x;
			prevY = y;
		};

		canvas.onmouseup = e => {
			if (e.button === 0) {
				isDrawing = false;
				if (isEraser) {
					isEraser = false;
				}

				saveCanvas();
				this.log('[mouse]: disabled drawing mode');
			}
		};

		canvas.ontouchend = e => {
			e.preventDefault();
			isDrawing = false;
			if (isEraser) {
				isEraser = false;
			}

			prevX = 0;
			prevY = 0;
			saveCanvas();
			this.log('[touch]: disabled drawing mode');
		};

		$container.append(`
			<div class="bottom-controls-container">
				<button id="clear-button-${id}" class="bottom-button">${buttonNew}</button>
				<button id="save-button-${id}" class="bottom-button">${buttonSave}</button>
				<button id="fullscreen-button-${id}" class="bottom-button">${buttonFulls}</button>
			</div>
		`);

		const clearButton = document.getElementById(`clear-button-${id}`);

		clearButton.onclick = () => {
			clearCanvas();
			clearStorage();
		};

		const fullscreenButton = document.getElementById(`fullscreen-button-${id}`);

		fullscreenButton.onclick = () => {
			if (H5P.isFullscreen) {
				H5P.exitFullScreen();
			} else {
				H5P.fullScreen($container, this);
			}
		};

		this.on('enterFullScreen', () => {
			this.log('entering fullscreen');
			fullscreenButton.innerHTML = buttonFullsExit;
			title.style.display = 'none';
			descr.style.display = 'none';
		});
		this.on('exitFullScreen', () => {
			this.log('exiting fullscreen');
			fullscreenButton.innerHTML = buttonFulls;
			title.style.display = 'block';
			descr.style.display = 'block';
		});

		const saveButton = document.getElementById(`save-button-${id}`);

		saveButton.onclick = async () => {
			const downloadLink = document.createElement('a');
			downloadLink.setAttribute('download', 'zeichnung.png');
			// https://stackoverflow.com/a/58652379
			if (this.options.image) {
				const canvasData = canvas.toDataURL('image/png');
				const backgroundImagePath = H5P.getPath(this.options.image.path, id);
				const bgImg = new Image();
				bgImg.src = backgroundImagePath;
				await bgImg.decode();
				ctx.globalCompositeOperation = 'source-over';
				const fac = canvas.width / bgImg.width;
				ctx.drawImage(bgImg, 0, 0, bgImg.width * fac, bgImg.height * fac);
				const img = new Image();
				img.src = canvasData;
				await img.decode();
				ctx.drawImage(img, 0, 0, img.width, img.height);
			} else if (this.options.backgroundColor) {
				const canvasData = canvas.toDataURL('image/png');
				ctx.fillStyle = this.options.backgroundColor;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				const img = new Image();
				img.src = canvasData;
				await img.decode();
				ctx.drawImage(img, 0, 0);
			}

			const dataURL = canvas.toDataURL('image/png');
			const url = dataURL.replace(/^data:image\/png/, 'data:application/octet-stream');
			downloadLink.setAttribute('href', url);
			downloadLink.click();
		};

		this.log(`post-setup container size: ${$container.width()}x${$container.height()}`);
	};

	return C;
})(H5P.jQuery);

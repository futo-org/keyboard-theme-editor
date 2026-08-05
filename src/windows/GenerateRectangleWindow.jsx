import { colorField } from "../panels/colors";
import AssetStore from "../systems/assets";
import Ui from "../ui"

function generateRoundedRect(width, height, roundPercent, tint, padding) {
	const canvas = document.createElement('canvas');
	canvas.width = width + padding * 2;
	canvas.height = height + padding * 2;
	const ctx = canvas.getContext('2d');

	const maxRadius = Math.min(width, height) / 2;
	const radius = maxRadius * (roundPercent / 100);

	ctx.fillStyle = tint;
	ctx.beginPath();
	ctx.roundRect(padding, padding, width, height, radius);
	ctx.fill();

	return canvas;
}


const local = {};

let numRects = 0;
function contents() {
	let backgroundColor = "#ffffff";
	let foregroundColor = "#000000";

	const previewBg = (newColor) => {
		backgroundColor = newColor;
		update();
	}
	const previewFg = (newColor) => {
		foregroundColor = newColor;
		update();
	}

	const dom = Ui.namespaced(local, "rectangleGenerator", () => <div className="rectanglegen-window">
		<div className="rectanglegen-preview" id="preview">
		</div>

		<div className="rectanglegen-opts">
			<div>
				<label className="label-left" for="scale">Diagonal: </label>
				<input type="range" id="scale" min="64" max="256" value="170" />
				<span id="scaleVal">170</span>px
			</div>
			<div>
				<label className="label-left" for="aspect">Aspect: </label>
				<input type="range" id="aspect" min="0.5" max="2.0" step="0.01" value="1.0" />
				<span id="aspectVal">0.5</span>
			</div>
			<div>
				<label className="label-left" for="round">Roundedness: </label>
				<input type="range" id="round" min="0" max="100" value="70" />
				<span id="roundVal">70</span>%
			</div>
			<div>
				<label className="label-left">Background: </label>
				{colorField("BG color", "", {}, () => backgroundColor, previewBg, previewBg)}
			</div>
			<div>
				<label className="label-left">Text: </label>
				{colorField("FG color", "", {}, () => foregroundColor, previewFg, previewFg)}
			</div>
			<div>
				<label className="label-left" for="padding">Padding: </label>
				<input type="range" id="padding" min="0" max="64" value="0" />
				<span id="paddingVal">0</span>px
			</div>
			<div className="action-buttons">
				<button explicit onClick={_ev => {
					Ui.closeWindow(RectangleWindow);
				}}>Cancel</button>
				<button explicit onClick={_ev => {
					insertRectangle();
					Ui.closeWindow(RectangleWindow);
				}}>Insert</button>
			</div>
		</div>
	</div>);

	let prevCanvas = undefined;
	function insertRectangle() {
		if(prevCanvas === undefined) return;

		(async () => {
			const bg = backgroundColor;
			backgroundColor = "#ffffff";
			update();
			const blob = await new Promise((res) => prevCanvas.toBlob(res));
			backgroundColor = bg;

			const round = +local.round.value;
			const padding = +local.padding.value;
			const width = prevCanvas.width;
			const height = prevCanvas.height;

			const rectWidth = width - 2*padding;
			const rectHeight = height - 2*padding;

			const xBegin = (rectWidth / 2) * (round / 100) + padding;
			const xEnd   = width - xBegin;

			const yBegin = (rectHeight / 2) * (round / 100) + padding;
			const yEnd   = height - yBegin;

			const override = {
				slicing: {
					left: xBegin / width,
					right: xEnd / width,
					top: yBegin / height,
					bottom: yEnd / height
				},
				padding: {
					left: padding / width,
					right: padding / width,
					top: padding / height,
					bottom: padding / height,
				},

				colorKind: "constant",
				foregroundConstant: foregroundColor,
				backgroundConstant: backgroundColor
			};

			numRects += 1;
			AssetStore.add(blob, "background", "rectangle" + numRects + ".png", override);
		})();
	}


	function update() {
		const scale = +local.scale.value;
		const aspect = +local.aspect.value;
		const round = +local.round.value;
		const padding = +local.padding.value;

		local.scaleVal.textContent   = scale;
		local.aspectVal.textContent  = aspect;
		local.roundVal.textContent   = round;
		local.paddingVal.textContent = padding;

		const diag = scale;
		const w = diag / Math.sqrt(1 + aspect * aspect);
		const h = w * aspect;

		const canvas = generateRoundedRect(w, h, round, backgroundColor, padding);
		const out = local.preview;
		out.innerHTML = '';
		out.appendChild(canvas);
		out.appendChild(<div className="fg-text" style={`color: ${foregroundColor}; font-size: ${scale/4}px;`}>Abc</div>)
		prevCanvas = canvas;
	}

	dom.querySelectorAll('input').forEach(i => i.addEventListener('input', update));
	update();

	return dom;
}

const RectangleWindow = {
	name: "Generate rectangle",
	contents: contents,
	persist: true,
}

export default RectangleWindow;

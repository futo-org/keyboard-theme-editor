import { HEXtoRGB } from '../../core/keyboard/color';
import { HSVtoRGB, RGBtoHEX, RGBtoHSV } from '../color';
import Ui from "../ui";

function updateColor(newHex) {
	currField.element.value = newHex;
	currField.element.dispatchEvent(new InputEvent("input"));
}

function updateCurrHsv(overrides) {
	if(currField === undefined) return;
	currField.hsv = { ...currField.hsv, ...overrides };
	updateColor(RGBtoHEX(HSVtoRGB(currField.hsv)));
}

function updateCurrRgb(overrides) {
	if(currField === undefined) return;

	const currColor = HEXtoRGB(currField.element.value);
	const newColor = { ...currColor, ...overrides };

	currField.hsv = RGBtoHSV(newColor);
	updateColor(RGBtoHEX(newColor));
}

function clamp01(v) {
	return Math.min(1, Math.max(0, v));
}


function onSVEvent(ev, _kind) {
	ev.preventDefault();
	const box = Ui.id.hsvSvBox;
	const rect = box.getBoundingClientRect();

	const x = ev.clientX;
	const y = ev.clientY;

	const s = clamp01((x - rect.left) / rect.width);
	const v = clamp01(1 - (y - rect.top) / rect.height);

	updateCurrHsv({s, v});
}

function onHEvent(ev, _kind) {
	ev.preventDefault();
	const box = Ui.id.hsvSvBox;
	const rect = box.getBoundingClientRect();
	const y = ev.clientY;
	const h = clamp01((y - rect.top) / rect.height);

	updateCurrHsv({h});
}

function onComponentEvent(component, ev, _kind) {
	ev.preventDefault();
	const box = Ui.id.colorComponents.children[component].children[1];
	const rect = box.getBoundingClientRect();
	const x = ev.clientX;
	const v = clamp01((x - rect.left) / rect.width);
	RGBComponentMode.components[component].update(v, true);
}

function onComponentInputEvent(component, ev, final) {
	const v = ev.target.value;
	RGBComponentMode.components[component].update(v, false);

	if(!final && ev.target.value !== v) {
		ev.target.value = v;
	}
}

function onHexInput(ev) {
	const newHexValue = ev.target.value;
	if(!newHexValue.startsWith("#")) return;
	if(!(newHexValue.length === 7 || newHexValue.length === 9)) return;

	const newRGB = HEXtoRGB(newHexValue);
	if(!isFinite(newRGB.r) || !isFinite(newRGB.g) || !isFinite(newRGB.b) || !isFinite(newRGB.a)) return;

	updateCurrRgb(newRGB);

	ev.target.blur();
}

let currField = undefined;
function colorWindowContents() {
	return <div id="colorWindow" style="padding: 8px;">
		<h1 id="colorName">Untargeted color picker</h1>

		<div className="hsv-main">
			<div className="hsv-sv-box" id="hsvSvBox" detectPointer={onSVEvent}>
				<div className="col-dot"></div>
			</div>
			<div className="hsv-hue" id="hsvHue" detectPointer={onHEvent}>
				<div className="col-line"></div>
			</div>
		</div>
		<div className="components" id="colorComponents">
			{["R", "G", "B", "A"].map((v, i) =>
				<div className="component">
					<div className="component-label">{v}</div>
					<div className="component-slider" detectPointer={(ev, k) => onComponentEvent(i, ev, k)}>
						<div className="col-line-hor"></div>
					</div>
					<input type="number" value="255"
						onInput={(ev) => onComponentInputEvent(i, ev, false)}
						onChange={(ev) => onComponentInputEvent(i, ev, true)}
					/>
				</div>
			)}
		</div>

		<div id="colorBox" className="color-box"></div>
		<input type="text" id="hexInput" onChange={onHexInput} />
		<div id="recentColors" className="recent-colors"></div>
		<div className="action-buttons" id="colorPickerActionButtons">
			<button explicit onClick={_e => {
				cancelPicker();
				Ui.closeWindow(ColorPickerWindow);
			}}>Cancel</button>
			<button explicit onClick={_e => {
				applyPicker();
				Ui.closeWindow(ColorPickerWindow);
			}}>Apply</button>
		</div>
	</div>
}

function cancelPicker() {
	if(currField === undefined) return;
	updateColor(currField.originalColor);
	if(currField.cancel) currField.cancel();
	currField = undefined;
}

function applyPicker() {
	if(currField === undefined) return;

	ColorPickerWindow.recentColors.unshift(currField.element.value.toLowerCase());
	ColorPickerWindow.recentColors = [...new Set(ColorPickerWindow.recentColors)];
	while(ColorPickerWindow.recentColors.length > 24) ColorPickerWindow.recentColors.pop();

	if(currField.originalColor !== currField.element.value) {
		currField.element.dispatchEvent(new InputEvent("change"));
	}

	currField = undefined;
}

function retargetColorWindow(newField) {
	if(currField !== undefined) {
		if(currField.element === newField.element) {
			return;
		}
		currField.element.removeEventListener("input", fieldChangeEvent);
		applyPicker();
	}

	currField = newField;
	let value = currField.element.value ?? currField.element.getAttribute("value");
	if(!value || value === "#") {
		console.error("There is no color! Setting red...", currField);
		updateColor("#FF0000");
	}

	currField.element.value = value;
	currField.originalColor = value;
	currField.element.addEventListener("input", fieldChangeEvent);
	currField.hsv = RGBtoHSV(HEXtoRGB(currField.element.value));

	Ui.id.colorName.innerText = currField.name;

	const btns = Ui.id.colorPickerActionButtons;
	Array.from(btns.children).forEach((v) => {
		if(v.getAttribute("explicit") != "true") {
			v.remove();
		}
	});

	if(currField.getActions !== undefined) currField.getActions().forEach((v) => {
		const btn = <button onClick={_ev => {
			v.action();
			currField = undefined;
			Ui.closeWindow(ColorPickerWindow);
		}}>{v.name}</button>
		btns.insertBefore(btn, btns.children[btns.children.length - 1]);
	});


	const recentColors = [...ColorPickerWindow.recentColors];
	const rcelem = Ui.id.recentColors;
	rcelem.replaceChildren(
		...recentColors.map((v) =>
			<div className="recent-color" style={`--color: ${v}`} onclick={_ev => {
				const newRgb = HEXtoRGB(v);
				updateCurrRgb(newRgb);
			}}></div>
		))

	fieldChangeEvent();
}


const makeRGBComponent = (name, maxV) => {return {
	"name": name.toUpperCase(),
	"getGradient": () => {
		const rgba = HEXtoRGB(currField.element.value);
		const min = { ...rgba, a: 1.0 };
		min[name] = 0;
		const max = { ...rgba, a: 1.0 };
		max[name] = maxV;

		return `linear-gradient(to right, ${RGBtoHEX(min)}, ${RGBtoHEX(max)})` + (name === 'a' ? ', var(--tg-checker)' : '');
	},
	"update": (newValue, isNorm) => {
		const obj = {};
		obj[name] = newValue * (isNorm ? maxV : 1);
		updateCurrRgb(obj);
	},
	"getValue": () => {
		const rgba = HEXtoRGB(currField.element.value);
		return [rgba[name], rgba[name] / maxV];
	},
	"maxV": maxV
}};
const RGBComponentMode = {
	"components": [
		makeRGBComponent("r", 255), makeRGBComponent("g", 255), makeRGBComponent("b", 255), makeRGBComponent("a", 1.0)
	]
}


function fieldChangeEvent() {
	if(currField === undefined) return;
	Ui.id.colorBox.style.setProperty("--color", currField.element.value);
	//Ui.id.colorBox.innerText = JSON.stringify(toHCT(currField.element.value));
	Ui.id.hexInput.value = currField.element.value;

	const currHue = currField.hsv.h;
	const maxCol = RGBtoHEX(HSVtoRGB(currHue, 1, 1));

	Ui.id.hsvSvBox.style.background = `linear-gradient(to top, black, white), linear-gradient(to right, transparent, ${maxCol})`;
	Ui.id.hsvSvBox.style.backgroundBlendMode = "multiply";

	let hueColors = [];
	for(let h=0; h<1; h+=0.1) {
		hueColors.push(RGBtoHEX(HSVtoRGB(h, 1, 1)));
	}

	Ui.id.hsvHue.style.background = `linear-gradient(to bottom, ${hueColors.join(", ")})`;

	const line = Ui.query(".hsv-hue .col-line")[0];
	line.style.top = currHue * 100 + "%";

	const dot = Ui.query(".hsv-sv-box .col-dot")[0];
	dot.style.left = currField.hsv.s * 100 + "%";
	dot.style.top  = (1-currField.hsv.v) * 100 + "%";
	dot.style.backgroundColor = currField.element.value;
	dot.style.outlineColor = currField.hsv.v > 0.5 ? "black" : "white";


	const currMode = RGBComponentMode;
	const components = Ui.id.colorComponents.children;

	currMode.components.forEach((v, i) => {
		components[i].children[0].innerText = v.name;
		components[i].children[1].style.background = v.getGradient();

		const [val, valNorm] = v.getValue();
		components[i].children[2].value = val;
		components[i].children[2].min = 0;
		components[i].children[2].max = v.maxV;
		components[i].children[2].step = v.maxV > 1 ? 1 : 0.1;
		components[i].children[1].children[0].style.left = valNorm * 100 + "%";
	});
}

const ColorPickerWindow = {
	name: "Color",
	contents: colorWindowContents,
	retargetColorWindow: retargetColorWindow,
	getCurrentElement: () => currField?.element,
	onClose: applyPicker,

	recentColors: ["#ff0000", "#00ff00", "#0000ff", "#00ffff", "#ff00ff", "#ffff00", "#ffffff", "#000000"]
};

export default ColorPickerWindow;

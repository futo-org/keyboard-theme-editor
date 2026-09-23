import Ui from "../ui";
import State from "../state";
import WorkCanvas from "./workcanvas";
import { DEFAULT_THEME } from '../../core/keyboard/types/Theme';
import ColorPickerWindow from "../windows/ColorPickerWindow";
import { HEXtoRGB } from "../../core/keyboard/color";
import { fromHCT, toHCT, RGBtoHEX } from "../color";

const ColorsPanel = {
	build: colorsPanel,
	elements: {}
};

const EV_COLOR = "colorEdited";
export function colorField(name, event, colorPickState, get, preview, set) {
	const updateCol = (_v) => {
		const col = get();
		if(col === undefined || col === null) return;

		const el = colorPickState.element;
		const elpar = el.parentElement;
		el.value = col;

		const isInherited = State.theme.internal.inheritedColors[name] === true;
		if(isInherited) {
			el.classList.add("inherited");
			if(elpar.parentElement === Ui.id.manualColors) {
				Ui.id.manualColors.removeChild(elpar);
				Ui.id.autoColors.appendChild(elpar);
			}
		} else {
			el.classList.remove("inherited");
			if(elpar.parentElement === Ui.id.autoColors) {
				Ui.id.autoColors.removeChild(elpar);
				Ui.id.manualColors.appendChild(elpar);
			}
		}

		el.dispatchEvent(new InputEvent("input"));
	};
	if(event) State.ev.listen(event, updateCol);
	State.ev.listen(State.EV_LOADED, updateCol);

	colorPickState.name = name;

	return Ui.namespaced(colorPickState, "colorField", () => <div className="color-field">
		<div type="color" className="color-input" style={`--color: ${get()}`} value={get()} onChange={(e) => {
			set(e.target.value);
		}} onInput={(e) => {
			preview(e.target.value);
			e.target.style.setProperty("--color", e.target.value);
		}} onClick={(e) => {
			e.preventDefault();
			Ui.showWindow(ColorPickerWindow);
			ColorPickerWindow.retargetColorWindow(colorPickState);
		}} onCreate={el => {
			ColorsPanel.elements[name] = el;
			el.addEventListener("inheritReflow", updateCol);
		}} id="element" />
		<label for="element">{name}</label>
	</div>);
}

function colorSections(name, children) {
	return <div>
		<h4 className="color-section-header">Manual</h4>
		<div id="manualColors" className="color-fields">{children}</div>
		<h4 className="color-section-header">Auto <span className="question-hint" title="These colors derive from other colors by default for easier editing. You can change any of them to manual.">{Ui.iconEl("circle-question", "regular")}</span></h4>
		<div id="autoColors" className="color-fields"></div>
	</div>
}


const reHCT = (params) => {
	return (colors) => {
		const base = params.baseref ?? params.base;
		const light = params.light ?? params.both;
		const dark = params.dark ?? light;
		const ref = params.baseref ?? (params.ref ?? "background");


		const refHct = toHCT(colors[ref] ?? ref);
		const hct = toHCT(colors[base] ?? base);

		if(base === "keyboardContainer") {
			console.log(params, refHct, hct);
		}

		let activeOverrides = (refHct.t < 50) ? dark : light;
		activeOverrides = {...activeOverrides};

		let alphaComposite = 1.0;
		for(const k of Object.keys(activeOverrides)) {
			if(k.startsWith("a") && k.length == 2) {
				const tk = k.slice(1);
				activeOverrides[tk] = hct[tk] + activeOverrides[k];
			}
		}
		let newColor = fromHCT({...hct, ...activeOverrides});

		if(base === "keyboardContainer") {
			console.log("    ", hct, activeOverrides, newColor);
		}

		if(alphaComposite < 1.0) {
			let oldRGB = HEXtoRGB(colors[base] ?? base);
			let intermediateRGB = HEXtoRGB(newColor);

			let newRGB = {
				r: intermediateRGB.r * alphaComposite + oldRGB.r * (1 - alphaComposite),
				g: intermediateRGB.g * alphaComposite + oldRGB.g * (1 - alphaComposite),
				b: intermediateRGB.b * alphaComposite + oldRGB.b * (1 - alphaComposite),
				a: 1.0
			}

			newColor = RGBtoHEX(newRGB);
		}

		return newColor;
	};
}

// Loosely based on androidx.compose.material3.tokens.ColorLightTokens and ColorDarkTokens
// These need to be specified in an order where a base color comes before its first use
const InheritableColors = {
	background:                 reHCT({baseref: "keyboardSurface", light: {t: 98}, dark: {t: 6}}),
	surface:                    reHCT({base: "background"}),
	surfaceVariant:             reHCT({base: "background", light: {t: 90, ac: 4, ah: 8}, dark: {t: 30, ac: 4, ah: 8}}),
	inverseSurface:             reHCT({base: "background", light: {t: 20}, dark: {t: 90}}),
	surfaceTint:                reHCT({base: "primary"}),

	onBackground:               reHCT({baseref: "background", light: {t: 10}, dark: {t: 90}}),
	onSurface:                  reHCT({baseref: "surface", light: {t: 10}, dark: {t: 90}}),
	onSurfaceVariant:           reHCT({baseref: "surfaceVariant", light: {t: 30}, dark: {t: 80}}),
	inverseOnSurface:           reHCT({baseref: "background", light: {t: 95}, dark: {t: 20}}),

	inversePrimary:             reHCT({base: "primary", light: {t: 80}, dark: {t: 40}}),

	secondary:                  reHCT({base: "primary", light: {ah: -30, t: 40}, dark: {ah: -30, t: 80}}),
	tertiary:                   reHCT({base: "primary", light: {ah: -90, t: 40}, dark: {ah: -90, t: 80}}),

	onPrimary:                  reHCT({baseref: "primary", light: {t: 10}, dark: {t: 90}}),
	onSecondary:                reHCT({baseref: "secondary", light: {t: 20}, dark: {t: 100}}),
	onTertiary:                 reHCT({baseref: "tertiary", light: {t: 20}, dark: {t: 100}}),

	primaryContainer:           reHCT({base: "primary", light: {t: 90}, dark: {t: 30}}),
	secondaryContainer:         reHCT({base: "secondary", light: {t: 90}, dark: {t: 30}}),
	tertiaryContainer:          reHCT({base: "tertiary", light: {t: 90}, dark: {t: 30}}),

	onPrimaryContainer:         reHCT({baseref: "primaryContainer", light: {t: 10}, dark: {t: 90}}),
	onSecondaryContainer:       reHCT({baseref: "secondaryContainer", light: {t: 10}, dark: {t: 90}}),
	onTertiaryContainer:        reHCT({baseref: "tertiaryContainer", light: {t: 10}, dark: {t: 90}}),

	error:                      reHCT({base: "#FF0000", light: {t: 40}, dark: {t: 80}}),
	errorContainer:             reHCT({baseref: "error", light: {t: 30}, dark: {t: 90}}),

	onError:                    reHCT({baseref: "error", light: {t: 20}, dark: {t: 100}}),
	onErrorContainer:           reHCT({baseref: "errorContainer", light: {t: 10}, dark: {t: 90}}),

	outline:                    reHCT({base: "surface", light: {t: 50, a: 0.8}, dark: {t: 60, a: 0.8}}),
	outlineVariant:             reHCT({base: "surface", light: {t: 80, a: 0.4}, dark: {t: 30, a: 0.4}}),

	scrim:                      reHCT({base: "surface", both: {t: 0}}),

	surfaceBright:              reHCT({base: "surface", light: {t: 98}, dark: {t: 24}}),
	surfaceDim:                 reHCT({base: "surface", light: {t: 87}, dark: {t: 6}}),
	surfaceContainer:           reHCT({baseref: "surface", light: {at: -4}, dark: {at: 6}}),
	surfaceContainerHigh:       reHCT({baseref: "surfaceContainer", light: {at: -2}, dark: {at: 5}}),
	surfaceContainerHighest:    reHCT({baseref: "surfaceContainer", light: {at: -4}, dark: {at: 10}}),
	surfaceContainerLow:        reHCT({baseref: "surfaceContainer", light: {at: 2},  dark: {at: -2}}),
	surfaceContainerLowest:     reHCT({baseref: "surfaceContainer", light: {at: 6},  dark: {at: -8}}),

	keyboardSurfaceDim:         reHCT({baseref: "surfaceContainer", light: {at: -4}, dark: {at: -8}}),
	keyboardContainerVariant:   reHCT({baseref: "keyboardContainer", light: {at: -8}, dark: {at: -5}}),
	onKeyboardContainer:        reHCT({baseref: "keyboardContainer", light: {aa: 0.5, t: 10}, dark: {aa: 0.5, t: 90}}),
	keyboardPress:              reHCT({base: "inversePrimary"}),
	keyboardContainerPressed:   reHCT({base: "outline", both: {a: 0.33}}),
	onKeyboardContainerPressed: reHCT({base: "outline", both: {a: 0}}),
};

function reflowInheritedColors(ignoreCurrent) {
	for(const [k, v] of Object.entries(InheritableColors)) {
		if(isInherited(k) && (ignoreCurrent===true || ColorPickerWindow.getCurrentElement() !== ColorsPanel.elements[k])) {
			State.theme.colors[k] = v(State.theme.colors);
			ColorsPanel.elements[k].dispatchEvent(new CustomEvent("inheritReflow"));
		}
	}
}

function isInherited(name) {
	return State.theme.internal.inheritedColors[name] === true;
}

function setInherited(name, to) {
	if(to) {
		State.theme.internal.inheritedColors[name] = true;
	} else {
		delete State.theme.internal.inheritedColors[name];
	}
}

function colorsPanel() {
	State.ev.listen(State.EV_LOADED, () => reflowInheritedColors(false));
	return <div id="colorsPanel">
		{colorSections("Colors", Object.keys(DEFAULT_THEME.colors).map(k => {
			const resetToAuto = {"name": "Reset to auto", "action": () => {
				const oldColor = colorPickState.originalColor ?? State.theme.colors[k];
				State.execute(`Make color ${k} automatic`,
					() => {
						setInherited(k, true);
						reflowInheritedColors(true);
						colorPickState.originalColor = State.theme.colors[k];
						WorkCanvas.ev.emit("refresh", `forward-inherit${k}`);
					},
					() => {
						setInherited(k, false);
						State.theme.colors[k] = oldColor;
						colorPickState.originalColor = State.theme.colors[k];
						reflowInheritedColors();
						WorkCanvas.ev.emit("refresh", `backward-inherit${k}`);
					},
					EV_COLOR
				);
			}}
			let colorPickState = {
				getActions: () => {
					const result = []
					if(!isInherited(k) && InheritableColors[k] !== undefined) {
						result.push(resetToAuto);
					}
					return result;
				},
				cancel: () => {
					reflowInheritedColors(true);
					WorkCanvas.ev.emit("refresh", `cancel-${k}`);
				}
			};
			return colorField(k, EV_COLOR, colorPickState,
				() => State.theme.colors[k],
				(v) => {
					const newCol = v;
					if(State.theme.colors[k] !== newCol) {
						colorPickState.originalColor = colorPickState.originalColor ?? State.theme.colors[k];
						State.theme.colors[k] = newCol;
						reflowInheritedColors();
						WorkCanvas.ev.emit("refresh", `preview${k}`);
					}
				},
				(v) => {
					const effectiveOldColor = colorPickState.originalColor ?? State.theme.colors[k];
					const oldIsInherited = isInherited(k);
					State.execute(`Change color ${k}`,
						() => {
							State.theme.colors[k] = v;
							colorPickState.originalColor = State.theme.colors[k];
							setInherited(k, false);
							reflowInheritedColors();
							WorkCanvas.ev.emit("refresh", `forward${k}`);
						},
						() => {
							State.theme.colors[k] = effectiveOldColor;
							colorPickState.originalColor = State.theme.colors[k];
							setInherited(k, oldIsInherited);
							reflowInheritedColors();
							WorkCanvas.ev.emit("refresh", `backward${k}`);
						},
						EV_COLOR
					);
				}
			)
		}))}
	</div>
}

export default ColorsPanel;

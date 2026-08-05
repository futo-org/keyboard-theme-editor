import Ui from "../ui";
import State from "../state";
import WorkCanvas from './workcanvas';
import { colorField } from "./colors";
import AssetStore from "../systems/assets";

const AssetConfigPanel = {
	build: buildAssetConfigPanel
};

function evaluateExpression(input, oldValue) {
	function run() {
		const expr = input.value.trim();
		if (!expr) return false;

		const tokens = expr.match(/-?\d*\.?\d+|[+\-*/()]/g);
		if (!tokens) return false;

		const result = evaluate(tokens);
		if (result !== null && isFinite(result)) {
			input.value = result;
			return true;
		} else {
			return false;
		}
	}

	function evaluate(tokens) {
		const output = [];
		const ops = [];
		const prec = { '+': 1, '-': 1, '*': 2, '/': 2 };

		for (const t of tokens) {
			if (/\d$/.test(t)) {
				output.push(parseFloat(t));
			} else if (t === '(') {
				ops.push(t);
			} else if (t === ')') {
				while (ops.length && ops[ops.length - 1] !== '(') {
					output.push(ops.pop());
				}
				ops.pop();
			} else {
				while (ops.length && prec[ops[ops.length - 1]] >= prec[t]) {
					output.push(ops.pop());
				}
				ops.push(t);
			}
		}
		while (ops.length) output.push(ops.pop());

		const stack = [];
		for (const t of output) {
			if (typeof t === 'number') {
				stack.push(t);
			} else {
				const b = stack.pop(), a = stack.pop();
				if (a === undefined || b === undefined) return null;
				switch (t) {
				case '+': stack.push(a + b); break;
				case '-': stack.push(a - b); break;
				case '*': stack.push(a * b); break;
				case '/': stack.push(b === 0 ? NaN : a / b); break;
				}
			}
		}
		return stack.length === 1 ? stack[0] : null;
	}

	const result = run();
	if(!result) input.value = oldValue;
	return result;
}

export const colorPairs = {
	"primary": "onPrimary",
	"primaryContainer": "onPrimaryContainer",
	"secondary": "onSecondary",
	"secondaryContainer": "onSecondaryContainer",
	"tertiary": "onTertiary",
	"tertiaryContainer": "onTertiaryContainer",
	"background": "onBackground",
	"surface": "onSurface",
	"surfaceVariant": "onSurfaceVariant",
	"inverseSurface": "inverseOnSurface",
	"error": "onError",
	"errorContainer": "onErrorContainer",
	"surfaceBright": "onSurface",
	"surfaceDim": "onSurface",
	"surfaceContainer": "onSurface",
	"surfaceContainerHigh": "onSurface",
	"surfaceContainerHighest": "onSurface",
	"surfaceContainerLow": "onSurface",
	"surfaceContainerLowest": "onSurface",
	"keyboardSurface": "onSurface",
	"keyboardSurfaceDim": "onSurface",
	"keyboardContainer": "onKeyboardContainer",
	"keyboardContainerVariant": "onKeyboardContainer",
	"keyboardPress": "onKeyboardContainer",
};

function themeColorTokenPicker(id, onchange) {
	return <div className="theme-token-picker">
		<label for={`${id}Select`}>Choose a theme color:</label>

		<select name={id} id={`${id}Select`} onchange={onchange}>
			{Object.keys(colorPairs).map((v) =>
				<option value={v}>{v}</option>
			)}
		</select>
	</div>
}

function onExpressionField(ev, name, a, executeName, isInt) {
	if(!a) return;

	const path = Array.isArray(name) ? name : [name];
	if(path.length === 0) return;

	const old = getValueAtPath(a.data, path);
	if(old === undefined) return;

	if(!evaluateExpression(ev.target, old)) return;
	const result = (isInt === true ? parseInt : parseFloat)(ev.target.value);
	if(isNaN(result)) {
		ev.target.value = old;
		return;
	}

	State.execute(executeName, () => {
		setValueAtPath(a.data, path, result);
	}, () => {
		setValueAtPath(a.data, path, old);
	}, State.EV_ASSET_EDITED);
}

function getValueAtPath(obj, path) {
	let current = obj;
	for(let i = 0; i < path.length; i++) {
		if(current === null || current === undefined) return undefined;
		current = current[path[i]];
	}
	return current;
}

function setValueAtPath(obj, path, value) {
	let current = obj;
	for(let i = 0; i < path.length - 1; i++) {
		current = current[path[i]];
	}
	current[path[path.length - 1]] = value;
}

function replaceAssetOption() {
	const acceptableMime = () => {
		const asset = AssetStore.store[State.editingAsset];
		return asset?.meta.type ?? "image";
	}

	const replaceAsset = (file) => {
		const fname = State.editingAsset;
		if(!fname) return;
		AssetStore.update(fname, file);
	}

	let inputEl;
	let hovering = false;
	const handlePaste = (ev) => {
		if(!hovering) return;

		const items = ev.clipboardData?.items;
		if (!items) return;

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (item.type.startsWith(acceptableMime() + "/")) {
				const blob = item.getAsFile();
				replaceAsset(blob);
				ev.preventDefault();
			}
		}
	};

	const dom = <div className="asset-configurable"
		onMouseEnter={(_ev) => {
			hovering = true;
			window.addEventListener("paste", handlePaste);
		}}
		onMouseLeave={(_ev) => {
			hovering = false;
			window.removeEventListener("paste", handlePaste);
		}}
		ondrop={(ev) => {
			dom.children[0].classList.remove("active");
			const tgtMime = acceptableMime() + "/";
			const fileItems = [...ev.dataTransfer.items].filter((item) => item.kind === "file" && item.type.startsWith(tgtMime));
			ev.preventDefault();
			if(fileItems.length > 0) {
				const file = fileItems[0].getAsFile();
				if(file) replaceAsset(file);
			}
		}}
		ondragover={(ev) => {
			dom.children[0].classList.remove("active");
			const tgtMime = acceptableMime() + "/";
			const fileItems = [...ev.dataTransfer.items].filter((item) => item.kind === "file" && item.type.startsWith(tgtMime));

			ev.preventDefault();
			if(fileItems.length > 0) {
				ev.dataTransfer.dropEffect = "copy";
				dom.children[0].classList.add("active");
			} else {
				ev.dataTransfer.dropEffect = "none";
			}

		}}
		ondragleave={(_ev) => {
			dom.children[0].classList.remove("active");
		}}>
		<div className="replace-file-container"
			onclick={(ev) => {
				ev.preventDefault();
				inputEl.accept = acceptableMime() === "font" ? ".ttf,.otf" : "image/*";
				inputEl.click();
			}}>
			<div className="replace-file-text">
				Replace file: drag and drop, paste, or click
			</div>
		</div>
		<input type="file" accept="image/*" style="display: none;"
			oncreate={el => { inputEl = el; }}
			onchange={(e) => {
				const file = e.target.files[0];
				replaceAsset(file);
			}}
		/>
	</div>;

	return dom;
}

const RectDirections = ["left", "top", "right", "bottom"];
function inlineRect(asset, name) {
	return <div className="inline-rect">
		{RectDirections.map((direction) => <div>
			<label for={`${name}${direction}`} title={direction}>{direction[0].toUpperCase()}</label>
			<input type="text" id={`${name}${direction}`} placeholder="0.0"
				onchange={(ev) => onExpressionField(ev, [name, direction], asset(), `Update asset ${name} ${direction}`)} />
		</div>)}
	</div>
}

function backgroundAssetConfig() {
	let asset = undefined;
	const local = {};
	const EV_CONSTANT_COLOR_UPDATE = "constantcolorupdateassetconfig";
	const dom = Ui.namespaced(local, () => <div className="asset-categories" style="display: none">
		{replaceAssetOption()}
		<div className="asset-configurable">
			<h3>Colors</h3>

			<div className="check-radio">
				<input type="radio" id="constant" name="fgkind" value="constant" checked
					onChange={(ev) => {
						const a = asset;
						if(ev.target.checked && a.data.colorKind !== "constant") {
							const oldKind = a.data.colorKind;
							State.execute("Set asset color to constant", () => {
								a.data.colorKind = "constant";
							}, () => {
								a.data.colorKind = oldKind;
							}, State.EV_ASSET_EDITED)
						}
					}}/>
				<label for="constant">Constant</label>
			</div>

			<div id="colorFields" className="color-fields2">
				{colorField("Foreground", EV_CONSTANT_COLOR_UPDATE, {}, () => {
					if(asset !== undefined && asset.data.foregroundConstant !== undefined) return asset.data.foregroundConstant;
					else return undefined;
				}, () => {}, (newColor) => {
					const a = asset;
					const oldColor = a.data.foregroundConstant;
					State.execute("Update asset foreground color", () => {
						a.data.foregroundConstant = newColor;
					}, () => {
						a.data.foregroundConstant = oldColor;
					}, State.EV_ASSET_EDITED);
				})}
				{colorField("Background tint", EV_CONSTANT_COLOR_UPDATE, {}, () => {
					if(asset !== undefined && asset.data.backgroundConstant !== undefined) return asset.data.backgroundConstant;
					else return undefined;
				}, () => {}, (newColor) => {
					const a = asset;
					const oldColor = a.data.backgroundConstant;
					State.execute("Update asset background color", () => {
						a.data.backgroundConstant = newColor;
					}, () => {
						a.data.backgroundConstant = oldColor;
					}, State.EV_ASSET_EDITED);
				})}
			</div>

			<div className="check-radio">
				<input type="radio" id="themed" name="fgkind" value="themed" checked
					onChange={(ev) => {
						const a = asset;
						if(ev.target.checked && a.data.colorKind !== "themed") {
							const oldKind = a.data.colorKind;
							State.execute("Set asset color to themed", () => {
								a.data.colorKind = "themed";
							}, () => {
								a.data.colorKind = oldKind;
							}, State.EV_ASSET_EDITED);
						}
					}}/>
				<label for="themed">Themed</label>
			</div>

			{themeColorTokenPicker("token", (ev) => {
				const a = asset;
				const oldFg = a.data.foregroundToken;
				const oldBg = a.data.backgroundToken;

				const newBg = ev.target.value;
				const newFg = colorPairs[newBg];
				if(newFg == null) {
					console.error("Invalid token selected:", newBg);
					return;
				}
				State.execute("Update asset color token", () => {
					a.data.backgroundToken = newBg
					a.data.foregroundToken = newFg;
				}, () => {
					a.data.backgroundToken = oldBg;
					a.data.foregroundToken = oldFg;
				}, State.EV_ASSET_EDITED);
			})}
		</div>

		<div className="asset-configurable">
			<h3>Padding</h3>
			<button className="tool-button" onclick={_ev => {
				WorkCanvas.changeAdjustTo("padding");
			}}>{Ui.iconEl("crop")}</button>

			{inlineRect(() => asset, "padding")}
		</div>


		<div className="asset-configurable">
			<h3>Slice center</h3>
			<button className="tool-button" onclick={_ev => {
				WorkCanvas.changeAdjustTo("slicing");
			}}>{Ui.iconEl("crop")}</button>

			{inlineRect(() => asset, "slicing")}
		</div>

		<div className="asset-configurable">
			<h3>Gap</h3>
			<button className="tool-button" onclick={_ev => {
				WorkCanvas.changeAdjustTo("gap");
			}}>{Ui.iconEl("crop")}</button>

			{inlineRect(() => asset, "gap")}
		</div>


		<div className="asset-configurable">
			<h3>Density scaling</h3>

			<div>
				<label for="targetDensity">Target density</label>
				<input type="text" id="targetDensity" placeholder="640"
					onchange={(ev) => onExpressionField(ev, "targetDensity", asset, "Update asset density")}></input>
			</div>
		</div>
	</div>);

	const update = (a) => {
		asset = a;

		local.constant.checked = asset.data.colorKind === "constant";
		local.themed.checked   = asset.data.colorKind === "themed";

		local.tokenSelect.value = asset.data.backgroundToken;

		["slicing", "padding", "gap"].forEach((a) => {
			RectDirections.forEach((b) => {
				local[a + b].value = asset.data[a][b];
			})
		});

		local.targetDensity.value = asset.data.targetDensity;

		State.ev.emit(EV_CONSTANT_COLOR_UPDATE);
	};
	const show = (a) => {
		asset = a;

		dom.style.display = "";
	};

	return { show, update, dom };
}

function iconAssetConfig() {
	let asset = undefined;
	const dom = <div className="asset-categories" style="display: none">
		{replaceAssetOption()}
		<div className="asset-configurable">
			<h3>Density scaling</h3>

			<div>
				<label for="iconDensityScaling">Target density</label>
				<input type="text" id="iconDensityScaling" placeholder="640"
					onchange={(ev) => onExpressionField(ev, "targetDensity", asset, "Update asset density")}></input>
			</div>
		</div>
	</div>;

	const update = (a) => {
		asset = a;
		Ui.id.iconDensityScaling.value = asset.data.targetDensity;
	};
	const show = (a) => {
		asset = a;
		dom.style.display = "";
	};

	return { show, update, dom };
}

function otherAssetConfig() {
	let asset = undefined;
	const local = {};
	const dom = Ui.namespaced(local, () =>
		<div className="asset-categories" style="display: none">
			{replaceAssetOption()}

			<div className="asset-configurable" id="bgcropping">
				<h3>Background cropping</h3>
				<button className="tool-button" onclick={_ev => {
					WorkCanvas.changeAdjustTo("cropping");
				}}>{Ui.iconEl("crop")}</button>

				{inlineRect(() => asset, "cropping")}
			</div>
		</div>);


	const update = (a) => {
		asset = a;

		local.bgcropping.style.display = (asset.meta.type === "image") ? "unset" : "none";
		["cropping"].forEach((a) => {
			RectDirections.forEach((b) => {
				local[a + b].value = asset.data[a][b];
			})
		});
	};
	const show = (a) => {
		asset = a;
		dom.style.display = "";
	};


	return { show, update, dom };
}

function buildAssetConfigPanel() {
	const configs = {
		background: backgroundAssetConfig(),
		icon: iconAssetConfig(),
		other: otherAssetConfig()
	};

	State.ev.listen(State.EV_EDITING_ASSET_CHANGE, () => {
		const fname = State.editingAsset;
		const isEditingAsset = fname !== undefined;

		Array.from(Ui.id.assetConfigPanel.children).forEach((v) => v.style.display = "none");

		if(isEditingAsset) {
			const asset = AssetStore.store[fname];
			const kind = asset.meta.kind;
			configs[kind].show(asset);
			configs[kind].update(asset);
		} else {
			Ui.id.noAssetEditingMessage.style.display = "";
		}
	});

	State.ev.listen(State.EV_ASSET_EDITED, () => {
		const fname = State.editingAsset;
		const isEditingAsset = fname !== undefined;

		if(isEditingAsset) {
			const asset = AssetStore.store[fname];
			const kind = asset.meta.kind;
			configs[kind].update(asset);
		}
	});
	return <div id="assetConfigPanel" style="min-height: 100%">
		<div id="noAssetEditingMessage" className="asset-categories">
			<div className="asset-configurable">
				<p>Click {Ui.iconEl("sliders")} on an asset in the Assets tab to configure it</p>
			</div>
		</div>

		{configs.background.dom}
		{configs.icon.dom}
		{configs.other.dom}
	</div>
}

export default AssetConfigPanel;

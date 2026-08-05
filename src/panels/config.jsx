import WorkCanvas from "./workcanvas";
import Ui from "../ui";
import State from "../state";
import AssetStore from "../systems/assets";
import { changeableFileImg } from "./upper";
import GoogleFontPickerWindow from "../windows/GoogleFontPickerWindow";

const EV_CONFIG_UPDATE = "configUpdated";
const local = {};

function updatePanel() {
	local.borders.checked = State.theme.options.autoBorders;
	local.centerHints.checked = State.theme.options.centerHints;
	WorkCanvas.ev.emit("refresh", "config update");
}

function fileDragTarget(id, changeEvent, get, onSet) {
	const el = <div id={id} className={`file highlight-on-drag-kind-other`} ondrop={e => {
		local[id].classList.remove("dragover");
		const assetName = e.dataTransfer.getData("editor/asset-id");
		if(!assetName) return;
		const asset = AssetStore.store[assetName];
		if(!asset) return;
		if(asset.meta.kind !== "other") return;

		onSet(assetName);
	}} ondragover={e => {
		if (!e.dataTransfer.types.includes("editor/asset-id")
				|| !e.dataTransfer.types.includes("editor/kind-other")) return;
		e.preventDefault();
		local[id].classList.add("dragover");
		e.dataTransfer.dropEffect = "link";
	}} ondragleave={e => {
		e.preventDefault();
		local[id].classList.remove("dragover");
	}}>
		{changeableFileImg("other", get()?.url, onSet)}
		<p className="file-name">{get()?.name ?? "[none]"}</p>
		<div style="flex: 1"></div>
		<button onclick={() => {
			onSet(undefined);
		}}>{Ui.iconEl("xmark")}</button>
	</div>

	State.ev.listen([State.EV_LOADED, changeEvent, AssetStore.EV_IMG_LOADED], () => {
		console.log(id, get());
		el.getElementsByTagName("img")[0].src = get()?.runtime?.preview ?? "";
		el.getElementsByTagName("p")[0].innerText = get()?.meta?.name ?? "[none]";
	})

	return el;
}

function capitalize(s) {
	return String(s[0]).toUpperCase() + String(s).slice(1);
}

function sliderFor(local, name, id, get, set, limits) {
	const valId = id + "Val";
	State.ev.listen([EV_CONFIG_UPDATE, State.EV_LOADED] , () => {
		local[id].value = get();
		local[valId].innerText = local[id].value;
	});
	return <div>
		<label for={id}>{capitalize(name)}: </label>
		<input type="range" id={id} min={limits?.min ?? 0.0} max={limits?.max ?? 1.0} step={limits?.step ?? 0.01} value="1.0"
			onInput={_ev => {
				local[valId].innerText = local[id].value;
			}}
			onChange={_ev => {
				const old = get();
				const newv = +local[id].value;
				if(old === newv) return;
				State.execute("Set bg " + name, () => {
					set(newv);
				}, () => {
					set(old);
				}, EV_CONFIG_UPDATE)

			}}/>
		<span id={valId} style="min-width:36px">1.0</span>
	</div>
}

function buildPanel() {
	State.ev.listen([State.EV_LOADED, EV_CONFIG_UPDATE], updatePanel);

	return Ui.namespaced(local, "configpanel", () =>
		<div className="asset-categories">
			<div className="asset-configurable">
				<h3>Keyboard</h3>
				<div className="check-radio">
					<input type="checkbox" id="borders"
						onChange={(ev) => {
							const old = State.theme.options.autoBorders;
							const newv = ev.target.checked;
							State.execute("Toggle key borders", () => {
								State.theme.options.autoBorders = newv;
							}, () => {
								State.theme.options.autoBorders = old;
							}, EV_CONFIG_UPDATE);
						}}/>
					<label for="borders">Key borders</label>
				</div>


				{sliderFor(
					local, "roundedness", "roundedness",
					() => State.theme.options.roundedness,
					(v) => {
						State.theme.options.roundedness = v;
					}, {min: 0.0, max: 3.0, step: 0.1}
				)}

				<div className="check-radio">
					<input type="checkbox" id="centerHints"
						onChange={(ev) => {
							const old = State.theme.options.centerHints;
							const newv = ev.target.checked;
							State.execute("Toggle center hints", () => {
								State.theme.options.centerHints = newv;
							}, () => {
								State.theme.options.centerHints = old;
							}, EV_CONFIG_UPDATE);
						}}/>
					<label for="centerHints">Center hints</label>
				</div>
			</div>

			<div className="asset-configurable">
				<h3>Key text</h3>
				{sliderFor(local, "text scale", "scaleText",
					() => State.theme.options.scaleText,
						   (v) => {
							   State.theme.options.scaleText = v;
						   }, {min: 0.0, max: 2.0, step: 0.1})}

				{sliderFor(local, "hint scale", "scaleHints",
					() => State.theme.options.scaleHints,
					(v) => {
						State.theme.options.scaleHints = v;
					}, {min: 0.0, max: 2.0, step: 0.1})}

				{sliderFor(local, "text weight", "weightText",
					() => State.theme.options.weightText,
					(v) => {
						State.theme.options.weightText = v;
					}, {min: 100, max: 900, step: 100})}

				{sliderFor(local, "hint weight", "weightHints",
					() => State.theme.options.weightHints,
					(v) => {
						State.theme.options.weightHints = v;
					}, {min: 100, max: 900, step: 100})}

			</div>
			<div className="asset-configurable">
				<h3>Background image</h3>

				{fileDragTarget("background", EV_CONFIG_UPDATE,
					() => AssetStore.store[State.theme.assets.background.image],
					(to) => {
						const old = State.theme.assets.background.image;
						if(to === old) return;
						const verb = (to ? "Set" : "Unset");
						State.execute(`${verb} background`, () => {
							State.theme.assets.background.image = to;
						}, () => {
							State.theme.assets.background.image = old;
						}, EV_CONFIG_UPDATE);
					})}

				{sliderFor(local, "opacity", "opacity",
					() => State.theme.assets.background.opacity,
					(v) => {
						State.theme.assets.background.opacity = v;
					})}

				{sliderFor(local, "action bar opacity", "actionBarOpacity",
					() => State.theme.assets.background.actionBarOpacity,
					(v) => {
						State.theme.assets.background.actionBarOpacity = v;
					})}

				<div>
					<button onclick={() => {
						if(!State.theme.assets.background.image) {
							alert("Set a background first!");
							return;
						}

						const aname = State.theme.assets.background.image;
						WorkCanvas.editAsset(aname);
						WorkCanvas.changeAdjustTo("cropping");
					}}>Crop</button>
				</div>
			</div>


			<div className="asset-configurable">
				<h3>Font</h3>

				{fileDragTarget("font", EV_CONFIG_UPDATE,
					() => AssetStore.store[State.theme.assets.font],
					(to) => {
						const old = State.theme.assets.font;
						if(to === old) return;
						const verb = (to ? "Set" : "Unset");
						State.execute(`${verb} font`, () => {
							State.theme.assets.font = to;
						}, () => {
							State.theme.assets.font = old;
						}, EV_CONFIG_UPDATE);
					})}


				<div>
					<button onclick={() => Ui.showWindow(GoogleFontPickerWindow)}>Browse Google fonts</button>
				</div>
			</div>
		</div>
	);
}

const ConfigPanel = {
	build: buildPanel
};

export default ConfigPanel;

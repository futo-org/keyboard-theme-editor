import State from "../state";
import { openFilePickerWithKind } from "../panels/assets";
import AssetStore from "../systems/assets";
import Ui from "../ui";
import Window from "./WindowWrapper";

let currentTarget = undefined;

function onSelect(fname) {
	if(!currentTarget) return;
	if(!AssetStore.store[fname] || (AssetStore.store[fname].meta.kind !== currentTarget.kind)) return;

	currentTarget.callback(fname);
	currentTarget = undefined;
	Window.close(AssetPickerWindow);
}

function contentsOfKind(kind) {
	let name;
	if(kind === "background") {
		name = "Border assets";
	} else if(kind === "icon") {
		name = "Icon assets";
	} else {
		name = "Other assets";
	}
	return <div className="asset-category">
		<div className="asset-category-header">
			<h4>{name}</h4>
			<button title={Ui.tooltipFor("insert.import")} onclick={() => openFilePickerWithKind(kind)}>{Ui.iconEl("plus")}</button>
		</div>
		<div>
			{Object.keys(AssetStore.store).filter((k) => AssetStore.store[k].meta.kind === kind && !AssetStore.store[k].meta.builtin).map((k) => {
				return <div className="file selectable" onclick={() => onSelect(k)}>
					<img src={AssetStore.store[k].runtime.preview ?? ""} />
					<p>{AssetStore.store[k].meta.name}</p>
				</div>
			})}
		</div>
	</div>
}

const local = {};
function assetPickerWindowContents() {
	State.ev.listen([AssetStore.EV_FILE_ADDED, AssetStore.EV_FILE_REMOVED, AssetStore.EV_IMG_LOADED], refresh);
	return Ui.namespaced(local, () => <div id="root" style="max-width: 400px;">
	</div>);
}

function refresh() {
	if(!local.root) return;
	if(!currentTarget) return;

	local.root.replaceChildren(contentsOfKind(currentTarget.kind));
}

function retarget(kind, callback) {
	currentTarget = { kind, callback };
	Window.spawn(AssetPickerWindow);
	refresh();
}

const AssetPickerWindow = {
	name: "Asset Picker",
	contents: assetPickerWindowContents,
	show: retarget,
	persist: true,
	onClose: () => {
		currentTarget = undefined;
	}
};

export default AssetPickerWindow;

import Ui from "../ui";
import makeTabbedPanel from './tabs';
import State from "../state";
import HistoryPanel from './history';
import WorkCanvas from './workcanvas';
import MetadataPanel from "./metadata";
import AssetStore from "../systems/assets";
import { getFileType } from "../../core/assets";

const AssetsPanel = {
	build: makeAssetsPanel,
	openFilePicker: openFilePicker
};

export function openFilePicker(_ev) {
	openFilePickerWithKind(undefined);
}

export function openFilePickerWithKind(kind) {
	if(!State.isProjectLoaded) {
		alert("Load a project first! File > New project...");
		return;
	}
	AssetsPanel.lastPickerKind = kind;
	Ui.id.picker.accept = (kind === "other") ? "image/*,font/*,.ttf,.otf" : "image/*";
	Ui.id.picker.click();
}

export const imageSizeLimits = {
	"background": 360,
	"icon": 360,
	"other": 2048
};

export const checkImageSizeOk = (file, kind) => new Promise((resolve, reject) => {
	if(kind === "other") {
		if(getFileType(file.name) !== "image") {
			resolve();
			return;
		}
	}
	const limit = imageSizeLimits[kind];

	const reader = new FileReader();
	reader.onload = () => {
		const img = new Image();
		img.onload = () => {
			const px = img.width * img.height;

			if(px > (limit*limit)) {
				reject(`Image is too big! Must not exceed the area of ${limit}px x ${limit}px`)
			} else {
				resolve(true);
			}
		}
		img.onerror = () => reject("Failed to load image");
		img.src = reader.result;
	}
	reader.onerror = () => reject("Failed to read file");
	reader.readAsDataURL(file);
});

function assetContent() {
	const fileElems = {};
	const nextSiblings = {};
	
	State.ev.listen(AssetStore.EV_FILE_ADDED, (fname) => {
		if(AssetStore.store[fname].meta.builtin === true) return;
		let tgtParent;
		const kind = AssetStore.store[fname].meta.kind;
		switch(kind) {
		case "background":
			tgtParent = Ui.id.assetItemsBackground;
			break;
		case "icon":
			tgtParent = Ui.id.assetItemsIcon;
			break;
		default:
			tgtParent = Ui.id.assetItemsOther;
			break;
		}
		fileElems[fname] = <div className="file" draggable="true" ondragstart={ev => {
			ev.dataTransfer.setData("editor/asset-id", fname);
			ev.dataTransfer.setData("editor/kind-" + kind, "true");
			ev.dataTransfer.effectAllowed = "link";

			document.body.classList.add("dragging-kind-" + kind);
		}} ondragend={_ev => {
			document.body.classList.remove("dragging-kind-" + kind);
		}}>
			<img src={AssetStore.store[fname].runtime.preview ?? ""} />
			<div className="labeled-input">
				<label>Filename</label>
				<input type="text" value={AssetStore.store[fname].meta.name} onchange={ev => {
					const obj = AssetStore.store[fname];
					const oldName = obj.meta.name;
					const newName = ev.target.value;
					State.execute(`Rename ${oldName} to ${newName}`,
						() => {
							obj.meta.name = newName;
							ev.target.value = newName;
						},
						() => {
							obj.meta.name = oldName;
							ev.target.value = oldName;
						});
				}} />
			</div>
			<button onclick={() => WorkCanvas.editAsset(fname)}>{Ui.iconEl("sliders")}</button>
			<button onclick={() => {
				const el = AssetStore.store[fname];

				const newMeta = structuredClone(el.meta);
				function incrementFilename(filename) {
					const match = filename.match(/^(.*?)(\d*)(\.[^.]+)$/);

					if (!match) {
						const numMatch = filename.match(/^(.*?)(\d*)$/);
						const base = numMatch[1];
						const num = numMatch[2];
						const newNum = num ? parseInt(num, 10) + 1 : 2;
						return base + newNum;
					}

					const [, base, num, ext] = match;
					const newNum = num ? parseInt(num, 10) + 1 : 2;

					return base + newNum + ext;
				}

				newMeta.name = incrementFilename(newMeta.name);

				fetch(el.runtime.url).then(v => v.blob()).then(blob =>
					AssetStore.loadSaved(
						State.unique(newMeta.name),
						newMeta,
						structuredClone(el.data),
						blob,
						true
					)
				);
			}}>{Ui.iconEl("clone")}</button>
			<button onclick={() => AssetStore.remove(fname)}>{Ui.iconEl("trash")}</button>
		</div>;
		if(nextSiblings[fname] && (tgtParent.contains(nextSiblings[fname]) || console.error("sibling gone?"))) {
			tgtParent.insertBefore(fileElems[fname], nextSiblings[fname]);
		} else if(tgtParent.children.length > 0) {
			tgtParent.insertBefore(fileElems[fname], tgtParent.children[0]);
		} else {
			tgtParent.appendChild(fileElems[fname]);
		}
	});
	State.ev.listen(AssetStore.EV_FILE_REMOVED, (fname) => {
		if(fileElems[fname] === undefined) return;
		nextSiblings[fname] = fileElems[fname].nextSibling;
		fileElems[fname].parentElement.removeChild(fileElems[fname]);
	});

	State.ev.listen(AssetStore.EV_IMG_LOADED, (fname) => {
		if(fileElems[fname])
			fileElems[fname].querySelector("img").src = AssetStore.store[fname].runtime.preview ?? "";
	});

	return <div className="asset-categories">
		<input id="picker" type="file" accept="image/*" style="display: none;"
			onchange={(e) => {
				const file = e.target.files[0];

				if(!file) return;

				const kind = AssetsPanel.lastPickerKind;
				const split = file.name.toLowerCase().split('.');
				const extension = split[split.length - 1];

				const allowedExtensions = ["png", "webp"];

				if(kind === "other") {
					allowedExtensions.push("ttf");
					allowedExtensions.push("otf");
					allowedExtensions.push("jpg");
					allowedExtensions.push("jpeg");
				}

				if(allowedExtensions.indexOf(extension) === -1) {
					const readableName = kind === "background" ? "border" : kind;
					alert(`The file extension ${extension} is not in the supported list for ${readableName}: ${allowedExtensions}`);
				} else {
					checkImageSizeOk(file, kind).then(() => {
						AssetStore.add(file, kind);
					}).catch(alert);
				}
			}}
		/>
		<div className="asset-category">
			<div className="asset-category-header">
				<h4>Border assets</h4>
				<button title={Ui.tooltipFor("insert.import")} onclick={() => openFilePickerWithKind("background")}>{Ui.iconEl("plus")}</button>
			</div>
			<div id="assetItemsBackground"></div>
		</div>
		<div className="asset-category">
			<div className="asset-category-header">
				<h4>Icon assets</h4>
				<button title={Ui.tooltipFor("insert.import")} onclick={() => openFilePickerWithKind("icon")}>{Ui.iconEl("plus")}</button>
			</div>
			<div id="assetItemsIcon"></div>
		</div>
		<div className="asset-category">
			<div className="asset-category-header">
				<h4>Other assets</h4>
				<button title={Ui.tooltipFor("insert.import")} onclick={() => openFilePickerWithKind("other")}>{Ui.iconEl("plus")}</button>
			</div>
			<div id="assetItemsOther"></div>
		</div>
	</div>
}

function makeAssetsPanel() {
	const tabs = [
		{name: "Assets", content: assetContent()},
		{name: "Metadata", content: MetadataPanel.build()},
		{name: "History", content: HistoryPanel.build()}
	]
	return <div className="assets-panel">
		{ makeTabbedPanel("assets", tabs) }
	</div>
}

export default AssetsPanel;

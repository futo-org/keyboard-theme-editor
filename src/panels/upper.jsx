import Ui from "../ui";
import State from "../state";
import makeTabbedPanel from './tabs';
import WorkCanvas from './workcanvas';
import ColorsPanel from "./colors";
import AssetConfigPanel from "./assetconfig";
import ConfigPanel from "./config";
import AssetStore from "../systems/assets";
import { qualifierInput } from "../keyboard/qualifiers-input";
import AssetPickerWindow from "../windows/AssetPickerWindow";

const UpperPanel = {
	build: makeUpperPanel,
};


const BordersPanel = {
	build: borderContent,
};

const KIND_BACKGROUND = "background";
const KIND_ICON = "icon";
const EV_MATCHRULE = "matchrule";

export function insertNewMatchrule(kind, idx, initial) {
	if(!State.isProjectLoaded) {
		alert("Load a project first! File > New project...");
		return;
	}

	const obj = {
		id: State.unique(),
		selector: initial ?? "",
		asset: ""
	};
	
	const arr = (kind === KIND_ICON) ? State.theme.assets.icon : State.theme.assets.key;
	State.execute(`Insert ${kind}`,
		() => {
			arr.splice(idx ?? 0, 0, obj);
			State.ev.emit(EV_MATCHRULE);
		},
		() => {
			const idx = arr.indexOf(obj);
			if(idx != -1) {
				arr.splice(idx, 1);
			}
			State.ev.emit(EV_MATCHRULE);
		}
	);
}

export function changeableFileImg(kind, src, updateToAsset) {
	return <div className="img-container">
		<img title={`Drag a ${kind} asset from the assets panel here.`} draggable={false} src={src ?? "missing.png"} />
		<button className="change-button" onclick={_ev => {
			AssetPickerWindow.show(kind, (fname) => {
				updateToAsset(fname);
			})
		}}>
			{Ui.iconEl("pen-to-square")}
		</button>
	</div>
}

function borderContent() {
	const elems = {};
	const updateMatchruleElem = (el, v) => {
		const img = el.querySelector("img");
		img.src = "";
		if(v.asset && AssetStore.store[v.asset]) {
			img.src = AssetStore.store[v.asset].runtime.url;
		} else {
			img.src = "missing.png";
		}
		
		return el;
	}

	const highlightedElements = [];
	
	const makeElem = (kind, v) => {
		const local = {};

		const updateToAsset = (asset) => {
			if(asset && AssetStore.store[asset] && AssetStore.store[asset].meta.kind === kind) {
				const oldAsset = v.asset;
				State.execute(`Update ${kind} asset`,
					() => {
						v.asset = asset;
					},
					() => {
						v.asset = oldAsset;
					}, EV_MATCHRULE);
			}
		};

		elems[v.id] = Ui.namespaced(local, () => <div className={`file highlight-on-drag-kind-${kind}`} ondrop={e => {
			elems[v.id].classList.remove("dragover");
			const asset = e.dataTransfer.getData("editor/asset-id");
			updateToAsset(asset);
			e.preventDefault();
		}} ondragover={e => {
			if (!event.dataTransfer.types.includes("editor/asset-id")
			 || !event.dataTransfer.types.includes("editor/kind-" + kind)) return;
			e.preventDefault();
			elems[v.id].classList.add("dragover");
			e.dataTransfer.dropEffect = "link";
		}} ondragleave={e => {
			e.preventDefault();
			elems[v.id].classList.remove("dragover");
		}}>
			<div className="file-grip" detectPointer={(ev, pk) => {
				ev.preventDefault();

				highlightedElements.forEach((el) => {
					el.classList.remove("highlight-above");
					el.classList.remove("highlight-below");
					el.classList.remove("highlight-dragging");
				});
				highlightedElements.splice(0, highlightedElements.length);

				const parentContainer = Ui.id[(kind === KIND_BACKGROUND) ? "borderItems" : "iconItems"];
				let matchedChild = undefined;
				let isMatchingBottom = false;
				let i = 0;

				for(const child of parentContainer.children) {
					const rect = child.getBoundingClientRect();
					if(rect.top < ev.clientY && rect.bottom > ev.clientY) {
						matchedChild = child;
						isMatchingBottom = ev.clientY > ((rect.bottom + rect.top) / 2);
						break;
					}
					i++;
				}

				if(isMatchingBottom) i++;

				if(matchedChild === undefined) {
					return;
				}

				if(pk === 0) {
					parentContainer.classList.add("dragging-file")
				}
				if(pk === 2) {
					parentContainer.classList.remove("dragging-file")
					const arr = (kind === KIND_ICON) ? State.theme.assets.icon : State.theme.assets.key;
					const idx = arr.indexOf(v);
					if(i > idx) i--;
					if(idx != -1 && idx != i) {
						State.execute(`Rearrange ${kind}`,
							() => {
								arr.splice(idx, 1);
								arr.splice(i, 0, v)
								State.ev.emit(EV_MATCHRULE);
							},
							() => {
								arr.splice(i, 1);
								arr.splice(idx, 0, v);
								State.ev.emit(EV_MATCHRULE);
							}
						);
					}
				} else {
					const selfEl = elems[v.id];

					if(matchedChild !== selfEl) {
						matchedChild.classList.add(isMatchingBottom ? "highlight-below" : "highlight-above");
						highlightedElements.push(matchedChild);
					}

					if(selfEl) {
						selfEl.classList.add("highlight-dragging");
						highlightedElements.push(selfEl);
					}
				}
			}}>{Ui.iconEl("grip-vertical")}</div>
			{changeableFileImg(kind, "", updateToAsset)}

			<div className="labeled-input">
				<label>Matchrule</label>
				{qualifierInput(v, kind, EV_MATCHRULE)}
			</div>
			<button onclick={() => {
				const arr = (kind === KIND_ICON) ? State.theme.assets.icon : State.theme.assets.key;
				const idx = arr.indexOf(v);
				if(idx != -1) {
					State.execute(`Remove ${kind}`,
						() => {
							arr.splice(idx, 1);
							State.ev.emit(EV_MATCHRULE);
						},
						() => {
							arr.splice(idx, 0, v);
							State.ev.emit(EV_MATCHRULE);
						}
					);
				}
			}}>{Ui.iconEl("trash")}</button>


			<div className="add-onhover-area">
				<button className="add-onhover" onClick={() => {
					const arr = (kind === KIND_ICON) ? State.theme.assets.icon : State.theme.assets.key;
					const idx = arr.indexOf(v);
					if(idx != -1) {
						insertNewMatchrule(kind, idx + 1);
					}
				}}>{Ui.iconEl("plus")}</button></div>

			<div className="add-onhover-area above">
				<button className="add-onhover" onClick={() => {
					const arr = (kind === KIND_ICON) ? State.theme.assets.icon : State.theme.assets.key;
					const idx = arr.indexOf(v);
					if(idx != -1) {
						insertNewMatchrule(kind, idx);
					}
				}}>{Ui.iconEl("plus")}</button></div>
		</div>);
		
		return elems[v.id];
	};
	
	const updateChildren = () => {
		Ui.id.borderItems.replaceChildren(...State.theme.assets.key.map(v => 
			updateMatchruleElem(elems[v] ?? makeElem(KIND_BACKGROUND, v), v)
		));
		Ui.id.iconItems.replaceChildren(...State.theme.assets.icon.map(v => 
			updateMatchruleElem(elems[v] ?? makeElem(KIND_ICON, v), v)
		));
	};

	State.ev.listen(EV_MATCHRULE, () => {
		WorkCanvas.ev.emit("refresh", EV_MATCHRULE);
		updateChildren();
	});
	
	State.ev.listen(State.EV_LOADED, () => {
		// Consider wiping elems here to avoid memory leak
		updateChildren();
	});
	
	return <div className="asset-categories">
		<div className="asset-category">
			<div className="asset-category-header">
				<h4>Border matchrules</h4>
				<button onclick={() => insertNewMatchrule(KIND_BACKGROUND, 0)}>{Ui.iconEl("plus")}</button>
			</div>
			<div id="borderItems"></div>
		</div>

		<div className="asset-category">
			<div className="asset-category-header">
				<h4>Icon matchrules</h4>
				<button onclick={() => insertNewMatchrule(KIND_ICON, 0)}>{Ui.iconEl("plus")}</button>
			</div>
			<div id="iconItems"></div>
		</div>
	</div>
}

function makeUpperPanel() {
	const tabs = [
		{name: "Matchrules", content: BordersPanel.build()},
		{name: "Asset", content: AssetConfigPanel.build()},
		{name: "Colors", content: ColorsPanel.build()},
		{name: "Config", content: ConfigPanel.build()},
	]
	return <div className="config-panel">
		{ makeTabbedPanel("config", tabs) }
	</div>
}

export default UpperPanel;

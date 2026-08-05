import WorkCanvas from "../panels/workcanvas";
import { insertNewMatchrule } from "../panels/upper";
import AssetStore from "../systems/assets";
import Ui from "../ui"
import Window from "./WindowWrapper";

let dom = undefined;
let activeKey = undefined;
function keyInfoWindowContents() {
	dom = <div style="width: 400px; max-height: 700px; overflow: scroll; padding: 8px;">
	</div>

	return dom;
}

export function displayKeyInfo(keyInfo) {
	Window.spawn(KeyInfoWindow);

	activeKey = keyInfo;
	WorkCanvas.previewSelector(keyInfo.selectors[keyInfo.selectors.length - 1]);

	const key = activeKey.key;
	dom.replaceChildren(<div>
		<section className="key-info-section">
			<h2>Key info</h2>
			<div>
				<div className="key-info-detail-item">
					<span className="key-info-detail-label">Visual style</span>
					<span className="key-info-detail-value">{key.visualStyle}</span>
				</div>
				<div className="key-info-detail-item">
					<span className="key-info-detail-label">Row</span>
					<span className="key-info-detail-value">{key.row}</span>
				</div>
				<div className="key-info-detail-item">
					<span className="key-info-detail-label">Column</span>
					<span className="key-info-detail-value">{key.column}</span>
				</div>

				<div className="key-info-detail-item">
					<span className="key-info-detail-label">Label</span>
					<span className="key-info-detail-value">{key.label}</span>
				</div>

				<div className="key-info-detail-item">
					<span className="key-info-detail-label">Icon</span>
					<span className="key-info-detail-value">{key.iconId}</span>
				</div>

				<div className="key-info-detail-item">
					<span className="key-info-detail-label">Code</span>
					<span className="key-info-detail-value">{key.code}</span>
				</div>
			</div>
		</section>

		<section className="key-info-section">
			<h2>Matched background matchrules</h2>
			<p className="key-info-hint">{activeKey.bgMatches.length > 1 ? "Only first one per layer applies" : (activeKey.bgMatches.length > 0 ? "" : "No matchrules match this key.")}</p>
			<div className="file-list">
				{activeKey.bgMatches.map((v) => (
					<div className="file compact">
						<img src={AssetStore.store[v.asset].runtime.preview} />
						<p>{v.selector}</p>
					</div>
				))}
			</div>
		</section>

		<section className="key-info-section">
			<h2>Matched icon matchrules</h2>
			<p className="key-info-hint">{activeKey.iconMatches.length > 1 ? "Only first one applies" : (activeKey.iconMatches.length > 0 ? "" : "No matchrules match this key.")}</p>
			<div className="file-list">
				{activeKey.iconMatches.map((v) => (
					<div className="file compact">
						<img src={AssetStore.store[v.asset].runtime.preview} />
						<p>{v.selector}</p>
					</div>
				))}
			</div>
		</section>

		<section className="key-info-section">
			<h2>Color sources</h2>
			<div>
				<div className="key-info-detail-item">
					<span className="key-info-detail-label">Background</span>
					<span className="key-info-detail-value">{activeKey.background}</span>
				</div>
				<div className="key-info-detail-item">
					<span className="key-info-detail-label">Foreground</span>
					<span className="key-info-detail-value">{activeKey.foreground}</span>
				</div>
				{activeKey.backgroundAsset ? <button onclick={() => {
					WorkCanvas.editAsset(activeKey.backgroundAsset);
					WorkCanvas.previewSelector("");
					Window.close(KeyInfoWindow);
				}}>Edit asset</button> : undefined}
			</div>
		</section>

		<section className="key-info-section">
			<h2>Add matchrule?</h2>
			<p className="key-info-hint">There are a lot of possible matchrules, these are just a few examples. You can remix them after adding.</p>
			<div className="file-list">
				{activeKey.selectors.map((v) => (
					<div
						className="file compact selectable"
						onmouseenter={() => WorkCanvas.previewSelector(v)}
						onmouseleave={() => WorkCanvas.previewSelector("")}
						onclick={() => {
							const kind = v.includes("icon") ? "icon" : "background";
							insertNewMatchrule(kind, 0, v);
							WorkCanvas.previewSelector("");
							Window.close(KeyInfoWindow);
						}}
					>
						<p>{v}</p>
						<div style="flex:1"></div>
						{Ui.iconEl("plus")}
					</div>
				))}
			</div>
		</section>


	</div>)
}

const KeyInfoWindow = {
	name: "Inspect Key",
	persist: true,
	contents: keyInfoWindowContents,
};

export default KeyInfoWindow;

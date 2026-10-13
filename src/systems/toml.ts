import { BackgroundAsset } from "../../core/assets";
import { importToml } from "../../core/toml";
import AssetStore from "./assets";

export function openTomlImportPicker() {
	if(State.isDirty()) {
		alert("Note: The current project will be replaced if you proceed. You may want to cancel then save it first.");
	}

	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.zip,application/zip,application/x-zip,application/x-zip-compressed';
	input.onchange = (e) => {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				try {
					const { newTheme, newStore } = importToml(reader.result as ArrayBuffer);

					for(const v of Object.values(newStore)) {
						if(v[0].kind === "background") {
							const info = v[1] as BackgroundAsset;
							if(info.backgroundToken.startsWith("system_") || info.foregroundToken.startsWith("system_")) {
								throw new Error("Themes with dynamic colors aren't supported for editing yet");
							}
						}
					}

					for(const v of Object.values(newTheme.colors)) {
						if(v.startsWith("system_")) {
							throw new Error("Themes with dynamic colors aren't supported for editing yet");
						}
					}
					
					State.newProject("load", () => {
						State.theme = newTheme;

						for(const [k, v] of Object.entries(newStore)) {
							AssetStore.loadSaved(k, v[0], v[1], v[2]);
						}
					});

					alert("Project imported: " + newTheme.name);
				}catch(e) {
					alert("Import failed. " + e);
				}
			}
			reader.readAsArrayBuffer(file);
		}
	};
	input.click();
}

import { importToml } from "../../core/toml";
import AssetStore from "./assets";

export function openTomlImportPicker() {
	if(State.isDirty()) {
		alert("Note: The current project will be replaced if you proceed. You may want to save it first.");
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

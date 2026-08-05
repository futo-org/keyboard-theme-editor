// Exporting code is currently in ExportWindow (and doesn't use TOML library)
import { DEFAULT_THEME, Theme } from "../keyboard/types/Theme";
import { UZIP } from "../vendor/UZIP";
import TOML from 'smol-toml';
import AssetStore, { AssetMeta, BackgroundAsset, DefaultAssets, genUniqueName, getFileType, IconAsset, OtherAsset } from "./assets";

export function importToml(file: ArrayBuffer) {
	const fdata = (UZIP as any).parse(file);

	const tomlData = fdata["theme.txt"] ?? fdata["theme.toml"];
	if(!tomlData) {
		throw new Error("No theme data found");
	}

	const toml = (new TextDecoder("utf-8")).decode(tomlData);
	const versionMatch = toml.match(/Format version: (\d\.?\d?)/);
	const version = versionMatch ? versionMatch[1] : null;

	if(version === null) {
		throw new Error("File must have a comment like this:  # Format version: 1.0");
	}
	if(version !== "1.0") {
		throw new Error("Unsupported version " + version);
	}

	const data = TOML.parse(toml) as any;

	const snakeToCamel = (str: string) => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

	const newStore: { [key: string]: [AssetMeta, BackgroundAsset | IconAsset | OtherAsset, Blob] } = {};
	const newTheme: Theme = structuredClone(DEFAULT_THEME);
	newTheme.name = data.name ?? "imported theme";
	newTheme.author = data.author ?? "unknown author";
	newTheme.id = data.id!;
	newTheme.version = data.version ?? 1;
	newTheme.description = data.description ?? "unknown description";
	newTheme.options = {
		autoBorders: data.options.auto_borders ?? true,
		centerHints: data.options.center_hints ?? false,
		roundedness: data.options.roundedness ?? 1.0,
		scaleText: data.options.scale_text ?? 1.0,
		scaleHints: data.options.scale_hints ?? 1.0,
		weightText: data.options.weight_text ?? 400,
		weightHints: data.options.weight_hints ?? 500,
	};


	const shouldInherit = new Set(Object.keys(newTheme.colors));

	for(const snake_name of Object.keys(data.colors)) {
		const camelName = snakeToCamel(snake_name);
		(newTheme.colors as any)[camelName] = data.colors[snake_name];
		shouldInherit.delete(camelName);
	}

	for(const line of toml.split("[colors]")[1].split("\n")) {
		if(!line.includes("# inherited")) continue;
		const snake_name = line.trim().split(" ")[0];
		if(!snake_name) continue;
		const camelName = snakeToCamel(snake_name);
		if(!Object.keys(newTheme.colors).includes(camelName)) continue;
		shouldInherit.add(camelName);
	}

	newTheme.internal = {inheritedColors: {}};
	for(const col of shouldInherit) {
		newTheme.internal.inheritedColors[col] = true;
	}

	const assignedAssetNames: { [key: string]: string } = {};

	const assetInfoFor = (name: string, kind: "background" | "icon" | "other") => {
		const asset = structuredClone(DefaultAssets[kind]);
		if(!data.asset) {
			console.error("data.asset is absent");
			return asset;
		}
		const list = data.asset[kind == "background" ? "border" : kind];
		if(!list) {
			console.error("data.asset[" + kind + "] is absent");
			return asset;
		}

		let found = false;
		for(const v of list) {
			if(v.name !== name) continue;
			found = true;

			if(kind === "background") {
				const a = asset as BackgroundAsset;
				if(v.foreground_tint && v.background_tint) {
					if(v.foreground_tint.startsWith("#") || v.background_tint.startsWith("#")) {
						a.colorKind = "constant";
						a.backgroundConstant = v.background_tint;
						a.foregroundConstant = v.foreground_tint;
					} else {
						a.colorKind = "themed";
						a.backgroundToken = v.background_tint;
						a.foregroundToken = v.foreground_tint;
					}
				}

				if(v.padding && v.padding.length === 4) {
					a.padding = {
						left: v.padding[0],
						top: v.padding[1],
						right: v.padding[2],
						bottom: v.padding[3]
					};
				}

				if(v.slicing && v.slicing.length === 4) {
					a.slicing = {
						left: v.slicing[0],
						top: v.slicing[1],
						right: v.slicing[2],
						bottom: v.slicing[3]
					};
				}

				if(v.gap && v.gap.length === 4) {
					a.gap = {
						left: v.gap[0],
						top: v.gap[1],
						right: v.gap[2],
						bottom: v.gap[3]
					};
				}

				if(v.target_density) {
					a.targetDensity = v.target_density;
				}
			}

			if(kind === "icon") {
				const a = asset as IconAsset;
				if(v.target_density) {
					a.targetDensity = v.target_density;
				}
			}

			break;
		}

		if(!found) {
			console.error("asset config not found: " + name);
		}

		return asset;
	}

	const lookupAsset = (name: string, kind: "background" | "icon" | "other") => {
		if(assignedAssetNames[name] !== undefined) {
			return assignedAssetNames[name];
		} else {
			const assetname = genUniqueName(name);
			const assetbuffer = fdata[name];
			if(!assetbuffer) return undefined;
			const blob = new Blob([assetbuffer]);

			const assetinfo = assetInfoFor(name, kind);
			newStore[assetname] = [{name: name, kind: kind, type: getFileType(name), builtin: false}, assetinfo, blob];
			assignedAssetNames[name] = assetname;
			return assetname;
		}
	}


	for(const { selector, asset } of data.matchrules?.border ?? []) {
		const name = lookupAsset(asset, "background");
		if(!name) continue;
		newTheme.assets.key.push({
			selector: selector,
			asset: name
		});
	}

	for(const { selector, asset } of data.matchrules?.icon ?? []) {
		const name = lookupAsset(asset, "icon");
		if(!name) continue;
		newTheme.assets.icon.push({
			selector: selector,
			asset: name
		});
	}

	if(data.options?.font?.font) {
		newTheme.assets.font = lookupAsset(data.options?.font?.font, "other");
	}

	if(data.options?.background?.image) {
		const aname = lookupAsset(data.options?.background?.image, "other");
		if(aname) {
			newTheme.assets.background.image = aname;
			const cropping = data.options?.background?.cropping;
			if(cropping && cropping.length === 4) {
				(newStore[aname][1] as OtherAsset).cropping = {
					left: cropping[0],
					top: cropping[1],
					right: cropping[2],
					bottom: cropping[3]
				};
			}
		}

		if(data.options?.background?.opacity)
			newTheme.assets.background.opacity = data.options?.background?.opacity;

		if(data.options?.background?.action_bar_opacity)
			newTheme.assets.background.actionBarOpacity = data.options?.background?.action_bar_opacity;
	}

	State.newProject("load", () => {
		State.theme = newTheme;

		for(const [k, v] of Object.entries(newStore)) {
			AssetStore.loadSaved(k, v[0], v[1], v[2]);
		}
	});

	alert("Project imported: " + newTheme.name);
}

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
					importToml(reader.result as ArrayBuffer);
				}catch(e) {
					alert("Import failed. " + e);
				}
			}
			reader.readAsArrayBuffer(file);
		}
	};
	input.click();
}

import { DEFAULT_ICONS, mergeDicts, Asset, BackgroundAsset, IconAsset, OtherAsset, AssetMeta, genUniqueName, getFileType, DefaultAssets } from "../../core/assets";

const AssetStore = {
	EV_FILE_ADDED: "fileAdded",
	EV_IMG_LOADED: "imageLoaded",
	EV_FILE_REMOVED: "fileRemoved",
	store: {} as { [key: string]: Asset },

	reset: () => {
		Object.keys(AssetStore.store).forEach((v) => {
			State.ev.emit(AssetStore.EV_FILE_REMOVED, v);
			URL.revokeObjectURL(AssetStore.store[v].runtime.url);
		});
		AssetStore.store = {};
		addBuiltInAssets();
	},
	add: addAsset,
	remove: removeAsset,
	update: updateAsset,
	loadSaved: loadSavedAsset
};

async function createFontPreview(filename: string, url: string): Promise<[Blob, string]> {
	const fontName = filename + "FontPreview";
	const fontFace = new FontFace(fontName, `url("${url}")`);

	await fontFace.load();

	document.fonts.add(fontFace);
	const canvas = document.createElement("canvas");
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext("2d");
	if(!ctx) throw Error("No ctx2d");
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#000";
	ctx.font = `48px "${fontName}"`;
	ctx.textBaseline = "middle";
	ctx.textAlign = "center";
	ctx.fillText("Aa", 32, 32);

	const blob = (await new Promise((res) => canvas.toBlob(res))) as Blob | null;
	if(!blob) throw Error("no blob");
	const result = URL.createObjectURL(blob);

	document.fonts.delete(fontFace);

	return [blob, result];
}

export function setPreviewAndImgOnAsset(asset: Asset, assetName: string, file: File | Blob) {
	const url = asset.runtime.url;

	let previewPromise: Promise<[Blob, string]>;
	if (asset.meta.type === "font") {
		if(asset.meta.kind !== "other") {
			console.error("A font is only permitted on 'other' kind.")
			return false;
		}

		previewPromise = createFontPreview(genUniqueName(""), url);
	} else {
		previewPromise = (async () => [file, url])();
	}

	previewPromise.then(([data, uri]) => {
		asset.runtime.preview = uri;
		createImageBitmap(data).then((img) => {
			asset.runtime.img = img;
			if(AssetStore.store[assetName]) {
				State.ev.emit(AssetStore.EV_IMG_LOADED, assetName);
			}
		});
	});

	return true;
}


export function updateAsset(assetName: string, newFile: File) {
	const asset = AssetStore.store[assetName];
	if(!asset) return false;

	const typeName = (newFile.name) ? getFileType(newFile.name) : asset.meta.type;
	if(typeName !== asset.meta.type) {
		console.error("Mismatching type! That's illegal", asset, newFile.name);
		return false;
	}

	const url = URL.createObjectURL(newFile);

	const newAsset = structuredClone(asset);
	newAsset.runtime = {
		url,
		preview: undefined,
		img: undefined
	}

	setPreviewAndImgOnAsset(newAsset, assetName, newFile);

	State.execute(`Replace asset ${asset.meta.name}`, () => {
		AssetStore.store[assetName] = newAsset;
		State.ev.emit(AssetStore.EV_IMG_LOADED, assetName);
	}, () => {
		AssetStore.store[assetName] = asset;
		State.ev.emit(AssetStore.EV_IMG_LOADED, assetName);
	});

}

function makeAsset(file: File, kind: "background" | "icon" | "other", name: string | undefined): [string, Asset] {
	const assetName = genUniqueName(name ?? file.name);
	const url = URL.createObjectURL(file);

	const obj: Asset = {
		runtime: {
			url: url
		},
		meta: {
			name: name ?? file.name,
			type: getFileType(name ?? file.name),
			kind: kind,
			builtin: false
		},
		data: structuredClone(DefaultAssets[kind])
	}

	if(!setPreviewAndImgOnAsset(obj, assetName, file)) throw Error("cant set preview");

	return [assetName, obj];
}

export function addAsset(file: File, kind: "background" | "icon" | "other", name: string | undefined, overrides: any | undefined): string {
	const [assetName, asset] = makeAsset(file, kind, name);

	if(overrides) {
		Object.keys(overrides).forEach((k) => (asset.data as any)[k] = overrides[k]);
	}

	State.execute(`Add asset ${name ?? file.name}`, () => {
		AssetStore.store[assetName] = asset;
		State.ev.emit(AssetStore.EV_FILE_ADDED, assetName);
	}, () => {
		delete AssetStore.store[assetName];
		State.ev.emit(AssetStore.EV_FILE_REMOVED, assetName);
	});

	return assetName;
}


function addBuiltinAsset(name: string, url: string, kind: "background" | "icon" | "other") {
	const asset: Asset = {
		runtime: {
			url: url
		},
		meta: {
			name: name,
			type: getFileType(name),
			kind: kind,
			builtin: true
		},
		data: structuredClone(DefaultAssets[kind])
	};

	const img = new Image();
	img.onload = () => {
		asset.runtime.img = img;
		State.ev.emit(AssetStore.EV_IMG_LOADED, name);
	};
	img.src = url;

	AssetStore.store[name] = asset;
	State.ev.emit(AssetStore.EV_FILE_ADDED, name);
}

export function addBuiltInAssets() {
	Object.entries(DEFAULT_ICONS).forEach(([filename, url]) => {
		addBuiltinAsset(filename, url, "icon");
	});
}

export function removeAsset(filename: string) {
	const item = AssetStore.store[filename];
	if(!item) return;

	State.execute(`Remove asset ${item.meta.name}`, () => {
		delete AssetStore.store[filename];
		State.ev.emit(AssetStore.EV_FILE_REMOVED, filename);
	}, () => {
		AssetStore.store[filename] = item;
		State.ev.emit(AssetStore.EV_FILE_ADDED, filename);
	});
}

function loadSavedAsset(assetName: string, meta: AssetMeta, data: BackgroundAsset | IconAsset | OtherAsset, blob: Blob, undoable?: boolean) {
	const url = URL.createObjectURL(blob);

	const d2 = mergeDicts(structuredClone(DefaultAssets[meta.kind]), data);

	const obj: Asset = {
		runtime: {url: url},
		meta, data: d2
	}

	if(!setPreviewAndImgOnAsset(obj, assetName, blob)) throw new Error("cant set preview");

	if(undoable === true) {
		State.execute(`Add asset ${meta.name}`, () => {
			AssetStore.store[assetName] = obj;
			State.ev.emit(AssetStore.EV_FILE_ADDED, assetName);
		}, () => {
			delete AssetStore.store[assetName];
			State.ev.emit(AssetStore.EV_FILE_REMOVED, assetName);
		})
	} else {
		AssetStore.store[assetName] = obj;
		State.ev.emit(AssetStore.EV_FILE_ADDED, assetName);
	}
}

export default AssetStore;

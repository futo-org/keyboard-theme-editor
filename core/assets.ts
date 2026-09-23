import icon_shift_key from './icons/shift.svg' with { type: 'text' }
import icon_delete_key from './icons/delete.svg' with { type: 'text' }
import icon_space_key from './icons/space.svg' with { type: 'text' }
import icon_space_key_for_number_layout from './icons/space_2.svg' with { type: 'text' }
import icon_enter_key from './icons/enter.svg' with { type: 'text' }
import icon_action_emoji from './icons/emoji.svg' with { type: 'text' }
import icon_chevron_right from './icons/chevron_right.svg' with { type: 'text' }
import icon_mic_fill from './icons/mic_fill.svg' with { type: 'text' }
import icon_action_switch_language from './icons/globe.svg' with { type: 'text' }
import icon_action_left from './icons/arrow-left.svg' with { type: 'text' }
import icon_action_right from './icons/arrow-right.svg' with { type: 'text' }
import icon_action_undo from './icons/undo.svg' with { type: 'text' }
import icon_numpad from './icons/numpad.svg' with { type: 'text' }

export type AssetKind = "background" | "icon" | "other";
export type AssetType = "image" | "font";
export type ColorKind = "constant" | "themed";
export type ColorString = string;

export interface IAssetStore {
	store: { [key: string]: Asset },
	//addAsset: (file: File, kind: AssetKind, name: string | undefined, overrides: any | undefined) => string,
	//removeAsset: (assetName: string) => void,
	//updateAsset: (assetName: string, newFile: File) => void,
	//loadSaved: (assetName: string, meta: AssetMeta, data: BackgroundAsset | IconAsset | OtherAsset, blob: Blob, undoable?: boolean) => void,
};

export type Rect = {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

export type Asset = {
	runtime: AssetRuntimeData;
	meta: AssetMeta;
	data: BackgroundAsset | IconAsset | OtherAsset;
}

export type AssetRuntimeData = {
	url: string;
	preview?: string;
	img?: ImageBitmap | HTMLImageElement;
};

export type AssetMeta = {
	name: string;
	type: AssetType;
	kind: AssetKind;
	builtin: boolean;
}

export type BackgroundAsset = {
	colorKind: ColorKind;
	foregroundConstant: ColorString;
	backgroundConstant: ColorString;
	foregroundToken: string;
	backgroundToken: string;
	padding: Rect;
	gap?: Rect;
	slicing: Rect;
	targetDensity: number;
}

export type IconAsset = {
	targetDensity: number;
}

export type OtherAsset = {
	cropping: Rect;
}

export const DefaultAssets = {
	"background": {
		colorKind: "constant",
		foregroundConstant: "#000000",
		backgroundConstant: "#ffffff",

		foregroundToken: "onKeyboardContainer",
		backgroundToken: "keyboardContainer",

		padding: {
			left: 0, top: 0, right: 0, bottom: 0,
		},

		gap: {
			left: 1, top: 1, right: 1, bottom: 1,
		},

		slicing: {
			left: 0, top: 0, right: 1, bottom: 1
		},

		targetDensity: 640.0
	} as BackgroundAsset,
	"icon": {
		targetDensity: 640.0
	} as IconAsset,
	"other": {
		cropping: {
			left: 0, top: 0, right: 1, bottom: 1
		}
	} as OtherAsset
};

export function genUniqueName(fn: string | undefined){
	return window.crypto.randomUUID() + "___" + (fn ?? "untitled");
}

export function mergeDicts<T extends Record<string, any>>(first: T, second: Partial<T>): T {
	const result: any = {};

	for (const key in first) {
		if (key in second) {
			const firstVal = first[key];
			const secondVal = second[key];

			if (
				firstVal !== null &&
                typeof firstVal === 'object' &&
                !Array.isArray(firstVal) &&
                secondVal !== null &&
                typeof secondVal === 'object' &&
                !Array.isArray(secondVal)
			) {
				result[key] = mergeDicts(firstVal, secondVal as any);
			} else {
				result[key] = secondVal;
			}
		} else {
			result[key] = first[key];
		}
	}

	for(const key in second) {
		if (!(key in first)) {
			result[key] = second[key];
		}
	}

	return result;
}

export function getFileType(name: string): AssetType {
	const split = (name).toLowerCase().split('.');
	const extension = split[split.length - 1];

	if(extension === "ttf" || extension === "otf") return "font";
	else return "image";
}


function toDataUrl(svgData: string) {
	return "data:image/svg+xml;utf8," + encodeURIComponent(svgData);
}

export const DEFAULT_ICONS = {
	"shift_key": toDataUrl(icon_shift_key),
	"delete_key": toDataUrl(icon_delete_key),
	"space_key": toDataUrl(icon_space_key),
	"space_key_for_number_layout": toDataUrl(icon_space_key_for_number_layout),
	"enter_key": toDataUrl(icon_enter_key),
	"action_emoji": toDataUrl(icon_action_emoji),
	"chevron_right": toDataUrl(icon_chevron_right),
	"mic_fill": toDataUrl(icon_mic_fill),
	"action_switch_language": toDataUrl(icon_action_switch_language),
	"action_left": toDataUrl(icon_action_left),
	"action_right": toDataUrl(icon_action_right),
	"action_undo": toDataUrl(icon_action_undo),
	"numpad": toDataUrl(icon_numpad),
}

export async function assetStoreOnceOff(newStore: {string: [AssetMeta, BackgroundAsset | IconAsset | OtherAsset, Blob]}) {
	const result: IAssetStore = {
		store: {}
	};

	for(const [assetName, url] of Object.entries(DEFAULT_ICONS)) {
		try {
			const img: Image = await (new Promise((resolve, reject) => {
				const img = new Image();
				img.onload = () => resolve(img);
				img.onerror = reject;
				img.src = url;
			}));
			const asset: Asset = {
				runtime: { url, img },
				meta: {
					name: assetName,
					type: "image",
					kind: "icon",
					builtin: true
				},
				data: structuredClone(DefaultAssets["icon"])
			};
			result.store[assetName] = asset;
		} catch(e) {
			console.error("cant decode " + assetName + " : " + e);
		}
	}

	for(const [assetName, [meta, pdata, blob]] of Object.entries(newStore)) {
		const url = URL.createObjectURL(blob);
		const data = mergeDicts(structuredClone(DefaultAssets[meta.kind]), pdata);

		try {
			const img = meta.type === "image" ? await createImageBitmap(blob) : undefined;
			const asset: Asset = {
				runtime: { url, img },
				meta,
				data
			};

			result.store[assetName] = asset;
		} catch(e) {
			console.error("cant decode " + assetName + " : " + e);
		}
	}

	return result;
}

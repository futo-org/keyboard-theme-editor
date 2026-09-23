import { createNinePatch, drawNinePatch, getEffectiveBackgroundTint, getEffectiveForegroundTint } from './ninepatch';
import { Theme, ThemeKeyIconAsset, ThemeOptions } from './types/Theme';
import { IAssetStore, OtherAsset, Rect } from '../assets.ts';
import { forceAlpha, HEXtoRGB } from './color';
import { matchesKey, parseQualifiers, suggestQualifiersForKey } from './qualifiers';
import { dp, pxToDp } from './density';

const robotoUrl = "Roboto-Regular.ttf";

function drawTintedImage(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, icon: CanvasImageSource, x: number, y: number, w: number, h: number, tint: string) {
	const tempCanvas = document.createElement('canvas');
	const tempCtx = tempCanvas.getContext('2d')!;
	tempCanvas.width = w;
	tempCanvas.height = h;

	tempCtx.drawImage(icon, 0, 0, w, h);

	tempCtx.globalCompositeOperation = 'source-in';
	tempCtx.fillStyle = tint;
	tempCtx.fillRect(0, 0, w, h);

	ctx.drawImage(tempCanvas, x, y);
}

function getAssetImage(store: IAssetStore, assetName: string) {
	const asset = store.store[assetName];
	if(!asset) {
		console.error("asset " + assetName + " has no corresponding entry in assetStore...");
		return undefined;
	}
	
	return asset.runtime.img;
}

function drawKeyForeground(store: IAssetStore, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, currIcons: Array<[ParsedQualifiers, string]>, key: EnrichedKey, fgCol: string, hintCol: string | null, offsetY: number, layout: EnrichedLayout, padding: Rect | undefined, options: ThemeOptions, kx: number, ky: number, kw: number, kh: number) {
	const centerHints = options.centerHints;
	ctx.fillStyle = fgCol;

	const autoXScale = (key.labelFlags & 0x4000) === 0x4000;
	const autoYScale = (key.labelFlags & 0x8000) === 0x8000;
	const autoScale = autoXScale && autoYScale;

	const hasHintLabel = (key.labelFlags & 0x800) === 0x800;
	const alignOffCenter = (key.labelFlags & 0x08) === 0x08;

	const followKeyLargeLetterRatio = (key.labelFlags & 0x40) === 0x40;
	const followKeyLetterRatio = (key.labelFlags & 0x80) === 0x80;
	const followKeyLabelRatio = (key.labelFlags & 0xC0) === 0xC0;
	const followKeyHintLabelRatio = (key.labelFlags & 0x140) === 0x140;
 
	let size;
	if(followKeyLetterRatio) {
		size = layout.keySizes.letter;
	} else if(followKeyLargeLetterRatio) {
		size = layout.keySizes.largeLetter;
	} else if(followKeyLabelRatio) {
		size = layout.keySizes.label;
	} else if(followKeyHintLabelRatio) {
		size = layout.keySizes.hintLabel;
	} else if(key.label.length <= 1 || key.visualStyle === "Normal") {
		size = layout.keySizes.letter;
	} else {
		size = layout.keySizes.label;
	}

	if(autoXScale) {
		// Not implemented
		if(autoScale) {
			// Not implemented
		}
	}

	const keyboardWidthDp = pxToDp(layout.width, layout.density);

	let keyHintPaddingX = dp(2.5, layout.density);
	if(keyboardWidthDp > 600) {
		keyHintPaddingX = dp(3, layout.density);
	}

	let keyHintPaddingY = keyHintPaddingX;

	if(padding !== undefined && (padding.left != 0 || padding.right != 0 || padding.top != 0 || padding.bottom != 0)) {
		keyHintPaddingX = padding.right;
		keyHintPaddingY = padding.top;
	}

	let icon = undefined;
	for (const v of currIcons) {
		if (matchesKey(v[0], key, layout)) {
			icon = getAssetImage(store, v[1]);
			if(icon) break;
		}
	}

	let baseX = kx;

	if(alignOffCenter) {
		baseX += size*-1.2/2;
	}

	size *= options.scaleText;
	if (icon) {
		const cx = baseX + kw / 2;
		const cy = ky + kh / 2;
		drawTintedImage(ctx, icon, cx - size / 2, cy - size / 2 + offsetY, size, size, ctx.fillStyle as string);
	} else if (key.iconId) {
		ctx.font = `${options.weightText} ${0.25*size*1.1}px theme-font`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle'
		ctx.fillText(key.iconId, baseX + kw / 2, ky + kh / 2 + offsetY);
	} else {
		ctx.font = `${options.weightText} ${size*1.1}px theme-font`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle'
		const offset = -ctx.measureText('').actualBoundingBoxAscent / 2 + ((centerHints && key.hintLabel && !hasHintLabel) ? size * 0.1 : 0);
		ctx.fillText(key.label, baseX + kw / 2, ky + kh / 2 + offset + offsetY);
	}
	size /= options.scaleText;

	if(key.hintLabel
		// offsetY means we are rendering the key press feedback, don't need the hint on there
		&& offsetY == 0
		&& options.scaleHints > 0.0
	) {
		size *= 0.5;
		size *= options.scaleHints;

		// TODO: The code for this on Android app is really convoluted and misleading
		ctx.fillStyle = hintCol || forceAlpha(fgCol, 0.8);

		ctx.font = `${hasHintLabel ? Math.max(700, options.weightHints) : options.weightHints} ${size}px theme-font`;


		if(!hasHintLabel) {
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			const hintDigitMeasurement = ctx.measureText('8');
			const hintLabelMeasurement = ctx.measureText(key.hintLabel);
			const maxHintWidth = Math.max(hintDigitMeasurement.width, hintLabelMeasurement.width);

			const hintX = centerHints ? (baseX + kw / 2) : (baseX + kw - keyHintPaddingX - maxHintWidth / 2);

			const hintBaseline = ky + keyHintPaddingY - (centerHints ? 0 : ctx.measureText('').actualBoundingBoxAscent/3);

			ctx.fillText(key.hintLabel, hintX, hintBaseline);
		} else {
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle'
			ctx.fillText(key.hintLabel, baseX + kw / 2 + 4.0*size/2, ky + kh / 2);
		}
	}
}

function drawKeyHighlight(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, key: EnrichedKey, theme: Theme, layout: EnrichedLayout) {
	const radius = dp(9, layout.density);

	ctx.strokeStyle = "#00FFFF";
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.roundRect(key.drawX, key.y, key.width, key.height, radius);
	ctx.stroke();

	ctx.strokeStyle = "#227777";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.roundRect(key.drawX, key.y, key.width, key.height, radius);
	ctx.stroke();
}

function lookupFillStyles(key: EnrichedKey, theme: Theme, lookup: boolean) {
	const fillStyleNames = {
		Action: {borders: ["primary", "onPrimary"], noborders: ["primary", "onPrimary"]},
		Normal: {borders: ["keyboardContainer", "onKeyboardContainer"], noborders: ["", "onBackground"]},
		Functional: {borders: ["keyboardContainerVariant", "onKeyboardContainer"], noborders: ["", "onBackground"]},
		Spacebar: {borders: ["keyboardContainer", "onKeyboardContainer"], noborders: ["keyboardContainerPressed", "onBackground"]},
	};

	const fallbackStyle = {borders: ["", "onBackground"], noborders: ["", "onBackground"]};

	let names = ((fillStyleNames as any)[key.visualStyle] ?? fallbackStyle)[theme.options.autoBorders ? "borders" : "noborders"];

	const result = {
		background: "",
		foreground: "",
		radius: 9,
		highlightOnPress: true
	};

	if(key.visualStyle === "Action") {
		result.highlightOnPress = false;
		result.radius = 128;

		if(key.pressed) names = ["secondaryContainer", "onSecondaryContainer"];
	}

	if(key.visualStyle === "Spacebar" && !theme.options.autoBorders) {
		result.radius = 100;
		if(key.pressed) names = ["", "onBackground"];
	}

	if(lookup) {
		if(names[0]) {
			result.background = (theme.colors as any)[names[0]];
		}

		if(names[1]) {
			result.foreground = (theme.colors as any)[names[1]];
		}
	} else {
		result.background = names[0] ? names[0] : "(none)";
		result.foreground = names[1] ? names[1] : "(none)";
	}

	return result;
}

function drawFallbackBackground(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, key: EnrichedKey, theme: Theme, layout: EnrichedLayout) {
	const style = lookupFillStyles(key, theme, true);
	const radius = dp(style.radius, layout.density) * theme.options.roundedness;

	if(style.background) {
		ctx.fillStyle = style.background;
		ctx.beginPath();
		ctx.roundRect(key.drawX, key.y, key.width, key.height, radius);
		ctx.fill();
	}

	if(style.highlightOnPress && key.pressed) {
		ctx.fillStyle = theme.colors.keyboardContainerPressed;
		ctx.beginPath();
		ctx.roundRect(key.drawX, key.y, key.width, key.height, radius);
		ctx.fill();
	}

	return style.foreground;
}

function drawFallbackPopup(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, theme: any, key: any, layout: any, x: number, y: number, width: number, height: number) {
	const radius = dp(9, layout.density) * theme.options.roundedness;

	ctx.fillStyle = theme.colors.keyboardPress;
	ctx.beginPath();
	ctx.roundRect(x, y, width, height, radius);
	ctx.fill();

	return theme.colors.onKeyboardContainer;
}

function matchIcon(store: IAssetStore, icon: string, currIcons: Array<[ParsedQualifiers, string]>) {
	for(const candidate of currIcons) {
		if(candidate[0][0].token == "DEFAULT_ICONS" && candidate[0][1].fn!({iconId: icon} as any, {} as any)) {
			const result = getAssetImage(store, candidate[1]);
			if(result) return result;
		}
	}
	return null;
}

function renderActionBar(store: IAssetStore, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, theme: Theme, layout: EnrichedLayout, currIcons: Array<[ParsedQualifiers, string]>) {
	if(layout.actionBar !== true) return;

	const dpl = (v: number) => dp(v, layout.density);

	const sep = dpl(1);

	const height: number = layout.actionBarHeight;
	ctx.fillStyle = theme.colors.keyboardSurfaceDim;


	// Draw background
	if(theme.assets.background.image) {
		ctx.fillStyle = forceAlpha(theme.colors.keyboardSurface, theme.assets.background.actionBarOpacity);
	} else if(theme.options.autoBorders) {
		ctx.fillStyle = theme.colors.keyboardSurface;
	} else {
		ctx.fillStyle = theme.colors.keyboardSurfaceDim;
	}
	ctx.fillRect(0, 0, layout.width, height);

	// Draw separators
	ctx.fillStyle = theme.colors.keyboardContainer;
	ctx.fillRect(0, 0, layout.width, sep);
	if(!theme.options.autoBorders) {
		ctx.fillStyle = theme.colors.keyboardContainer;
		ctx.fillRect(0, height - sep, layout.width, sep);
	}

	// Draw suggestions
	let words = ["thus", "the", "\"thr\""];
	if(layout.name == "flick") {
		words = ["こんにちは"];
	}else if(layout.name == "lithuanian_qwerty") {
		words = ["labas", "labuka", "\"labubu\""];
	}
	for(let i=0; i<words.length; i++) {
		const width = (layout.width - 2 * dpl(42)) / words.length;
		const x = dpl(42) + i*width;

		// draw text
		ctx.fillStyle = i == 1 ? theme.colors.onSurface : theme.colors.onSurfaceVariant;
		const size = dpl(18);
		ctx.font = (words[i].startsWith('"') ? "italic" : "") + (i == 1 ? "bold" : "") + ` ${size}px theme-font`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle'
		ctx.fillText(words[i], x + width / 2, height / 2);

		// draw separator
		if(i < (words.length-1)) {
			ctx.fillStyle = theme.colors.outlineVariant;
			ctx.fillRect(x + width - sep, height * 0.165, sep, height * 0.66);
		}
	}

	// Draw buttons

	ctx.fillStyle = theme.colors.keyboardContainer;
	ctx.beginPath();
	ctx.arc(dpl(20), height/2, dpl(16), 0, 2 * Math.PI);
	ctx.fill();


	ctx.fillStyle = theme.colors.keyboardContainer;
	ctx.beginPath();
	ctx.arc(layout.width - dpl(20), height/2, dpl(16), 0, 2 * Math.PI);
	ctx.fill();

	const chevron = matchIcon(store, "chevron_right", currIcons);
	const mic = matchIcon(store, "mic_fill", currIcons);
	let iconSize = dpl(20);
	if(chevron) drawTintedImage(ctx, chevron, dpl(20) - iconSize / 2, height / 2 - iconSize / 2, iconSize, iconSize, theme.colors.onKeyboardContainer);
	iconSize = dpl(16);
	if(mic) drawTintedImage(ctx, mic, layout.width - dpl(20) - iconSize / 2, height / 2 - iconSize / 2, iconSize, iconSize, theme.colors.onKeyboardContainer);
}

function render({store, ctx, theme, currBgs, currIcons, layout, previewSelector} : {
	store: IAssetStore,
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	theme: Theme,
	currBgs: Array<[ParsedQualifiers, NinePatch]>,
	currIcons: Array<[ParsedQualifiers, string]>,
	layout: EnrichedLayout,
	previewSelector: string
}) {
	ctx.clearRect(0, 0, layout.width, layout.height);

	ctx.fillStyle = forceAlpha(theme.colors.keyboardSurface, 1.0);
	ctx.fillRect(0, 0, layout.width, layout.height);
	if(theme.assets.background.image) {
		const backgroundAsset = store.store[theme.assets.background.image];
		const img = backgroundAsset.runtime?.img;
		if(backgroundAsset && img) {
			const bgWidth = img.width;
			const bgHeight = img.height;

			const data = backgroundAsset.data as OtherAsset;
			const rect = {
				left: data.cropping.left * bgWidth,
				top: data.cropping.top * bgHeight,
				width: (data.cropping.right - data.cropping.left) * bgWidth,
				height: (data.cropping.bottom - data.cropping.top) * bgHeight
			};

			const canvasScale = Math.max(layout.width / rect.width, layout.height / rect.height);

			const offsetX = (-rect.left - rect.width/2  + layout.width/2/canvasScale) * canvasScale;
			const offsetY = (-rect.top  - rect.height/2 + layout.height/2/canvasScale) * canvasScale;

			ctx.drawImage(img,
				0,
				0,
				bgWidth,
				bgHeight,
				offsetX, offsetY, bgWidth * canvasScale, bgHeight * canvasScale
			);

			const fs = forceAlpha(theme.colors.keyboardSurface, 1.0 - theme.assets.background.opacity);
			ctx.fillStyle = fs;
			ctx.fillRect(0, 0, layout.width, layout.height);
		}
	}

	renderActionBar(store, ctx, theme, layout, currIcons);

	const hintCol = null;

	const layers = new Set([0]);
	for(const v of currBgs) {
		const layer = v[0].map((v) => v.layer).filter((v) => v !== undefined)[0];
		if(layer !== undefined) {
			layers.add(layer);
		}
	}
	const layerList = [...layers];
	layerList.sort();

	for(const layer of layerList) {
		const bgs = currBgs.filter((v) => {
			const bgLayer = v[0].map((v) => v.layer).filter((v) => v !== undefined)[0];
			return (bgLayer === layer) || (layer === 0 && bgLayer === undefined);
		});


		for (const key of layout.keys) {

			let x = key.drawX;
			let y = key.y;
			let w = key.width;
			let h = key.height;
			let fgCol = undefined;
			let padding = undefined;
			for(const v of bgs) {
				if(matchesKey(v[0], key, layout)) {

					const gap = v[1].gap;
					if(gap && (gap.left !== 1 || gap.right !== 1 || gap.top !== 1 || gap.bottom !== 1)) {
						x = key.x + (key.horizontalGap / 2) * gap.left;
						w = key.width - (key.horizontalGap / 2 * (gap.left + gap.right - 2));

						y = key.y + (key.verticalGap / 2) * (gap.top - 1);
						h = key.height - (key.verticalGap / 2 * (gap.top + gap.bottom - 2));
					}

					drawNinePatch(ctx, v[1], x, y, w, h);
					fgCol = v[1].foreground;
					padding = v[1].padding;
					break;
				}
			}

			if(fgCol === undefined && layer === 0) {
				fgCol = drawFallbackBackground(ctx, key, theme, layout);
			}

			if(fgCol !== undefined && HEXtoRGB(fgCol).a != 0) {
				drawKeyForeground(store, ctx, currIcons, key, fgCol, hintCol, 0, layout, padding, theme.options, x, y, w, h);
			}
		}
	}

	for (const key of layout.pressedKeys) {
		if ((key.actionFlags & 0x02) === 0x02) continue;
		let bgDrawn = false;
		for (const v of currBgs) {
			const popupless = v[0].filter((v) => v.token != "popup");
			const isPopup = v[0].length != popupless.length;
			if (!isPopup) continue;
			if (matchesKey(popupless, key, layout)) {
				drawNinePatch(ctx, v[1], key.drawX, key.y - key.height, key.width, key.height * 2);
				drawKeyForeground(store, ctx, currIcons, key, v[1].foreground, hintCol, -key.height * 9 / 10, layout, undefined, theme.options,
					key.drawX, key.y, key.width, key.height);

				bgDrawn = true;
				break;
			}
		}

		if(!bgDrawn) {
			const fgColor = drawFallbackPopup(ctx, theme, key, layout, key.drawX, key.y - key.height, key.width, key.height * 2);
			drawKeyForeground(store, ctx, currIcons, key, fgColor, hintCol, -key.height * 9 / 10, layout, undefined, theme.options,
				key.drawX, key.y, key.width, key.height);
		}
	}

	if(previewSelector) {
		const parsed = parseQualifiers(previewSelector);
		if(parsed) {
			for(const key of layout.keys) {
				if(matchesKey(parsed, key, layout)) {
					drawKeyHighlight(ctx, key, theme, layout);
				}
			}
		}
	}
}

export interface RenderContext {
	backgrounds: Array<[ParsedQualifiers, NinePatch]>,
	icons: Array<[ParsedQualifiers, string]>,
	refresh: () => void,
	registeredInput: boolean,
	theme?: Theme,
	onmousedown?: (normX: number, normY: number) => void;
	onmouseup?: () => void;
	loadingFont?: string;
	assetStore?: IAssetStore;
}


type Key = {
	hitbox?: [number, number, number, number];
	drawX: number;
	y: number;
	x: number;
	width: number;
	height: number;
	verticalGap: number;
	horizontalGap: number;
	row: number;
	visualStyle: string;
	iconId: string;
	labelFlags: number;
	actionFlags: number;
	label: string;
	hintLabel: string;
	pressed?: boolean;
};

type EnrichedKey = {
	hitbox: [number, number, number, number];
	drawX: number;
	y: number;
	x: number;
	width: number;
	height: number;
	verticalGap: number;
	horizontalGap: number;
	row: number;
	visualStyle: string;
	iconId: string;
	labelFlags: number;
	actionFlags: number;
	label: string;
	hintLabel: string;
	pressed?: boolean;
};

interface Layout {
	actionBar?: boolean;
	actionBarHeight?: number;
	drawXCorrected?: boolean;
	hitboxAdded?: boolean;
	pressedKeys?: Array<Key>;
	mostCommonKeyWidth?: number;
	mostCommonKeyHeight?: number;
	verticalGap?: number;
	keySizes?: {
		largeLetter: number;
		letter: number;
		label: number;
		hintLabel: number;
	}

	name: string;
	width: number;
	height: number;
	density: number;
	keys: Array<Key>;
};

interface EnrichedLayout {
	actionBar: boolean;
	actionBarHeight: number;
	drawXCorrected: boolean;
	hitboxAdded: boolean;
	pressedKeys: Array<EnrichedKey>;
	mostCommonKeyWidth: number;
	mostCommonKeyHeight: number;
	verticalGap: number;
	keySizes: {
		largeLetter: number;
		letter: number;
		label: number;
		hintLabel: number;
	}

	name: string;
	width: number;
	height: number;
	density: number;
	keys: Array<EnrichedKey>;
}


const LARGE_LETTER_RATIO = 0.9;
const LETTER_RATIO = 0.66;
const LABEL_RATIO = 0.34;
const HINT_LABEL_RATIO = 0.30;
function enrichLayout(layout: Layout) {
	if(layout.actionBar !== true) {
		const actionBarHeight = dp(44, layout.density); // includes 4dp of padding
		const actionBarRenderableHeight = dp(40, layout.density); // without padding
		layout.actionBar = true;
		layout.actionBarHeight = actionBarRenderableHeight;

		layout.height += actionBarHeight;
		layout.keys.forEach((v) => {
			v.y += actionBarHeight;
		})
	}

	if(layout.drawXCorrected !== true) {
		layout.drawXCorrected = true;
		layout.keys.forEach((v) => {
			v.drawX = v.x + v.horizontalGap / 2;
		})
	}

	if(layout.hitboxAdded !== true) {
		layout.hitboxAdded = true;
		layout.keys.forEach((v) => {
			v.hitbox = [v.x, v.y, v.x + v.width + v.horizontalGap, v.y + v.height + v.verticalGap];
		})
	}

	if(layout.pressedKeys === undefined) {
		layout.pressedKeys = [];
	}

	// maybe should include this in json itself
	if(layout.mostCommonKeyWidth === undefined || layout.mostCommonKeyHeight === undefined || layout.verticalGap === undefined) {

		// Very dirty heuristic to find the minimum width "normal" key
		// In some layouts like numpad, the last row has a comma key that is smaller width than a normal key on a first row
		const lastRow = Math.max(...layout.keys.map((v) => v.row));
		const minWidthLastRow = Math.min(...layout.keys.filter((v) => v.row === lastRow).map((v) => v.width));
		const minWidthFirstRow = Math.min(...layout.keys.filter((v) => v.row === 0).map((v) => v.width));
		let mostCommonKey;
		if(minWidthFirstRow < minWidthLastRow) {
			mostCommonKey = layout.keys.find((v) => v.row === 0 && v.width === minWidthFirstRow);
		} else {
			mostCommonKey = layout.keys.find((v) => v.row === lastRow && v.width === minWidthLastRow);
		}
		mostCommonKey = mostCommonKey ?? layout.keys.find((v) => v.visualStyle === "Normal") ?? layout.keys[0];

		layout.mostCommonKeyWidth = mostCommonKey.width;
		layout.mostCommonKeyHeight = mostCommonKey.height;
		layout.verticalGap = mostCommonKey.verticalGap;
	}

	if(layout.keySizes === undefined) {
		const dim = Math.min(layout.mostCommonKeyHeight - layout.verticalGap, layout.mostCommonKeyWidth);
		layout.keySizes = {
			largeLetter: dim * LARGE_LETTER_RATIO,
			letter:      dim * LETTER_RATIO,
			label:       dim * LABEL_RATIO,
			hintLabel:   dim * HINT_LABEL_RATIO,
		};
	}

	return layout as EnrichedLayout;
}

const styleElement = document.createElement("style");
export function initRenderContext(refresh: () => void): RenderContext {
	return { backgrounds: [], icons: [], refresh, registeredInput: false, theme: undefined,
		onmousedown: undefined,
		onmouseup: undefined
	};
}

function renderContextDetectKey(rc: RenderContext, canvas: HTMLCanvasElement | OffscreenCanvas, layout: Layout, normX: number, normY: number) {
	const x = normX * canvas.width;
	const y = normY * canvas.height;

	for (const key of enrichLayout(layout).keys) {
		if (key.hitbox[0] < x && key.hitbox[2] > x && key.hitbox[1] < y && key.hitbox[3] > y) {
			return key;
		}
	}

	return undefined;
}

function registerCanvasInput(rc: RenderContext, canvas: HTMLCanvasElement | OffscreenCanvas, layout: EnrichedLayout) {
	rc.onmousedown = (normX: number, normY: number) => {
		const key = renderContextDetectKey(rc, canvas, layout, normX, normY);
		if(key) {
			key.pressed = true;
			layout.pressedKeys.push(key);
		}

		rc.refresh();
	};

	rc.onmouseup = () => {
		for (const key of layout.pressedKeys) {
			key.pressed = false;
		}
		layout.pressedKeys.length = 0;
		rc.refresh();
	};
}


export function renderContextGetDetectedKeyInfo(rc: RenderContext, canvas: HTMLCanvasElement | OffscreenCanvas, layout: Layout, theme: Theme, normX: number, normY: number) {
	if(!rc.assetStore) return undefined;

	const key = renderContextDetectKey(rc, canvas, layout, normX, normY);
	if(!key) return undefined;

	const result = {
		key: key,
		selectors: suggestQualifiersForKey(layout, key),
		bgMatches: [] as Array<ThemeKeyIconAsset>,
		iconMatches: [] as Array<ThemeKeyIconAsset>,
		background: "",
		foreground: "",
		backgroundAsset: undefined as (string | undefined),
	};

	for (const {selector, asset} of theme.assets.key) {
		const qualifiers = parseQualifiers(selector);
		if(matchesKey(qualifiers, key, layout)) {
			result.bgMatches.push({selector, asset});
		}
	}

	for (const {selector, asset} of theme.assets.icon) {
		const qualifiers = parseQualifiers(selector);
		if(matchesKey(qualifiers, key, layout)) {
			result.iconMatches.push({selector, asset});
		}
	}

	if(result.bgMatches.length > 0) {
		const { asset } = result.bgMatches[0];

		const obj = rc.assetStore.store[asset];

		const bgTint = getEffectiveBackgroundTint(rc.theme, obj, true);
		const fgTint = getEffectiveForegroundTint(rc.theme, obj, true);

		result.background = `Asset ${rc.assetStore.store[asset].meta.name} ${bgTint.toLowerCase() !== "#ffffff" ? "× its background tint " + bgTint : ""}`;
		result.foreground = `Foreground color of asset ${rc.assetStore.store[asset].meta.name} (${fgTint})`;
		result.backgroundAsset = asset;
	} else {
		const style = lookupFillStyles(key, theme, false);
		result.background = style.background;
		result.foreground = style.foreground;
	}

	return result;
}

interface NinePatch {
	image: HTMLCanvasElement | OffscreenCanvas;
	foreground: string;
	stretchX: number[][];
	stretchY: number[][];
	padding: Rect;
	gap: Rect;
};

type ParsedQualifiers = {
	layer?: number;
	token: string;
	fn: ((key: EnrichedKey, kb: EnrichedLayout) => boolean) | null;
}[];

export function updateRenderContext(rc: RenderContext, assetStore: IAssetStore, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, canvas: HTMLCanvasElement | OffscreenCanvas, theme: Theme, layout: Layout) {
	rc.assetStore = assetStore;

	const elayout = enrichLayout(layout);

	rc.theme = theme;
	canvas.width = layout.width;
	canvas.height = layout.height;
	if(!rc.onmouseup) {
		registerCanvasInput(rc, canvas, elayout);
	}
	const density = layout.density;

	rc.backgrounds.length = 0;
	rc.icons.length = 0;

	for (const {selector, asset} of theme.assets.key) {
		const qualifiers = parseQualifiers(selector);
		const img = rc.assetStore.store[asset];
		if(qualifiers && img) {
			const ninepatch = createNinePatch(theme, img, density);
			if(ninepatch) rc.backgrounds.push([qualifiers, ninepatch]);
		}
	}
	
	for (const {selector, asset} of theme.assets.icon) {
		const qualifiers = parseQualifiers(selector);
		const img = rc.assetStore.store[asset];
		if(qualifiers && img) {
			rc.icons.push([qualifiers, asset]);
		}
	}

	const DEFAULT_ICONS = {
		"shift_key": "icons/shift.svg",
		"delete_key": "icons/delete.svg",
		"space_key": "icons/space.svg",
		"space_key_for_number_layout": "icons/space_2.svg",
		"enter_key": "icons/enter.svg",
		"action_emoji": "icons/emoji.svg",
		"chevron_right": "icons/chevron_right.svg",
		"mic_fill": "icons/mic_fill.svg",
		"action_switch_language": "icons/globe.svg",
		"action_left": "icons/arrow-left.svg",
		"action_right": "icons/arrow-right.svg",
		"action_undo": "icons/undo.svg",
		"numpad": "icons/numpad.svg",
	};
	for (const [k, _v] of Object.entries(DEFAULT_ICONS)) {
		const qualifiers: ParsedQualifiers = [{token: "DEFAULT_ICONS", fn: (_key: EnrichedKey, _kb: EnrichedLayout) => true}, {token: "icon", fn: (key: EnrichedKey, _kb: EnrichedLayout) => key.iconId == k}];
		rc.icons.push([qualifiers, k]);
	}

	return loadRenderContextFont(rc).then((v) => { if(v) rc.refresh() });
}

async function loadRenderContextFont(rc: RenderContext) {
	const theme = rc.theme!;
	const urlFont = rc.assetStore!.store[theme.assets.font ?? ""]?.runtime?.url ?? robotoUrl;
	if(rc.loadingFont !== urlFont) {
		rc.loadingFont = urlFont;
		styleElement.textContent = `
		@font-face {
			font-family: "theme-font";
			src: url(${urlFont}) format("truetype");
		}
		`;

		if(!styleElement.parentElement) document.head.appendChild(styleElement);
		await document.fonts.load('1em "theme-font"');
		return true;
	}
	return false;
}

export function drawRenderContext(rc: RenderContext, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, canvas: HTMLCanvasElement | OffscreenCanvas, layout: Layout, selectorBeingPreviewed: string) {
	render({store: rc.assetStore!, ctx, currBgs: rc.backgrounds, currIcons: rc.icons, layout: enrichLayout(layout), theme: rc.theme!, previewSelector: selectorBeingPreviewed});
}


export async function drawThemeOnceOff(theme: Theme, layout: Layout, assetStore: IAssetStore) {
	const canvas = new OffscreenCanvas(layout.width, layout.height * 2);
	const ctx = canvas.getContext("2d");
	if(!ctx) throw new Error("Couldnt initialize 2d context");

	const rc = initRenderContext(() => {});
	await updateRenderContext(rc, assetStore, ctx, canvas, theme, layout);
	drawRenderContext(rc, ctx, canvas, layout, "");
	const blob = await canvas.convertToBlob();

	return blob;
}

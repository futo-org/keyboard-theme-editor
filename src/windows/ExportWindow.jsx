import State from "../state";
import { HEXtoRGB, RGBtoHEX, toHCT } from "../keyboard/color";
import { parseQualifiers } from "../keyboard/qualifiers";
import { colorPairs } from "../panels/assetconfig";
import AssetStore from "../systems/assets";
import Ui from "../ui"
import { UZIP } from "../vendor/UZIP";

function formatBytes(bytes, decimals = 1) {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}


const HEADER = `
#  ▄███████████████                   ▄▄▄████████▒░      ▄▄▄
# ████████████████████▒░      ██████████████████▒░   ▄█████████▄
# ░▒▒▒▒▒█████▒▒▒▒▒███▒░        ▒███████████▒▒▒▒▒░  ▄█████████████▄
#      █████████░░▒▒▒░███░   ███▒░▒▒▒▒█████▒░░░░  ██████▀   ▀██████░
#     ████████▒▒░ ░░░ ███▒░  ███▒ ░░░░█████▒░    ██████       ██████▒
#    ▄███▒▒▒▒▒░░     ███▒░  ███▒░     █████▒░    ░██████▄   ▄██████▒░
#    ███▒░░░░░      ▐████▄▄███▒░      ░█████▒░    ░▒█████████████▒▒░
#    ██▒░            ▐███████▒░        ░▒██▒░      ░░▒█████████▒▒░
#    ░▒░              ▒▒▒▒▒▒▒░          ░▒▒░         ░░▒▒▒▒▒▒▒░░░
#     ░               ░░░░░░░            ░░            ░░░░░░░
#          ▄██████▄░ ▄██████▄░ ▄██████▄░ ▄██████▄░ ▄██████▄░
#          ████████▒░████████▒░████████▒░████████▒░████████▒░
#          ▀██████▀░ ▀██████▀░ ▀██████▀░ ▀██████▀░ ▀██████▀░
#           ░▒▒▒▒▒░   ░▒▒▒▒▒░   ░▒▒▒▒▒░   ░▒▒▒▒▒░   ░▒▒▒▒▒░
#          ▄██████▄░ ▄██████▄░ ▄██████▄░ ▄██████▄░ ▄██████▄░
#          ████████▒░████████▒░████████▒░████████▒░████████▒░
#          ▀██████▀░ ▀██████▀░ ▀██████▀░ ▀██████▀░ ▀██████▀░
#           ░▒▒▒▒▒░   ░▒▒▒▒▒░   ░▒▒▒▒▒░   ░▒▒▒▒▒░   ░▒▒▒▒▒░
#            ░░░░░  ▄█████████████████████████████▄░ ░░░░░
#                   ███████████████████████████████▒░
#                   ▀█████████████████████████████▀░
#                    ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░
#                     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░
#
#                  FUTO Keyboard Theme Configuration
#                        Format version: 1.0
#
# Although there are comments to help you, please check our guide for
# more information. It can be found at:
#                      https://docs.keyboard.futo.tech/theme/advanced
#
# If blindly editing configuration files isn't your thing, there is a
# much easier way which is our theme editor web app. You can see live
# realtime previews of the keyboard with different sizes or languages
# as well as an easy editing interface. Try it out at:
#                             https://keyboard.futo.tech/theme-editor
#
# Have fun theming!
# -------------------------------------------------------------------
`.trim();

const toSnake = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
function makeToml(theme, store) {
	let output = "";
	const add = (l) => {
		output = output.trimEnd() + "\n" + l;
	}

	const s = (v) => JSON.stringify(v);
	const asset = (v) => s(store[v].meta.name);

	const rn = (v) => Math.round(v*1000)/1000;
	const rect = (v) => `[${rn(v.left)}, ${rn(v.top)}, ${rn(v.right)}, ${rn(v.bottom)}]`;

	add(HEADER);
	add("\n" + `
name = ${s(theme.name)}
author = ${s(theme.author)}
id = ${s(theme.id)}
version = ${theme.version}
description = ${s(theme.description)}
`.trim());

	add("\n[options]");
	Object.keys(theme.options).forEach((k) => {
		if(theme.options[k] !== undefined) {
			add(`${toSnake(k)} = ${s(theme.options[k])}`);
		}
	})

	add("\n" + `
# -------------------------------------------------------------------
# There are many colors here, so it'll likely be difficult for you to
# edit them by hand. We would recommend you to use a Material 3 color
# generator or our theme editor linked above. Color format: #RRGGBBAA
# If you change a color, remove its "# inherited" comment if present.
# -------------------------------------------------------------------

[colors]
	`.trim());

	const gapAt = {
		secondary: true,
		tertiary: true,
		background: true,
		surface: true,
		surfaceBright: true,
		error: true,
		outline: true,
		keyboardSurface: true
	};
	Object.keys(theme.colors).forEach((k) => {
		add(`${gapAt[k] ? "\n" : ""}${toSnake(k)} = ${s(theme.colors[k])} ${theme.internal.inheritedColors[k] ? "# inherited" : ""}`);
	});

	if(theme.assets.font) {
		add("\n[options.font]");
		add(`font = ${asset(theme.assets.font)}`)
	}
	if(theme.assets.background.image) {
		add("\n[options.background]");
		add(`image = ${asset(theme.assets.background.image)}`);
		add(`opacity = ${s(theme.assets.background.opacity)}`);
		add(`action_bar_opacity = ${s(theme.assets.background.actionBarOpacity)}`);
		add(`cropping = ${rect(store[theme.assets.background.image].data.cropping)}`);
	}

	if(theme.assets.key.length + theme.assets.icon.length > 0) {
		add("\n" + `
# -------------------------------------------------------------------
# Matchrules will apply a key border or icon to a group of keys based
# on the selector.  They are order-dependent, only the first matching
# rule will be applied.
# -------------------------------------------------------------------
`.trim());
	}
	theme.assets.key.forEach((v) => {
		add("\n[[matchrules.border]]");
		add(`selector = ${s(v.selector)}`);
		add(`asset = ${asset(v.asset)}`);
	});

	theme.assets.icon.forEach((v) => {
		add("\n[[matchrules.icon]]");
		add(`selector = ${s(v.selector)}`);
		add(`asset = ${asset(v.asset)}`);
	});

	if(Object.keys(store).filter((k) => store[k].meta.kind !== "other").length > 0) {
		add("\n" + `
# -------------------------------------------------------------------
# All image assets used above should have a corresponding config here
# -------------------------------------------------------------------
`.trim());
	}
	Object.keys(store).forEach((k) => {
		const asset = store[k];
		if(asset.meta.kind === "background") {
			add(`\n[[asset.border]]`);
			add(`name = ${s(asset.meta.name)}`);
			add(`background_tint = ${s(asset.data.colorKind === "constant" ? asset.data.backgroundConstant : toSnake(asset.data.backgroundToken))}`);
			add(`foreground_tint = ${s(asset.data.colorKind === "constant" ? asset.data.foregroundConstant : toSnake(asset.data.foregroundToken))}`);
			add(`padding = ${rect(asset.data.padding)}`);
			add(`slicing = ${rect(asset.data.slicing)}`);
			add(`gap = ${rect(asset.data.gap)}`);
			add(`target_density = ${s(asset.data.targetDensity)}`);
		}else if(asset.meta.kind === "icon") {
			add(`\n[[asset.icon]]`);
			add(`name = ${s(asset.meta.name)}`);
			add(`target_density = ${s(asset.data.targetDensity)}`);
		}
	});

	return output;
}

function isValidPackageName(str) {
	const regex = /^[a-zA-Z][a-zA-Z0-9_-]*(\.[a-zA-Z][a-zA-Z0-9_-]*)+$/;
	return regex.test(str);
}

const isSemver = s => /^\d+(\.\d+)*(-\w+)?$/.test(s);


function exportWindowContents() {
	let criticalError = false;
	const warnings = [];
	const usedAssetNames = [];

	const assets = {};
	const usedFilenames = {};
	for(let k of Object.keys(AssetStore.store)) {
		const v = AssetStore.store[k];
		if(v.meta.builtin) continue;

		if(v.meta.kind === "background" || v.meta.kind === "icon") {
			if(!v.runtime.img || v.meta.type !== "image") {
				warnings.push({
					message: `Asset ${v.meta.name} has no image. Skipping. There may be subsequent errors as a result of this.`
				});
				continue;
			}

			const maxDimension = Math.max(v.runtime.img.width, v.runtime.img.height) * (640 / v.data.targetDensity);
			if(maxDimension > 4096) {
				warnings.push({
					preview: v.runtime.preview,
					message: `Asset ${v.meta.name} has a too-large scaled dimension of ${maxDimension} pixels. Consider limiting the size and keeping target density at 640. Skipping. There may be subsequent errors as a result of this.`
				});
				continue;
			}
		}

		const name = v.meta.name.toLowerCase();
		if(v.meta.type === "image") {
			// TODO: Verify blob MIME matches extension
			if(!name.endsWith(".png") && !name.endsWith(".jpg") && !name.endsWith(".jpeg") && !name.endsWith(".webp")) {
				warnings.push({
					preview: v.runtime.preview,
					message: `Asset ${v.meta.name} should be a png, jpeg  or webp file, and end with .png, .jpeg or .webp. Skipping. There may be subsequent errors as a result of this.`
				});
				continue;
			}
		} else if(v.meta.type === "font") {
			// TODO: Verify blob MIME matches extension
			if(!name.endsWith(".ttf") && !name.endsWith(".otf")) {
				warnings.push({
					preview: v.runtime.preview,
					message: `Asset ${v.meta.name} should be a ttf/otf file, and end with .ttf or .otf. Skipping. There may be subsequent errors as a result of this.`
				});
				continue;
			}
		}

		if(usedFilenames[name]) {
			warnings.push({
				preview: v.runtime.preview,
				message: `There are multiple assets named ${name}. Please ensure this is not the case! Skipping all but one. There may be subsequent errors as a result of this.`
			});
			continue;
		}
		usedFilenames[name] = true;

		assets[k] = v;
	}

	const clean = structuredClone(State.theme);
	const isAsset = (name, t, k) => assets[name] && assets[name].meta.type === t && assets[name].meta.kind === k;

	if(clean.assets.background.image) {
		if(isAsset(clean.assets.background.image, "image", "other")) {
			usedAssetNames.push(clean.assets.background.image);
		} else {
			warnings.push({
				preview: "missing.png",
				message: "Background asset does not exist, or is not a valid image, and will not be set."
			});
			clean.assets.background.image = undefined;
		}
	}

	if(clean.assets.font) {
		if(isAsset(clean.assets.font, "font", "other")) {
			usedAssetNames.push(clean.assets.font);
		} else {
			warnings.push({
				preview: "missing.png",
				message: "Font asset does not exist, or is not a valid font, and will not be set."
			});
			clean.assets.font = undefined;
		}
	}

	const layers = [];
	clean.assets.key = clean.assets.key.filter((v) => {
		if(!v.selector) {
			warnings.push({
				preview: assets[v.asset]?.runtime?.preview ?? "missing.png",
				message: `A background matchrule is blank, and will not be included.`
			});
			return false;
		}

		if(!v.asset) {
			warnings.push({
				preview: "missing.png",
				message: `Background matchrule [${v.selector}] has no asset, and will not be included.`
			});
			return false;
		}

		if(!isAsset(v.asset, "image", "background")) {
			warnings.push({
				preview: "missing.png",
				message: `Background matchrule [${v.selector}] asset does not exist or is not a valid image, and will not be included.`
			});
			return false;
		}

		try {
			const parsedSelector = parseQualifiers(v.selector, true);
			if(parsedSelector === undefined) throw new Error();

			let layer = parsedSelector.filter(v => v.layer !== undefined)[0]?.layer ?? 0;
			layers.push(layer);
		} catch {
			warnings.push({
				preview: assets[v.asset]?.runtime?.preview ?? "missing.png",
				message: `The selector ${v.selector} is invalid and will not be included.`
			});
		}

		usedAssetNames.push(v.asset);
		return true;
	});

	const layerSet = new Set(layers);
	if(layerSet.size > 3) {
		warnings.push({
			style: "opacity:0",
			message: `There are more than 3 layers used in total (${layerSet.size} layers). Please reduce this number if possible. Using layers may make your theme more laggy.`
		});
	} else if(layerSet.size > 1) {
		warnings.push({
			style: "opacity:0",
			message: `Using layers may make your theme more laggy, consider carefully whether to use them.`
		});
	}

	clean.assets.icon = clean.assets.icon.filter((v) => {
		if(!v.selector) {
			warnings.push({
				preview: assets[v.asset]?.runtime?.preview ?? "missing.png",
				message: `An icon matchrule is blank, and will not be included.`
			});
			return false;
		}

		if(!v.asset) {
			warnings.push({
				preview: "missing.png",
				message: `Icon matchrule [${v.selector}] has no asset, and will not be included.`
			});
			return false;
		}

		if(!isAsset(v.asset, "image", "icon")) {
			warnings.push({
				preview: "missing.png",
				message: `Icon matchrule [${v.filter}] asset does not exist or is not a valid image, and will not be included.`
			});
			return false;
		}

		usedAssetNames.push(v.asset);
		return true;
	});

	const unusedKeys = Object.keys(assets).filter((v) => {
		const idx = usedAssetNames.indexOf(v);
		if(idx == -1) {
			warnings.push({
				preview: assets[v].runtime.preview,
				message: `Asset ${assets[v].meta.name} is unused and will not be included.`
			});
			return true;
		} else {
			return false;
		}
	});

	unusedKeys.forEach((v) => delete assets[v]);

	Object.keys(colorPairs).forEach((bgName) => {
		const fgName = colorPairs[bgName];

		const bgColor = toHCT(clean.colors[bgName]);
		const fgColor = toHCT(clean.colors[fgName]);
		let fgColorC = fgColor;
		if(fgColorC.a != 1) {
			const bgColorRGB = HEXtoRGB(clean.colors[bgName]);
			const fgColorRGB = HEXtoRGB(clean.colors[fgName]);

			const fgR = fgColorRGB.r * fgColorRGB.a;
			const fgG = fgColorRGB.g * fgColorRGB.a;
			const fgB = fgColorRGB.b * fgColorRGB.a;

			const bgR = bgColorRGB.r * bgColorRGB.a;
			const bgG = bgColorRGB.g * bgColorRGB.a;
			const bgB = bgColorRGB.b * bgColorRGB.a;

			const outA = fgColorRGB.a + bgColorRGB.a * (1.0 - fgColorRGB.a);

			const newColor = {
				r: (fgR + bgR * (1.0 - fgColorRGB.a)) / outA,
				g: (fgG + bgG * (1.0 - fgColorRGB.a)) / outA,
				b: (fgB + bgB * (1.0 - fgColorRGB.a)) / outA,
				a: outA
			};

			fgColorC = toHCT(RGBtoHEX(newColor));
		}

		const toneDelta = Math.abs(bgColor.t - fgColorC.t);
		const renderPreview = (txt) => {
			const canvas = document.createElement("canvas");
			canvas.width = 64;
			canvas.height = 64;
			const ctx = canvas.getContext("2d");
			ctx.fillStyle = clean.colors[bgName];
			ctx.fillRect(0, 0, 64, 64);
			ctx.fillStyle = clean.colors[fgName];
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.font = "24px sans-serif";
			ctx.fillText(txt, 32, 32);
			return canvas.toDataURL("image/png");
		}
		if(toneDelta < 25) {
			warnings.push({
				style: "background:var(--tg-checker);",
				preview: renderPreview(`Δ${Math.floor(toneDelta)}`),
				message: `Insufficient contrast for color ${fgName} against background ${bgName}! (Δ${Math.floor(toneDelta)}, recommended >Δ25)`
			});
		}

		if(fgColorC.a < 0.9) {
			warnings.push({
				style: "background:var(--tg-checker);",
				preview: renderPreview(`a=${Math.round(fgColorC.a * 10) / 10}`),
				message: `Colors ${fgName}+${bgName} are rather translucent! (${Math.round(bgColor.a * 10) / 10} to ${Math.round(fgColorC.a * 10) / 10}, recommended >0.9)`
			});
		}
	});

	if(clean.name.startsWith("Untitled Theme")
		|| clean.id.startsWith("com.example.Theme")
		|| clean.description.startsWith("This is a template FUTO Keyboard theme")
		|| clean.author === "Anonymous"
	) {
		warnings.push({
			style: "opacity:0",
			message: `Please customize the metadata! Make sure the name, id, description, and author have been changed.`
		});
	}

	if(clean.id.startsWith("com.example.Theme")) {
		criticalError = true;
	}

	if(!isSemver(clean.version)) {
		criticalError = true;
		warnings.push({
			style: "opacity:0",
			message: `Make sure the version is a number, for example 1 or 2.5.1`
		});
	}


	if(!isValidPackageName(clean.id)) {
		criticalError = true;
		warnings.push({
			style: "opacity:0",
			message: `The ID "${clean.id}" is invalid. It should use rDNS notation. Example: "com.mywebsite.MyTheme"`
		});
	}

	const local = {};
	let pending = new Set();
	let totalSize = 0;
	return Ui.namespaced(local, () => <div style="width: 400px; max-height: 700px; overflow: scroll; padding: 8px;">
		<p>{warnings.length > 0 ? "Please resolve these errors:" : ""}</p>
		<div id="warnings" className="">
			{warnings.map((v) => {
				return <div className="file">
					<img src={v.preview} style={v.style ?? ""} />
					<p>{v.message}</p>
				</div>
			})}
		</div>

		<p>{Object.keys(assets).length} asset files will be included <span id="totalText"></span></p>
		<div id="fileBreakdown" className="">
			{Object.keys(assets).map((k) => {
				const asset = assets[k];
				return <div className="file">
					<img src={asset.runtime.preview} />
					<p>{asset.meta.name}</p>
					<div style="flex: 1" />
					<p oncreate={el => {
						const blobUrl = assets[k].runtime.url;
						pending.add(el);
						fetch(blobUrl).then((response) => response.blob()).then((blob) => {
							totalSize += blob.size;
							el.innerText = formatBytes(blob.size);
							el.parentElement.setAttribute("data-size", blob.size);
							pending.delete(el);

							if(pending.size === 0) {
								local.totalText.innerText = `(total ${formatBytes(totalSize)} uncompressed)`;
								el.parentElement.parentElement.replaceChildren(...Array.from(el.parentElement.parentElement.children).sort((b, a) => {
									return (parseInt(a.getAttribute("data-size")) || 0) - (parseInt(b.getAttribute("data-size")) || 0)
								}));
							}
						})
					}}>...</p>
				</div>
			})}
		</div>



		<div className="action-buttons">
			<button explicit onclick={_ev => {
				Ui.closeWindow(ExportWindow);
			}}>Cancel</button>
			<button explicit onclick={_ev => {
				if(criticalError) {
					alert("Please resolve the metadata errors before exporting!");
				}
				const obj = {};
				obj["theme.txt"] = (new TextEncoder()).encode(makeToml(clean, assets));

				const promises = [];
				Object.keys(assets).forEach((k) => {
					const asset = assets[k];
					promises.push(fetch(asset.runtime.url).then((v) => v.arrayBuffer()).then((buffer) => {
						obj[asset.meta.name] = new Uint8Array(buffer);
						return true
					}));
				});

				Promise.all(promises).then(() => {
					const zip = UZIP.encode(obj);
					const blob = new Blob([zip], { type: 'application/zip' });
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = clean.id + ".zip";
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
					Ui.closeWindow(ExportWindow);
				});
			}}>Export</button>
		</div>
	</div>);
}

const ExportWindow = {
	name: "Export",
	contents: exportWindowContents,
}

export default ExportWindow;

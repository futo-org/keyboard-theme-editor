import Ev from '../event';
import Ui from "../ui";
import Layouts from '../../core/keyboard/layouts/layouts';
import State from '../state';
import { initRenderContext, updateRenderContext, drawRenderContext, renderContextGetDetectedKeyInfo } from '../../core/keyboard/render';
import { drawMaterialColorDemo } from '../material/render';
import { TabbedPanels } from './tabs';
import ToolPanel from './tools';
import AssetStore from '../systems/assets';
import { createNinePatch, drawNinePatch, getEffectiveForegroundTint } from '../../core/keyboard/ninepatch';
import { displayKeyInfo } from '../windows/KeyInfoWindow';

function makeMaterialTabObject() {
	const result = {
		tab: "material",
		name: "Color Preview",
		off: new OffscreenCanvas(1200, 500),
		canClose: false
	};
	return result;
}

function makeKeyboardTabObject(name, layout) {
	const result = {
		tab: "keyboard",
		name: name,
		layout: layout,
		off: new OffscreenCanvas(1, 1),
		canClose: false
	};
	
	result.ctx = result.off.getContext("2d");
	
	return result;
}

const WorkCanvas = {
	ev: Ev.makeEventBus(),
	build: makeWorkCanvas,
	
	currentTab: 0,
	tabs: [],//[],
	
	grid: true,
	
	zoom: 1.0,
	pan: [0.0, 0.0],
	
	resetZoom: resetZoom,
	toggleGrid: toggleGrid,
	increaseZoom: zoom,
	
	editAsset: editAsset,
	changeAdjustTo: changeAdjustTo,

	update: updateWorkCanvas,
	reset: () => {
		WorkCanvas.tabs = [];
		setCurrentTab(0);
		WorkCanvas.zoom = 1.0;
		WorkCanvas.pan = [0.0, 0.0];
	},
	addDefaultTabs: () => {
		WorkCanvas.tabs.push(makeKeyboardTabObject("QWERTY", Layouts["QWERTY"]));
		WorkCanvas.tabs.push(makeKeyboardTabObject("Landscape", Layouts["Landscape QWERTY Split"]));
		WorkCanvas.tabs.push(makeKeyboardTabObject("Japanese", Layouts['Japanese 12-Key']));
		WorkCanvas.tabs.push(makeKeyboardTabObject("Symbols", Layouts.Symbols));
		WorkCanvas.tabs.push(makeKeyboardTabObject("Numpad", Layouts.Numpad));
		WorkCanvas.tabs.push(makeKeyboardTabObject("Phone", Layouts.Phone));
		WorkCanvas.tabs.push(makeMaterialTabObject());
		updateTabButtons();
		refreshCanvas("default");
	},

	selectorBeingPreviewed: "",
	previewSelector: (to) => {
		if(to.trim() === WorkCanvas.selectorBeingPreviewed) return;
		WorkCanvas.selectorBeingPreviewed = to.trim();
		refreshCanvas("selector preview");
	},

	copy: () => {
		const tab = getCurrentTabObj();
		if(!tab) return;
		if(!tab.off) return;

		tab.off.convertToBlob({ type: "image/png" }).then((blob) => {
			navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(() => {
				console.log("Copied");
			});
		});
	}
};

function getCurrentTabObj() {
	const tab = WorkCanvas.currentTab;
	if(tab >= 0 && tab < WorkCanvas.tabs.length) {
		return WorkCanvas.tabs[tab];
	} else {
		return null;
	}
}

function getCurrentAsset() {
	const tab = getCurrentTabObj();
	if(tab === null) return null;

	const name = tab.assetFname;
	if(name === undefined) return null;

	const obj = AssetStore.store[name];
	if(obj === undefined) return null;

	return obj;
}


function setCurrentTab(i) {
	WorkCanvas.selectorBeingPreviewed = "";
	const oldObj = getCurrentTabObj();
	if(oldObj !== null) {
		oldObj.zoom = WorkCanvas.zoom;
		oldObj.pan  = [...WorkCanvas.pan];
	}

	WorkCanvas.currentTab = i;

	const newObj = getCurrentTabObj();
	if(newObj !== null) {
		WorkCanvas.zoom = newObj.zoom ?? 1.0;
		WorkCanvas.pan  = newObj.pan  ?? [0.0, 0.0];

		State.setCurrentEditingAsset(newObj.assetFname);
	} else {
		State.setCurrentEditingAsset(undefined);
	}

	updateTabButtons();
}

function editAsset(fname) {
	const existingTab = WorkCanvas.tabs.filter((v) => v.assetFname === fname);
	if(existingTab.length !== 0) {
		setCurrentTab(WorkCanvas.tabs.indexOf(existingTab[0]));
		TabbedPanels.config.setTab("Asset");
		return;
	}

	const asset = AssetStore.store[fname];

	const obj = {
		tab: "asset",
		name: asset.meta.name,
		off: asset.runtime.img,
		assetFname: fname,

		onImgLoaded: (fname2) => {
			if(fname2 === fname) {
				obj.off = AssetStore.store[fname]?.runtime?.img;
				delete obj.offtex;
				refreshCanvas("img loaded");
			}
		}
	};
	WorkCanvas.tabs.push(obj);
	setCurrentTab(WorkCanvas.tabs.length - 1);

	State.ev.listen(AssetStore.EV_IMG_LOADED, obj.onImgLoaded);
	TabbedPanels.config.setTab("Asset");
}


function updateWorkCanvas() {
	//Object.values(WorkCanvas.tabButtons).forEach((v) => v.classList.remove("active"));
	//WorkCanvas.tabButtons[WorkCanvas.currentTab].classList.add("active");
}

function deepEqual(obj1, obj2) {
	if(obj1 === obj2)
		return true;
	if(isPrimitive(obj1) && isPrimitive(obj2))
		return obj1 === obj2;
	if(Object.keys(obj1).length !== Object.keys(obj2).length)
		return false;
	for(let key in obj1) {
		if(!(key in obj2)) return false;
		if(!deepEqual(obj1[key], obj2[key])) return false;
	}
	return true;
}

function isPrimitive(obj) {
	return (obj !== Object(obj));
}

function refreshCanvas(reason) {
	const gl = WorkCanvas.ctx;
	

	const w = WorkCanvas.el.width;
	const h = WorkCanvas.el.height;
	
	const tab = getCurrentTabObj();
	
	if(tab === null || (tab.tab === "asset" && tab.off === undefined)) {
		gl.viewport(0, 0, w, h);
		gl.clearColor(0.062, 0.062, 0.062, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		return;
	}
	if(tab.offtex === undefined) {
		tab.offtex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tab.offtex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tab.off);
	}
	
	if(WorkCanvas.prog === undefined) {
		const compile = (kind, src) => {
			const shader = gl.createShader(kind);
			gl.shaderSource(shader, src);
			gl.compileShader(shader);
			return shader;
		}

		const prog = gl.createProgram();
		gl.attachShader(prog, compile(gl.VERTEX_SHADER, `
		attribute vec2 a;
		varying vec2 vUV;
		void main(){
		  gl_Position=vec4(a,0,1);
		  vUV=(a+1.)*.5;
		  vUV.y = 1.-vUV.y;
		}`));
		gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, `
		precision highp float;
		uniform sampler2D tex;
		uniform sampler2D tex6;
		uniform vec3 uTex6OffsetScaleAlpha;
		uniform vec2 px;
		varying vec2 vUV;
		uniform vec2 uCanvasSize, uOffSize;
		uniform vec2 uScale, uTrans;
		uniform vec2 uMajorStart, uMajorEnd;
		uniform vec3 uMajorColor;
		uniform vec2 uMinorStart;
		uniform bool uGrid;
		void main(){
		  highp vec2 uv=vUV;

		  uv = uv * (uCanvasSize/uOffSize);
		  uv = uv + (1.0/2.0) - (uCanvasSize/uOffSize/2.0);
		  uv = (uv - 0.5) * uScale + 0.5 + uTrans;// / (uCanvasSize/uOffSize);
		  uv += 0.5 / uOffSize;

		  vec2 pixel = floor((vUV * uCanvasSize + uTrans / uScale * uOffSize) / 4.0);
		  float isDark = mod(pixel.x + pixel.y, 2.0);
		  float gc = mix(0.15, 1.0-0.15, isDark);
		  
		  if(uv.x>=0.0 && uv.y>=0.0 && uv.x<=1.0 && uv.y<=1.0) {
			gl_FragColor=texture2D(tex,uv);
			
			if(uGrid && uScale.x < 0.075) {
				vec2 pixMod = mod(uv * uOffSize, 1.0);
				//vec2 pixModC = mod(vUV * uCanvasSize + uTrans / uScale * uOffSize, 10.0) / 10.0;

				if(pixMod.x < uScale.x || pixMod.y < uScale.y) {
					gl_FragColor = vec4(gc, gc, gc, 1.0);
				}
			}
			
			vec2 gc = vUV * uCanvasSize / 8.0;
			float component = 0.8 + 0.15 * mod(floor(gc.x) + floor(gc.y), 2.0);
			gl_FragColor = mix(gl_FragColor, vec4(component, component, component, 1.0), 1.0-gl_FragColor.a);
		  } else {
			gl_FragColor=vec4(0.062, 0.062, 0.062, 1.0);
		  }

		  vec2 uv6 = (uv - uTex6OffsetScaleAlpha.x) / uTex6OffsetScaleAlpha.y;
		  if(uTex6OffsetScaleAlpha.y > 0.0 && uv6.x >= 0.0 && uv6.y >= 0.0 && uv6.x <= 1.0 && uv6.y <= 1.0) {
			vec4 col6 = texture2D(tex6, uv6);
			gl_FragColor = mix(gl_FragColor, vec4(col6.xyz, 1.0), col6.a * uTex6OffsetScaleAlpha.z);
		  }
		
		  vec4 majorColor = vec4(uMajorColor.xyz * gc, 1.0);
		  vec4 minorColor = vec4(gc, gc, gc, 1.0);

		  vec2 majorStartOffset = (uv - uMajorStart) * uOffSize;
		  vec2 majorEndOffset = (uv - uMajorEnd) * uOffSize;
		  vec2 minorStartOffset = (uv - uMinorStart) * uOffSize;

		  if(uMajorStart.x > -10.0)
		  if(
		  		(majorStartOffset.x > 0.0 && majorStartOffset.x < uScale.x) ||
				(majorEndOffset.x > 0.0 && majorEndOffset.x < uScale.x) ||
				(majorStartOffset.y > 0.0 && majorStartOffset.y < uScale.y) ||
				(majorEndOffset.y > 0.0 && majorEndOffset.y < uScale.y)
		  ) {
		 	  gl_FragColor = majorColor;
		  }

		  if(uMinorStart.x > -10.0)
		  if(
		  		(minorStartOffset.x > 0.0 && minorStartOffset.x < uScale.x) ||
				(minorStartOffset.y > 0.0 && minorStartOffset.y < uScale.y)
		  ) {
		 	  gl_FragColor = mix(gl_FragColor, minorColor, 0.5);
		  }

		}`));
		gl.linkProgram(prog);
		gl.useProgram(prog);
		
		WorkCanvas.prog = prog;
		WorkCanvas.u = {};
		["tex", "tex6", "uTex6OffsetScaleAlpha", "uCanvasSize", "uOffSize", "uScale", "uTrans", "uGrid", "uMajorStart", "uMajorEnd", "uMajorColor", "uMinorStart"].forEach((v) => {
			WorkCanvas.u[v] = gl.getUniformLocation(prog, v);
		})
	}
	
	if(WorkCanvas.quad === undefined) {
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1,1,-1,1,-1,-1, -1,-1,1,-1,1,1]), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
		WorkCanvas.quad = true;
	}
	
	let needsRender = reason !== "control" && reason !== "resize" && reason !== "mousemoved";
	if(tab.tab === "keyboard") {
		if(tab.render === undefined) {
			tab.render = initRenderContext(() => {
				WorkCanvas.ev.emit("refresh", "renderer");
			});
			needsRender = true;
		}
		
		if(needsRender && State.isProjectLoaded) {
			updateRenderContext(tab.render, AssetStore, tab.ctx, tab.off, State.theme, tab.layout);
			drawRenderContext(tab.render, tab.ctx, tab.off, tab.layout, WorkCanvas.selectorBeingPreviewed);
			console.log("needs render", reason);
		}
	} else if(tab.tab === "material") {
		if(tab.ctx === undefined) tab.ctx = tab.off.getContext("2d");
		drawMaterialColorDemo(State.theme.colors, tab.ctx, tab.off.width, tab.off.height);
	}


	gl.uniform2f(WorkCanvas.u.uMajorStart, -20.0, -2.0);
	gl.uniform2f(WorkCanvas.u.uMajorEnd, -20.0, -2.0);
	gl.uniform2f(WorkCanvas.u.uMinorStart, -20.0, -2.0);

	if(tab.tab === "asset" && tab.assetFname !== undefined && AssetStore.store[tab.assetFname] !== undefined && AssetStore.store[tab.assetFname].data[cropTargetProperty] !== undefined) {
		const obj = AssetStore.store[tab.assetFname];

		const colors = {
			"slicing": [1,0,0],
			"padding": [0,0,1],
			"cropping": [0,1,0],
			"gap": [1,0,1],
		};
		const color = colors[cropTargetProperty] ?? [0,1,1];

		gl.uniform3f(WorkCanvas.u.uMajorColor, color[0], color[1], color[2]);

		const rect = obj.data[cropTargetProperty];
		const rect2 = transformCropRect(rect);

		gl.uniform2f(WorkCanvas.u.uMajorStart, rect2.left, rect2.top);
		gl.uniform2f(WorkCanvas.u.uMajorEnd, rect2.right, rect2.bottom);

		if(reason === "mousemoved")
			gl.uniform2f(WorkCanvas.u.uMinorStart, WorkCanvas.mouseNorm?.[0] ?? -20.0, WorkCanvas.mouseNorm?.[1] ?? -20.0);
	}
	
	gl.viewport(0, 0, w, h);
	
	gl.clearColor(1, 0, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	const scale = 1.0 / WorkCanvas.zoom;
	const panX = WorkCanvas.pan[0];
	const panY = WorkCanvas.pan[1];
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, tab.offtex);
	
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, scale < 0.25 ? gl.NEAREST : gl.LINEAR);
	
	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE, tab.off);
	gl.uniform1i(WorkCanvas.u.tex, 0);
	
	gl.uniform1i(WorkCanvas.u.uGrid, WorkCanvas.grid ? 1 : 0);
	gl.uniform3f(WorkCanvas.u.uTex6OffsetScaleAlpha, 0.0, 0.0, 0.0);
	const obj = getCurrentAsset();
	if(obj && obj.meta.kind === "background" && WorkCanvas.zoom < 1.5) {
		const canSkipReRender = tab.tex6 !== undefined && tab.tex6data !== undefined && deepEqual(obj.data, tab.tex6data);
		if(!canSkipReRender) {
			tab.tex6 = document.createElement("canvas");
			tab.tex6.width = tab.off.width * 6;
			tab.tex6.height = tab.off.height * 6;

			const ctx = tab.tex6.getContext("2d");
			ctx.clearRect(0, 0, tab.off.width * 6, tab.off.height * 6);

			const ninepatch = createNinePatch(State.theme, obj, obj.data.targetDensity);
			drawNinePatch(ctx, ninepatch, tab.off.width, 0, tab.off.width*5, tab.off.height);
			drawNinePatch(ctx, ninepatch, 0, tab.off.height, tab.off.width, tab.off.height*5);
			drawNinePatch(ctx, ninepatch, tab.off.width, tab.off.height, tab.off.width*5, tab.off.height*5);

			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.font = `${tab.off.height * 0.25}px theme-font`
			ctx.fillStyle = getEffectiveForegroundTint(State.theme, obj);
			ctx.fillText("9-slice stretch preview", tab.off.width * 3.5, tab.off.height * 0.5);

			ctx.fillText("Tall", tab.off.width * 0.5, tab.off.height * 3.5);
			ctx.fillText("Big and wide", tab.off.width * 3.5, tab.off.height * 3.5);

			tab.tex6data = structuredClone(obj.data);
		}

		tab.offtex6 = tab.offtex6 ?? gl.createTexture();
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, tab.offtex6);
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,tab.tex6);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.uniform1i(WorkCanvas.u.tex6, 1);

		const alpha = clamp((1.5 - WorkCanvas.zoom) * 1.75, 0.0, 1.0);
		gl.uniform3f(WorkCanvas.u.uTex6OffsetScaleAlpha, 0.0, 6.0, alpha);
	}
	
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.uniform2f(WorkCanvas.u.uScale, scale, scale);
	gl.uniform2f(WorkCanvas.u.uTrans, panX, panY);
	
	gl.uniform2f(WorkCanvas.u.uCanvasSize, w, h);
	gl.uniform2f(WorkCanvas.u.uOffSize, tab.off.width, tab.off.height);
	gl.drawArrays(gl.TRIANGLES,0,6);
	
	Ui.id.wcZoomPercent.innerText = Math.round(WorkCanvas.zoom * 100.0) + "%";
	Ui.id.wcGridToggle.className = WorkCanvas.grid ? "active" : "inactive";

	/*
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, w, h);
	
	ctx.drawImage(tab.off, 0, 0, tab.off.width, tab.off.height, 0, 0, w, h);
	
	ctx.fillStyle = "#000000";
	ctx.textAlign = "center";
	ctx.fillText(WorkCanvas.tabs[WorkCanvas.currentTab].name + " " + w + "x" + h, w / 2.0, h / 2.0);
	*/
}

function closeTab(idx) {
	const tab = WorkCanvas.tabs[idx];
	if(tab.onImgLoaded !== undefined) {
		State.ev.unlisten(AssetStore.EV_IMG_LOADED, tab.onImgLoaded);
	}
	WorkCanvas.tabs.splice(idx, 1);
	if(WorkCanvas.currentTab === idx && idx > 0) {
		setCurrentTab(WorkCanvas.currentTab - 1);
	}
	updateTabButtons();
}

function updateTabButtons() {
	const el = Ui.id.wcTabSwitcher;
	el.replaceChildren(...WorkCanvas.tabs.map((v, i) => {
		const active = WorkCanvas.currentTab === i;
		const className = "tabbutton " + (active ? "active" : "");
		return <div className={className} onclick={_e => {
			setCurrentTab(i);
		}}>{v.assetFname ? AssetStore.store[v.assetFname].meta.name : v.name} {active && (v.canClose !== false) && <button onclick={e => {
				e.stopPropagation();
				closeTab(i);
			}}>{Ui.iconEl("xmark")}</button>}</div>
	}));
	
	// skip initial refresh
	if(WorkCanvas.el) WorkCanvas.ev.emit("refresh", "tab");
}

function clamp(v, m, M) {
	return Math.min(M, Math.max(m, v));
}

function zoom(value) {
	if(value == 0.0) return;
	const minZoom = 0.1;
	const maxZoom = Math.min(WorkCanvas.el.width, WorkCanvas.el.height) / 3.0;
	
	let scale = Math.pow(1.1, Math.abs(value));
	if(value > 0.0) scale = 1.0 / scale;

	let newZoom = clamp(WorkCanvas.zoom * scale, minZoom, maxZoom);
	
	// Snap to nice values
	const snappableValues = [0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0];
	for(let z of snappableValues) {
		if((WorkCanvas.zoom < z && newZoom > z) || (WorkCanvas.zoom > z && newZoom < z)) {
			newZoom = z;
			break;
		}
	}
	
	WorkCanvas.zoom = newZoom;
	WorkCanvas.ev.emit("refresh", "control");
}

function resetZoom() {
	WorkCanvas.pan = [0.0, 0.0];
	WorkCanvas.zoom = 1.0;
	WorkCanvas.ev.emit("refresh", "refresh");
}

function toggleGrid() {
	WorkCanvas.grid = !WorkCanvas.grid;
	WorkCanvas.ev.emit("refresh", "control");
}

let panPrevX = -1;
let panPrevY = -1;
function pointerPan(ev, mode) {
	if(mode === 0) {
		panPrevX = ev.clientX;
		panPrevY = ev.clientY;
	} else if(mode === 2) {
		panPrevX = -1;
		panPrevY = -1;
	} else if(panPrevX != -1 && panPrevY != -1) {
		const tab = getCurrentTabObj();
		if(tab === null) return;
		const off = tab.off;
		if(off === undefined || off.width == 1) return;

		const deltaX = (ev.clientX - panPrevX) / off.width / WorkCanvas.zoom;
		const deltaY = (ev.clientY - panPrevY) / off.height / WorkCanvas.zoom;
		
		panPrevX = ev.clientX;
		panPrevY = ev.clientY;
		
		WorkCanvas.pan = [
			clamp(WorkCanvas.pan[0] - deltaX, -1.0, 1.0),
			clamp(WorkCanvas.pan[1] - deltaY, -1.0, 1.0)
		];
		WorkCanvas.ev.emit("refresh", "control");
	}
}

let zoomStartZoom = undefined;
let zoomStartX = -1;
let zoomStartY = -1;
function pointerZoom(ev, mode) {
	if(mode === 0) {
		zoomStartX = ev.clientX;
		zoomStartY = ev.clientY;
		zoomStartZoom = WorkCanvas.zoom;
	} else if(mode === 2) {
		zoomStartX = -1;
		zoomStartY = -1;
	} else if(zoomStartX != -1 && zoomStartY != -1) {
		const tab = getCurrentTabObj();
		if(tab === null) return;
		const off = tab.off;
		if(off === undefined || off.width == 1) return;

		//const deltaX = (ev.clientX - zoomStartX) / off.width;
		const deltaY = (ev.clientY - zoomStartY) / off.height;

		const delta = deltaY;
		WorkCanvas.zoom = zoomStartZoom * (1.0+delta);
		WorkCanvas.ev.emit("refresh", "control");
	}
}

function eventToNormXY(ev) {
	const tab = getCurrentTabObj();
	if(tab === null) return null;

	const subcanvasWidth  = tab.off.width  * WorkCanvas.zoom;
	const subcanvasHeight = tab.off.height * WorkCanvas.zoom;

	const workCanvasRect = WorkCanvas.el.getBoundingClientRect();
	
	const x = ev.clientX - workCanvasRect.left;
	const y = ev.clientY - workCanvasRect.top;

	const subcanvasLeft = workCanvasRect.width / 2 - (subcanvasWidth * (WorkCanvas.pan[0] + 0.5));
	const subcanvasTop  = workCanvasRect.height / 2 - (subcanvasHeight * (WorkCanvas.pan[1] + 0.5));

	const normX = (x - subcanvasLeft) / subcanvasWidth;
	const normY = (y - subcanvasTop) / subcanvasHeight;

	return [normX, normY];
}

function pointerInteract(ev, mode) {
	const tab = getCurrentTabObj();
	if(tab !== null && tab.render !== undefined) {
		const [x, y] = eventToNormXY(ev);
		tab.render.onmouseup();
		if(mode !== 2) {
			tab.render.onmousedown(x, y);
		}
	}
}


let cropTargetProperty = "slicing";
function changeAdjustTo(to) {
	cropTargetProperty = to;
	ToolPanel.setTool("crop");
	refreshCanvas("adjustChanged");
}

function getXYGapRatio() {
	const obj = getCurrentAsset();
	if(!obj) return undefined;

	const xGapDp = 4;
	const yGapDp = 8;
	const xGapPx = xGapDp * (obj.data.targetDensity / 160);
	const yGapPx = yGapDp * (obj.data.targetDensity / 160);
	const xGapRatio = xGapPx / obj.runtime.img.width;
	const yGapRatio = yGapPx / obj.runtime.img.height;

	return [xGapRatio, yGapRatio];
}

function transformCropRect(rect, inverse) {
	const rect2 = {...rect};
	if(inverse !== true) {
		if(cropTargetProperty === "padding") {
			rect2.right = 1.0 - rect2.right;
			rect2.bottom = 1.0 - rect2.bottom;
		}else if(cropTargetProperty === "gap") {
			const [xg, yg] = getXYGapRatio();
			rect2.left = -xg * rect2.left;
			rect2.top = -yg * rect2.top;
			rect2.right = 1.0 + xg * rect2.right;
			rect2.bottom = 1.0 + yg * rect2.bottom;
		}
	} else {
		if(cropTargetProperty === "padding") {
			rect2.right = 1.0 - rect2.right;
			rect2.bottom = 1.0 - rect2.bottom;
		}else if(cropTargetProperty === "gap") {
			const [xg, yg] = getXYGapRatio();
			rect2.left = rect2.left / -xg;
			rect2.top = rect2.top / -yg;
			rect2.right = (rect2.right - 1.0) / xg;
			rect2.bottom = (rect2.bottom - 1.0) / yg;
		}
	}

	return rect2;
}

function isInRangeForActiveCrop(norm) {
	if(cropTargetProperty !== "gap") {
		return !(norm[0] < -0.25 || norm[0] > 1.25 || norm[1] < -0.25 || norm[1] > 1.25);
	} else {
		return true;
	}
}

let cropStart = undefined;
let cropAsset = undefined;
let cropAssetCopy = undefined;
let updatedCrop = false;
function pointerCrop(ev, mode) {
	if(mode === 0) {
		const asset = getCurrentAsset();
		if(asset === null) return;
		if(asset.data?.[cropTargetProperty]?.left === undefined) return;

		const start = eventToNormXY(ev);
		if(!isInRangeForActiveCrop(start)) return;

		cropAsset = asset;
		cropAssetCopy = structuredClone(asset.data);
		cropStart = start;
		updatedCrop = false;
	} else if(cropStart !== undefined) {
		const cropEnd = eventToNormXY(ev);

		if(cropStart[0] === cropEnd[0] && cropStart[1] === cropEnd[1]) return;

		cropAsset.data[cropTargetProperty].left   = Math.min(cropStart[0], cropEnd[0]);
		cropAsset.data[cropTargetProperty].top    = Math.min(cropStart[1], cropEnd[1]);
		cropAsset.data[cropTargetProperty].right  = Math.max(cropStart[0], cropEnd[0]);
		cropAsset.data[cropTargetProperty].bottom = Math.max(cropStart[1], cropEnd[1]);
		cropAsset.data[cropTargetProperty] = transformCropRect(cropAsset.data[cropTargetProperty], true);

		const needClamping = cropTargetProperty !== "gap";
		if(needClamping) {
			cropAsset.data[cropTargetProperty].left   = clamp(cropAsset.data[cropTargetProperty].left, 0, 1);
			cropAsset.data[cropTargetProperty].top    = clamp(cropAsset.data[cropTargetProperty].top, 0, 1);
			cropAsset.data[cropTargetProperty].right  = clamp(cropAsset.data[cropTargetProperty].right, 0, 1);
			cropAsset.data[cropTargetProperty].bottom = clamp(cropAsset.data[cropTargetProperty].bottom, 0, 1);
		}

		WorkCanvas.ev.emit("refresh", "crop");
		updatedCrop = true;
	}

	if(mode === 2) {
		const asset = cropAsset;
		if(asset !== undefined && updatedCrop) {
			const endState = structuredClone(asset.data);
			const startState = structuredClone(cropAssetCopy);

			const prop = cropTargetProperty;
			State.execute(`Set asset ${cropTargetProperty}`, () => {
				asset.data[prop] = {...endState[prop]};
			}, () => {
				asset.data[prop] = {...startState[prop]};
			}, State.EV_ASSET_EDITED);
		}

		cropAssetCopy = undefined;
		cropAsset = undefined;
		cropStart = undefined;
	}
}

function pointerInspect(ev, mode) {
	if(mode === 2) {
		const pos = eventToNormXY(ev);
		const tab = getCurrentTabObj();
		if(!tab) return;
		if(tab.tab !== "keyboard") return;
		const info = renderContextGetDetectedKeyInfo(tab.render, tab.off, tab.layout, State.theme, pos[0], pos[1]);
		if(!info) return;

		displayKeyInfo(info);
	}
}

let toolMappings = {
	pan: pointerPan,
	zoom: pointerZoom,
	crop: pointerCrop,
	interact: pointerInteract,
	inspect: pointerInspect
};


function canvasPointer(ev, mode) {
	if(WorkCanvas.tabs.length === 0) return;

	ev.preventDefault();
	
	const method = toolMappings[ToolPanel.activeTool];
	if(method !== undefined) method(ev, mode);
}

function makeWorkCanvas() {
	WorkCanvas.ev.listen("refresh", refreshCanvas);
	State.ev.listen(State.EV_LOADED, () => {
		refreshCanvas("loaded");
	});

	State.ev.listen(AssetStore.EV_IMG_LOADED, () => {
		refreshCanvas("assetLoaded");
	});

	State.ev.listen(State.EV_ASSET_EDITED, () => {
		refreshCanvas("assetEdited");
	});

	State.ev.listen(State.EV_RESET, () => {
		WorkCanvas.reset();
		WorkCanvas.addDefaultTabs();
	});

	return <div className="workcanvas">
		<div className="tab-switcher" id="wcTabSwitcher" oncreate={_el => updateTabButtons() }>
		</div>
		<div className="content" oncreate={el => {
			new ResizeObserver(() => {
				const workcanvas = WorkCanvas.el;
				workcanvas.width  = workcanvas.parentElement.offsetWidth;
				workcanvas.height = workcanvas.parentElement.offsetHeight;
				WorkCanvas.ev.emit("refresh", "resize");
			}).observe(el);
		}} style="position: relative;">
			<canvas id="workcanvas" style="position: absolute" oncreate={el => {
				WorkCanvas.el = el;
				WorkCanvas.ctx = el.getContext("webgl");
			}} detectPointer={canvasPointer}
			onmousemove={ev => {
				if(ToolPanel.activeTool === "crop") {
					WorkCanvas.mouseNorm = eventToNormXY(ev);
					if(!isInRangeForActiveCrop(WorkCanvas.mouseNorm)) {
						WorkCanvas.mouseNorm = [-20.0, -2.0];
					}
					refreshCanvas("mousemoved");
				}
			}}
			onwheel={e => {
				zoom(e.deltaY / 200.0);
				e.preventDefault();
			}}></canvas>
			<div className="controls">
				<button title={Ui.tooltipFor("view.reset")} onclick={resetZoom}>{Ui.iconEl("rotate-left")}</button>
				&nbsp;|&nbsp;
				<button title={Ui.tooltipFor("view.out")} onclick={_e => {zoom(1)}}>{Ui.iconEl("minus")}</button>
				&nbsp;<span id="wcZoomPercent">100%</span>&nbsp;
				<button title={Ui.tooltipFor("view.in")} onclick={_e => {zoom(-1)}}>{Ui.iconEl("plus")}</button>
				&nbsp;|&nbsp;
				<button title={Ui.tooltipFor("view.grid")} id="wcGridToggle" onclick={toggleGrid}>{Ui.iconEl("border-all")}</button>
			</div>
		</div>
	</div>
}

export default WorkCanvas;
globalThis.WorkCanvas = WorkCanvas;

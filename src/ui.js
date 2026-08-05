import quickh, { namespaced } from "./quickh";
import State from "./state";
import { buildMenuBar } from "./ui/menu";
import AboutWindow from "./windows/AboutWindow";
import NewProjectWindow from "./windows/NewProjectWindow";
import Window from "./windows/WindowWrapper";
import PanelManager from './panels/main.jsx';
import WorkCanvas from './panels/workcanvas';
import AssetsPanel from './panels/assets';
import GenerateRectangleWindow from "./windows/GenerateRectangleWindow.jsx";
import ExportWindow from "./windows/ExportWindow.jsx";
import { openTomlImportPicker } from "./systems/toml.js";
import GoogleFontPickerWindow from "./windows/GoogleFontPickerWindow.jsx";

const loaded = () => State.isProjectLoaded;
const menu = [
	{name: "&File", items: [
		{ name: "&New / open project...", action: () => Ui.showWindow(NewProjectWindow) },
		{ name: "&Save", shortcut: "Ctrl+S", enabled: loaded, action: State.saveProject },

		{ name: "&Import theme...", enabled: () => true, action: () => { openTomlImportPicker() } },
		{ name: "&Export theme...", shortcut: "Ctrl+E", enabled: loaded, action: () => Ui.showWindow(ExportWindow) },
	]},

	// should move these to State
	{name: "&Edit", items: [
		{ name: "&Undo", shortcut: "Ctrl+Z", enabled: State.canUndo, action: State.undo },
		{ name: "&Redo", shortcut: "Ctrl+Y", enabled: State.canRedo, action: State.redo },

		{ name: "&Copy render", enabled: loaded, action: WorkCanvas.copy }
		
		//{ name: "&Paste", shortcut: "Ctrl+V", enabled: State.canPaste, action: State.paste },
	]},
	
	// should move these to WorkCanvas
	{name: "&View", items: [
		{ name: "&Reset to Center", shortcut: "Alt+R", enabled: loaded, action: WorkCanvas.resetZoom },
		{ name: "Toggle Pixel &Grid", shortcut: "Alt+G", enabled: loaded, action: WorkCanvas.toggleGrid },
		{ name: "Zoom &In", shortcut: "Ctrl+=", enabled: loaded, action: () => WorkCanvas.increaseZoom(-1) },
		{ name: "Zoom &Out", shortcut: "Ctrl+-", enabled: loaded, action: () => WorkCanvas.increaseZoom(1) },
	]},
	
	// should move these to Assets(State?)
	{name: "&Insert", items: [
		{ name: "&Import from Filesystem...", shortcut: "Ctrl+I", enabled: loaded, action: AssetsPanel.openFilePicker },
		{ name: "Generate &Rectangle...", action: () => Ui.showWindow(GenerateRectangleWindow) },
		{ name: "Insert Google &Font...", action: () => Ui.showWindow(GoogleFontPickerWindow) },
	]},
	
	// should add {name: "Tools", from ./panels/tools

	{name: "&Help", items: [
		{ name: "&About", action: () => Ui.showWindow(AboutWindow) },
	]}
]

function getIdFromMenu(name) {
	let words = name.split(" ").filter(v => v.includes("&"));
	if(words.length == 0) return undefined;
	
	return words[0].replace("&", "").toLowerCase();
}

function initUi() {
	menu.forEach((v) => {
		const prefix = getIdFromMenu(v.name);
		v.items.forEach((v) => {
			const id = getIdFromMenu(v.name);
			
			Ui.menusById[`${prefix}.${id}`] = v;
		});
	});

	Ui.coreElement = document.getElementById("__core");
	Ui.coreElement.appendChild(buildMenuBar(menu));
	Ui.coreElement.appendChild(quickh("div", {"id": "windowRoot"}));
	Ui.coreElement.appendChild(PanelManager.build());
}

function tooltipFor(id) {
	const menu = Ui.menusById[id];
	if(menu === undefined) return "";
	
	return `${menu["name"]} (${menu["shortcut"]})`
}

const Ui = {
	init: initUi,
	id: {},
	quickh: quickh,
	query: (q) => Array.from(document.querySelectorAll(q)),
	showWindow: Window.spawn,
	closeWindow: Window.close,
	iconEl: (i, style) => quickh("i", {"className": `fa-${style ?? 'solid'} fa-${i}`}),
	namespaced: namespaced,

	menusById: {},
	tooltipFor: tooltipFor,
};

export default Ui;
globalThis.Ui = Ui;

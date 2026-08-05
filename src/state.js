import { Persistence } from './db';
import Ev from './event';
import { DEFAULT_THEME } from './keyboard/types/Theme';
import AssetStore, { genUniqueName } from './systems/assets';

let uniqueCounter = 0;
const State = {
	isProjectLoaded: false,
	ev: Ev.makeEventBus(),
	EV_RESET: "reset",
	EV_LOADED: "projectLoaded",
	EV_COMMAND: "command",
	
	execute: executeCommand,
	commands: [],
	redoableCommands: [],
	
	unique: () => genUniqueName(uniqueCounter++),
	projectUid: null,
	
	init: initState,
	
	redo: redo,
	undo: undo,
	canUndo: () => State.commands.length > 1,
	canRedo: () => State.redoableCommands.length > 0,

	isDirty: () => {
		if(!State.isProjectLoaded) return false;
		if(State.commands.length === 0) return false;
		return State.commands[State.commands.length - 1].saved !== true;
	},
	markNonDirty: () => {
		if(!State.isProjectLoaded) return;
		if(State.commands.length === 0) return;

		State.commands.forEach((v) => v.saved = undefined);
		State.commands[State.commands.length - 1].saved = true;
	},
	
	paste: paste,
	canPaste: () => false,

	newProject: (kind, initializer) => {
		State.ev.emit(State.EV_RESET);
		State.theme = structuredClone(DEFAULT_THEME)
		State.isProjectLoaded = true;
		State.commands = [];
		State.redoableCommands = [];
		State.projectUid = genUniqueName(uniqueCounter++);

		AssetStore.reset();

		if(initializer) initializer();

		State.ev.emit(State.EV_LOADED);
		executeCommand("Load project", () => {}, () => {});
		State.markNonDirty();
	},
	openProject: () => console.log("open project"),
	saveProject: () => Persistence.save(),
	
	theme: structuredClone(DEFAULT_THEME),

	EV_EDITING_ASSET_CHANGE: "editingAssetChange",
	EV_ASSET_EDITED: "assetEdited",
	editingAsset: undefined,
	setCurrentEditingAsset: setCurrentEditingAsset
}

function setCurrentEditingAsset(fname) {
	if(State.editingAsset === fname) return;

	State.editingAsset = fname;
	State.ev.emit(State.EV_EDITING_ASSET_CHANGE, "set", fname);
}

function executeCommand(name, fwd, bwd, arg) {
	if(!State.isProjectLoaded) {
		alert("No project is loaded. Load a project in File > New project...");
		bwd();
		State.ev.emit(State.EV_COMMAND, name, "backward");
		if(arg) State.ev.emit(arg, "backward");
		return;
	}
	const commandObj = { name, forward: () => {
		fwd();
		State.ev.emit(State.EV_COMMAND, name, "forward");
		if(arg) State.ev.emit(arg, "forward");
	}, backward: () => {
		bwd();
		State.ev.emit(State.EV_COMMAND, name, "backward");
		if(arg) State.ev.emit(arg, "backward");
	}};
	
	State.redoableCommands = [];
	State.commands.push(commandObj);
	commandObj.forward();
}

function paste() { }

function undo() {
	if(State.commands.length >= 1) {
		const lastCommand = State.commands.pop();
		State.redoableCommands.push(lastCommand);
		lastCommand.backward();
	}
}
function redo() {
	if(State.redoableCommands.length >= 0) {
		const lastCommand = State.redoableCommands.pop();
		State.commands.push(lastCommand);
		lastCommand.forward();
	}
}

function initState() {
	// Here, we may load stuff from indexedDB, localstorage, etc
	setTimeout(() => globalThis.Ui.showWindow(globalThis.AboutWindow), 50);

	window.addEventListener("beforeunload", function(e) {
		let confirmationMessage = "There are unsaved changes in this project. If you leave this page, your changes will be lost.";

		if(State.isDirty()) {
		   (e || window.event).returnValue = confirmationMessage;
			return confirmationMessage;
		}
	})
}

export default State;
globalThis.State = State;

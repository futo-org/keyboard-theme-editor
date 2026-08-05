import Ui from "../ui";
import State from "../state";

const HistoryPanel = {
	build: historyPanel,
};

function historyPanel() {
	State.ev.listen(State.EV_COMMAND, update);
	return <div id="historyPanel">
	
	</div>
}

function jumpTo(command, needRedo) {
	HistoryPanel.jumping = true;
	if(needRedo) {
		const redoIdx = State.redoableCommands.indexOf(command);
		if(redoIdx == -1) return;
		
		
		const numRedosNeeded = State.redoableCommands.length - redoIdx;
		console.log("redo", redoIdx, State.redoableCommands.length, numRedosNeeded);
		
		for(let i=0; i<numRedosNeeded; i++) {
			State.redo();
		}
	} else {
		const undoIdx = State.commands.indexOf(command);
		if(undoIdx == -1) return;
		
		const numUndosNeeded = State.commands.length - undoIdx - 1;
		console.log("undo", undoIdx, State.commands.length, numUndosNeeded);
		
		for(let i=0; i<numUndosNeeded; i++) {
			State.undo();
		}
	}
	
	HistoryPanel.jumping = false;
	update();
}

function update() {
	// debouncing
	if(HistoryPanel.jumping === true) return;
	
	Ui.id.historyPanel.replaceChildren(<div className="historyItems">
		{State.redoableCommands.map(v => <button className="redoable" onclick={_e => jumpTo(v, true)}>{v.name}</button>)}
		{State.commands.toReversed().map((v, i) => <button className={`undoable ${i == 0 ? "top" : ""}`} onclick={_e => jumpTo(v, false)}>{v.name}</button>)}
	</div>);
}

export default HistoryPanel;

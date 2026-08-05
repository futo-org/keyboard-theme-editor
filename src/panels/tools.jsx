import Ev from "../event";
import Ui from "../ui";

const ToolPanel = {
	build: makeToolPanel,

	EV_TOOL_CHANGE: "toolChange",
	ev: Ev.makeEventBus(),
	activeTool: "pan",

	setTool: (to) => {
		ToolPanel.activeTool = to;
		ToolPanel.ev.emit(ToolPanel.EV_TOOL_CHANGE, to);

		for(const child of ToolPanel.el.children) {
			if(child.name === to) {
				child.classList.add("active");
			} else {
				child.classList.remove("active");
			}
		}
	}
};

function toolButton(name, icon) {
	return <button name={name} title={name} className={ToolPanel.activeTool === name ? "active" : ""} onclick={_e => ToolPanel.setTool(name)}>{Ui.iconEl(icon)}</button>
}

function makeToolPanel() {
	return <div className="tool-panel" oncreate={el => {
		ToolPanel.el = el;
	}}>
		{toolButton("pan", "hand")}
		{toolButton("zoom", "magnifying-glass")}
		{toolButton("interact", "arrow-pointer")}
		{toolButton("crop", "crop-simple")}
		{toolButton("inspect", "eyedropper")}
	</div>
}

export default ToolPanel;

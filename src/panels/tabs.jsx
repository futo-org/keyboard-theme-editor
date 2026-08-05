import Ui from "../ui";

export const TabbedPanels = {};

export default function makeTabbedPanel(name, tabs) {
	let currentTab = 0;
	let tabButtons = {};
	let tabContents = {};
	
	let updateState = () => {
		Object.values(tabButtons).forEach((v) => v.classList.remove("active"));
		Object.values(tabContents).forEach((v) => v.style.display = "none");
		
		tabButtons[currentTab].classList.add("active");
		tabContents[currentTab].style.display = "block";
	}

	TabbedPanels[name] = {
		setTab: (to) => {
			let tgt = -1;
			for(let i=0; i<tabs.length; i++) {
				if(tabs[i].name === to) {
					tgt = i;
					break;
				}
			}

			if(tgt === -1) {
				console.error("No such tab exists: " + to);
				return;
			}

			currentTab = tgt;
			updateState();
		}
	}
	
	return <div className="tabbed-panel" oncreate={ _el => updateState() }>
		<div className="tab-switcher">
			{ tabs.map((v, i) => <button oncreate={ el => tabButtons[i] = el } onclick={ _e => {currentTab = i; updateState();} }>{ v.name }</button>) }
		</div>
		<div className="content">
			{ tabs.map((v, i) => <div className="tab" oncreate={ el => tabContents[i] = el }>{ v.content }</div>) }
		</div>
	</div>
}

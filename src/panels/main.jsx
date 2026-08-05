import Ui from "../ui";
import ToolPanel from './tools';
import UpperPanel from './upper';
import WorkCanvas from './workcanvas';
import AssetsPanel from './assets';

const PanelManager = {
	build: makeMainPanel,
};

function resizeVerticalFlexSplit() {
	return <div style="width: 100%; height: 0.25rem; cursor: row-resize;"
		onmousedown={e => {
			const el = e.target;
			const par = el.parentElement;
			const prevEl = el.previousElementSibling;
			const nextEl = el.nextElementSibling;
				
			const move = e => {
				const splitGap = (e.clientY - par.offsetTop) / par.offsetHeight;
					
				prevEl.style.flex = splitGap;
				nextEl.style.flex = 1.0 - splitGap;
			}
			const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up) }
			addEventListener('mousemove', move); addEventListener('mouseup', up)

			e.preventDefault();
		}}>
	</div>
}

function resizeHorizontalPxSplit() {
	return <div style="width: 0.2rem; height: 100%; cursor: col-resize;"
		onmousedown={e => {
			const el = e.target;
			const par = el.parentElement;
			const prevEl = el.previousElementSibling;
			const nextEl = el.nextElementSibling;
				
			const move = e => {
				const splitGap = (e.clientX - par.offsetLeft) / par.offsetWidth;
					
				prevEl.style.flex = splitGap;
				nextEl.style.flex = 1.0 - splitGap;
			}
			const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up) }
			addEventListener('mousemove', move); addEventListener('mouseup', up)

			e.preventDefault();
		}}>
	</div>
}

function makeMainPanel() {
	return <div className="workspace">
		<div className="left-panel">{ ToolPanel.build() }</div>
		<div className="mid-area">{ WorkCanvas.build() }</div>
		{ resizeHorizontalPxSplit() }
		<div className="right-panel">
			{ UpperPanel.build() }
			{ resizeVerticalFlexSplit() }
			{ AssetsPanel.build() }
		</div>
	</div>
}

export default PanelManager;

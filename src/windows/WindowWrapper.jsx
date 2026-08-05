import Ui from "../ui"


let windows = {}
let persistedWindows = {}
let z = 0
function WindowWrapper(w) {
	const contents = (w.persist === true ? persistedWindows[w.name] : null) ?? w.contents();
	if(w.persist === true) persistedWindows[w.name] = contents;

	const position = 100 + 100 * Object.keys(windows).length;

	return (
		<div class="win" style={`z-index: ${++z};`}
			oncreate={el => {
				windows[w.name] = el
				el.style.left = `${position}px`
				el.style.top  = `${position}px`
			}}>
			<div class="bar" onmousedown={e => {
				const el = windows[w.name];
				el.style.zIndex = ++z
				const ox = e.clientX - el.offsetLeft, oy = e.clientY - el.offsetTop
				const move = e => {
					el.style.left = e.clientX - ox + 'px';
					el.style.top = e.clientY - oy + 'px';
				}
				const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up) }
				addEventListener('mousemove', move); addEventListener('mouseup', up)

				e.preventDefault();
			}}>
				<span class="title">{w.name}</span>
				<button onclick={() => { closeWindow(w) }}>×</button>
			</div>
			<div class="body">{contents}</div>
		</div>
	)
}

const Window = {
	spawn: spawnWindow,
	close: closeWindow
};

function spawnWindow(w) {
	console.log("spawn",w,windows);
	if (windows[w.name]) { windows[w.name].style.zIndex = ++z; return }
	Ui.id.windowRoot.appendChild(WindowWrapper(w))
}

function closeWindow(w) {
	if(!windows[w.name]) return;
	if(w.onClose !== undefined) w.onClose();
	Ui.id.windowRoot.removeChild(windows[w.name]);
	delete windows[w.name];
}

export default Window;

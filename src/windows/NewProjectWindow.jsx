import { Persistence } from "../db";
import State from "../state"
import Ui from "../ui"

function newProjectWindowContents() {
	return <div>
		<h2>Recent projects</h2>
		<div id="recentProjects" oncreate={el => {
			Persistence.getRecent().then((recent) => {
				el.replaceChildren(...recent.map((p) =>
					<button onclick={ () => {
						Persistence.load(p.uid);
						Ui.closeWindow(NewProjectWindow);
					}}>{p.name}</button>
				))
			})
		}}></div>
		<h2>New project</h2>
		<button onclick={ () => {
			State.newProject({});
			Ui.closeWindow(NewProjectWindow);
		}}>Blank project</button>
	</div>
}

const NewProjectWindow = {
	name: "New Project",
	contents: newProjectWindowContents,
}

export default NewProjectWindow;

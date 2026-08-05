import State from "./state";
import Ui from "./ui";

function main() {
	State.init();
	Ui.init();
}

window.addEventListener('DOMContentLoaded', main);
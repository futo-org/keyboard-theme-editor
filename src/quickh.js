import Ui from "./ui";

let activeNamespaces = [];
let namespaceCounts = {};
export function namespaced(namespace, name, constructor) {
	if(constructor === undefined) {
		constructor = name;
		name = "untitled";
	}
	namespaceCounts[name] = (namespaceCounts[name] ?? -1) + 1;
	if(namespaceCounts[name] !== 0) name = name + namespaceCounts[name];

	activeNamespaces.push({ namespace, name });
	const result = constructor();
	activeNamespaces.pop();
	return result;
}

function activeNamespace() {
	if(activeNamespaces.length === 0) return null;
	else return activeNamespaces[activeNamespaces.length - 1];
}

export default function quickh(type, props, ...children) {
	if (type === null) {
		return document.createTextNode(props);
	}

	const el = document.createElement(type);

	if (props) {
		if(props["id"] !== undefined) {
			const namespace = activeNamespace();

			if(namespace) {
				namespace.namespace[props["id"]] = el;
				props["id"] = namespace.name + '_' + props["id"];
			}

			Ui.id[props["id"]] = el;
		}
		for (const [k, v] of Object.entries(props)) {
			if(v === undefined) continue;

			if (k === 'for') {
				const namespace = activeNamespace();
				if(namespace) {
					el.setAttribute("for", namespace.name + '_' + v);
					continue;
				}
			}
			if (k === 'className') { el.className = v; continue; }
			if (k === 'style' && typeof v === 'object') {
				Object.assign(el.style, v);
				continue;
			}
			if (k.startsWith('on') && typeof v === 'function') {
				if(k.toLowerCase() === "oncreate") {
					v(el);
					continue;
				}
				el.addEventListener(k.slice(2).toLowerCase(), v);
				continue;
			}

			if (k.toLowerCase() === 'detectpointer') {
				let pressing = undefined;
				el.addEventListener("pointerdown", (ev) => {
					pressing = ev.pointerId;
					v(ev, 0);
          
					const pointerMoveListener = (ev) => {
						if(pressing === ev.pointerId) v(ev, 1);
					};

					const pointerCancelListener = (ev) => {
						if(pressing === ev.pointerId) {
							pressing = undefined;
							v(ev, 2);
							document.removeEventListener("pointermove", pointerMoveListener);
							document.removeEventListener("pointerup", pointerCancelListener);
						}
					}

					document.addEventListener("pointermove", pointerMoveListener);
					document.addEventListener("pointerup", pointerCancelListener);
				});
				continue;
			}

			if (k === "disabled" && !v) continue;

			el.setAttribute(k, v);
		}
	}

	const add = kids => {
		for (const c of kids) {
			if(c === undefined || c === false) continue;
			if (Array.isArray(c)) add(c);
			else el.appendChild(
				c instanceof Node ? c : document.createTextNode(String(c))
			);
		}
	};
	add(children);
	return el;
}

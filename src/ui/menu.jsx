import Ui from "../ui";

// Extract accelerator from name wxWidgets style with the ampersand preceding the accelerator character
function getItemName(item) {
	return item.name.replace("&", "");
}
function getItemNameUnderlined(item, underline) {
	if (underline) {
		const idx = item.name.indexOf("&");
		if (idx === -1) return item.name;
		else return <span>{item.name.substr(0, idx)}<u>{item.name.substr(idx + 1, 1)}</u>{item.name.substr(idx + 2)}</span>
	} else return getItemName(item);
}
function getItemAlt(item) {
	const idx = item.name.indexOf("&");
	if (idx === -1) return undefined;

	return item.name[idx + 1];
}


function makePopup(items) {
	return (
		<ul className="popup" style={{ display: 'none' }}>
			{items.map(it => {
				return (
					<li className="item">
						<button disabled={it.enabled ? !it.enabled() : false}
							onclick={() => {
								it.action();
								closeAllPopups();
							}}
							oncreate={el => it.el = el}>
							<span className="label">{it.uname}</span>
							{it.shortcut && <span className="shortcut">{it.shortcut}</span>}
						</button>
					</li>
				);
			})}
		</ul>
	);
}

const underlineClass = "underline-accelerators";
function togglePopup(top, popup) {
	const showing = popups.includes(popup);

	const underlineEls = Ui.query("." + underlineClass);
	const wasUnderlineShowing = underlineEls.length > 0;
	underlineEls.forEach((v) => v.classList.remove(underlineClass));
	closeAllPopups();
	if (!showing) {
		// update buttons disabled
		top.items.forEach((v) => {
			if(v.enabled) {
				if(v.enabled()) {
					v.el.removeAttribute("disabled");
				} else {
					v.el.setAttribute("disabled", "true");
				}
			}
		});

		popups.push(popup);
		popups.forEach(p => p.style.display = 'block');

		if (wasUnderlineShowing) {
			popups.forEach(p => {
				p.previousElementSibling.classList.add(underlineClass)
				p.classList.add(underlineClass)
			});
		}
	} else {
		if (wasUnderlineShowing) Ui.id.menuBar.classList.add(underlineClass);
	}
}

const popups = [];
function closeAllPopups() {
	popups.forEach(p => p.style.display = 'none');
	popups.length = 0;

	const underlineEls = Ui.query("." + underlineClass);
	const wasUnderlineShowing = underlineEls.length > 0;
	underlineEls.forEach((v) => v.classList.remove(underlineClass));

	if (wasUnderlineShowing) Ui.id.menuBar.classList.add(underlineClass);
}

export function buildMenuBar(menu) {
	const enrichEl = (v) => {
		v.alt = getItemAlt(v).toLowerCase();
		v.uname = getItemNameUnderlined(v, true);
		v.name = getItemName(v);
		return true;
	}
	menu.forEach((v) => enrichEl(v) && v.items.forEach((v) => enrichEl(v)));


	window.addEventListener('keydown', e => {
		if (e.key === 'Escape') closeAllPopups();
	});

	window.addEventListener('mousedown', e => {
		if (!Ui.id.menuBar.contains(e.target)) closeAllPopups();
	});

	let altDown = false;
	function underlineAltLetters(show) {
		if (show) {
			const classList = popups.length > 0 ? popups[0].classList : Ui.id.menuBar.classList;
			classList.add(underlineClass);
		} else {
			Ui.query("." + underlineClass).forEach((v) => v.classList.remove(underlineClass));
		}
	}

	window.addEventListener('keydown', e => { if (e.key === 'Alt') { altDown = true; underlineAltLetters(true); e.preventDefault(); } });
	window.addEventListener('keyup', e => { if (e.key === 'Alt') { altDown = false; underlineAltLetters(false); e.preventDefault(); } });

	let shortcutRegistry = Object.fromEntries(
		menu.map((v) => v.items.map((v) => [v.shortcut ? v.shortcut.toLowerCase() : undefined, v])).flat().filter((v) => v[0] !== undefined)
	);
	window.addEventListener('keydown', e => {
		const target = e.target;
		const isEditing = target && (
			target.tagName === 'INPUT' && !['button', 'checkbox', 'radio', 'submit', 'reset'].includes(target.type) ||
			target.tagName === 'TEXTAREA' ||
			target.isContentEditable
		);

		if(isEditing) {
			if(altDown) {
				altDown = false;
				underlineAltLetters(false);
			}
			return;
		}

		let canUseShortcut = popups.length === 0;
		if (altDown && e.key.length === 1 && !e.ctrlKey && !e.shiftKey) {
			const key = e.key.toLowerCase();

			const subtop = menu.find((v) => popups.includes(v.el.nextSibling))

			if (subtop) {
				// submenu
				if (subtop.alt === key) {
					// toggle the top menu
					e.preventDefault();
					togglePopup(subtop, subtop.el.nextSibling);
					canUseShortcut = false;
				} else {
					// search subitems
					const item = subtop.items.find((v) => v.alt === key);
					if (item) {
						e.preventDefault();
						if(!item.enabled || item.enabled()) {
							item.action();
							closeAllPopups();
						}
						canUseShortcut = false;
					}
				}
			} else {
				// root level
				const top = menu.find((v) => v.alt === key)
				if (top) {
					e.preventDefault();
					togglePopup(top, top.el.nextSibling);
					canUseShortcut = false;
				}
			}
		}
		
		// Find and trigger shortcut if permitted
		if(canUseShortcut) {
			const pieces = [];
			if (e.ctrlKey) pieces.push('ctrl');
			if (e.shiftKey) pieces.push('shift');
			if (e.altKey) pieces.push('alt');
			pieces.push(e.key.toLowerCase());
			const canon = pieces.join('+');

			const item = shortcutRegistry[canon];
			if (item !== undefined && (!e.altKey || popups.length === 0)) {
				e.preventDefault();
				if(!item.enabled || item.enabled()) item.action();
			}
		}
	});


	return (
		<header id="menuBar" className="menu-bar">
			<ul className="menu-strip">
				{menu.map(top => (
					<li className="top-level">
						<button className="strip-label"
							accessKey={top.alt}
							onclick={e => togglePopup(top, e.currentTarget.nextSibling)}
							oncreate={el => top.el = el}>
							{top.uname}
						</button>
						{makePopup(top.items)}
					</li>
				))}
			</ul>
		</header>
	);
}

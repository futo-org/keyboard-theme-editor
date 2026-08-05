import Ui from "../ui";
import State from "../state";
import WorkCanvas from "../panels/workcanvas";

const VALID_TOKENS = new Set([
	'normal','functional','action','spacebar',
	'pressed','popup',
	'stickyoff','stickyon','nobackground',
	'morekey','morekeysbox','code','label','icon','ratio','outputtext',
	'layout','row','col','rowmod','colmod','layer'
]);

const KEY_KIND_TOKENS = new Set([
	"normal","functional","action","spacebar","stickyoff","stickyon","nobackground","morekey","morekeysbox"
]);

const ICON_NAMES = new Set([
	'shift_key', 'shift_key_shifted', 'delete_key', 'settings_key',
	'space_key', 'space_key_for_number_layout', 'enter_key',
	'go_key', 'search_key', 'send_key', 'next_key', 'done_key',
	'previous_key', 'tab_key', 'zwnj_key', 'zwj_key', 'numpad',
	'action_emoji', 'action_settings', 'action_paste',
	'action_text_edit', 'action_themes', 'action_undo', 'action_redo',
	'action_voice_input', 'action_system_voice_input',
	'action_switch_language', 'action_clipboard_history',
	'action_mem_dbg', 'action_cut', 'action_copy',
	'action_select_all', 'action_more', 'action_bugs',
	'action_keyboard_modes', 'action_up', 'action_down',
	'action_left', 'action_right'
]);

const TOKEN_DESCRIPTIONS = {
	'normal': '- Typical light-colored letter keys (qwerty)',
	'functional': '- Darker-colored functional keys (shift, comma)',
	'action': '- Bright enter key',
	'spacebar': '- Light-colored spacebar',
	'pressed': '- Key is pressed',
	'popup': '- Key\'s popup',
	'stickyoff': '- Shift key without sticky',
	'stickyon': '- Shift key toggled',
	'nobackground': '- Keys without background (number row)',
	'morekey': '- Focused morekey',
	'morekeysbox': '- More keys box',
	'code': '%d - Match key by code ID',
	'label': '%s - Match key by its label',
	'icon': '%s - Match key by its icon',
	'outputtext': '%s - Match key by its output text',
	'layout': '%s - Match keys by keyboard layout',
	'row': '%d - Match keys by row index',
	'col': '%d - Match keys by column index',
	'rowmod': '%d %d - Row modulo condition',
	'colmod': '%d %d - Column modulo condition',
	'ratio': '%s - Match keys by aspect ratio',
	'layer': '%d',
};

const ARG_CONSUMERS = {
	'code': 1, 'label': 1, 'icon': 1, 'outputtext': 1, 'layout': 1,
	'row': 1, 'col': 1, 'ratio': 1,
	'rowmod': 2, 'colmod': 2, 'layer': 1,
};

const RATIO_NAMES = new Set(['Tallest','Tall','Squarish','Wide','ExtraWide','Widest']);

let selectedIndex = -1;
let currentSuggestions = [];

function getCurrentTokenInfo(editor) {
	const sel = window.getSelection();
	if (!sel.rangeCount) return { textBefore: '', currentToken: '', tokenStart: 0 };

	const range = sel.getRangeAt(0);
	const preCaretRange = range.cloneRange();
	preCaretRange.selectNodeContents(editor);
	preCaretRange.setEnd(range.endContainer, range.endOffset);
	const offset = preCaretRange.toString().length;

	const fullText = editor.innerText;
	const textBefore = fullText.substring(0, offset);

	// Find start of current token
	const lastSpace = textBefore.lastIndexOf(' ');
	const tokenStart = lastSpace === -1 ? 0 : lastSpace + 1;
	const currentToken = textBefore.substring(tokenStart).trim();

	const includesAnyKindTokens = [...KEY_KIND_TOKENS].some((v) => fullText.includes(v));

	return { textBefore, currentToken, tokenStart, offset, includesAnyKindTokens };
}

function needsArgument(editor) {
	const text = editor.innerText;
	const tokens = text.split(/\s+/).filter(t => t.length);
	if (tokens.length === 0) return false;

	const lastToken = tokens[tokens.length - 1];

	if (text.endsWith(' ') && ARG_CONSUMERS[lastToken]) {
		const consumed = ARG_CONSUMERS[lastToken];
		let argCount = 0;
		for (let i = tokens.length - 1; i > tokens.indexOf(lastToken); i--) {
			if (!VALID_TOKENS.has(tokens[i]) || ARG_CONSUMERS[tokens[i-1]]) argCount++;
			else break;
		}
		return argCount < consumed ? { token: lastToken, remaining: consumed - argCount } : false;
	}

	if (tokens.length >= 2) {
		const prevToken = tokens[tokens.length - 2];
		if (ARG_CONSUMERS[prevToken] && !text.endsWith(' ')) {
			const consumed = ARG_CONSUMERS[prevToken];
			let argCount = 1; // current partial
			for (let i = tokens.length - 2; i > tokens.indexOf(prevToken); i--) {
				if (!VALID_TOKENS.has(tokens[i]) || ARG_CONSUMERS[tokens[i-1]]) argCount++;
				else break;
			}
			return argCount <= consumed ? { token: prevToken, remaining: consumed - argCount + 1 } : false;
		}
	}

	return false;
}

function getSuggestions(editor) {
	const { currentToken, includesAnyKindTokens } = getCurrentTokenInfo(editor);
	const argNeed = needsArgument(editor);

	if (argNeed) {
		const { token } = argNeed;
		if (token === 'ratio') {
			return [...RATIO_NAMES].filter(r => r.toLowerCase().startsWith(currentToken.toLowerCase()))
				.map(r => ({ text: r, desc: 'Aspect ratio range', full: `ratio ${r}` }));
		}
		if (token === 'icon') {
			return [...ICON_NAMES].filter(icon => icon.toLowerCase().includes(currentToken.toLowerCase()))
				.map(icon => ({ text: icon, desc: 'Icon ID', full: `icon ${icon}` }));
		}
		return [];
	}

	return [...VALID_TOKENS].filter(t =>
		!includesAnyKindTokens || !KEY_KIND_TOKENS.has(t)
	).filter(t => t.toLowerCase().startsWith(currentToken.toLowerCase()))
		.map(t => ({ text: t, desc: TOKEN_DESCRIPTIONS[t] || '', full: t }));
}

function showAutocomplete(editor, listEl) {
	currentSuggestions = getSuggestions(editor);
	selectedIndex = -1;

	if (currentSuggestions.length === 0) {
		listEl.classList.remove('visible');
		editor.setAttribute('aria-expanded', 'false');
		return;
	}

	listEl.replaceChildren(...currentSuggestions.map((s, i) =>
		<li role="option" data-index={i} data-text={s.text} onmouseenter={(_ev) => WorkCanvas.previewSelector(s.text)}>{s.text}<span class="desc">{s.desc}</span></li>
	))

	listEl.classList.add('visible');
	editor.setAttribute('aria-expanded', 'true');
}

function insertSuggestion(editor, suggestion) {
	const { textBefore, tokenStart } = getCurrentTokenInfo(editor);
	const argNeed = needsArgument(editor);

	let newText;
	if (argNeed && !textBefore.endsWith(' ')) {
		newText = textBefore.substring(0, tokenStart) + suggestion + ' ';
	} else if (argNeed && textBefore.endsWith(' ')) {
		newText = textBefore + suggestion + ' ';
	} else {
		newText = textBefore.substring(0, tokenStart) + suggestion + ' ';
	}

	const fullText = editor.innerText;
	const afterCursor = fullText.substring(textBefore.length);

	editor.innerText = newText + afterCursor;

	const newOffset = newText.length;
	restoreCursor(editor, newOffset);

	render(editor, editor.parentElement.querySelector("input"));
}

function selectItem(listEl, index) {
	const items = listEl.querySelectorAll('li');
	items.forEach((item, i) => {
		item.setAttribute('aria-selected', i === index ? 'true' : 'false');
		if (i === index) item.scrollIntoView({ block: 'nearest' });
	});
	selectedIndex = index;

	WorkCanvas.previewSelector(currentSuggestions[index].full);
}

function validate(tokens) {
	const errors = [];
	let i = 0;
	while (i < tokens.length) {
		const token = tokens[i];

		if (!VALID_TOKENS.has(token)) {
			errors.push({ pos: i, msg: `Unknown token "${token}"` });
			i++;
			continue;
		}

		const needed = ARG_CONSUMERS[token] || 0;
		const available = tokens.length - i - 1;

		if (needed > 0 && available < needed) {
			errors.push({ pos: i, msg: `"${token}" needs ${needed} argument${needed>1?'s':''}, found ${available}` });
			break;
		}

		// Validate specific arguments
		if (token === 'ratio' && !RATIO_NAMES.has(tokens[i+1])) {
			errors.push({ pos: i+1, msg: `"${tokens[i+1]}" is not a valid ratio name. Use: ${[...RATIO_NAMES].join(', ')}` });
		}
		if (token === 'icon' && !ICON_NAMES.has(tokens[i+1])) {
			errors.push({ pos: i+1, msg: `"${tokens[i+1]}" is not a valid icon. Use: ${[...ICON_NAMES].join(', ')}` });
		}
		if ((token === 'row' || token === 'col') && isNaN(parseInt(tokens[i+1]))) {
			errors.push({ pos: i+1, msg: `Expected integer, got "${tokens[i+1]}"` });
		}
		if ((token === 'rowmod' || token === 'colmod') && (isNaN(parseInt(tokens[i+1])) || isNaN(parseInt(tokens[i+2])))) {
			const bad = isNaN(parseInt(tokens[i+1])) ? i+1 : i+2;
			errors.push({ pos: bad, msg: `Expected integer, got "${tokens[bad]}"` });
		}

		i += 1 + needed;
	}

	// Check for trailing arguments without tokens
	if (i < tokens.length) {
		errors.push({ pos: i, msg: `Unexpected value "${tokens[i]}" without a parameter` });
	}

	return errors;
}

function render(editor, hiddenInput, textOverride) {
	const text = textOverride ?? editor.innerText;
	hiddenInput.value = text;

	const hadFocus = document.activeElement === editor;

	// Save cursor position before DOM manipulation
	let cursorOffset = -1;
	if (hadFocus) {
		const sel = window.getSelection();
		if (sel.rangeCount > 0) {
			const range = sel.getRangeAt(0);
			const preCaretRange = range.cloneRange();
			preCaretRange.selectNodeContents(editor);
			preCaretRange.setEnd(range.endContainer, range.endOffset);
			cursorOffset = preCaretRange.toString().length;
		}
	}

	const tokens = text.trim().split(/\s+/).filter(t => t.length);
	const errors = validate(tokens);
	const errorSet = new Set(errors.map(e => e.pos));
	const errorMap = Object.fromEntries(errors.map(e => [e.pos, e.msg]));

	let html = '';
	tokens.forEach((token, idx) => {
		let cls = 'token-valid';
		if (errorSet.has(idx)) cls = 'token-invalid';
		else if (idx > 0 && errorSet.has(idx-1) && ARG_CONSUMERS[tokens[idx-1]]) cls = 'token-string';
		else if (idx > 1 && errorSet.has(idx-2) && ARG_CONSUMERS[tokens[idx-2]] === 2) cls = 'token-string';
		else if (idx > 0 && !errorSet.has(idx-1) && ARG_CONSUMERS[tokens[idx-1]]) cls = 'token-arg';
		else if (idx > 1 && !errorSet.has(idx-2) && ARG_CONSUMERS[tokens[idx-2]] === 2) cls = 'token-arg';

		const title = errorMap[idx] ? `title="${errorMap[idx].replace(/"/g, '&quot;')}"` : '';
		html += `<span class="${cls}" ${title}>${token.replace(/</g, '&lt;')}</span>`;
		if (idx < tokens.length - 1) html += ' ';
	});

	if(text.endsWith(" ")) html += " ";
	if(text.startsWith(" ")) html = " " + html;

	editor.innerHTML = html || '<br>';

	if (hadFocus && cursorOffset != -1) {
		restoreCursor(editor, cursorOffset);
	}
}

function restoreCursor(editor, targetOffset) {
	const sel = window.getSelection();
	const range = document.createRange();

	let currentOffset = 0;
	let found = false;

	function traverse(node) {
		if (found) return;

		if (node.nodeType === Node.TEXT_NODE) {
			const nodeLength = node.textContent.length;
			if (currentOffset + nodeLength >= targetOffset) {
				const offsetInNode = Math.min(targetOffset - currentOffset, nodeLength);
				range.setStart(node, offsetInNode);
				range.collapse(true);
				found = true;
				return;
			}
			currentOffset += nodeLength;
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			for (const child of node.childNodes) {
				traverse(child);
				if (found) return;
			}
		}
	}

	traverse(editor);

	if (!found) {
		// Place at end
		const lastText = findLastTextNode(editor);
		if (lastText) {
			range.setStart(lastText, lastText.length);
			range.collapse(true);
		} else {
			range.selectNodeContents(editor);
			range.collapse(false);
		}
	}

	sel.removeAllRanges();
	sel.addRange(range);
}

function findLastTextNode(node) {
	if (node.nodeType === Node.TEXT_NODE) return node;
	for (let i = node.childNodes.length - 1; i >= 0; i--) {
		const found = findLastTextNode(node.childNodes[i]);
		if (found) return found;
	}
	return null;
}

export function qualifierInput(v, kind, EV_MATCHRULE) {
	const local = {};
	const dom = Ui.namespaced(local, () => <div style="display: contents;">
		<div class="qualifier-editor" id="editor" contenteditable="true" spellcheck="false"
			role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="autocomplete-list"
			oninput={(_ev) => {
				render(local.editor, local.hiddenInput);
				showAutocomplete(local.editor, local.autocompleteList);
				WorkCanvas.previewSelector(local.hiddenInput.value);
			}}
			onfocus={(_ev) => {
				render(local.editor, local.hiddenInput);
				showAutocomplete(local.editor, local.autocompleteList);
				WorkCanvas.previewSelector(local.hiddenInput.value);
			}}
			onkeydown={(e) => {
				const editor = local.editor;
				const listEl = local.autocompleteList;

				if(!listEl.classList.contains('visible') || currentSuggestions.length === 0) {
					if(e.key === "Enter") {
						e.preventDefault();
						local.editor.blur();
					}
				} else {
					switch (e.key) {
					case 'ArrowDown':
						e.preventDefault();
						selectItem(listEl, Math.min(selectedIndex + 1, currentSuggestions.length - 1));
						break;
					case 'ArrowUp':
						e.preventDefault();
						selectItem(listEl, Math.max(selectedIndex - 1, 0));
						break;
					case 'Enter':
					case 'Tab':
						e.preventDefault();
						if (selectedIndex >= 0) {
							insertSuggestion(editor, currentSuggestions[selectedIndex].text);
						} else if (currentSuggestions.length === 1) {
							insertSuggestion(editor, currentSuggestions[0].text);
							if(e.key === "Enter") local.editor.blur();
						}
						listEl.classList.remove('visible');
						editor.setAttribute('aria-expanded', 'false');
						break;
					case 'Escape':
						listEl.classList.remove('visible');
						editor.setAttribute('aria-expanded', 'false');
						break;
					}
				}
			}}
			onblur={(_ev) => {
				local.autocompleteList.classList.remove('visible');
				local.editor.setAttribute('aria-expanded', 'false');
				WorkCanvas.previewSelector("");

				const oldSelector = v.selector;
				const newSelector = local.hiddenInput.value.trim();

				if(oldSelector !== newSelector)
					State.execute(`Edit ${kind} selector`,
						() => {
							v.selector = newSelector;
							render(local.editor, local.hiddenInput, newSelector);
						},
						() => {
							v.selector = oldSelector;
							render(local.editor, local.hiddenInput, oldSelector);
						}, EV_MATCHRULE);
			}}></div>
		<ul class="autocomplete-list" id="autocompleteList" role="listbox"
			onmousedown={(e) => {
				const li = e.target.closest('li');
				if (!li || !li.dataset?.text) return;
				e.preventDefault();
				insertSuggestion(local.editor, li.dataset.text);
				local.autocompleteList.classList.remove('visible');
				local.editor.setAttribute('aria-expanded', 'false');
			}}></ul>
		<input type="hidden" name="qualifier" id="hiddenInput" value={v.selector} oncreate={() => {
			render(local.editor, local.hiddenInput, v.selector);
		}}/>
	</div>)

	return dom;
}

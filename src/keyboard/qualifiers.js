function getMinMaxFromRatioName(name) {
	let min, max;
	switch (name) {
	case "Tallest":
		min = 2.20;
		max = Infinity;
		break;
	case "Tall":
		min = 1.35;
		max = 2.20;
		break;
	case "Squarish":
		min = 0.85;
		max = 1.35;
		break;
	case "Wide":
		min = 0.50;
		max = 0.85;
		break;
	case "ExtraWide":
		min = 0.33;
		max = 0.50;
		break;
	case "Widest":
		min = 0.00
		max = 0.33;
		break;

	default:
		return undefined;
	}

	return [min, max];
}

export function parseQualifiers(qualifier, strict) {
	const result = [];
	const tokens = qualifier.split(" ")
	let i = 0;
	while (i < tokens.length) {
		const token = tokens[i];
		let fn = null;
		if(!token.trim()) {
			i++;
			continue;
		}
		const obj = {};
		let arg0, arg1;
		switch (token) {
		case "normal":
			fn = (key, _kb) => key.visualStyle === "Normal";
			break;
		case "nobackground":
			fn = (key, _kb) => key.visualStyle === "NoBackground";
			break;
		case "functional":
			fn = (key, _kb) => key.visualStyle === "Functional";
			break;
		case "stickyoff":
			fn = (key, _kb) => key.visualStyle === "StickyOff";
			break;
		case "stickyon":
			fn = (key, _kb) => key.visualStyle === "StickyOn";
			break;
		case "action":
			fn = (key, _kb) => key.visualStyle === "Action";
			break;
		case "spacebar":
			fn = (key, _kb) => key.visualStyle === "Spacebar";
			break;
		case "morekey":
			fn = (key, _kb) => key.visualStyle === "MoreKey";
			break;
		case "code":
			arg0 = tokens[++i];
			fn = (key, _kb) => key.code == arg0;
			break;
		case "label":
			arg0 = tokens[++i];
			fn = (key, _kb) => key.label == arg0;
			break;
		case "icon":
			arg0 = tokens[++i];
			fn = (key, _kb) => key.iconId == arg0;
			break;
		case "outputtext":
			arg0 = tokens[++i];
			fn = (key, _kb) => key.outputText == arg0;
			break;
		case "layout":
			arg0 = tokens[++i];
			fn = (_key, kb) => kb.name == arg0;
			break;

		case "row":
			arg0 = parseInt(tokens[++i]);
			fn = (key, kb) => {
				let relevantRow = arg0;
				if(relevantRow < 0) {
					relevantRow = Math.max(...kb.keys.map((v) => v.row)) + arg0 + 1;
				}
				return key.row == relevantRow;
			};
			break;
		case "col":
			arg0 = parseInt(tokens[++i]);
			fn = (key, kb) => {
				let relevantCol = arg0;
				if(relevantCol < 0) {
					relevantCol = Math.max(...kb.keys.filter((v) => v.row === key.row).map((v) => v.column)) + arg0 + 1;
				}
				return key.column == relevantCol;
			}
			break;
		case "rowmod":
			arg0 = parseInt(tokens[++i]);
			arg1 = parseInt(tokens[++i]);
			fn = (key, _kb) => (key.row + arg0) % arg1 == 0;
			break;
		case "colmod":
			arg0 = parseInt(tokens[++i]);
			arg1 = parseInt(tokens[++i]);
			fn = (key, _kb) => (key.column + arg0) % arg1 == 0;
			break;
		case "ratio":
			arg0 = getMinMaxFromRatioName(tokens[++i]);
			if (arg0 == undefined) break;
			fn = (key, _kb) => (key.height / key.width) > arg0[0] && (key.height / key.width) < arg0[1];
			break;


		case "pressed":
			fn = (key, _kb) => key.pressed === true;
			break;
		case "morekeysbox":
			fn = (_, _1) => false;
			break;
		case "popup":
			fn = (_, _1) => false;
			break;
		case "layer":
			arg0 = parseInt(tokens[++i]);
			obj.layer = arg0;
			fn = (_, _1) => true;
			break;
		default:
			fn = (_, _1) => false;
			console.error("Unknown token: " + token);
			if(strict === true) return undefined;
			break;
		}

		result.push({ ...obj, token, fn })
		i++;
	}
	if(result.length === 0) return undefined;
	return result;
}

export function matchesKey(qualifiers, key, kb) {
	for (const q of qualifiers) {
		if (!q.fn(key, kb)) return false;
	}
	return true;
}

export function suggestQualifiersForKey(kb, key) {
	const kind = key.visualStyle.toLowerCase();
	const suggestions = [];


	suggestions.push(`${kind}`);

	const rowCount = Math.max(...kb.keys.map((v) => v.row));
	const colCount = Math.max(...kb.keys.filter((v) => v.row === key.row).map((v) => v.column));

	const suggestedCol = (key.column < colCount/2) ? key.column : (key.column - colCount - 1);

	suggestions.push(`${kind} row ${key.row}`);
	suggestions.push(`${kind} row ${key.row - rowCount - 1}`);
	suggestions.push(`${kind} col ${suggestedCol}`);
	suggestions.push(`col ${suggestedCol}`);
	suggestions.push(`${kind} row ${key.row} col ${suggestedCol}`);
	suggestions.push(`${kind} row ${key.row - rowCount - 1} col ${suggestedCol}`);

	suggestions.push(`${kind} row ${key.row} colmod ${-(key.column % 2)} 2`);
	suggestions.push(`${kind} row ${key.row} colmod ${-(key.column % 3)} 3`);
	suggestions.push(`${kind} row ${key.row} colmod ${-(key.column % 4)} 4`);

	suggestions.push(`${kind} rowmod ${-(key.row % 2)} 2 colmod ${-(key.column % 2)} 2`);

	if(key.iconId) {
		suggestions.push(`icon ${key.iconId}`);
	}

	if(key.label) {
		suggestions.push(`${kind} layout ${kb.name} label ${key.label}`);
	}

	return suggestions;
}

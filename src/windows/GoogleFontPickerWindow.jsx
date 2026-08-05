import AssetStore from "../systems/assets";
import Ui from "../ui"

let local = {};
let fonts = {};
let filteredFonts = [];
let searchQuery = "";
let selectedCategory = "ALL";
let loadedFontFamilies = new Set();
let renderedCount = 0;
const ITEMS_PER_PAGE = 30;

const CATEGORIES = {
	ALL: "All",
	SANS_SERIF: "Sans Serif",
	SERIF: "Serif",
	DISPLAY: "Display",
	HANDWRITING: "Handwriting",
	MONOSPACE: "Monospace",
};

function fontPickerContents() {
	local = {};
	filteredFonts = [];
	searchQuery = "";
	selectedCategory = "ALL";
	loadedFontFamilies.clear();
	renderedCount = 0;

	if (Object.keys(fonts).length === 0) {
		fetch("fonts.json")
			.then(v => v.json())
			.then(v => {
				fonts = v;
				updateContents();
			})
			.catch(err => {
				console.error("Failed to load fonts:", err);
				if (local.contents) {
					local.contents.innerHTML = "Error loading fonts.";
				}
			});
	}

	return Ui.namespaced(local, () => <div id="root" className="font-picker-window">
		<div id="header" className="font-picker-header">
			<input
				id="search"
				type="text"
				placeholder="Search fonts..."
				oninput={(e) => {
					searchQuery = e.target.value.toLowerCase();
					renderedCount = 0;
					updateContents();
				}}
			/>
			<div id="categories" style="display: flex; gap: 4px; flex-wrap: wrap;">
				{Object.entries(CATEGORIES).map(([key, label]) =>
					<button
						id={`cat-${key}`}
						onclick={() => {
							selectedCategory = key;
							renderedCount = 0;
							updateContents();
						}}>{label}</button>
				)}
			</div>
		</div>
		<div id="contents" className="font-picker-contents" oncreate={() => updateContents()}>
			<div id="sentinel" style="height: 1px;"></div>
		</div>
		<div id="footer" className="font-picker-footer">
			<span id="count"></span>
			&nbsp;|&nbsp;
			<span>For more filtering options browse <a style="color:#2af;" href="https://fonts.google.com/">Google Fonts</a></span>
		</div>
	</div>)
}

function getFilteredFonts() {
	let result = Object.values(fonts);

	if (selectedCategory !== "ALL") {
		result = result.filter(f => f.category === selectedCategory);
	}

	if (searchQuery) {
		result = result.filter(f => f.name.toLowerCase().includes(searchQuery));
	}

	return result;
}

const previewText = "AaBbCc QWERTYUIOP"

function loadFontPreview(name) {
	const family = encodeURIComponent(name);
	if (loadedFontFamilies.has(family)) return Promise.resolve(true);

	loadedFontFamilies.add(family);

	return new Promise((resolve) => {
		const link = document.createElement('link');
		link.href = `https://fonts.googleapis.com/css?family=${family}&text=${encodeURIComponent(previewText)}`;
		link.rel = 'stylesheet';

		link.onload = () => resolve(true);
		link.onerror = () => {
			loadedFontFamilies.delete(family);
			resolve(false);
		};

		document.head.appendChild(link);
	});
}

function createFontCard(font) {
	return <div
		className="font-card"
		data-font-name={font.name}
		onmouseenter={(e) => {
			e.target.style.borderColor = "var(--primary)";
		}}
		onmouseleave={(e) => {
			e.target.style.borderColor = "var(--border-high)";
		}}
		onclick={() => onFontSelected(font.name)}
	>
		<div className="font-card-header">
			<span className="name">{font.name}</span>
			<span className="category">{font.category.replace('_', ' ')}</span>
		</div>
		<div
			className="font-preview"
			data-font={font.name}
			oncreate={el => local._fontObserver.observe(el)}
		>
			{previewText}
		</div>
		<div className="font-card-footer">{font.designer}</div>
	</div>;
}

function setupIntersectionObserver() {
	if (local._fontObserver && local._scrollObserver) {
		return;
	}

	const fontObserver = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				const previewEl = entry.target;
				const fontName = previewEl.dataset.font;

				loadFontPreview(fontName).then(() => {
					previewEl.style.fontFamily = `'${fontName}', sans-serif`;
					previewEl.style.visibility = 'visible';
				});

				fontObserver.unobserve(previewEl);
			}
		});
	}, {
		root: local.contents,
		rootMargin: '100px 0px',
		threshold: 0
	});

	// Observer for infinite scroll
	const scrollObserver = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting && renderedCount < filteredFonts.length) {
				loadMoreItems();
			}
		});
	}, {
		root: local.contents,
		rootMargin: '200px 0px',
		threshold: 0
	});

	local._fontObserver = fontObserver;
	local._scrollObserver = scrollObserver;
}

function loadMoreItems() {
	const start = renderedCount;
	const end = Math.min(start + ITEMS_PER_PAGE, filteredFonts.length);
	const newItems = filteredFonts.slice(start, end);

	const fragment = document.createDocumentFragment();

	newItems.forEach(font => {
		const card = createFontCard(font);
		fragment.appendChild(card);
	});

	if (start === 0) {
		local.contents.innerHTML = "";
	}

	local.contents.appendChild(fragment);

	renderedCount = end;
	updateCount();

	if(local.sentinel.parentElement === local.contents) {
		local.contents.removeChild(local.sentinel);
	}

	if (renderedCount < filteredFonts.length) {
		local.contents.appendChild(local.sentinel);
		local._scrollObserver.observe(local.sentinel);
	}
}

function updateContents() {
	if (!local.contents) return;

	if(local.sentinel.parentElement === local.contents) {
		local.contents.removeChild(local.sentinel);
	}

	if (Object.keys(fonts).length === 0) {
		local.contents.innerHTML = "Loading fonts...";
		if (local.count) local.count.textContent = "";
		return;
	}

	filteredFonts = getFilteredFonts();

	Object.keys(CATEGORIES).forEach(key => {
		const btn = local[`cat-${key}`];
		if (btn) {
			const isSelected = key === selectedCategory;
			btn.style.fontWeight = isSelected ? "bold" : "normal";
			btn.style.background = isSelected ? "var(--primary)" : "var(--bg-lowest)";
			btn.style.color = isSelected ? "var(--on-primary)" : "var(--fg-high)";
		}
	});

	renderedCount = 0;
	local.contents.innerHTML = "";

	setupIntersectionObserver();

	if (filteredFonts.length === 0) {
		local.contents.replaceChildren(<div style="text-align: center; padding: 40px; color: var(--fg-highest);">No fonts match your search.</div>);
		updateCount();
		return;
	}

	loadMoreItems();
}

function updateCount() {
	if (local.count) {
		local.count.textContent = `Showing ${renderedCount} of ${filteredFonts.length} font${filteredFonts.length !== 1 ? 's' : ''}`;
	}
}

function onFontSelected(name) {
	const fontKey = Object.keys(fonts).find(f => fonts[f].name === name);

	const filename = fontKey + ".ttf"
	const fontUrl = "https://sapples.net/google-fonts-ttf/" + filename;
	fetch(fontUrl).then(v => v.blob()).then(v => {
		AssetStore.add(v, "other", filename);
		alert("Font asset added: " + filename + ". Set it in Config > Font");
	}).catch(e => {
		alert("An error occurred while fetching: " + e);
	});

	Ui.closeWindow(GoogleFontPickerWindow);
}

const GoogleFontPickerWindow = {
	name: "Font Picker",
	contents: fontPickerContents,
}

export default GoogleFontPickerWindow;

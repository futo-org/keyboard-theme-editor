import Ui from "../ui";
import State from "../state";

const EV_META_UPDATE = "metadataUpdated";

function generateThemeId() {
	const author = State.theme.author.toLowerCase().replace(/\s+/g, "");
	const themeName = State.theme.name.replace(/(?:^|\s|_|-)(\w)/g, (_, c) => c ? c.toUpperCase() : '');
	return `p.${author}.${themeName}`;
}

export function buildMetadataPanel(registerListeners) {
	const local = {};

	function updatePanel() {
		local.id.value = State.theme.id;
		local.name.value = State.theme.name;
		local.author.value = State.theme.author;
		local.version.value = State.theme.version;

		if(local.description)
			local.description.value = State.theme.description;
	}

	function isValidRDNS(rdns) {
		const pattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/i;
		return pattern.test(rdns) && rdns.length <= 253 && rdns.split('.').every(part => part.length <= 63);
	}

	function onParamChange(paramName, validifier) {
		return (_ev) => {const oldValue = State.theme[paramName];
			const newValue = local[paramName].value;
			if(!validifier || validifier(newValue)) {
				State.execute("Update metadata: " + paramName, () => {
					State.theme[paramName] = newValue;
				}, () => {
					State.theme[paramName] = oldValue;
				}, EV_META_UPDATE);
			} else {
				local[paramName].value = oldValue;
			}
			local[paramName].blur();
		};
	}

	if(registerListeners === true) {
		State.ev.listen(State.EV_LOADED, updatePanel);
		State.ev.listen(EV_META_UPDATE, updatePanel);
	}

	const result = Ui.namespaced(local, "metadata", () =>
		<div className="asset-categories">
			<div className="asset-configurable">
				<h3>Metadata</h3>

				<div>
					<label for="name">Theme Name</label>
					<input type="text" id="name" placeholder="Super duper theme 123"
						onChange={onParamChange("name")}></input>
				</div>

				<div>
					<label for="author">Author</label>
					<input type="text" id="author" placeholder="Peter"
						onChange={onParamChange("author")}></input>
				</div>

				<div>
					<label for="version">Version</label>
					<input type="text" id="version" placeholder="1"
						onChange={onParamChange("version")}></input>
				</div>
				
				<button style="margin-top:8px;margin-bottom: 8px;" onClick={() => {
					local["id"].value = generateThemeId();
					onParamChange("id", isValidRDNS)();
				}}>Automatically pick ID from name and author</button>
				<div>
					<label for="id">ID</label>
					<input type="text" id="id" placeholder="com.example.SuperDuperTheme123"
						onChange={onParamChange("id", isValidRDNS)}></input>
				</div>
				<p className="key-info-detail-value">Note: ID should be a globally unique identifier of this theme. After publishing you must not change it!</p>

				{/*<div>
					<label for="desc">Description</label>
					<textarea id="description" placeholder="Awesome theme I made :)"
						onChange={onParamChange("description")}></textarea>
				</div>*/}
			</div>
		</div>
	);

	if(!registerListeners) updatePanel();
	return result;
}

const MetadataPanel = {
	build: () => buildMetadataPanel(true)
};

export default MetadataPanel;

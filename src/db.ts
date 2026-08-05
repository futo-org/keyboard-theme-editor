import { DEFAULT_THEME } from './keyboard/types/Theme';
import State from './state';
import { openDB } from "idb";
import AssetStore, { AssetMeta, BackgroundAsset, IconAsset, OtherAsset } from './systems/assets';

const DB_NAME = 'asndajfs';
const DB_VERSION = 1;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
	upgrade(db, oldVersion, _newVersion, _ev) {
		if(oldVersion === 0) {
			const projectStore = db.createObjectStore("projects", {
				keyPath: 'uid'
			});

			projectStore.createIndex("by-modified", "modified", { unique: false });
			projectStore.createIndex("by-name", "name", { unique: false });

			const assetStore = db.createObjectStore("assets", {
				keyPath: 'assetName'
			});

			assetStore.createIndex("by-project", "projectUid", { unique: false });
			assetStore.createIndex("by-project-name", ["projectUid", "assetName"], { unique: true });
		}
	},
	blocked(_currentVersion, _blockedVersion, _ev) {
		alert("Blocked, close other tabs");
	},
	blocking(_currentVersion, _blockedVersion, _ev) {
		alert("Blocking, refresh this tab");
	},
	terminated() {
		alert("Terminated.");
	}
});

type SavedAsset = {assetName: string, meta: AssetMeta, data: BackgroundAsset | IconAsset | OtherAsset};

async function saveProject() {
	if(!State.isProjectLoaded) return;

	const db = await dbPromise;
	const now = Date.now();

	const uid = State.projectUid;
	if(!uid) return; // undefined/null = no project loaded

	const project = {
		uid,
		name: State.theme.name,
		modified: now,
		theme: State.theme,
		assets: [] as Array<SavedAsset>
	};

	const assets = [];
	for(const assetName of Object.keys(AssetStore.store)) {
		const asset = AssetStore.store[assetName];
		if(asset.meta.builtin) continue;

		project.assets.push({
			assetName,
			meta: asset.meta,
			data: asset.data
		});

		const url = asset.runtime.url; // blob url
		const blob = await (await fetch(url)).blob();
		assets.push({
			assetName: assetName,
			projectUid: uid,
			blob: blob
		});
	}

	const tx = db.transaction(["projects", "assets"], "readwrite");
	const projectStore = tx.objectStore("projects");
	const assetStore = tx.objectStore("assets");

	await projectStore.put(project);
	for(const asset of assets) {
		await assetStore.put(asset);
	}

	await tx.done;

	alert("Saved project " + project.name);
	State.markNonDirty();

	return true;
}

async function getLatestProjects(limit = 20) {
	const db = await dbPromise;
	const index = db.transaction('projects').store.index('by-modified');
	const projects = [];
	let cursor = await index.openCursor(null, 'prev');
	while (cursor && projects.length < limit) {
		projects.push({
			uid: cursor.value.uid,
			name: cursor.value.name,
			modified: cursor.value.modified
		});
		cursor = await cursor.continue();
	}
	return projects;
}

export function mergeDicts<T extends Record<string, any>>(first: T, second: Partial<T>): T {
	const result: any = {};

	for (const key in first) {
		if (key in second) {
			const firstVal = first[key];
			const secondVal = second[key];

			if (
				firstVal !== null &&
                typeof firstVal === 'object' &&
                !Array.isArray(firstVal) &&
                secondVal !== null &&
                typeof secondVal === 'object' &&
                !Array.isArray(secondVal)
			) {
				result[key] = mergeDicts(firstVal, secondVal as any);
			} else {
				result[key] = secondVal;
			}
		} else {
			result[key] = first[key];
		}
	}

	for(const key in second) {
		if (!(key in first)) {
			result[key] = second[key];
		}
	}

	return result;
}

async function loadProject(uid: string) {
	const db = await dbPromise;

	const tx = db.transaction(["projects", "assets"], "readonly");
	const projectStore = tx.objectStore("projects");
	const assetStore = tx.objectStore("assets");

	const project = await projectStore.get(uid);
	if(!project) {
		throw new Error("Project not found! " + uid);
	}

	const assetIndex = assetStore.index("by-project");
	const assets = await assetIndex.getAll(uid);

	await tx.done;

	const newTheme = mergeDicts(structuredClone(DEFAULT_THEME), project.theme);

	State.newProject("load", () => {
		State.theme = newTheme;
		(State as any).projectUid = uid;

		for(const asset of (project.assets as Array<SavedAsset>)) {
			const {assetName, meta, data} = asset;
			const savedBlob = assets.filter((v) => v.assetName === assetName);
			if(savedBlob.length !== 1) {
				console.error("Saved blob not found, or multiple found!", assetName, savedBlob);
				continue;
			}
			AssetStore.loadSaved(assetName, meta, data, savedBlob[0].blob);
		}
	});
	State.markNonDirty();
}

export const Persistence = {
	save: saveProject,
	getRecent: getLatestProjects,
	load: loadProject,
};
(globalThis as any).Persistence = Persistence;

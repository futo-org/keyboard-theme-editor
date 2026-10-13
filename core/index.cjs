import { importToml } from './toml'
import { drawThemeOnceOff } from './keyboard/render'
import Layouts from './keyboard/layouts/layouts'
import { assetStoreOnceOff } from './assets'
import { flattenDynamicColors } from './dynamic-colors';

module.exports = {
	importToml,
	drawThemeOnceOff,
	assetStoreOnceOff,
	Layouts,
	flattenDynamicColors,

	generateScreenshot: (file, layoutName) => new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const { newTheme, newStore } = importToml(reader.result, false);
				assetStoreOnceOff(newStore).then((store) => {
					flattenDynamicColors(newTheme, store);
					drawThemeOnceOff(newTheme, Layouts[layoutName ?? "QWERTY"], store).then((blob) => {
						resolve(blob);
					}).catch(reject);
				}).catch(reject);
			} catch(err) {
				reject(err);
			}
		}
		reader.onerror = reject;
		reader.readAsArrayBuffer(file);
	})
};

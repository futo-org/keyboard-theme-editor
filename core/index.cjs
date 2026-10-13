import { importToml } from './toml'
import { drawThemeOnceOff } from './keyboard/render'
import Layouts from './keyboard/layouts/layouts'
import { assetStoreOnceOff } from './assets'

module.exports = {
	importToml,
	drawThemeOnceOff,
	assetStoreOnceOff,
	Layouts,

	generateScreenshot: (file, layoutName) => new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const { newTheme, newStore } = ThemeCore.importToml(reader.result);
			ThemeCore.assetStoreOnceOff(newStore).then((store) => {
				ThemeCore.drawThemeOnceOff(newTheme, Layouts[layoutName ?? "QWERTY"], store).then((blob) => {
					resolve(blob);
				}).catch(reject);
			}).catch(reject);
		}
		reader.onerror = reject;
		reader.readAsArrayBuffer(file);
	})
};

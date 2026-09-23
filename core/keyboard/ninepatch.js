import { HEXtoRGB } from "./color";

export function drawNinePatch(ctx, ninePatch, destX, destY, destWidth, destHeight) {
	let { image, stretchX, stretchY } = ninePatch;

	const srcWidth = image.width;
	const srcHeight = image.height;

	if (!stretchX || stretchX.length === 0) {
		stretchX = [[0, srcWidth]];
	}
	if (!stretchY || stretchY.length === 0) {
		stretchY = [[0, srcHeight]];
	}

	const buildRegions = (srcSize, stretchRegions) => {
		const regions = [];
		let lastPos = 0;

		for (const [stretchStart, stretchEnd] of stretchRegions) {
			if (stretchStart > lastPos) {
				regions.push({ start: lastPos, end: stretchStart, stretch: false });
			}
			regions.push({ start: stretchStart, end: stretchEnd, stretch: true });
			lastPos = stretchEnd;
		}

		if (lastPos < srcSize) {
			regions.push({ start: lastPos, end: srcSize, stretch: false });
		}

		return regions;
	};

	const xRegions = buildRegions(srcWidth, stretchX);
	const yRegions = buildRegions(srcHeight, stretchY);

	const totalStretchableX = stretchX.reduce((sum, [start, end]) => sum + (end - start), 0);
	const totalStretchableY = stretchY.reduce((sum, [start, end]) => sum + (end - start), 0);
	const totalFixedX = srcWidth - totalStretchableX;
	const totalFixedY = srcHeight - totalStretchableY;

	// if source asset is larger than destination, gets downscaled to fit (allows perfect pill shapes)
	let scale = 1.0;
	if(totalFixedX > destWidth || totalFixedY > destHeight) {
		scale = Math.min(destWidth / totalFixedX, destHeight / totalFixedY);
	}

	const destStretchableX = Math.max(0, (destWidth/scale) - totalFixedX);
	const destStretchableY = Math.max(0, (destHeight/scale) - totalFixedY);
	const scaleX = totalStretchableX > 0 ? destStretchableX / totalStretchableX : 1;
	const scaleY = totalStretchableY > 0 ? destStretchableY / totalStretchableY : 1;

	let currentY = Math.round(destY);
	for (const yRegion of yRegions) {
		const srcH = yRegion.end - yRegion.start;
		const destH = Math.round(scale*(yRegion.stretch ? srcH * scaleY : srcH));

		let currentX = Math.round(destX);
		for (const xRegion of xRegions) {
			const srcW = xRegion.end - xRegion.start;
			const destW = Math.round(scale*(xRegion.stretch ? srcW * scaleX : srcW));

			ctx.drawImage(
				image,
				xRegion.start, yRegion.start, srcW, srcH,
				currentX, currentY, destW, destH
			);

			currentX += destW;
		}
		currentY += destH;
	}
}

export function scaleNinePatchImage(image, scale, tint) {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	const sc = (v) => Math.round(v * scale);

	const newWidth = sc(image.width);
	const newHeight = sc(image.height);

	if(newWidth > 4096 || newHeight > 4096) {
		console.error("Invalid scale! " + scale);
		throw new Error("Image too large");
	}


	canvas.width = sc(image.width);
	canvas.height = sc(image.height);
	ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);

	if(tint !== "#ffffff" && tint !== "#FFFFFF") {
		const {r, g, b} = HEXtoRGB(tint);

		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;
		for (let i = 0; i < data.length; i += 4) {
			data[i] = Math.round(data[i] * (r / 255));
			data[i + 1] = Math.round(data[i + 1] * (g / 255));
			data[i + 2] = Math.round(data[i + 2] * (b / 255));
		}
		ctx.putImageData(imageData, 0, 0);
	}

	return canvas;
}

export function getEffectiveForegroundTint(theme, assetObj, passthruToken) {
	if(assetObj.data.colorKind === "constant") {
		return assetObj.data.foregroundConstant;
	} else {
		if(passthruToken) return assetObj.data.foregroundToken;
		return theme.colors[assetObj.data.foregroundToken];
	}
}

export function getEffectiveBackgroundTint(theme, assetObj, passthruToken) {
	if(assetObj.data.colorKind === "constant") {
		return assetObj.data.backgroundConstant;
	} else {
		if(passthruToken) return assetObj.data.backgroundToken;
		return theme.colors[assetObj.data.backgroundToken];
	}
}

export function createNinePatch(theme, assetObj, density) {
	const img = assetObj.runtime.img;
	if(!img) return null;
	const { slicing, padding, targetDensity, gap } = assetObj.data;

	const tint = getEffectiveBackgroundTint(theme, assetObj);

	const scale = density / targetDensity;
	const scaled = scaleNinePatchImage(img, scale, tint);

	const sx = (v) => Math.round(v * scaled.width);
	const sy = (v) => Math.round(v * scaled.height);

	const stretchX = [[ sx(slicing.left), sx(slicing.right) ]];
	const stretchY = [[ sy(slicing.top), sy(slicing.bottom) ]];

	let padding2 = {
		left: sx(padding.left),
		right: sx(padding.right),
		top: sy(padding.top),
		bottom: sy(padding.bottom),
	};

	const foreground = getEffectiveForegroundTint(theme, assetObj);

	const result = {
		image: scaled,
		foreground, stretchX, stretchY, padding: padding2, gap,
	};

	return result;
}

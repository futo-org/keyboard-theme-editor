export type RGBType = {r: number, g: number, b: number, a: number | undefined};

export function clamp0255r(v: number): number {
	return Math.min(255, Math.max(0, Math.round(v)));
}

export function ths2(num: number) {
	return clamp0255r(num).toString(16).padStart(2, '0');
}

export function HEXtoRGB(hex: string): RGBType {
	let cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

	if(hex.startsWith("rgb") && hex.includes("(") && hex.includes(")")) {
		const colors = hex.split("(")[1].split(")")[0].split(",").map((v) => parseFloat(v.trim()));
		return {
			r: colors[0],
			g: colors[1],
			b: colors[2],
			a: colors.length == 4 ? colors[3] : 1.0,
		};
	}

	if(cleanHex.length === 3) {
		cleanHex = cleanHex
			.split('')
			.map(char => char + char)
			.join('');
	}

	const r = parseInt(cleanHex.substring(0, 2), 16);
	const g = parseInt(cleanHex.substring(2, 4), 16);
	const b = parseInt(cleanHex.substring(4, 6), 16);

	let a = 255;
	if(cleanHex.length == 8) {
		a = parseInt(cleanHex.substring(6, 8), 16);
	}

	a /= 255.0;

	return {r, g, b, a};
}

export function forceAlpha(hex: string, alpha: number): string {
	return hex.slice(0, 7) + ths2(alpha * 255);
}



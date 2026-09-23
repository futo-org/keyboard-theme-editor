import { Hct } from "@material/material-color-utilities";
import { RGBType, ths2 } from "../core/keyboard/color";

export type HCTType = {h: number, c: number, t: number, a: number | undefined};
export type HSVType = {h: number, s: number, v: number, a: number | undefined};

export function HSVtoRGB(h: number | HSVType, s: number | undefined, v: number | undefined, a: number | undefined): RGBType {
	let r: number, g: number, b: number;
	let hue: number, sat: number, val: number, alpha: number;
	if (typeof h === 'object') {
		({ h: hue, s: sat, v: val, a: alpha = 1 } = h);
	} else {
		hue = h;
		sat = s!;
		val = v!;
		alpha = a ?? 1;
	}
	const i = Math.floor(hue * 6);
	const f = hue * 6 - i;
	const p = val * (1 - sat);
	const q = val * (1 - f * sat);
	const t = val * (1 - (1 - f) * sat);
	switch (i % 6) {
	case 0: r = val; g = t; b = p; break;
	case 1: r = q; g = val; b = p; break;
	case 2: r = p; g = val; b = t; break;
	case 3: r = p; g = q; b = val; break;
	case 4: r = t; g = p; b = val; break;

		// case 5
	default: r = val; g = p; b = q; break;
	}
	return {
		r: r * 255,
		g: g * 255,
		b: b * 255,
		a: alpha
	};
}

export function RGBtoHSV(r: number | RGBType, g: number | undefined, b: number | undefined, a: number | undefined): HSVType {
	let red: number, grn: number, blu: number, alpha: number;
	if(typeof r === 'object') {
		({ r: red, g: grn, b: blu, a: alpha = 1 } = r);
	} else {
		red = r;
		grn = g!;
		blu = b!;
		alpha = a ?? 1;
	}
	let h: number;
	const max = Math.max(red, grn, blu), min = Math.min(red, grn, blu),
		d = max - min,
		s = (max === 0 ? 0 : d / max),
		v = max / 255;

	switch (max) {
	case min: h = 0; break;
	case r: h = (grn - blu) + d * (grn < blu ? 6: 0); h /= 6 * d; break;
	case g: h = (blu - red) + d * 2; h /= 6 * d; break;
	case b: h = (red - grn) + d * 4; h /= 6 * d; break;

		// unreachable
	default: h = 0; break;
	}

	return {
		h: h,
		s: s,
		v: v,
		a: alpha
	};
}

export function RGBtoHEX(r: number | RGBType, g: number | undefined, b: number | undefined, a: number | undefined): string {
	let red: number, grn: number, blu: number, alpha: number;
	if(typeof r === 'object') {
		({ r: red, g: grn, b: blu, a: alpha = 1 } = r);
	} else {
		red = r;
		grn = g!;
		blu = b!;
		alpha = a ?? 1;
	}

	alpha *= 255.0;

	const outParts = [ths2(red), ths2(grn), ths2(blu)];
	if(alpha !== 255) {
		outParts.push(ths2(alpha));
	}

	return '#' + outParts.join('');
}


export function toHCT(hex: string): HCTType {
	let argb = hex.replace("#", "");
	let alpha = 1.0;
	if(argb.length == 8) { // swap ARGB
		argb = argb.slice(6) + argb.slice(0, 6);
		alpha = parseInt(argb.slice(0, 2), 16) / 255;
	}

	const argbInt = parseInt(argb, 16);
	const hct = Hct.fromInt(argbInt);
	return {
		h: hct.hue,
		c: hct.chroma,
		t: hct.tone,
		a: alpha
	}
}

export function fromHCT(hct: HCTType): string {
	const argbInt = (Hct.from(hct.h, hct.c, hct.t)).toInt();
	let argb = (argbInt >>> 0).toString(16).padStart(8, '0');

	if(argb.length == 8) {
		argb = argb.slice(2);
	}

	if((hct.a ?? 1) < 1) {
		argb = argb + ths2((hct.a ?? 1) * 255);
	}

	return "#" + argb;
}

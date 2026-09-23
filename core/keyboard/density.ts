export function dp(v: number, density: number): number {
	return v * (density / 160.0);
}

export function pxToDp(px: number, density: number): number {
	return px / (density / 160.0);
}

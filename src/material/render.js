function rr(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

export function drawMaterialColorDemo(colors, ctx, W, H) {
	ctx.fillStyle = '#FFFFFF';
	ctx.fillRect(0, 0, W, H);

	ctx.fillStyle = colors.background;
	ctx.fillRect(0, 0, W, H);

	ctx.fillStyle = colors.onBackground;
	ctx.font = 'bold 16px sans-serif';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	ctx.fillText('M3 color preview. Make sure everything is readable and has adequate contrast!', 16, 12);

	const margin = 16;
	const gap = 12;
	const top = 44;
	const cols = 4;
	const rows = 3;
	const cw = (W - margin * 2 - gap * (cols - 1)) / cols;
	const ch = (H - top - margin - gap * (rows - 1)) / rows;

	function cell(c, r, wc, hc) {
		return {
			x: margin + c * (cw + gap),
			y: top + r * (ch + gap),
			w: (wc || 1) * cw + (wc > 1 ? (wc - 1) * gap : 0),
			h: (hc || 1) * ch + (hc > 1 ? (hc - 1) * gap : 0)
		};
	}

	// --- Row 0 ---

	// Primary
	let p = cell(0, 0);
	rr(ctx, p.x, p.y, p.w, p.h, 12);
	ctx.fillStyle = colors.primaryContainer;
	ctx.fill();
	ctx.fillStyle = colors.onPrimaryContainer;
	ctx.font = 'bold 11px sans-serif';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	ctx.fillText('primaryContainer', p.x + 10, p.y + 8);
	ctx.font = '11px sans-serif';
	ctx.fillText('Lorem ipsum dolor sit amet', p.x + 10, p.y + 26);
	rr(ctx, p.x + 10, p.y + p.h - 32, p.w - 20, 24, 12);
	ctx.fillStyle = colors.primary;
	ctx.fill();
	ctx.fillStyle = colors.onPrimary;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = '12px sans-serif';
	ctx.fillText('primary / onPrimary', p.x + p.w / 2, p.y + p.h - 20);

	// Secondary
	p = cell(1, 0);
	rr(ctx, p.x, p.y, p.w, p.h, 12);
	ctx.fillStyle = colors.secondaryContainer;
	ctx.fill();
	ctx.fillStyle = colors.onSecondaryContainer;
	ctx.font = 'bold 11px sans-serif';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	ctx.fillText('secondaryContainer', p.x + 10, p.y + 8);
	ctx.font = '11px sans-serif';
	ctx.fillText('Lorem ipsum dolor sit amet', p.x + 10, p.y + 26);
	rr(ctx, p.x + 10, p.y + p.h - 32, p.w - 20, 24, 12);
	ctx.fillStyle = colors.secondary;
	ctx.fill();
	ctx.fillStyle = colors.onSecondary;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = '12px sans-serif';
	ctx.fillText('secondary / onSecondary', p.x + p.w / 2, p.y + p.h - 20);

	// Tertiary
	p = cell(2, 0);
	rr(ctx, p.x, p.y, p.w, p.h, 12);
	ctx.fillStyle = colors.tertiaryContainer;
	ctx.fill();
	ctx.fillStyle = colors.onTertiaryContainer;
	ctx.font = 'bold 11px sans-serif';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	ctx.fillText('tertiaryContainer', p.x + 10, p.y + 8);
	ctx.font = '11px sans-serif';
	ctx.fillText('Lorem ipsum dolor sit amet', p.x + 10, p.y + 26);
	rr(ctx, p.x + 10, p.y + p.h - 32, p.w - 20, 24, 12);
	ctx.fillStyle = colors.tertiary;
	ctx.fill();
	ctx.fillStyle = colors.onTertiary;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = '12px sans-serif';
	ctx.fillText('tertiary / onTertiary', p.x + p.w / 2, p.y + p.h - 20);

	// Error
	p = cell(3, 0);
	rr(ctx, p.x, p.y, p.w, p.h, 12);
	ctx.fillStyle = colors.errorContainer;
	ctx.fill();
	ctx.fillStyle = colors.onErrorContainer;
	ctx.font = 'bold 11px sans-serif';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	ctx.fillText('errorContainer', p.x + 10, p.y + 8);
	ctx.font = '11px sans-serif';
	ctx.fillText('Lorem ipsum dolor sit amet', p.x + 10, p.y + 26);
	rr(ctx, p.x + 10, p.y + p.h - 32, p.w - 20, 24, 12);
	ctx.fillStyle = colors.error;
	ctx.fill();
	ctx.fillStyle = colors.onError;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = '12px sans-serif';
	ctx.fillText('error / onError', p.x + p.w / 2, p.y + p.h - 20);

	// --- Row 1 ---

	// Surface
	p = cell(0, 1);
	rr(ctx, p.x, p.y, p.w, p.h, 12);
	ctx.fillStyle = colors.surface;
	ctx.fill();
	ctx.fillStyle = colors.onSurface;
	ctx.font = 'bold 11px sans-serif';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	ctx.fillText('surface', p.x + 10, p.y + 8);
	ctx.font = '11px sans-serif';
	ctx.fillText('Lorem ipsum dolor sit amet', p.x + 10, p.y + 26);
	rr(ctx, p.x + 10, p.y + p.h - 40, p.w - 20, 28, 8);
	ctx.fillStyle = colors.surfaceVariant;
	ctx.fill();
	ctx.fillStyle = colors.onSurfaceVariant;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = '11px sans-serif';
	ctx.fillText('surfaceVariant / onSurfaceVariant', p.x + p.w / 2, p.y + p.h - 26);
	// scrim overlay
	rr(ctx, p.x + p.w / 2, p.y + 50, p.w / 2 - 10, p.h - 60, 8);
	ctx.fillStyle = colors.scrim;
	ctx.globalAlpha = 0.5;
	ctx.fill();
	ctx.globalAlpha = 1.0;
	ctx.fillStyle = colors.onSurface;
	ctx.fillText('scrim 0.5', p.x + p.w / 2 + (p.w / 2 - 10) / 2, p.y + 50 + (p.h - 60) / 2);

	// Inverse
	p = cell(1, 1);
	rr(ctx, p.x, p.y, p.w, p.h, 12);
	ctx.fillStyle = colors.inverseSurface;
	ctx.fill();
	ctx.fillStyle = colors.inverseOnSurface;
	ctx.font = 'bold 11px sans-serif';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	ctx.fillText('inverseSurface', p.x + 10, p.y + 8);
	ctx.font = '11px sans-serif';
	ctx.fillText('Lorem ipsum dolor sit amet', p.x + 10, p.y + 26);
	rr(ctx, p.x + 10, p.y + p.h - 32, p.w - 20, 24, 12);
	ctx.fillStyle = colors.inversePrimary;
	ctx.fill();
	ctx.fillStyle = colors.onPrimaryContainer;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = '12px sans-serif';
	ctx.fillText('inversePrimary', p.x + p.w / 2, p.y + p.h - 20);

	// Background & Tint
	p = cell(2, 1);
	rr(ctx, p.x, p.y, p.w, p.h, 12);
	ctx.fillStyle = colors.background;
	ctx.fill();
	rr(ctx, p.x, p.y, p.w, p.h, 12);
	ctx.strokeStyle = colors.outline;
	ctx.lineWidth = 1;
	ctx.stroke();
	ctx.fillStyle = colors.onBackground;
	ctx.font = 'bold 11px sans-serif';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	ctx.fillText('1px outlined background', p.x + 10, p.y + 8);
	ctx.font = '11px sans-serif';
	ctx.fillText('Lorem ipsum dolor sit amet', p.x + 10, p.y + 26);
	ctx.fillStyle = colors.surfaceTint;
	ctx.globalAlpha = 0.1;
	ctx.beginPath();
	rr(ctx, p.x + 10, p.y + p.h - 32, p.w - 20, 24, 12);
	ctx.fill();
	ctx.globalAlpha = 1.0;
	ctx.fillStyle = colors.surfaceTint;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = '11px sans-serif';
	ctx.fillText('surfaceTint', p.x + p.w / 2, p.y + p.h - 20);

	// Surface Dim / Bright
	p = cell(3, 1);
	rr(ctx, p.x, p.y, p.w, p.h, 12);
	ctx.fillStyle = colors.surfaceDim;
	ctx.fill();
	ctx.fillStyle = colors.onSurface;
	ctx.font = 'bold 11px sans-serif';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	ctx.fillText('surfaceDim', p.x + 10, p.y + 8);
	ctx.font = '11px sans-serif';
	ctx.fillText('Lorem ipsum dolor sit amet', p.x + 10, p.y + 26);
	rr(ctx, p.x + 10, p.y + p.h - 32, p.w - 20, 24, 12);
	ctx.fillStyle = colors.surfaceBright;
	ctx.fill();
	ctx.fillStyle = colors.onSurface;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = '12px sans-serif';
	ctx.fillText('surfaceBright', p.x + p.w / 2, p.y + p.h - 20);

	// --- Row 2 ---

	// Surface Containers (spans 2 cols)
	p = cell(0, 2, 2, 1);
	rr(ctx, p.x, p.y, p.w, p.h, 12);
	ctx.fillStyle = colors.surfaceContainerLowest;
	ctx.fill();
	ctx.fillStyle = colors.onSurfaceVariant;
	ctx.font = 'bold 11px sans-serif';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	ctx.fillText('surfaceContainerLowest', p.x + 10, p.y + 8);

	const barH = (p.h - 48) / 4;
	const bars = [
		{ c: colors.surfaceContainerLow, t: 'surfaceContainerLow' },
		{ c: colors.surfaceContainer, t: 'surfaceContainer' },
		{ c: colors.surfaceContainerHigh, t: 'surfaceContainerHigh' },
		{ c: colors.surfaceContainerHighest, t: 'surfaceContainerHighest' }
	];
	bars.forEach((b, i) => {
		const by = p.y + 28 + i * (barH + 4);
		rr(ctx, p.x + 10, by, p.w - 20, barH, 6);
		ctx.fillStyle = b.c;
		ctx.fill();
		ctx.fillStyle = colors.onSurfaceVariant;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.font = '11px sans-serif';
		ctx.fillText(b.t, p.x + 20, by + barH / 2);
	});

	// Outline
	p = cell(2, 2);
	rr(ctx, p.x, p.y, p.w, p.h, 12);
	ctx.fillStyle = colors.surfaceContainer;
	ctx.fill();
	rr(ctx, p.x, p.y, p.w, p.h, 12);
	ctx.strokeStyle = colors.outline;
	ctx.lineWidth = 2;
	ctx.stroke();
	ctx.fillStyle = colors.onSurface;
	ctx.font = 'bold 11px sans-serif';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	ctx.fillText('2px outlined surfaceContainer', p.x + 10, p.y + 8);
	ctx.font = '11px sans-serif';
	ctx.fillText('Lorem ipsum dolor sit amet', p.x + 10, p.y + 26);
	ctx.strokeStyle = colors.outlineVariant;
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(p.x + 10, p.y + p.h / 2);
	ctx.lineTo(p.x + p.w - 10, p.y + p.h / 2);
	ctx.stroke();
	ctx.fillStyle = colors.onSurfaceVariant;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = '11px sans-serif';
	ctx.fillText('outlineVariant', p.x + p.w / 2, p.y + p.h / 2 + 12);

	// Scrim
	p = cell(3, 2);
	rr(ctx, p.x, p.y, p.w, p.h, 12);
	ctx.fillStyle = colors.surface;
	ctx.fill();
	ctx.fillStyle = colors.onSurface;
	ctx.font = 'bold 11px sans-serif';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	ctx.fillText('surface + scrim', p.x + 10, p.y + 8);
	ctx.font = '11px sans-serif';
	ctx.fillText('Lorem ipsum dolor sit amet', p.x + 10, p.y + 26);
	rr(ctx, p.x + 10, p.y + p.h - 60, p.w - 20, 50, 8);
	ctx.fillStyle = colors.scrim;
	ctx.globalAlpha = 0.5;
	ctx.fill();
	ctx.globalAlpha = 1.0;
	ctx.fillStyle = colors.onSurface;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = '11px sans-serif';
	ctx.fillText('scrim 0.5', p.x + p.w / 2, p.y + p.h - 35);
}

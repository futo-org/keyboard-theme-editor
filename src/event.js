const Ev = {
	makeEventBus: () => {
		const t = new EventTarget();
		return {
			target: t,
			emit: (n, ...p) => t.dispatchEvent(new CustomEvent(n, {detail: p})),
			listen: (n, c) => Array.isArray(n) ? n.forEach(v => t.addEventListener(v, e => c(...e.detail))) : t.addEventListener(n, e => c(...e.detail)),
			unlisten: (n, c) => Array.isArray(n) ? n.forEach(v => t.removeEventListener(v, c)) : t.removeEventListener(n, c)
		};
	}
};

export default Ev;

export type ThemeIdString = string;
export type AssetString = string;
export type PercentageString = string;
export type FilterString = string;
export type ColorString = string;

export type ThemeOptions = {
	autoBorders: boolean;
	roundedness: number;

	centerHints: boolean;

	scaleText: number;
	scaleHints: number;

	weightText: number;
	weightHints: number;
}

export interface ThemeAssets {
	font?: AssetString;
	background: ThemeBackground;
	icon: ThemeKeyIconAsset[];
	key: ThemeKeyIconAsset[];
}

export interface ThemeBackgroundCropping {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface ThemeBackground {
	image?: AssetString;
	opacity: number;
	actionBarOpacity: number;
}

export interface ThemeKeyIconAsset {
	selector: FilterString;
	asset: AssetString;
}


export interface ThemeColors {
	primary: ColorString;
	onPrimary: ColorString;
	primaryContainer: ColorString;
	onPrimaryContainer: ColorString;
	inversePrimary: ColorString;
	secondary: ColorString;
	onSecondary: ColorString;
	secondaryContainer: ColorString;
	onSecondaryContainer: ColorString;
	tertiary: ColorString;
	onTertiary: ColorString;
	tertiaryContainer: ColorString;
	onTertiaryContainer: ColorString;
	background: ColorString;
	onBackground: ColorString;
	surface: ColorString;
	onSurface: ColorString;
	surfaceVariant: ColorString;
	onSurfaceVariant: ColorString;
	surfaceTint: ColorString;
	inverseSurface: ColorString;
	inverseOnSurface: ColorString;
	surfaceBright: ColorString;
	surfaceDim: ColorString;
	surfaceContainer: ColorString;
	surfaceContainerHigh: ColorString;
	surfaceContainerHighest: ColorString;
	surfaceContainerLow: ColorString;
	surfaceContainerLowest: ColorString;
	error: ColorString;
	onError: ColorString;
	errorContainer: ColorString;
	onErrorContainer: ColorString;
	outline: ColorString;
	outlineVariant: ColorString;
	scrim: ColorString;
	keyboardSurface: ColorString;
	keyboardSurfaceDim: ColorString;
	keyboardContainer: ColorString;
	keyboardContainerVariant: ColorString;
	onKeyboardContainer: ColorString;
	keyboardPress: ColorString;
	keyboardContainerPressed: ColorString;
	onKeyboardContainerPressed: ColorString;
}


export type ThemeInternal = any;

export interface Theme {
	name: string;
	author: string;
	id: string;
	version: number;
	description: string;

	options: ThemeOptions;
	assets: ThemeAssets;
	colors: ThemeColors
	internal?: ThemeInternal;
}


export const DEFAULT_THEME: Theme = {
	name: "Untitled Theme",
	author: "Anonymous",
	id: "com.example.Theme",
	version: 1,
	description: "This is a template FUTO Keyboard theme",
	options: {
		autoBorders: true,
		centerHints: false,
		roundedness: 1.0,

		scaleText: 1.0,
		scaleHints: 1.0,
		weightText: 400,
		weightHints: 500,
	},
	assets: {
		icon: [],
		key: [],
		background: {
			opacity: 1,
			actionBarOpacity: 0.5
		}
	},
	colors: {
		primary: "#B2C8FF",
		onPrimary: "#131D36",
		primaryContainer: "#131D36",
		onPrimaryContainer: "#E6E6EE",
		inversePrimary: "#",
		secondary: "#A7B3D1",
		onSecondary: "#393B40",
		secondaryContainer: "#17181C",
		onSecondaryContainer: "#949499",
		tertiary: "#ADC6FF",
		onTertiary: "#394866",
		tertiaryContainer: "#44567A",
		onTertiaryContainer: "#D6E3FF",
		background: "#121316",
		onBackground: "#E6E6EE",
		surface: "#121316",
		onSurface: "#E6E6EE",
		surfaceVariant: "#",
		onSurfaceVariant: "#BBBDBF",
		surfaceTint: "#",
		inverseSurface: "#",
		inverseOnSurface: "#",
		error: "#FA6060",
		onError: "#663939",
		errorContainer: "#732323",
		onErrorContainer: "#FFD6D6",
		outline: "#767A8A",
		outlineVariant: "#1D1E24",
		scrim: "#",
		surfaceBright: "#",
		surfaceDim: "#",
		surfaceContainer: "#",
		surfaceContainerHigh: "#",
		surfaceContainerHighest: "#2C2F38",
		surfaceContainerLow: "#",
		surfaceContainerLowest: "#",
		keyboardSurface: "#121316",
		keyboardSurfaceDim: "#0D0D0F",
		keyboardContainer: "#1E2024",
		keyboardContainerVariant: "#17181C",
		onKeyboardContainer: "#E6E6EE",
		keyboardPress: "#3C3F47",
		keyboardContainerPressed: "#767A8A54",
		onKeyboardContainerPressed: "#00000000",
	},
	internal: {
		inheritedColors: {
			//primary: true,
			//keyboardSurface: true,
			//keyboardContainer: true,
			onPrimary: true,
			primaryContainer: true,
			onPrimaryContainer: true,
			inversePrimary: true,
			secondary: true,
			onSecondary: true,
			secondaryContainer: true,
			onSecondaryContainer: true,
			tertiary: true,
			onTertiary: true,
			tertiaryContainer: true,
			onTertiaryContainer: true,
			background: true,
			onBackground: true,
			surface: true,
			onSurface: true,
			surfaceVariant: true,
			onSurfaceVariant: true,
			surfaceTint: true,
			inverseSurface: true,
			inverseOnSurface: true,
			error: true,
			onError: true,
			errorContainer: true,
			onErrorContainer: true,
			outline: true,
			outlineVariant: true,
			scrim: true,
			surfaceBright: true,
			surfaceDim: true,
			surfaceContainer: true,
			surfaceContainerHigh: true,
			surfaceContainerHighest: true,
			surfaceContainerLow: true,
			surfaceContainerLowest: true,
			keyboardSurfaceDim: true,
			keyboardContainerVariant: true,
			onKeyboardContainer: true,
			keyboardPress: true,
			keyboardContainerPressed: true,
			onKeyboardContainerPressed: true,
		}
	}
}

//export type ThemeParms = {theme: Theme, setTheme: React.Dispatch<React.SetStateAction<Theme>>};

// ============================================================
// UNITS
// ============================================================

type DimensionUnit = "px" | "rem" | "%";
type DurationUnit = "ms" | "s";

type DimensionBase = { value: number; unit: DimensionUnit };
type DurationBase = { value: number; unit: DurationUnit };

// ============================================================
// COLORS
// ============================================================
type SupportedColorSpace = "srgb" | "oklch";

type ColorValue = {
    colorSpace: SupportedColorSpace;
    components: (number | "none")[];
    alpha?: number;
    hex?: string;
};

type PaletteParams = {
    source: "tailwind";
    colorSpace: SupportedColorSpace;
};

// ============================================================
// NODE METADATA
// ============================================================

type NodeMetadata = {
	$description?: string;
	$extensions?: Record<string, unknown>;
};

// ============================================================
// CORE
// ============================================================

type CoreConfig = {
	rootFontSize: number;
	baseUnit: DimensionBase;
	baseSteps: number[];
};

// ============================================================
// GENERATOR PARAMS
// ============================================================

type StepsParams<T extends TokenType> = {
	base?: DimensionBase | DurationBase;
	steps?: number[];
	extend?: Record<string, TokenValueMap[T]>;
};

type RangeParams = {
	min?: number;
	max?: number;
	step?: number;
	base?: DimensionBase | DurationBase;
};


type MapParams<T extends TokenType> = {
	values: Record<string, TokenValueMap[T]>;
};

// ============================================================
// GENERATORS
// ============================================================


type Generator<T extends TokenType> =
	| { generator: "steps"; params?: StepsParams<T> }
	| { generator: "range"; params?: RangeParams }
	| { generator: "map"; params?: MapParams<T> }
	| { generator: "palette"; params: PaletteParams };

// ============================================================
// TOKEN TYPES
// Single source of truth. TokenGroup and ResolvedToken derive from these.
// ============================================================

type TokenType = "dimension" | "duration" | "number" | "fontWeight" | "color";

type TokenValueMap = {
	dimension: DimensionBase;
	duration: DurationBase;
	number: number;
	fontWeight: number;
	color: ColorValue;
};

// ============================================================
// CONFIG DOMAIN
// ============================================================

type TokenGroup = NodeMetadata & {
	[K in TokenType]: { $type: K; $config: Generator<K> }
}[TokenType];

type Config = {
	core: CoreConfig;
	tokens: Record<string, TokenGroup>;
};

export {
	Config,
	CoreConfig,
	TokenGroup,
	TokenType,
	TokenValueMap,
	Generator,
	StepsParams,
	RangeParams,
	MapParams,
	NodeMetadata,
	DimensionBase,
	DurationBase,
	DimensionUnit,
	DurationUnit,
	PaletteParams,
	ColorValue,
	SupportedColorSpace
}
import { DimensionUnit, DurationUnit, TokenType, TokenValueMap } from './types';

function isDimensionUnit(unit: string): unit is DimensionUnit {
    return unit === "px" || unit === "rem" || unit === "%";
}

function isDurationUnit(unit: string): unit is DurationUnit {
    return unit === "ms" || unit === "s";
}

function validateTokenValue(type: TokenType, value: unknown): asserts value is TokenValueMap[typeof type] {
    switch (type) {
        case "dimension": {
            if (
                typeof value !== "object" || value === null ||
                !("value" in value) || !("unit" in value) ||
                typeof (value as any).value !== "number" ||
                !isDimensionUnit((value as any).unit)
            ) throw new Error(`Invalid dimension value at key`);
            return;
        }
        case "duration": {
            if (
                typeof value !== "object" || value === null ||
                !("value" in value) || !("unit" in value) ||
                typeof (value as any).value !== "number" ||
                !isDurationUnit((value as any).unit)
            ) throw new Error(`Invalid duration value`);
            return;
        }
        case "number":
        case "fontWeight": {
            if (typeof value !== "number") throw new Error("Expected number");
            return;
        }
		case "color": {
			if (
				typeof value !== 'object' || value === null ||
				!('colorSpace' in value) ||
				!('components' in value) ||
				!Array.isArray((value as any).components) ||
				!["srgb", "oklch"].includes((value as any).colorSpace) ||
				!(value as any).components.every(
					(c: unknown) => typeof c === 'number' || c === 'none'
				) ||
				('alpha' in value && typeof (value as any).alpha !== 'number') ||
				('hex' in value && typeof (value as any).hex !== 'string')
			) throw new Error("Invalid color value");
			return;
		}
    }
}

export { validateTokenValue };
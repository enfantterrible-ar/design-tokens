import {
    generateColor, generateMap, generateRange, generateSteps, GeneratorOutput
} from './generators';
import { formatTokenDescription, formatTokenKey } from './helpers';
import { Config, CoreConfig, NodeMetadata, TokenType, TokenValueMap } from './types';
import { validateTokenValue } from './validation';

// ============================================================
// RESOLVED DOMAIN
// Config with generators executed. $config is gone, $value is populated.
// This is your internal representation before any DTCG transformation.
// ============================================================

type ResolvedToken = NodeMetadata & {
    [K in TokenType]: { $type: K; $value: TokenValueMap[K] }
}[TokenType];

type ResolvedGroup = NodeMetadata & {
    tokens: Record<string, ResolvedToken>;
};

type ResolvedConfig = {
    core: CoreConfig;
    tokens: Record<string, ResolvedGroup>;
};

// ============================================================
// SORTABLE MAGNITUDE
// ============================================================

function toSortableMagnitude(token: ResolvedToken, rootFontSize: number): number {
    switch (token.$type) {
        case "dimension":
            if (token.$value.unit === "rem") return token.$value.value * rootFontSize;
            if (token.$value.unit === "px") return token.$value.value;
            return Infinity;
        case "duration":
            return token.$value.unit === "s" ? token.$value.value * 1000 : token.$value.value;
        case "number":
        case "fontWeight":
            return token.$value;
        case "color":
            return Infinity; // colors are not sortable by magnitude
    }
}

export function resolveConfig(config: Config): ResolvedConfig {
	const resolvedTokens: Record<string, ResolvedGroup> = {};

	for (const [groupName, group] of Object.entries(config.tokens)) {
		let raw: GeneratorOutput = {};

		const { generator, params } = group.$config;

		switch (generator) {
			case "steps": raw = generateSteps<typeof group.$type>(params ?? {}, config.core); break;
			case "range": raw = generateRange(params ?? {}); break;
			case "map":   raw = generateMap<typeof group.$type>(params ?? { values: {} }); break;
			case "palette": raw = generateColor(params); break;
		}

		const tokens: Record<string, ResolvedToken> = {};

		for (const [key, value] of Object.entries(raw)) {
			validateTokenValue(group.$type, value);
			
			const tokenName = formatTokenKey(key);
			const tokenType = group.$type;
			const tokenValue = value;
			const tokenDescription = formatTokenDescription(groupName, key, value);
			const tokenExtensions = group.$extensions;

			tokens[tokenName] = {
				$type: tokenType,
				$value: tokenValue,
				$description: tokenDescription,
				$extensions: tokenExtensions
			} as ResolvedToken;
		}

		const ordered = Object.entries(tokens).sort(
			([, a], [, b]) => toSortableMagnitude(a, config.core.rootFontSize) - toSortableMagnitude(b, config.core.rootFontSize)
		);

		ordered.forEach(([, token], index) => {
			token.$extensions = {
				...token.$extensions,
				"org.enfantterrible.order": index
			};
		});

		resolvedTokens[groupName] = {
			$description: group.$description,
			$extensions: group.$extensions,
			tokens
		};
	}

	return {
		core: config.core,
		tokens: resolvedTokens
	};
}

export type { ResolvedConfig };
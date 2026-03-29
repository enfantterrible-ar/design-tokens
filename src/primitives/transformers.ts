import { ResolvedConfig } from './resolver';

type DTCGToken = {
    $type: string;
    $value: unknown;
    $description?: string;
    $extensions?: Record<string, unknown>;
};

type DTCGGroup = {
    $description?: string;
    $extensions?: Record<string, unknown>;
    [tokenName: string]: DTCGToken | string | Record<string, unknown> | undefined;
};

type DTCGOutput = {
    primitives: Record<string, DTCGGroup>;
};

export function toDTCG(resolved: ResolvedConfig): DTCGOutput {
    const primitives: Record<string, DTCGGroup> = {};

    for (const [groupName, group] of Object.entries(resolved.tokens)) {
        const { tokens, ...meta } = group;
        primitives[groupName] = { ...meta, ...tokens };
    }

    return { primitives };
}
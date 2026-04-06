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
    [tokenName: string]: DTCGToken | string | Record<string, unknown> | DTCGGroup | undefined;
};

type DTCGOutput = {
    primitives: Record<string, DTCGGroup>;
};

function setNestedPath(obj: Record<string, any>, path: string[], value: any) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        const part = path[i];
        if (!current[part]) {
            current[part] = {};
        }
        current = current[part];
    }
    current[path[path.length - 1]] = value;
}

export function toDTCG(resolved: ResolvedConfig): DTCGOutput {
    const primitives: Record<string, DTCGGroup> = {};

    for (const [groupName, group] of Object.entries(resolved.tokens)) {
        const { tokens, ...meta } = group;
        
        primitives[groupName] = { ...meta } as DTCGGroup;

        for (const [tokenKey, tokenData] of Object.entries(tokens)) {
            // Constrain the deep nesting exclusively to color tokens
            if (groupName === 'color' || groupName === 'colors') {
                const pathParts = tokenKey.split('-');
                setNestedPath(primitives[groupName], pathParts, tokenData);
            } else {
                // Leave flat tokens (like px-1) exactly as they are
                primitives[groupName][tokenKey] = tokenData as DTCGToken;
            }
        }
    }

    return { primitives };
}
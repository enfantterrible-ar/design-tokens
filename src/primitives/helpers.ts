import fs from 'fs';
import stringify from 'json-stable-stringify';
import path from 'path';

// ============================================================
// DESCRIPTION FORMATTER
// ============================================================

function formatTokenDescription(groupName: string, key: string, value: unknown): string {
    const base = groupName.charAt(0).toUpperCase() + groupName.slice(1);
    if (typeof value === "object" && value !== null && "value" in value) {
        const v = value as any;
        return `${base} scale - ${v.value}${v.unit}`;
    }
    return `${base} ${key}`;
}

function formatTokenKey(key: string): string {
    let result = key;

    if (result.includes(".")) {

        result = result.replace(/\./g, "p");
        // console.log(result);
    }

    return result;
}

function getOrder(value: unknown): number {
    if (
        typeof value === 'object' &&
        value !== null &&
        '$extensions' in value &&
        typeof (value as any).$extensions === 'object' &&
        (value as any).$extensions !== null &&
        'org.enfantterrible.order' in (value as any).$extensions
    ) {
        return (value as any).$extensions['org.enfantterrible.order'] as number;
    }
    return Infinity;
}

function saveTokens(dtcg: Record<string, unknown>, outputPath: string): void {
    const fullPath = path.resolve(process.cwd(), outputPath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const output = stringify(dtcg, {
        cmp: (a, b) => {
            const orderA = getOrder(a.value);
            const orderB = getOrder(b.value);
            if (orderA !== Infinity || orderB !== Infinity) {
                return orderA - orderB;
            }
            return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
        },
        space: 2
    });

    fs.writeFileSync(fullPath, output );
    console.log(`Tokens saved → ${fullPath}`);
}

export { formatTokenDescription, formatTokenKey, saveTokens };
import { readdir } from 'fs/promises';
import { join, relative } from 'path';

/**
 * Recursively collects all file paths under a target directory,
 * returning paths relative to project root (prefixed with "./").
 */
export const getPathsFromRoot = async (targetDir: string): Promise<string[]> => {
  const projectRoot = process.cwd();
  const absoluteTargetDir = join(projectRoot, targetDir);

  const walk = async (dir: string): Promise<string[]> => {
    const entries = await readdir(dir, { withFileTypes: true });

    const results: string[] = [];

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        const nested = await walk(fullPath);
        results.push(...nested);
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
      // symlinks or others are ignored intentionally
    }

    return results;
  };

  const absolutePaths = await walk(absoluteTargetDir);

  return absolutePaths.map((fullPath) => {
    const relPath = relative(projectRoot, fullPath);
    return relPath.startsWith('.') ? relPath : `./${relPath}`;
  });
};
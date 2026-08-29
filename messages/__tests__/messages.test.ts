import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import en from '../en.json';
import vi from '../vi.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [prefix + key] : flatten(value, `${prefix}${key}.`),
  );
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' || entry.name.startsWith('.') ? [] : walk(path);
    }
    return ['.ts', '.tsx'].includes(extname(entry.name)) ? [path] : [];
  });
}

const enKeys = new Set(flatten(en as Tree));
const viKeys = new Set(flatten(vi as Tree));

describe('message catalogues', () => {
  it('define exactly the same keys in both locales', () => {
    expect([...enKeys].filter((key) => !viKeys.has(key))).toEqual([]);
    expect([...viKeys].filter((key) => !enKeys.has(key))).toEqual([]);
  });

  it('has no empty strings', () => {
    const empty = [...enKeys, ...viKeys].filter((key) => {
      const read = (tree: Tree) =>
        key
          .split('.')
          .reduce<string | Tree | undefined>(
            (node, part) => (typeof node === 'object' ? node[part] : undefined),
            tree,
          );
      return read(en as Tree) === '' || read(vi as Tree) === '';
    });
    expect(empty).toEqual([]);
  });
});

/**
 * Catches the failure that is otherwise invisible until a component renders:
 * a t('...') call whose key was never added to the catalogues. next-intl logs
 * this to the console and renders the raw key, so it ships silently.
 */
describe('translation calls in source', () => {
  const namespaceDecl =
    /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(\s*(?:'([\w.]+)'|\{[^}]*namespace:\s*'([\w.]+)'[^}]*\})\s*\)/g;

  const files = [...walk('app'), ...walk('components')].filter(
    (file) => !file.includes('__tests__'),
  );

  it('only references keys that exist in both locales', () => {
    const missing: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      const namespaces = new Map<string, string>();

      for (const match of source.matchAll(namespaceDecl)) {
        namespaces.set(match[1]!, (match[2] ?? match[3])!);
      }
      if (namespaces.size === 0) continue;

      for (const [variable, namespace] of namespaces) {
        // One name per namespace per file: a repeated `t` across two functions
        // would resolve to whichever was declared last. Keeping the names
        // distinct is clearer to read anyway.
        // Template-literal keys (`suggestions.${k}`) cannot be checked statically.
        const call = new RegExp(`\\b${variable}\\(\\s*'([\\w.]+)'`, 'g');
        for (const match of source.matchAll(call)) {
          const key = `${namespace}.${match[1]}`;
          if (!enKeys.has(key)) missing.push(`${file}: en is missing ${key}`);
          if (!viKeys.has(key)) missing.push(`${file}: vi is missing ${key}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});

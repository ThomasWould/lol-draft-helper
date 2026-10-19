import catalog from "../data/runes.json" with { type: "json" };
import { normalizeLoose } from "../draft";

export function parseRuneLine(line: string) {
  const separator = line.indexOf(":");
  return {
    tree: line.slice(0, separator).trim(),
    names: line
      .slice(separator + 1)
      .split(/[/|]/)
      .map((name) => name.trim())
      .filter(Boolean),
  };
}
export function findRune(name: string) {
  return catalog.runes.find(
    (rune) => normalizeLoose(rune.name) === normalizeLoose(name),
  );
}

/** Validate the selected page, not prose or alternative-page suggestions. */
export function validateRunePage(lines: string[]) {
  const errors: string[] = [];
  const pages = lines
    .filter((line) => !line.startsWith("Shards:"))
    .map(parseRuneLine);
  if (pages.length !== 2 || pages[0].tree === pages[1].tree)
    return ["Choose two distinct rune trees."];
  pages.forEach((page, index) => {
    const expected = index === 0 ? 4 : 2;
    if (page.names.length !== expected)
      errors.push(`${page.tree}: expected ${expected} runes.`);
    const slots = new Set<number>();
    page.names.forEach((name) => {
      const rune = findRune(name);
      if (!rune || rune.tree !== page.tree) {
        errors.push(`Unknown rune or incorrect tree: ${name}`);
        return;
      }
      if (slots.has(rune.slot))
        errors.push(`Duplicate slot in ${page.tree}: ${name}`);
      if (index === 1 && rune.slot === 0)
        errors.push("Secondary tree cannot contain a keystone.");
      slots.add(rune.slot);
    });
    if (index === 0 && !slots.has(0))
      errors.push("Primary tree needs a keystone.");
  });
  return errors;
}

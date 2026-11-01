/** Lightweight language guess from pasted code (no network). */
export function detectSnippetLanguage(content: string): string {
  const sample = content.trim().slice(0, 1200);
  if (!sample) return "text";

  if (/^\s*[\[{]/.test(sample) && /"\w+"\s*:/.test(sample)) return "json";
  if (/^#!\/usr\/bin\/env (python|bash)/m.test(sample)) {
    return sample.includes("python") ? "python" : "bash";
  }
  if (/^(import|export|interface|type|const|function|async)\s/m.test(sample)) return "typescript";
  if (/^<\?php|^namespace\s/m.test(sample)) return "php";
  if (/^(def |class |import |from \w+ import)/m.test(sample)) return "python";
  if (/^(package |func |import \")/m.test(sample)) return "go";
  if (/^(use |fn |let mut |pub fn)/m.test(sample)) return "rust";
  if (/^\s*(SELECT|INSERT|UPDATE|CREATE TABLE)\s/im.test(sample)) return "sql";
  if (/^(\s*)?(<!DOCTYPE|<html|<div)/im.test(sample)) return "html";
  if (/^(\s*)?\{[\s\S]*\}/m.test(sample) && sample.includes(":")) return "css";
  return "text";
}

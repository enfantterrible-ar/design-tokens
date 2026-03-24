// // /**
// //  * to-tokenstudio.js
// //  *
// //  * Transforms a DTCG 2025.10 token tree into a Token Studio-compatible shape.
// //  *
// //  * Type mapping:
// //  *
// //  *   DTCG              → Token Studio
// //  *   ─────────────────────────────────────────────────────────────────
// //  *   color (object)    → color — hex string or rgba() for alpha < 1
// //  *   dimension (obj)   → spacing | borderRadius | borderWidth | fontSizes
// //  *                       inferred from token path, falls back to "dimension"
// //  *   fontFamily        → fontFamilies — string or joined array
// //  *   fontWeight        → fontWeights
// //  *   number            → number (unchanged)
// //  *   shadow (object)   → exploded into flat sub-tokens (Free plan compat)
// //  *                       shadow.md → shadow.md.x, .y, .blur, .spread, .color
// //  *   string            → string (unchanged)
// //  *
// //  * References like "{Primitives.color.grey.50}" pass through untouched.
// //  */

// // // ---------------------------------------------------------------------------
// // // Color
// // // ---------------------------------------------------------------------------

// // function colorToString(value) {
// //   if (typeof value === "string") return value;

// //   const components = value?.components ?? [0, 0, 0];
// //   const alpha = value?.alpha ?? 1;
// //   const [r, g, b] = components.map((c) => Math.round(c * 255));

// //   if (alpha < 1) return `rgba(${r},${g},${b},${alpha})`;
// //   if (value?.hex) return value.hex;

// //   const h = (n) => n.toString(16).padStart(2, "0");
// //   return `#${h(r)}${h(g)}${h(b)}`;
// // }

// // // ---------------------------------------------------------------------------
// // // Dimension
// // // ---------------------------------------------------------------------------

// // const DIMENSION_TYPE_MAP = [
// //   { match: (path) => path.includes("spacing"),       type: "spacing" },
// //   { match: (path) => path.includes("border-radius"), type: "borderRadius" },
// //   { match: (path) => path.includes("border-width"),  type: "borderWidth" },
// //   { match: (path) => path.includes("font-size"),     type: "fontSizes" },
// // ];

// // function dimensionToTS(value, path) {
// //   const tsType = DIMENSION_TYPE_MAP.find((m) => m.match(path))?.type ?? "dimension";
// //   if (typeof value === "string") return { tsType, value };
// //   const scalar = typeof value?.value === "number" ? value.value : parseFloat(value);
// //   return { tsType, value: scalar };
// // }

// // // ---------------------------------------------------------------------------
// // // Shadow — explode composite into flat sub-tokens
// // //
// // // Input (DTCG):
// // //   "md": { "$type": "shadow", "$value": { color, offsetX, offsetY, blur, spread } }
// // //
// // // Output (Token Studio Free):
// // //   "md": {
// // //     "color":  { "$type": "color",  "$value": "rgba(...)" },
// // //     "x":      { "$type": "number", "$value": 0 },
// // //     "y":      { "$type": "number", "$value": 4 },
// // //     "blur":   { "$type": "number", "$value": 8 },
// // //     "spread": { "$type": "number", "$value": -2 },
// // //     "inset":  { "$type": "number", "$value": 0 }   // 1 if inset
// // //   }
// // // ---------------------------------------------------------------------------

// // function shadowToTS(value) {
// //   const toShadowObject = (v) => ({
// //     x:      String(v.offsetX?.value ?? 0),
// //     y:      String(v.offsetY?.value ?? 0),
// //     blur:   String(v.blur?.value    ?? 0),
// //     spread: String(v.spread?.value  ?? 0),
// //     color:  colorToString(v.color),
// //     type:   v.inset ? "innerShadow" : "dropShadow",
// //   });

// //   if (Array.isArray(value)) return value.map(toShadowObject);
// //   return toShadowObject(value);
// // }

// // // ---------------------------------------------------------------------------
// // // Typography composite value resolver
// // // Token Studio cannot reliably resolve references inside composite $value
// // // objects when applying to Figma — fontSize especially errors with NaN.
// // // Solution: resolve fontSize references to their actual "Npx" string values
// // // at transform time. Other properties pass through as references.
// // // ---------------------------------------------------------------------------

// // // Built at transform time from the merged DTCG tree
// // let _typographyIndex = {};

// // function buildTypographyIndex(tree) {
// //   try {
// //     const scale = tree?.Typography?.scale ?? {};

// //     // font-size → "51px"
// //     for (const [key, token] of Object.entries(scale["font-size"] ?? {})) {
// //       if (token.$value) {
// //         const v = typeof token.$value === "object" ? token.$value.value : parseFloat(token.$value);
// //         _typographyIndex[`Typography.scale.font-size.${key}`] = `${v}px`;
// //       }
// //     }

// //     // font-family → "Inter" or "ui-monospace, ..."
// //     for (const [key, token] of Object.entries(scale["font-family"] ?? {})) {
// //       if (token.$value) {
// //         _typographyIndex[`Typography.scale.font-family.${key}`] = Array.isArray(token.$value)
// //           ? token.$value.join(", ")
// //           : token.$value;
// //       }
// //     }

// //     // font-weight → 700
// //     for (const [key, token] of Object.entries(scale["font-weight"] ?? {})) {
// //       if (token.$value !== undefined) {
// //         _typographyIndex[`Typography.scale.font-weight.${key}`] = token.$value;
// //       }
// //     }

// //     // line-height → "133.33%" (Token Studio needs string with unit, not decimal)
// //     for (const [key, token] of Object.entries(scale["line-height"] ?? {})) {
// //       if (token.$value !== undefined) {
// //         const pct = (token.$value * 100).toFixed(2) + "%";
// //         _typographyIndex[`Typography.scale.line-height.${key}`] = pct;
// //       }
// //     }

// //     // letter-spacing: DTCG dimension in em → convert to % for Token Studio/Figma
// //     for (const [key, token] of Object.entries(scale["letter-spacing"] ?? {})) {
// //       if (token.$value !== undefined) {
// //         const emVal = typeof token.$value === "object" ? token.$value.value : parseFloat(token.$value);
// //         _typographyIndex[`Typography.scale.letter-spacing.${key}`] = (emVal * 100).toFixed(2) + "%";
// //       }
// //     }
// //   } catch (e) { /* silent */ }
// // }

// // function resolveRef(value) {
// //   if (typeof value === "string" && value.startsWith("{") && value.endsWith("}")) {
// //     const key = value.slice(1, -1);
// //     return _typographyIndex[key] !== undefined ? _typographyIndex[key] : value;
// //   }
// //   return value;
// // }

// // function resolveTypographyValue(value) {
// //   // Token Studio requires ALL typography properties as strings
// //   const str = (v) => v === undefined ? "0" : String(v);
// //   return {
// //     fontFamily:       str(resolveRef(value.fontFamily)),
// //     fontWeight:       str(resolveRef(value.fontWeight)),
// //     fontSize:         str(resolveRef(value.fontSize)),
// //     lineHeight:       str(resolveRef(value.lineHeight)),
// //     letterSpacing:    str(resolveRef(value.letterSpacing)),
// //     paragraphSpacing: "0",
// //     paragraphIndent:  "0",
// //     textCase:         "none",
// //     textDecoration:   "none",
// //   };
// // }

// // // ---------------------------------------------------------------------------
// // // Core transform
// // // ---------------------------------------------------------------------------

// // function transformNode(node, path = "") {
// //   // Leaf token — has $type and $value
// //   if ("$type" in node && "$value" in node) {
// //     const { $type, $value, $description, ...rest } = node;

// //     switch ($type) {
// //       case "color":
// //         return { ...rest, $type: "color", $value: colorToString($value), ...($description && { $description }) };

// //       case "dimension": {
// //         // letter-spacing uses em in DTCG source → convert to % for Token Studio
// //         if (path.includes("letter-spacing")) {
// //           const emVal = typeof $value === "object" ? $value.value : parseFloat($value);
// //           const pct = (emVal * 100).toFixed(2) + "%";
// //           return { ...rest, $type: "letterSpacing", $value: pct, ...($description && { $description }) };
// //         }
// //         const { tsType, value } = dimensionToTS($value, path);
// //         // fontSizes must be strings with unit so typography composites resolve correctly
// //         const finalValue = tsType === "fontSizes" ? `${value}px` : value;
// //         return { ...rest, $type: tsType, $value: finalValue, ...($description && { $description }) };
// //       }

// //       case "fontFamily":
// //         return {
// //           ...rest,
// //           $type: "fontFamilies",
// //           $value: Array.isArray($value) ? $value.join(", ") : $value,
// //           ...($description && { $description }),
// //         };

// //       case "fontWeight":
// //         return { ...rest, $type: "fontWeights", $value, ...($description && { $description }) };

// //       case "letterSpacing":
// //         return { ...rest, $type: "letterSpacing", $value, ...($description && { $description }) };

// //       case "typography":
// //         return {
// //           ...rest,
// //           $type: "typography",
// //           $value: resolveTypographyValue($value),
// //           ...($description && { $description }),
// //         };

// //       case "number":
// //         if (path.includes("line-height")) {
// //           const lhPct = ($value * 100).toFixed(2) + "%";
// //           return { ...rest, $type: "lineHeights", $value: lhPct, ...($description && { $description }) };
// //         }
// //         if (path.includes("opacity")) {
// //           return { ...rest, $type: "opacity", $value, ...($description && { $description }) };
// //         }
// //         return { ...rest, $type: "number", $value, ...($description && { $description }) };

// //       case "shadow":
// //         return { ...rest, $type: "boxShadow", $value: shadowToTS($value), ...($description && { $description }) };

// //       case "string":
// //       default:
// //         return { ...rest, $type, $value, ...($description && { $description }) };
// //     }
// //   }

// //   // Group node - recurse
// //   // Strip $description from groups - Token Studio misreads it as a token
// //   // property and silently fails to load the group.
// //   const result = {};
// //   for (const [key, val] of Object.entries(node)) {
// //     if (key === "$description") continue;
// //     if (key.startsWith("$")) {
// //       result[key] = val;
// //     } else {
// //       result[key] = transformNode(val, path ? `${path}.${key}` : key);
// //     }
// //   }
// //   return result;
// // }

// // /**
// //  * @param {object} dtcgTree - merged DTCG 2025.10 token tree
// //  * @returns {object} Token Studio Free-compatible token tree
// //  */
// // export function toTokenStudio(dtcgTree) {
// //   buildTypographyIndex(dtcgTree);
// //   return transformNode(dtcgTree);
// // }

// /**
//  * to-tokenstudio.js
//  *
//  * Transforms a DTCG 2025.10 token tree into a Token Studio-compatible shape.
//  *
//  * Type mapping:
//  *
//  *   DTCG              → Token Studio
//  *   ─────────────────────────────────────────────────────────────────
//  *   color (object)    → color — hex string or rgba() for alpha < 1
//  *   dimension (obj)   → spacing | borderRadius | borderWidth | fontSizes
//  *                       inferred from token path, falls back to "dimension"
//  *   fontFamily        → fontFamilies — string or joined array
//  *   fontWeight        → fontWeights
//  *   number            → number (unchanged)
//  *   shadow (object)   → exploded into flat sub-tokens (Free plan compat)
//  *                       shadow.md → shadow.md.x, .y, .blur, .spread, .color
//  *   string            → string (unchanged)
//  *
//  * References like "{Primitives.color.grey.50}" pass through untouched.
//  */

// // ---------------------------------------------------------------------------
// // Color
// // ---------------------------------------------------------------------------

// function colorToString(value) {
//   if (typeof value === "string") return value;

//   const components = value?.components ?? [0, 0, 0];
//   const alpha = value?.alpha ?? 1;
//   const [r, g, b] = components.map((c) => Math.round(c * 255));

//   if (alpha < 1) return `rgba(${r},${g},${b},${alpha})`;
//   if (value?.hex) return value.hex;

//   const h = (n) => n.toString(16).padStart(2, "0");
//   return `#${h(r)}${h(g)}${h(b)}`;
// }

// // ---------------------------------------------------------------------------
// // Dimension
// // ---------------------------------------------------------------------------

// const DIMENSION_TYPE_MAP = [
//   { match: (path) => path.includes("spacing"),       type: "spacing" },
//   { match: (path) => path.includes("border-radius"), type: "borderRadius" },
//   { match: (path) => path.includes("border-width"),  type: "borderWidth" },
//   { match: (path) => path.includes("font-size"),     type: "fontSizes" },
// ];

// function dimensionToTS(value, path) {
//   const tsType = DIMENSION_TYPE_MAP.find((m) => m.match(path))?.type ?? "dimension";
//   if (typeof value === "string") return { tsType, value };
//   const scalar = typeof value?.value === "number" ? value.value : parseFloat(value);
//   return { tsType, value: scalar };
// }

// // ---------------------------------------------------------------------------
// // Shadow — explode composite into flat sub-tokens
// //
// // Input (DTCG):
// //   "md": { "$type": "shadow", "$value": { color, offsetX, offsetY, blur, spread } }
// //
// // Output (Token Studio Free):
// //   "md": {
// //     "color":  { "$type": "color",  "$value": "rgba(...)" },
// //     "x":      { "$type": "number", "$value": 0 },
// //     "y":      { "$type": "number", "$value": 4 },
// //     "blur":   { "$type": "number", "$value": 8 },
// //     "spread": { "$type": "number", "$value": -2 },
// //     "inset":  { "$type": "number", "$value": 0 }   // 1 if inset
// //   }
// // ---------------------------------------------------------------------------

// function shadowToTS(value) {
//   const toShadowObject = (v) => ({
//     x:      String(v.offsetX?.value ?? 0),
//     y:      String(v.offsetY?.value ?? 0),
//     blur:   String(v.blur?.value    ?? 0),
//     spread: String(v.spread?.value  ?? 0),
//     color:  colorToString(v.color),
//     type:   v.inset ? "innerShadow" : "dropShadow",
//   });

//   if (Array.isArray(value)) return value.map(toShadowObject);
//   return toShadowObject(value);
// }


// // ---------------------------------------------------------------------------
// // Core transform
// // ---------------------------------------------------------------------------

// function transformNode(node, path = "") {
//   // Leaf token — has $type and $value
//   if ("$type" in node && "$value" in node) {
//     const { $type, $value, $description, ...rest } = node;

//     switch ($type) {
//       case "color":
//         return { ...rest, $type: "color", $value: colorToString($value), ...($description && { $description }) };

//       case "dimension": {
//         // letter-spacing uses em in DTCG source → convert to % for Token Studio
//         if (path.includes("letter-spacing")) {
//           const emVal = typeof $value === "object" ? $value.value : parseFloat($value);
//           const pct = (emVal * 100).toFixed(2) + "%";
//           return { ...rest, $type: "letterSpacing", $value: pct, ...($description && { $description }) };
//         }
//         const { tsType, value } = dimensionToTS($value, path);
//         // fontSizes must be strings with unit so typography composites resolve correctly
//         const finalValue = tsType === "fontSizes" ? `${value}px` : value;
//         return { ...rest, $type: tsType, $value: finalValue, ...($description && { $description }) };
//       }

//       case "fontFamily":
//         return {
//           ...rest,
//           $type: "fontFamilies",
//           $value: Array.isArray($value) ? $value.join(", ") : $value,
//           ...($description && { $description }),
//         };

//       case "fontWeight":
//         return { ...rest, $type: "fontWeights", $value, ...($description && { $description }) };

//       case "letterSpacing":
//         return { ...rest, $type: "letterSpacing", $value, ...($description && { $description }) };

//       case "typography":
//         // Token Studio resolves references internally — pass through as-is
//         // All string conversion happens when the referenced tokens are transformed
//         return { ...rest, $type: "typography", $value, ...($description && { $description }) };

//       case "number":
//         if (path.includes("line-height")) {
//           const lhPct = ($value * 100).toFixed(2) + "%";
//           return { ...rest, $type: "lineHeights", $value: lhPct, ...($description && { $description }) };
//         }
//         if (path.includes("opacity")) {
//           return { ...rest, $type: "opacity", $value, ...($description && { $description }) };
//         }
//         return { ...rest, $type: "number", $value, ...($description && { $description }) };

//       case "shadow":
//         return { ...rest, $type: "boxShadow", $value: shadowToTS($value), ...($description && { $description }) };

//       case "string":
//       default:
//         return { ...rest, $type, $value, ...($description && { $description }) };
//     }
//   }

//   // Group node - recurse
//   // Strip $description from groups - Token Studio misreads it as a token
//   // property and silently fails to load the group.
//   const result = {};
//   for (const [key, val] of Object.entries(node)) {
//     if (key === "$description") continue;
//     if (key.startsWith("$")) {
//       result[key] = val;
//     } else {
//       result[key] = transformNode(val, path ? `${path}.${key}` : key);
//     }
//   }
//   return result;
// }

// /**
//  * @param {object} dtcgTree - merged DTCG 2025.10 token tree
//  * @returns {object} Token Studio Free-compatible token tree
//  */
// export function toTokenStudio(dtcgTree) {
//   return transformNode(dtcgTree);
// }

// /**
//  * to-tokenstudio.js
//  *
//  * Transforms a DTCG 2025.10 token tree into a Token Studio-compatible shape.
//  *
//  * Type mapping:
//  *
//  *   DTCG              → Token Studio
//  *   ─────────────────────────────────────────────────────────────────
//  *   color (object)    → color — hex string or rgba() for alpha < 1
//  *   dimension (obj)   → spacing | borderRadius | borderWidth | fontSizes
//  *                       inferred from token path, falls back to "dimension"
//  *   fontFamily        → fontFamilies — string or joined array
//  *   fontWeight        → fontWeights
//  *   number            → number (unchanged)
//  *   shadow (object)   → exploded into flat sub-tokens (Free plan compat)
//  *                       shadow.md → shadow.md.x, .y, .blur, .spread, .color
//  *   string            → string (unchanged)
//  *
//  * References like "{Primitives.color.grey.50}" pass through untouched.
//  */

// // ---------------------------------------------------------------------------
// // Color
// // ---------------------------------------------------------------------------

// function colorToString(value) {
//   if (typeof value === "string") return value;

//   const components = value?.components ?? [0, 0, 0];
//   const alpha = value?.alpha ?? 1;
//   const [r, g, b] = components.map((c) => Math.round(c * 255));

//   if (alpha < 1) return `rgba(${r},${g},${b},${alpha})`;
//   if (value?.hex) return value.hex;

//   const h = (n) => n.toString(16).padStart(2, "0");
//   return `#${h(r)}${h(g)}${h(b)}`;
// }

// // ---------------------------------------------------------------------------
// // Dimension
// // ---------------------------------------------------------------------------

// const DIMENSION_TYPE_MAP = [
//   { match: (path) => path.includes("spacing"),       type: "spacing" },
//   { match: (path) => path.includes("border-radius"), type: "borderRadius" },
//   { match: (path) => path.includes("border-width"),  type: "borderWidth" },
//   { match: (path) => path.includes("font-size"),     type: "fontSizes" },
// ];

// function dimensionToTS(value, path) {
//   const tsType = DIMENSION_TYPE_MAP.find((m) => m.match(path))?.type ?? "dimension";
//   if (typeof value === "string") return { tsType, value };
//   const scalar = typeof value?.value === "number" ? value.value : parseFloat(value);
//   return { tsType, value: scalar };
// }

// // ---------------------------------------------------------------------------
// // Shadow — explode composite into flat sub-tokens
// //
// // Input (DTCG):
// //   "md": { "$type": "shadow", "$value": { color, offsetX, offsetY, blur, spread } }
// //
// // Output (Token Studio Free):
// //   "md": {
// //     "color":  { "$type": "color",  "$value": "rgba(...)" },
// //     "x":      { "$type": "number", "$value": 0 },
// //     "y":      { "$type": "number", "$value": 4 },
// //     "blur":   { "$type": "number", "$value": 8 },
// //     "spread": { "$type": "number", "$value": -2 },
// //     "inset":  { "$type": "number", "$value": 0 }   // 1 if inset
// //   }
// // ---------------------------------------------------------------------------

// function shadowToTS(value) {
//   const toShadowObject = (v) => ({
//     x:      String(v.offsetX?.value ?? 0),
//     y:      String(v.offsetY?.value ?? 0),
//     blur:   String(v.blur?.value    ?? 0),
//     spread: String(v.spread?.value  ?? 0),
//     color:  colorToString(v.color),
//     type:   v.inset ? "innerShadow" : "dropShadow",
//   });

//   if (Array.isArray(value)) return value.map(toShadowObject);
//   return toShadowObject(value);
// }


// // ---------------------------------------------------------------------------
// // Core transform
// // ---------------------------------------------------------------------------

// function transformNode(node, path = "") {
//   // Leaf token — has $type and $value
//   if ("$type" in node && "$value" in node) {
//     const { $type, $value, $description, ...rest } = node;

//     switch ($type) {
//       case "color":
//         return { ...rest, $type: "color", $value: colorToString($value), ...($description && { $description }) };

//       case "dimension": {
//         // letter-spacing uses em in DTCG source → convert to % for Token Studio
//         if (path.includes("letter-spacing")) {
//           const emVal = typeof $value === "object" ? $value.value : parseFloat($value);
//           const pct = (emVal * 100).toFixed(2) + "%";
//           return { ...rest, $type: "letterSpacing", $value: pct, ...($description && { $description }) };
//         }
//         const { tsType, value } = dimensionToTS($value, path);
//         // fontSizes must be strings with unit so typography composites resolve correctly
//         const finalValue = tsType === "fontSizes" ? `${value}px` : value;
//         return { ...rest, $type: tsType, $value: finalValue, ...($description && { $description }) };
//       }

//       case "fontFamily":
//         return {
//           ...rest,
//           $type: "fontFamilies",
//           $value: Array.isArray($value) ? $value.join(", ") : $value,
//           ...($description && { $description }),
//         };

//       case "fontWeight":
//         return { ...rest, $type: "fontWeights", $value, ...($description && { $description }) };

//       case "letterSpacing":
//         return { ...rest, $type: "letterSpacing", $value, ...($description && { $description }) };

//       case "typography":
//         return { ...rest, $type: "typography", $value, ...($description && { $description }) };

//       case "number":
//         if (path.includes("line-height")) {
//           const lhPct = ($value * 100).toFixed(2) + "%";
//           return { ...rest, $type: "lineHeights", $value: lhPct, ...($description && { $description }) };
//         }
//         if (path.includes("opacity")) {
//           return { ...rest, $type: "opacity", $value, ...($description && { $description }) };
//         }
//         return { ...rest, $type: "number", $value, ...($description && { $description }) };

//       case "shadow":
//         return { ...rest, $type: "boxShadow", $value: shadowToTS($value), ...($description && { $description }) };

//       case "string":
//       default:
//         return { ...rest, $type, $value, ...($description && { $description }) };
//     }
//   }

//   // Group node - recurse
//   // Strip $description from groups - Token Studio misreads it as a token
//   // property and silently fails to load the group.
//   const result = {};
//   for (const [key, val] of Object.entries(node)) {
//     if (key === "$description") continue;
//     if (key.startsWith("$")) {
//       result[key] = val;
//     } else {
//       result[key] = transformNode(val, path ? `${path}.${key}` : key);
//     }
//   }
//   return result;
// }

// // ---------------------------------------------------------------------------
// // Root key → prefix flattener
// //
// // Token Studio treats each root key as a separate set.
// // References across root keys don't resolve within a single imported file.
// //
// // Solution: flatten all root keys into a single flat set using lowercase
// // prefixes as group names.
// //
// // Primitives.color.red.50   → primitive.color.red.50
// // Semantics.surface.page    → semantic.surface.page
// // Typography.scale.font-size.6 → typography.scale.font-size.6
// //
// // References are also rewritten to match the new paths.
// // ---------------------------------------------------------------------------

// // ---------------------------------------------------------------------------
// // Single set wrapper
// //
// // Token Studio treats each root key as a separate set.
// // Solution: wrap everything under a single root key "et".
// //
// // Primitives.color.red.50      → et.primitive.color.red.50
// // Semantics.surface.page       → et.semantic.surface.page
// // Typography.scale.font-size.6 → et.typography.scale.font-size.6
// //
// // References are rewritten to match the new paths.
// // ---------------------------------------------------------------------------

// const SET_NAME = "et";

// const ROOT_PREFIX_MAP = {
//   "Primitives": "primitive",
//   "Semantics":  "semantic",
//   "Typography": "typography",
// };

// function wrapInSingleSet(tree) {
//   const roots = Object.keys(tree);

//   // Rewrite all references: {Primitives.color.red.50} → {et.primitive.color.red.50}
//   const refPattern = new RegExp(
//     `\{(${roots.join("|")})\.(.*?)\}`,
//     "g"
//   );

//   let str = JSON.stringify(tree);
//   str = str.replace(refPattern, (_, root, rest) => {
//     const prefix = ROOT_PREFIX_MAP[root] ?? root.toLowerCase();
//     // No SET_NAME prefix in references — Token Studio strips the root key
//     return `{${prefix}.${rest}}`;
//   });
//   const rewritten = JSON.parse(str);

//   // Nest all collections under SET_NAME
//   const inner = {};
//   for (const [root, tokens] of Object.entries(rewritten)) {
//     const prefix = ROOT_PREFIX_MAP[root] ?? root.toLowerCase();
//     inner[prefix] = tokens;
//   }

//   return { [SET_NAME]: inner };
// }

// /**
//  * @param {object} dtcgTree - merged DTCG 2025.10 token tree
//  * @returns {object} Token Studio compatible token tree — single set
//  */
// export function toTokenStudio(dtcgTree) {
//   const wrapped = wrapInSingleSet(dtcgTree);
//   return transformNode(wrapped);
// }

/**
 * to-tokenstudio.js
 *
 * Transforms a DTCG 2025.10 token tree into a Token Studio-compatible shape.
 *
 * Type mapping:
 *
 *   DTCG              → Token Studio
 *   ─────────────────────────────────────────────────────────────────
 *   color (object)    → color — hex string or rgba() for alpha < 1
 *   dimension (obj)   → spacing | borderRadius | borderWidth | fontSizes
 *                       inferred from token path, falls back to "dimension"
 *   fontFamily        → fontFamilies — string or joined array
 *   fontWeight        → fontWeights
 *   number            → number (unchanged)
 *   shadow (object)   → boxShadow composite
 *   string            → string (unchanged)
 *
 * References: {Primitives.color.grey.50} → {color.grey.50}
 * Root key is stripped from all references so Token Studio resolves correctly.
 */

// ---------------------------------------------------------------------------
// Color
// ---------------------------------------------------------------------------

function colorToString(value) {
  if (typeof value === "string") return value;

  const components = value?.components ?? [0, 0, 0];
  const alpha = value?.alpha ?? 1;
  const [r, g, b] = components.map((c) => Math.round(c * 255));

  if (alpha < 1) return `rgba(${r},${g},${b},${alpha})`;
  if (value?.hex) return value.hex;

  const h = (n) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

// ---------------------------------------------------------------------------
// Dimension
// ---------------------------------------------------------------------------

const DIMENSION_TYPE_MAP = [
  { match: (path) => path.includes("spacing"),       type: "spacing" },
  { match: (path) => path.includes("border-radius"), type: "borderRadius" },
  { match: (path) => path.includes("border-width"),  type: "borderWidth" },
  { match: (path) => path.includes("font-size"),     type: "fontSizes" },
];

function dimensionToTS(value, path) {
  const tsType = DIMENSION_TYPE_MAP.find((m) => m.match(path))?.type ?? "dimension";
  if (typeof value === "string") return { tsType, value };
  const scalar = typeof value?.value === "number" ? value.value : parseFloat(value);
  return { tsType, value: scalar };
}

// ---------------------------------------------------------------------------
// Shadow
// ---------------------------------------------------------------------------

function shadowToTS(value) {
  const toShadowObject = (v) => ({
    x:      String(v.offsetX?.value ?? 0),
    y:      String(v.offsetY?.value ?? 0),
    blur:   String(v.blur?.value    ?? 0),
    spread: String(v.spread?.value  ?? 0),
    color:  colorToString(v.color),
    type:   v.inset ? "innerShadow" : "dropShadow",
  });

  if (Array.isArray(value)) return value.map(toShadowObject);
  return toShadowObject(value);
}

// ---------------------------------------------------------------------------
// Reference stripper
// Strips the root collection key from all references.
// {Primitives.color.grey.50} → {color.grey.50}
// {Typography.scale.font-size.6} → {scale.font-size.6}
// ---------------------------------------------------------------------------

function stripRootKeysFromRefs(tree) {
  const roots = Object.keys(tree);
  const pattern = new RegExp(
    `\\{(${roots.map(r => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|")})\\.(.*?)\\}`,
    "g"
  );
  const str = JSON.stringify(tree);
  const stripped = str.replace(pattern, (_, _root, rest) => `{${rest}}`);
  return JSON.parse(stripped);
}

// ---------------------------------------------------------------------------
// Core transform
// ---------------------------------------------------------------------------

function transformNode(node, path = "") {
  // Leaf token — has $type and $value
  if ("$type" in node && "$value" in node) {
    const { $type, $value, $description, ...rest } = node;

    switch ($type) {
      case "color":
        return { ...rest, $type: "color", $value: colorToString($value), ...($description && { $description }) };

      case "dimension": {
        // letter-spacing: em → % for Token Studio/Figma
        if (path.includes("letter-spacing")) {
          const emVal = typeof $value === "object" ? $value.value : parseFloat($value);
          const pct = (emVal * 100).toFixed(2) + "%";
          return { ...rest, $type: "letterSpacing", $value: pct, ...($description && { $description }) };
        }
        const { tsType, value } = dimensionToTS($value, path);
        const finalValue = tsType === "fontSizes" ? `${value}px` : value;
        return { ...rest, $type: tsType, $value: finalValue, ...($description && { $description }) };
      }

      case "fontFamily":
        return {
          ...rest,
          $type: "fontFamilies",
          $value: Array.isArray($value) ? $value.join(", ") : $value,
          ...($description && { $description }),
        };

      case "fontWeight":
        return { ...rest, $type: "fontWeights", $value, ...($description && { $description }) };

      case "letterSpacing":
        return { ...rest, $type: "letterSpacing", $value, ...($description && { $description }) };

      case "typography":
        return { ...rest, $type: "typography", $value, ...($description && { $description }) };

      case "number":
        if (path.includes("line-height")) {
          const lhPct = ($value * 100).toFixed(2) + "%";
          return { ...rest, $type: "lineHeights", $value: lhPct, ...($description && { $description }) };
        }
        if (path.includes("opacity")) {
          return { ...rest, $type: "opacity", $value, ...($description && { $description }) };
        }
        return { ...rest, $type: "number", $value, ...($description && { $description }) };

      case "shadow":
        return { ...rest, $type: "boxShadow", $value: shadowToTS($value), ...($description && { $description }) };

      case "string":
      default:
        return { ...rest, $type, $value, ...($description && { $description }) };
    }
  }

  // Group node — recurse, strip $description from groups
  const result = {};
  for (const [key, val] of Object.entries(node)) {
    if (key === "$description") continue;
    if (key.startsWith("$")) {
      result[key] = val;
    } else {
      result[key] = transformNode(val, path ? `${path}.${key}` : key);
    }
  }
  return result;
}

/**
 * @param {object} dtcgTree - merged DTCG 2025.10 token tree
 * @returns {object} Token Studio compatible token tree
 */
export function toTokenStudio(dtcgTree) {
  const stripped = stripRootKeysFromRefs(dtcgTree);
  return transformNode(stripped);
}
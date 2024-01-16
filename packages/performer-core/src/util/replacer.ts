export function traverse<T>(
	obj: T,
	replacer: (key: string, value: any, path: string) => any,
	path: string = ''
): T {
	if (obj !== null && typeof obj === 'object') {
		// The result needs to be typed as 'any' since we don't know its structure beforehand
		const result: any = Array.isArray(obj) ? [] : {};

		for (const key in obj) {
			if (Object.hasOwnProperty.call(obj, key)) {
				const newPath = path ? `${path}.${key}` : key;
				const value = replacer(key, (obj as any)[key], newPath);

				// Check if replacer returned undefined
				if (value !== undefined) {
					result[key] = traverse(value, replacer, newPath);
				}
			}
		}

		return result;
	} else {
		// For root-level non-object values, the key is an empty string
		const replacedValue = replacer('', obj, path);
		return replacedValue === undefined ? ({} as T) : replacedValue;
	}
}

export function replacerWithPath(replacer: Function) {
	let m = new Map();

	return function (this: any, field: string, value: any) {
		let path = m.get(this) + (Array.isArray(this) ? `[${field}]` : '.' + field);
		if (value === Object(value)) m.set(value, path);
		return replacer.call(this, field, value, path.replace(/undefined\.\.?/, ''));
	};
}

// https://stackoverflow.com/questions/61681176/json-stringify-replacer-how-to-get-full-path
// Explanation fo replacerWithPath decorator:
// > 'this' inside 'return function' point to field parent object
//   (JSON.stringify execute replacer like that)
// > 'path' contains path to current field based on parent ('this') path
//   previously saved in Map
// > during path generation we check is parent ('this') array or object
//   and chose: "[field]" or ".field"
// > in Map we store current 'path' for given 'field' only if it
//   is obj or arr in this way path to each parent is stored in Map.
//   We don't need to store path to simple types (number, bool, str,...)
//   because they never will have children
// > value===Object(value) -> is true if value is object or array
//   (more: https://stackoverflow.com/a/22482737/860099)
// > path for main object parent is set as 'undefined.' so we cut out that
//   prefix at the end ad call replacer with that path

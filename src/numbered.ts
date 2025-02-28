import { NamedString, StringContext } from './main'
import { Namer } from './namer';

export const getNames: Namer = async <K,>(strs: Map<K, StringContext>): Promise<Map<K, NamedString>> => {
	let count = 0;
	const name = (cntx: StringContext) => `var${count++}`;

	// Convert the map to an array of entries
  	const entries = Array.from(strs.entries());

  	// Process all entries in parallel
  	const transformedEntries =
    	entries.map(([key, value]) => [key, {
			name: name(value),
			...value
			}] as [K, NamedString]);

  	// Create a new map from the transformed entries
  	return new Map(transformedEntries);
};

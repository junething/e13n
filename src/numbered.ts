import { Namer } from './app';
import { NamedString, StringContext } from './main'

export const getNames: Namer = async <K,>(strs: [K, Promise<StringContext>][]): Promise<[K, Promise<NamedString>][]> => {

	let count = 0;
	const name = (cntx: StringContext) => `var${count++}`;

	// Convert the map to an array of entries

  	// Process all entries in parallel
	  let transformedEntries = [];
	  for (let [key, value] of strs) {
		  transformedEntries.push([
			  key,
			  Promise.resolve({
				  name: await name(await value),
				  ...value
			  })
		  ] as [K, Promise<NamedString>]);
	  }
  	// Create a new map from the transformed entries
  	return Promise.resolve(transformedEntries);
};

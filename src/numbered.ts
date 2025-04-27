import { Namer, Options, StringContext } from './app';
import { NamedString } from "./app";


export const namer: Namer = {
  name: 'numbered',
  preflight: async () => ({ good: true }),
  namer: factory
}

async function* factory<K,>(strings: AsyncGenerator<[K, StringContext]>, _options: Options): AsyncGenerator<[K, NamedString]> {
  let count = 0;
  const name = (_: StringContext) => `var${count++}`;
  for await (let [key, value] of strings) {
    yield [key, { name: name(value), ...value }];
  }
};

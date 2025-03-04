import { number, restPositionals, Type } from 'cmd-ts';
import * as fs from 'fs';
import { command, run, positional, option } from 'cmd-ts';
import { NamedString, processFile, StringContext } from './main';
import * as ai from "./ai"
import * as numbered from "./numbered"
import * as human from "./human"
import { parseIntStrict, Percentage, throwErr } from './lib';
import { fromFn } from 'cmd-ts/dist/cjs/type';

export type Path = string

const CheckedFile: Type<string, Path> = {
  from: async (str) => {
    if (!fs.existsSync(str)) {
      // Here is our error handling!
      throw new Error('File not found');
    }
    return str as Path;
  },
};

const namers: Record<string, Namer> = {
  ['numbered']: numbered.getNames,
  ['ai']: ai.getNames,
  ['human']: human.getNames,
}
const NamerArg: Type<string, Namer> = {
  defaultValue: () => namers['ai'],
  from: async (str: string) => str in namers ? namers[str] : throwErr(`No installed namer found '${str}'`)
};
const PercentageArg: Type<string, Percentage> = {
  from: async (str): Promise<Percentage> => {
    let num = parseIntStrict(str);
    return (num > 0 || num < 100) ? (num as Percentage) : throwErr(`No installed namer found '${str}'`);
  }
};
export type Namer = <K, >(strs: [K, Promise<StringContext>][], options: Options) => Promise<[K, Promise<NamedString>][]>;
export type Options = {
  namer: Namer,
  suggester?: Namer
  resourcePath: string[]
  linesOfContext: number,
  threshold: Percentage
}

const app = command({
  name: "JSTool",
  args: {
    files: restPositionals({ type: CheckedFile, displayName: 'file' }),
    linesOfContext: option({ type: number, short: 'l', long: 'lines-of-cntx', defaultValue: () => 3 }),
    threshold: option({ type: PercentageArg, short: 't', long: 'threshold', defaultValue: () => 50 as Percentage }),
    namer: option({ type: NamerArg, short: 'n', long: 'namer' }),
    suggester: option({ type: NamerArg, short: 's', long: 'suggester' }),
  },
  handler: async ({ files, namer, linesOfContext, threshold }) => {
    files.map(async file => {
      const resourcePath: string[] = [ file.split('.')[0] ];
      const { newSource, resourceData } = await processFile(file, {
        namer,
        resourcePath,
        linesOfContext,
        threshold
      });
      console.log(newSource);
      console.log(resourceData);
    })
  },
});
// parse arguments
run(app, process.argv.slice(2));

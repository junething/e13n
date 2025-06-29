#!/usr/bin/env node
import { number, restPositionals, Type, command, run, option, positional } from 'cmd-ts';
import { processFile } from './main';
import * as ai from "./ai"
import * as numbered from "./numbered"
import * as human from "./human"
import { parseIntStrict, Percentage, throwErr } from './lib';
import highlight from 'cli-highlight';
import * as fs from 'fs';
import color from 'colorts';

/* DEFAULTS */
const DEFAULT_LLM_THRESHOLD: Percentage = 60;
const DEFAULT_LINES_CNTX: number = 3;
const DEFAULT_ALLOWED_REENTRIES: number = 3;
const DEFAULT_NAMER: keyof typeof namers = "human";

export type Namer = {
  name: string,
  namer: NameGenerator,
  preflight: Preflight
}
export type NameGenerator = <K, >(strings: AsyncGenerator<[K, StringContext]>, options: Options) => AsyncGenerator<[K, NamedString]>

export type Preflight = () => Promise<PreflightResult>;
export type PreflightResult = {
  good: true
  warnings?: string[]
} | {
  good: false
  warnings?: string[]
  errors: string[],
}
export type Options = {
  // TODO: make this pipeline more configurable
  namer: Namer,
  suggester?: Namer
  resourcePath: string[]
  linesOfContext: number,
  threshold: Percentage,
  reentries: number
}
export type StringContext = {
  sugestion?: string,
  text: string,
  suroundingCode: CodeReference,
  moveConfidence?: number
}
export type NamedString = StringContext & { name: string | typeof Skip; };
export type SourceCode = {
  name: string,
  lines: string[]
}
export type CodeReference = {
  file: SourceCode,
  line: number,
  character: number,
  length: number
}
export type Path = string

export const CheckedFile: Type<string, Path> = {
  from: async (str) => {
    if (!fs.existsSync(str)) {
      throw new Error('File not found');
    }
    return str as Path;
  },
};
export const Skip = Symbol("Skip");

export const NamerArg: Type<string, Namer | undefined> = {
  from: async (str: string) => str in namers ? namers[str as keyof typeof namers] : throwErr(`No installed namer found '${str}'`)
};
export const PercentageArg: Type<string, Percentage> = {
  from: async (str): Promise<Percentage> => {
    let num = parseIntStrict(str);
    return (num > 0 || num < 100) ? (num as Percentage) : throwErr(`No installed namer found '${str}'`);
  }
};

export const namers = {
  ['numbered']: numbered.namer,
  ['ai']: ai.namer,
  ['human']: human.namer,
}
const app = command({
  name: "e13n",
  args: {
    firstFile: positional({ type: CheckedFile, displayName: 'file' }),
    restFiles: restPositionals({ type: CheckedFile, displayName: 'file' }),
    linesOfContext: option({ type: number, short: 'l', long: 'lines-of-cntx', defaultValue: () => DEFAULT_LINES_CNTX }),
    threshold: option({ type: PercentageArg, short: 't', long: 'threshold', defaultValue: () => DEFAULT_LLM_THRESHOLD }),
    reentries: option({ type: number, long: 'reentries', defaultValue: () => DEFAULT_ALLOWED_REENTRIES }),
    namer: option({ type: NamerArg, short: 'n', long: 'namer', defaultValue: () => namers[DEFAULT_NAMER] }),
    suggester: option({ type: NamerArg, short: 's', long: 'suggester', defaultValue: () => undefined }),
  },
  handler: async ({ firstFile, restFiles, namer: maybeNamer, suggester, linesOfContext, threshold, reentries }) => {
    let files = [firstFile].concat(restFiles);
    let namer = maybeNamer as Namer; // cmd-ts should know this?
    // run preflight tests and exit on fail, prints results
    await runPreflights(suggester != undefined ? [namer, suggester] : [namer]);
    for (let file of files) {
      namer = namer;
      const resourcePath: string[] = [file.split('.')[0]];
      console.log(`File: ${color(file).yellow}, Type: ${color(getFiletypeName(file)).yellow}`);
      const { newSource, resourceData } = await processFile(file, {
        namer,
        suggester,
        resourcePath,
        linesOfContext,
        threshold,
        reentries
      });
      console.log(highlight(newSource, { language: 'typescript' }));
      console.log(highlight(JSON.stringify(resourceData, null, 4), { language: 'json' }));
    }
  },
});
const runPreflights = async (namers: Namer[]) => {
  if (namers.length == 0) {
    return;
  }
  console.error('Running preflights')
  // Run all preflights in parallel, some may involve api requests 
  let preflights = await Promise.all(namers.map(async (namer) => (
    {
      namer,
      result: await namer.preflight()
    })));
  // Print results to stderr sequentially
  preflights.map(p => {
    console.error(`${p.namer.name}: ${p.result.good
      ? color("Pass").green.toString()
      : color("Fail").red.toString()}`);
    p.result.warnings?.map(w => console.error(`    \uFE0F⚠ ${color(w).yellow.dim.toString()}`));
    if (!p.result.good) {
      p.result.errors?.map(e => console.error(`    ❌ ${color(e).red.toString()}`));
    }
  });
  if (preflights.some(result => !result.result.good)) {
    console.error(color(`Preflight failed`).red.toString());
    process.exit(1);
  }
  console.error(color(`Preflight passed`).green.toString());
}
// Proper names of supported filetypes
const fileTypeNames: Record<string, string> = {
  'js': 'Javascript',
  'ts': 'Typescript',
  'jsx': 'JSX',
  'tsx': 'TSX',
}
const getFiletypeName = (file: string) => fileTypeNames[file.split('.').at(-1) ?? 0] ?? "Unknown";
/**
  * Catch exit signal (likely from ctrl-c) and exit nicely
  */
process.on('uncaughtException', (error) => {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    console.log('Exiting...');
    // TODO: handle exit gracefully, make sure files are in a valid state etc
  } else {
    // Rethrow unknown errors
    throw error;
  }
});

// app entry point
run(app, process.argv.slice(2));

import { Namer, Options, Preflight, PreflightResult, Skip, StringContext } from './app';
import { getCodeLines } from './main'
import { NamedString } from "./app";
import color from 'colorts';
import { input, rawlist, select } from '@inquirer/prompts';
import { highlight } from 'cli-highlight'
import { escapeRegExp, escapeRegExpReplacement } from './lib';
import * as tty from 'tty';

const prompt = "String name: "
const STRING_PLACEHOLD = '__STRING__PLACEHOLD__';
const STRING_PLACEHOLD_ESCAPED = escapeRegExpReplacement(STRING_PLACEHOLD)
export const namer: Namer = {
  name: 'human',
  preflight: async () => preflight(),
  namer: generator
}

async function* generator<K,>(strings: AsyncGenerator<[K, StringContext]>, options: Options): AsyncGenerator<[K, NamedString]> {
  const name = async (cntx: StringContext): Promise<string | typeof Skip> => {
    console.log(highlightContext(cntx, options));
    if (cntx.moveConfidence !== undefined && cntx.sugestion !== undefined) {
      const suggestSkip = (cntx.moveConfidence ?? 100) < options.threshold;
      const trimedText = cntx.text.slice(0, 70);
      const message = `"${trimedText}${trimedText.length < cntx.text.length ? '...' : ''}"`;
      const confidenceMsg = color(`${suggestSkip ? 100 - cntx.moveConfidence : cntx.moveConfidence}% confidence`).dim.toString();
      const action: 'accept' | 'skip' | 'change' | 'set' = cntx.sugestion ? await select({
        message,
        choices: suggestSkip ? [
          { name: `skip ${confidenceMsg}`, value: 'skip' },
          { name: cntx.sugestion, value: 'accept' },
          { name: 'change', value: 'change' },
        ] : [
          { name: `${cntx.sugestion} ${confidenceMsg}`, value: 'accept' },
          { name: 'skip', value: 'skip' },
          { name: 'change', value: 'change' },
        ],
      }) : 'set';
      switch (action) {
        case 'accept':
          return cntx.sugestion as string;
        case 'change':
          return await input({
            message: prompt,
          }) ?? name(cntx);
        case 'set':
          return await input({
            message: prompt,
            default: cntx.sugestion ?? undefined
          }) ?? cntx.sugestion;
        case 'skip':
          return Skip;
        default:
          return Skip;
      };
    } else {
      const answer: string | typeof Skip = (await input({
        message: prompt,
        default: 'skip\u200B' // TODO: remove HACK
      }));
      return (answer !== 'skip\u200B') ? answer : Skip;
    }
  };

  for await (let [key, value] of strings) {
    let strName = await name(value);
    yield [key, { ...value, sugestion: undefined, name: strName }];
  }
};
const preflight = (): PreflightResult =>
  tty.isatty(process.stdout.fd) ? {
    good: true
  } : {
    good: false,
    errors: ["NOT A TTY: Interative terminal required for human naming."]
  }
/**
 * Generate pretty printed context from StringContext using terminal colorts
 */
const highlightContext = (cntx: StringContext, options: Options) => {
  const code = getCodeLines(cntx.suroundingCode, options.linesOfContext).join('\n');
  // TODO this should be more robust in case of multiple instances of the same string
  const textEscaped = escapeRegExp(cntx.text);
  const codeStringRemoved = code.replace(
    new RegExp(`(?<=")${textEscaped}(?=")|(?<=')${textEscaped}(?=')|(?<=\>|})${textEscaped}(?=<|{)`),
    STRING_PLACEHOLD_ESCAPED
  );

  const codeHighlighted = highlight(codeStringRemoved, { language: 'jsx', ignoreIllegals: true });
  let lineNumber = Math.max(cntx.suroundingCode.line - options.linesOfContext - 1, 1);
  const maxNumWidth = Math.max((lineNumber + 1 + options.linesOfContext * 2).toString().length, 3);
  const codeNumbered = codeHighlighted.split('\n').map(l => {
    const num = lineNumber.toString().padStart(maxNumWidth);
    lineNumber += 1;
    const pre = color(num)[
      lineNumber == cntx.suroundingCode.line
        ? 'bold'
        : 'dim'].toString() + color('  │').dim.toString();
    return ` ${pre} ${l}`
  }).join('\n');
  const codeStringInserted = codeNumbered.replace(
    STRING_PLACEHOLD,
    color(cntx.text).bold.inverse.toString()
  );
  const fileLine = color(`  ${'🗎'.padStart(maxNumWidth)}  │ ${cntx.suroundingCode.file.name}`).dim.underline.toString();
  return `${fileLine}\n${codeStringInserted.toString()}`;
}

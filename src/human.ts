import { Namer, Options } from './app';
import { getCodeLines, NamedString, StringContext } from './main'
import color from 'colorts';
import { echo } from 'colorts';
import { input } from '@inquirer/prompts';
import { highlight } from 'cli-highlight'

const prompt = "String name: "

export const highlightContext = (cntx: StringContext, options: Options) => {
	const code = getCodeLines(cntx.suroundingCode, options.linesOfContext).join('\n');
	// TODO this should be more robust in case of multiple cases of the same string
	const codeInvertString = code.replace(
		new RegExp(`"${cntx.text}"|'${cntx.text}'`),
		(str) => color(str).bold.underline.toString()
	);
	const codeHighlighted = highlight(codeInvertString, { language: 'typescript', ignoreIllegals: true });
	let lineNumber = cntx.suroundingCode.line - options.linesOfContext - 1;
	const maxNumWidth = (lineNumber + 1 + options.linesOfContext * 2).toString().length;
	const codeNumbed = codeHighlighted.split('\n').map(l => {
		const num = lineNumber.toString().padStart(maxNumWidth);
		lineNumber += 1;
		const pre = color(`${num}  │`)[
			lineNumber == cntx.suroundingCode.line
			? 'bold'
			: 'dim'].toString();
		return ` ${pre} ${l}`
	});
	const fileLine = color(`  ${'🗎'.padStart(maxNumWidth)}  │ ${cntx.suroundingCode.file.name}`).dim.underline.toString();
	return `${fileLine}\n${codeNumbed.join('\n')}`;
}

export const getNames: Namer = async <K,>(strs: [K, Promise<StringContext>][], options: Options): Promise<[K, Promise<NamedString>][]> => {
	const name = async (cntx: StringContext): Promise<string> => {
		console.log(highlightContext(cntx, options));
		const answer = await input({
			message: prompt,
			default: cntx.sugestion
		});
		console.log(answer);
		return answer ?? cntx.sugestion;
	};

	let transformedEntries = [];
	for (let [key, value] of strs) {
		const val = await value;
		transformedEntries.push([
			key,
			Promise.resolve({
				name: await name(val),
				...val
			})
		] as [K, Promise<NamedString>]);
	}

	return transformedEntries;
};
class Deferred<T> {
	promise: Promise<T>;
	resolve!: (value: T) => void;
	reject!: (reason?: any) => void;
	constructor() {
		this.promise = new Promise<T>((resolve, reject) => {
			this.reject = reject;
			this.resolve = resolve;
		});
	}
}

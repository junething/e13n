import { Mistral } from '@mistralai/mistralai';
import { NamedString, StringContext } from './main'
import { batch, parseIntStrict, sleep, tupleApplySnd } from './lib';
import { ChatCompletionChoice, UserMessage } from '@mistralai/mistralai/models/components';
import { Namer } from './app';
//const apiKey = process.env.MISTRAL_API_KEY;
const apiKey = "YIe7h150W1IUE2wvp4hArZajerQEo5UP";

const client = new Mistral({ apiKey: apiKey });

const makeSequentializer = <T,>(time: number) => {
	let jobNumber = 0;
	return async (job: () => T): Promise<T> => {
		await sleep(time * jobNumber++)
		return await job();
	}
}
type LLMResponse = Record<string, {
	name: string,
	confidence: number
}>;
const askLLM = <K,>(
	cntxs: [K, StringContext][],
	dispatcher?: Promise<boolean>): [K, Promise<NamedString>][] => {
	const json = Object.fromEntries(cntxs.map(([_, c]) => (
		[c.text, {
			context: c.suroundingCode
		}]
	)));
	const aiMistake = () => {
		console.log(json);
		//console.log(results);
		console.log(cntxs.map(([n, c]) => c.text));
		throw new Error("The ai messed up");
	}
	const request = (async (): Promise<LLMResponse> => {
		await dispatcher;
		//console.log(`making request at ${Date.now()}`)
		const response = await client.agents.complete({
			agentId: "ag:528ca108:20250228:naming-agent:4b20f6d7",
			messages: [{
				role: 'user',
				content: JSON.stringify(json)
			}]
		});
		const stringResponse = response.choices?.[0]?.message.content?.toString();
		//console.log(JSON.stringify(json));
		//console.log(response);
		return JSON.parse(stringResponse ?? aiMistake());
	})();

	//if (results.length != cntxs.length) aiMistake();
	return cntxs.map(([k, v], i) => [
		k,
		(async (): Promise<NamedString> => {
			const { name, confidence } = (await request)[v.text];
			//console.log(name, confidence);
			const moveConfidence = confidence ?? aiMistake();
			return ({
				name,
				moveConfidence,
				sugestion: v.sugestion ?? name,
				...v })
		})()
	] as [K, Promise<NamedString>]);
};

const askLLM2 = async <K,>(cntxs: [K, StringContext][]): Promise<[K, NamedString][]> => {
	const json = Object.fromEntries(cntxs.map(([_, c]) => (
		[c.text, {
			context: c.suroundingCode
		}]
	)));
	const aiMistake = () => {
		console.log(json);
		//console.log(results);
		console.log(cntxs.map(([n, c]) => c.text));
		throw new Error("The ai messed up");
	}
	const response = await client.agents.complete({
		agentId: "ag:528ca108:20250228:naming-agent:4b20f6d7",
		messages: [{
			role: 'user',
			content: JSON.stringify(json)
		}]
	});
	const stringResponse = response.choices?.[0]?.message.content?.toString();
	//console.log(JSON.stringify(json));
	//console.log(response);
	const responseObject = JSON.parse(stringResponse ?? aiMistake());

	//if (results.length != cntxs.length) aiMistake();
	return cntxs.map(([k, v], i) =>  {
		const { name, confidence } = responseObject[v.text];
		console.log(name, confidence);
		const moveConfidence = confidence ?? aiMistake();
		return [k, ({ name, moveConfidence, ...v })]	
});
};
const newTimedDispatcher = <T,>(time: number) => {
	let jobNumber = 0;
	return { dispatcher: async (): Promise<boolean> => {
		await sleep(time * jobNumber++); // TODO: make this interuptable on abort
		return true;
	}};
}
const promiseUnbatch = <K,T>(batch: Promise<[K, T][]>, batchSize: number) =>
	[...Array(batchSize).keys()].map(async i => {
		const [k, p] = (await batch)[i];
		return [k, Promise.resolve(p)]
	});
export const getNames: Namer = async <K,>(strs: [K, Promise<StringContext>][]): Promise<[K, Promise<NamedString>][]> => {
	const { dispatcher } = newTimedDispatcher(1100)
	const requests = (await Promise.all(batch(strs, 4).flatMap(async b => {
		let waited = await Promise.all(b.map(async ([k, v]) => [k, await v] as [K, StringContext]));
		return askLLM(waited, dispatcher())
	}))).flat();
	return requests;
};

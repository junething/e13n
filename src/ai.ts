import { Mistral } from '@mistralai/mistralai';
import { NamedString, StringContext } from './main'
import { Namer } from './namer';
//const apiKey = process.env.MISTRAL_API_KEY;
const apiKey = "YIe7h150W1IUE2wvp4hArZajerQEo5UP";

const client = new Mistral({apiKey: apiKey});

export const getNames: Namer = async <K,>(strs: Map<K, StringContext>): Promise<Map<K, NamedString>> => {

	const askLLM = async (cntx: StringContext) => (await client.agents.complete({
  	  		agentId: "ag:528ca108:20250228:naming-agent:4b20f6d7",
  	  		messages: [{
  	  	  		role: 'user',
  	  	  		content: `"${cntx.text}"\n\`\`\`js\n${cntx.suroundingCode}\n\`\`\``
  	  		}]
  		})).choices[0].message.content.toString();

  	const entries = Array.from(strs.entries());

  	const transformedEntries = await Promise.all(
    	entries.map(async ([key, value]) => [key, {
			name: await askLLM(value),
			...value
		}] as [K, NamedString])
  	);

  	// Create a new map from the transformed entries
  	return new Map(transformedEntries);
};

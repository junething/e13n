"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNames = void 0;
const mistralai_1 = require("@mistralai/mistralai");
//const apiKey = process.env.MISTRAL_API_KEY;
const apiKey = "YIe7h150W1IUE2wvp4hArZajerQEo5UP";
const client = new mistralai_1.Mistral({ apiKey: apiKey });
const getNames = (strs) => __awaiter(void 0, void 0, void 0, function* () {
    const asyncTransform = (cntx) => __awaiter(void 0, void 0, void 0, function* () {
        return (yield client.agents.complete({
            agentId: "ag:528ca108:20250228:naming-agent:4b20f6d7",
            messages: [{
                    role: 'user',
                    content: `"${cntx.text}"\n\`\`\`js\n${cntx.suroundingCode}\n\`\`\``
                }]
        })).choices[0].message.content.toString();
    });
    // Convert the map to an array of entries
    const entries = Array.from(strs.entries());
    // Process all entries in parallel
    const transformedEntries = yield Promise.all(entries.map((_a) => __awaiter(void 0, [_a], void 0, function* ([key, value]) {
        return [key, Object.assign({ name: yield asyncTransform(value) }, value)];
    })));
    // Create a new map from the transformed entries
    return new Map(transformedEntries);
});
exports.getNames = getNames;
//# sourceMappingURL=ai.js.map
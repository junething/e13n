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
const getNames = (strs) => __awaiter(void 0, void 0, void 0, function* () {
    let count = 0;
    const name = (cntx) => `var${count++}`;
    // Convert the map to an array of entries
    const entries = Array.from(strs.entries());
    // Process all entries in parallel
    const transformedEntries = entries.map(([key, value]) => [key, Object.assign({ name: name(value) }, value)]);
    // Create a new map from the transformed entries
    return new Map(transformedEntries);
});
exports.getNames = getNames;
//# sourceMappingURL=numbered.js.map
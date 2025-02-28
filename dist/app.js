"use strict";
// ReadStream.ts
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
const fs = require("fs");
const CheckedFile = {
    from(str) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!fs.existsSync(str)) {
                // Here is our error handling!
                throw new Error('File not found');
            }
            return str;
        });
    },
};
// my-app.ts
const cmd_ts_1 = require("cmd-ts");
const main_1 = require("./main");
const app = (0, cmd_ts_1.command)({
    name: "JSTool",
    args: {
        file: (0, cmd_ts_1.positional)({ type: CheckedFile, displayName: 'file' }),
    },
    handler: (_a) => __awaiter(void 0, [_a], void 0, function* ({ file }) {
        const { newSource, resourceData } = yield (0, main_1.processFile)(file, {});
        console.log(newSource);
        console.log(resourceData);
    }),
});
// parse arguments
(0, cmd_ts_1.run)(app, process.argv.slice(2));
//# sourceMappingURL=app.js.map
// ReadStream.ts

import { Type } from 'cmd-ts';
import * as fs from 'fs';
import { Stream } from 'stream';

export type Path = string
const CheckedFile: Type<string, Path> = {
  async from(str) {
    if (!fs.existsSync(str)) {
      // Here is our error handling!
      throw new Error('File not found');
    }
    return str as Path;
  },
};
// my-app.ts

import { command, run, positional } from 'cmd-ts';
import { processFile } from './main';

const app = command({
  name: "JSTool",
  args: {
    file: positional({ type: CheckedFile, displayName: 'file' }),
  },
  handler: async ({ file }) => {
    const { newSource, resourceData } = await processFile(file, {});
    console.log(newSource);
    console.log(resourceData);
  },
});
// parse arguments
run(app, process.argv.slice(2));

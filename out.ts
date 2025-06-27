import { readFileSync } from "fs";
const resource = JSON.parse(readFileSync("resource.json", { encoding: 'utf8', flag: 'r' }));
// The key should be skipped
// The value should be included
let dict = {
  "text": resource.welcomeMessage
};
// Hello should be included
// Text should be skipped as it is a key,
// this case could be accounted for in the AST,
// for more complex cases the AI is needed
console.log(resource.helloGreeting + dict["text"]);

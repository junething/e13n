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
exports.processFile = void 0;
const fs_1 = require("fs");
const ts = require("typescript");
const numbered = require("./numbered");
//const makeTransformer = (): ts.TransformerFactory<ts.Node> => {
const collector = (sourceFile) => {
    let strings = new Map();
    const sourceLines = sourceFile.getText().split("\n");
    const getNodeContext = (node, lines) => {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        return sourceLines.slice(Math.max(0, line - lines), Math.min(sourceLines.length, line + lines)).join("\n");
    };
    const visit = (node) => {
        if (node.kind == ts.SyntaxKind.StringLiteral) {
            const strNode = node;
            strings.set(node, {
                text: strNode.text,
                suroundingCode: getNodeContext(strNode, 5)
            });
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return strings;
};
const makeImportTransformer = () => (context) => {
    const resource_read_node = ts.factory.createVariableStatement(undefined, [
        ts.factory.createVariableDeclaration("resource", undefined, undefined, ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier("JSON"), "parse"), undefined, [
            ts.factory.createCallExpression(ts.factory.createIdentifier("readFileSync"), undefined, [ts.factory.createStringLiteral("resource.json")])
        ]))
    ]);
    return (sourceFile) => {
        const firstNonImport = sourceFile.statements.findIndex(s => s.kind != ts.SyntaxKind.ImportDeclaration);
        return ts.factory.updateSourceFile(sourceFile, [
            ...sourceFile.statements.slice(0, firstNonImport),
            resource_read_node,
            ...sourceFile.statements.slice(firstNonImport)
            ///resource_read_node
        ]);
    };
    //ts.visit(sourceFile, visit, ts.isSourceFile);
};
const makeStringTransformer = (strings, resourceNode) => (context) => {
    const visit = (node) => {
        if (node.kind == ts.SyntaxKind.StringLiteral && strings.has(node)) {
            return ts.factory.createPropertyAccessExpression(resourceNode, strings.get(node).name);
        }
        else if (node.kind != ts.SyntaxKind.ImportDeclaration) {
            return ts.visitEachChild(node, visit, context);
        }
        else {
            return node;
        }
    };
    return (sourceFile) => ts.visitNode(sourceFile, visit, ts.isSourceFile);
};
const processFile = (file, options) => __awaiter(void 0, void 0, void 0, function* () {
    const sourceFile = ts.createSourceFile(file, (0, fs_1.readFileSync)(file).toString(), ts.ScriptTarget.ES2015, 
    /*setParentNodes */ true);
    const strings = collector(sourceFile);
    const namedStrings = yield numbered.getNames(strings);
    const stringTransformer = makeStringTransformer(namedStrings, ts.factory.createIdentifier("resource"));
    const importTransformer = makeImportTransformer();
    const result = ts.transform(sourceFile, [stringTransformer, importTransformer]);
    const transformedSourceFile = result.transformed[0];
    const resourceData = Object.fromEntries(Array.from(namedStrings.values()).map(({ name, text }) => [name, text]));
    const printer = ts.createPrinter();
    const newSource = printer.printNode(ts.EmitHint.SourceFile, transformedSourceFile, sourceFile);
    return { newSource, resourceData };
});
exports.processFile = processFile;
//# sourceMappingURL=main.js.map
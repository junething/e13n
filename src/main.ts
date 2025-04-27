import { readFileSync } from "fs";
import * as ts from "typescript";
import { CodeReference, NamedString, Options, Path, Skip, SourceCode, StringContext } from "./app";
import { takeAsync, toAsyncGenerator } from "./lib";

export const getCodeLines = (codeRef: CodeReference, linesEachSide: number): string[] =>
  codeRef.file.lines.slice(
    Math.max(0, codeRef.line - linesEachSide),
    Math.min(codeRef.file.lines.length, codeRef.line + linesEachSide));

//const makeTransformer = (): ts.TransformerFactory<ts.Node> => {
const collector = (sourceFile: ts.SourceFile): Map<ts.Node, StringContext> => {
  let strings = new Map<ts.Node, StringContext>();
  const sourceCode: SourceCode = { name: sourceFile.fileName, lines: sourceFile.getText().split("\n") };
  const getNodeCodeReference = (node: ts.Node): CodeReference => {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const length = node.getEnd() - node.getStart()
    return { line, character, length, file: sourceCode }
  }
  const visit = (node: ts.Node) => {
    if (node.kind == ts.SyntaxKind.StringLiteral) {
      const strNode = node as ts.StringLiteral;
      if (strNode.text.trim() != '')
        strings.set(node, {
          text: strNode.text,
          suroundingCode: getNodeCodeReference(strNode)
        });
    } else if (node.kind == ts.SyntaxKind.JsxText) {
      const strNode = node as ts.JsxText;
      if (strNode.text.trim() != '')
        strings.set(node, {
          text: strNode.text,
          suroundingCode: getNodeCodeReference(strNode)
        });
    } else if (node.kind != ts.SyntaxKind.ImportDeclaration) {
      ts.forEachChild(node, visit);
    }
  };
  visit(sourceFile);
  return strings;
};
const makeImportTransformer = (): ts.TransformerFactory<ts.SourceFile> =>
  (context: ts.TransformationContext) => {
    const resource_read_node = ts.factory.createVariableStatement(undefined, [
      ts.factory.createVariableDeclaration("resource",
        undefined,
        undefined,
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier("JSON"),
            "parse"
          ),
          undefined,
          [
            ts.factory.createCallExpression(
              ts.factory.createIdentifier("readFileSync"),
              undefined,
              [ts.factory.createStringLiteral("resource.json")]
            )
          ]
        )
      )]);
    return (sourceFile): ts.SourceFile => {
      const firstNonImport = sourceFile.statements.findIndex(s => s.kind != ts.SyntaxKind.ImportDeclaration);
      return ts.factory.updateSourceFile(sourceFile,
        [
          ...sourceFile.statements.slice(0, firstNonImport),
          resource_read_node,
          ...sourceFile.statements.slice(firstNonImport)
          ///resource_read_node
        ])
    }
    //ts.visit(sourceFile, visit, ts.isSourceFile);
  };
const makeStringTransformer = (strings: Map<ts.Node, NamedString>, resourceNode: ts.Expression): ts.TransformerFactory<ts.SourceFile> =>
  (context: ts.TransformationContext) => {
    const visit = (node: ts.Node): ts.Node => {
      const name = strings.get(node)?.name ?? Skip;
      if (node.kind == ts.SyntaxKind.StringLiteral && name !== Skip) {
        return ts.factory.createPropertyAccessExpression(
          resourceNode,
          name
        );
      } else if (node.kind == ts.SyntaxKind.JsxText && name !== Skip) {
        return ts.factory.createJsxExpression(undefined,
          ts.factory.createPropertyAccessExpression(
            resourceNode,
            name
          ));
      } else {
        return ts.visitEachChild(node, visit, context);
      }
    }
    return (sourceFile): ts.SourceFile => ts.visitNode(sourceFile, visit, ts.isSourceFile);
  };
type ResourceFileOptions = {
  oraniseBy: 'flat' | 'file'
}

export const processFile = async (file: Path, options: Options): Promise<{ newSource: string, resourceData: any }> => {
  const sourceFile = ts.createSourceFile(
    file,
    readFileSync(file).toString(),
    ts.ScriptTarget.Latest,
    true
  );
  const strings = toAsyncGenerator([...collector(sourceFile).entries()]);
  const sugestedStrings = options.suggester?.namer?.(strings, options) ?? strings;
  const namedStrings = new Map(await takeAsync(options.namer.namer(sugestedStrings, options)));

  const stringTransformer = makeStringTransformer(
    namedStrings,
    ts.factory.createIdentifier("resource")
  );
  const importTransformer = makeImportTransformer();
  const result = ts.transform(sourceFile, [stringTransformer, importTransformer]);
  const transformedSourceFile = result.transformed[0];
  const resourceData = Object.fromEntries(Array.from(namedStrings.values()).map(({ name, text }) => [name, text]));
  const printer = ts.createPrinter();
  const newSource = printer.printNode(ts.EmitHint.SourceFile, transformedSourceFile, transformedSourceFile);
  return { newSource, resourceData };
};

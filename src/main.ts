import { readFileSync } from "fs";
import * as ts from "typescript";
import * as ai from "./ai"
import * as numbered from "./numbered"
import { Path } from "./app";
export type StringContext = {
	sugestion?: string,
	text: string,
	suroundingCode: string
}
export type NamedString = StringContext & { name: string };
//const makeTransformer = (): ts.TransformerFactory<ts.Node> => {
const collector = (sourceFile): Map<ts.Node, StringContext> => {
	let strings = new Map<ts.Node, StringContext>();
	const sourceLines = sourceFile.getText().split("\n");
	const getNodeContext = (node: ts.Node, lines: number): string => {
		const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
		return sourceLines.slice(Math.max(0, line - lines), Math.min(sourceLines.length, line + lines)).join("\n");
	}
	const visit = (node: ts.Node) => {
		if (node.kind == ts.SyntaxKind.StringLiteral) {
			const strNode = node as ts.StringLiteral;
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
						[ ts.factory.createStringLiteral("resource.json") ]
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
			if (node.kind == ts.SyntaxKind.StringLiteral && strings.has(node)) {
				return ts.factory.createPropertyAccessExpression(
					resourceNode,
					strings.get(node).name
				);
			} else if(node.kind != ts.SyntaxKind.ImportDeclaration) {
				return ts.visitEachChild(node, visit, context);
			} else {
				return node;
			}
		}
		return (sourceFile): ts.SourceFile => ts.visitNode(sourceFile, visit, ts.isSourceFile);
	};
type ResourceFileOptions = {
	oraniseBy: 'flat' | 'file'
}
type Options = {

}
export const processFile = async (file: Path, options: Options): Promise<{ newSource: string, resourceData: any }> => {
	const sourceFile = ts.createSourceFile(
		file,
		readFileSync(file).toString(),
		ts.ScriptTarget.ES2015,
		/*setParentNodes */ true
	);
	const strings = collector(sourceFile);
	const namedStrings = await numbered.getNames(strings)
	const stringTransformer = makeStringTransformer(
		namedStrings,
		ts.factory.createIdentifier("resource")
	);
	const importTransformer = makeImportTransformer();
	const result = ts.transform(sourceFile, [stringTransformer, importTransformer]);
	const transformedSourceFile = result.transformed[0];
	const resourceData = Object.fromEntries(Array.from(namedStrings.values()).map(({name, text}) => [name, text]));
	const printer = ts.createPrinter();
	const newSource = printer.printNode(ts.EmitHint.SourceFile, transformedSourceFile, sourceFile);
	return { newSource, resourceData };
};
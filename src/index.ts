import * as ts from 'typescript';
export default function(program: ts.Program, pluginOptions: {}) {
    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            if (sourceFile.isDeclarationFile) {
                return sourceFile;
            }

            let hasAsync = false;
            const asyncContext = ts.createOptimisticUniqueName('asyncContext');
            const startAsync = ts.createOptimisticUniqueName('startAsync');
            const pauseAsync = ts.createOptimisticUniqueName('pauseAsync');
            const resumeAsync = ts.createOptimisticUniqueName('resumeAsync');

            let eid: ts.Identifier | undefined;
            function visitor(node: ts.Node): ts.Node {
                if (
                    (ts.isFunctionDeclaration(node) ||
                        ts.isFunctionExpression(node) ||
                        ts.isMethodDeclaration(node) ||
                        ts.isArrowFunction(node)) &&
                    node.modifiers !== undefined &&
                    node.modifiers.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword)
                ) {
                    hasAsync = true;
                    const parentEid = eid;
                    eid = ts.createOptimisticUniqueName('eid');
                    const classIdent = ts.isMethodDeclaration(node)
                        ? (node.parent as ts.ClassExpression).name
                        : undefined;
                    const className = classIdent !== undefined ? classIdent.getText() + '.' : '';
                    const call = ts.createCall(
                        startAsync,
                        [],
                        [ts.createLiteral(className + (node.name !== undefined ? node.name.getText() : ''))],
                    );
                    const varDecl = createVar(eid, call);
                    const clone = ts.visitEachChild(node, visitor, ctx);
                    if (!clone.body) return node;
                    clone.body = ts.createBlock([
                        varDecl,
                        ...(ts.isBlock(clone.body) ? clone.body.statements : [ts.createReturn(clone.body)]),
                    ]);
                    eid = parentEid;
                    return clone;
                }

                if (ts.isAwaitExpression(node) && eid !== undefined) {
                    const pauseAsyncExpr = ts.createCall(
                        pauseAsync,
                        [],
                        [ts.visitEachChild(node.expression, visitor, ctx)],
                    );
                    return ts.createCall(resumeAsync, [], [eid, ts.createAwait(pauseAsyncExpr)]);
                }
                if (ts.isForOfStatement(node) && node.awaitModifier !== undefined) {
                }

                return ts.visitEachChild(node, visitor, ctx);
            }
            const newSF = ts.visitEachChild(sourceFile, visitor, ctx);

            const requireVar = createVar(
                asyncContext,
                ts.createCall(ts.createIdentifier('require'), undefined, [ts.createLiteral('@cevek/async-context/dist/lib')]),
            );
            const startAsyncVar = createVar(startAsync, ts.createPropertyAccess(asyncContext, 'startAsync'));
            const pauseAsyncVar = createVar(pauseAsync, ts.createPropertyAccess(asyncContext, 'pauseAsync'));
            const resumeAsyncVar = createVar(resumeAsync, ts.createPropertyAccess(asyncContext, 'resumeAsync'));

            if (hasAsync) {
                newSF.statements = ts.createNodeArray([
                    requireVar,
                    startAsyncVar,
                    pauseAsyncVar,
                    resumeAsyncVar,
                    ...newSF.statements,
                ]);
            }
            return newSF;
        };
    };
}

function createVar(ident: ts.Identifier, value: ts.Expression) {
    return ts.createVariableStatement(undefined, [ts.createVariableDeclaration(ident, undefined, value)]);
}

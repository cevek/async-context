async function foo() {
    return await await 1;
}

class Bar {
    async foo() {
        await 1;
    }
}

var x = async () => await 100;
var y = async () => {
    await 1;
};

test(foo, 'async function foo() { var eid = startAsync("foo"); return resumeAsync(eid, await pauseAsync(await 1)); }');
test(Bar.prototype.foo, 'async foo() { var eid_1 = startAsync("Bar.foo"); resumeAsync(eid_1, await pauseAsync(1)); }');
test(x, 'async () => { var eid_2 = startAsync(""); return resumeAsync(eid_2, await pauseAsync(100)); }');
test(y, 'async () => { var eid_3 = startAsync(""); resumeAsync(eid_3, await pauseAsync(1)); }');

console.log('All tests passed');
function test(fn: Function, toBe: string) {
    if (fn.toString() !== toBe) {
        throw new Error(`Expected:\n${fn.toString()}\nshould be\n${toBe}`);
    }
}

export {};

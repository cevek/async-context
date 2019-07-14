let currentAsyncId = 0;
let currentFunName = 'root';
const asyncMap = [currentAsyncId];
const asyncNameMap = [currentFunName];

export function startAsync(fnName: string) {
    const parentAsyncId = currentAsyncId;
    const parentFunName = currentFunName;
    currentAsyncId = asyncMap.length;
    currentFunName = fnName;
    asyncMap.push(parentAsyncId);
    asyncNameMap.push(parentFunName);
    return currentAsyncId;
}

export function pauseAsync<T>(ret: T) {
    currentAsyncId = 0;
    currentFunName = 'root';
    return ret;
}

export function resumeAsync<T>(eid: number, ret: T) {
    currentAsyncId = eid;
    currentFunName = asyncNameMap[eid];
    return ret;
}

export function getCurrentFunctionName() {
    return currentFunName;
}
export function getCurrentStackId() {
    return currentAsyncId;
}

export function getStack(): readonly number[] {
    return asyncMap;
}

export function getFunctionNameStack(): readonly string[] {
    return asyncNameMap;
}

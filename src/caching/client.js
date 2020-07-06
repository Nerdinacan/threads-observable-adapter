/**
 * Client functions for threads
 */

import { spawn } from "threads"
import { of, from, pipe } from "rxjs"
import { mergeMap, map, materialize, withLatestFrom, mergeScan, finalize } from "rxjs/operators"
import { v4 as uuidv4 } from 'uuid'

import TestWorker from "worker-loader!./worker";


let _thread;
async function getWorker() {
    if (!_thread) {
        console.log("creating new thread");
        _thread = await spawn(new TestWorker());
    }
    return _thread;
}


async function getWorkerMethod(methodName) {
    const thread = await getWorker()
    if (!thread[methodName]) {
        throw new Error(`No function ${methodName} exposed on thread`)
    }
    return thread[methodName];
}

export const toOperator = (methodName) => {

    const method$ = from(getWorkerMethod(methodName)).pipe(
        map(f => {
            // Unfocking "observable promise"
            return (...args) => from(f(...args));
        })
    )

    const operator = () => src$ => {
        const id = uuidv4();
        return src$.pipe(
            materialize(),
            withLatestFrom(method$),
            map(([ notification, method ]) => {
                // Not a fan of "ObservablePromise"
                return method({ id, ...notification });
            }),
            mergeScan((acc, obs) => {
                return obs || acc
            }, null),
            finalize(async () => {
                const method = await getWorkerMethod(methodName)
                method({ id, kind: "C" });
            }),
        )
    }

    return operator;
}

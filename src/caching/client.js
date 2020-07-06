/**
 * Client functions for threads
 */

import { spawn } from "threads"
import { of, from, pipe } from "rxjs"
import { pluck, mergeMap, map, materialize, withLatestFrom, mergeScan, finalize } from "rxjs/operators"
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

export const toOperator = (methodName) => {

    const method$ = from(getWorker(methodName)).pipe(
        pluck(methodName),
        // Unfucking "observable promise"
        map(f => (...args) => from(f(...args)))
    )

    const operator = () => {
        const id = uuidv4();

        return pipe(
            materialize(),
            withLatestFrom(method$),
            map(([ notification, method ]) => method({ id, ...notification })),
            mergeScan((acc, obs) => obs || acc, null),
            finalize(async () => {
                const method = await method$.toPromise();
                method({ id, kind: "C" });
            }),
        )
    }

    return operator;
}

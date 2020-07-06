/**
 * Client functions for threads
 */

import { spawn, Thread } from "threads"
import { from, defer } from "rxjs"
import { shareReplay, filter, pluck, mergeMap, map, materialize, finalize } from "rxjs/operators"
import { v4 as uuidv4 } from 'uuid'

import TestWorker from "worker-loader!./worker";



const thread$ = defer(() => spawn(new TestWorker())).pipe(shareReplay(1));



// Give this a string of the function name on the worker thread instance
// that you want to call (I'm assuming you're exporting a module and not
// a function from your worker, otherwise you'll have to modify this)

export const toOperator = (fnName) => {

    // "ObservablePromise" makes it awkward to extract the actual
    // observable back from the method call. Not a fan. Would prefer
    // if the function just returned either an observable or a promise
    // depending on how you explicitly decided to expose it.

    const method$ = thread$.pipe(
        pluck(fnName),
        map(f => (...args) => from(f(...args)))
    );

    const operator = () => src$ => {

        // "Hat on a hat"
        // This looks like something that probably already existed in the
        // threads transfer layer, but I don't think I have access to the
        // internals.
        const id = uuidv4();

        return method$.pipe(
            mergeMap(method => src$.pipe(
                materialize(),
                map(notification => method({ id, ...notification })),
                // first emission will be the observable
                // we want, rest will be nulls,
                filter(Boolean),
                mergeMap(val => val),
                finalize(async () => {
                    method({ id, kind: "C" });
                })
            ))
        )
    }

    return operator;
}

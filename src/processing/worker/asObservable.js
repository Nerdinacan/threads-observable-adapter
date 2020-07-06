import { Subject, of } from "rxjs";
import { startWith } from "rxjs/operators";

export const asObservable = operation => {

    // list of current subscriptions
    const currentSubs = new Map();

    return payload => {
        // console.log("asObservable", payload, currentSubs.size);
        const { id, value, kind } = payload;

        // initialization
        if (!currentSubs.has(id)) {
            const input$ = new Subject();
            const output$ = input$.pipe(startWith(value), operation);
            currentSubs.set(id, { input$, output$ });
            return output$;
        }

        // process notifications
        const sub = currentSubs.get(id);

        // materialize exposed a "kind" variable for all
        // observable messages, it's either N,C,E for
        // next, complete, error

        if (kind == "C" || kind == "E") {
            sub.input$.complete();
            currentSubs.delete(id);
        }

        if (kind == "N") {
            sub.input$.next(value);
        }

        // If we're just running against the existing stored observable do not
        // return a new one.
        return of(null);
    }
}

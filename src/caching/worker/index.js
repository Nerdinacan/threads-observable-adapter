import { expose } from "threads/worker"
import { scan, finalize } from "rxjs/operators";
import { asObservable } from "./asObservable";

expose({

    counter: asObservable(src$ => {
        return src$.pipe(
            scan((acc, val) => acc + val, 0),
            finalize(() => {
                console.log("counter completed");
            })
        )
    })

})

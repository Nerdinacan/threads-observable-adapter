<template>
    <div id="app">
        <button @click="clicky">Toggle 1</button>
        <button @click="clickyTwo">Toggle 2</button>
    </div>
</template>

<script>

import { interval } from 'rxjs';
import { mergeMap, finalize } from "rxjs/operators";
import { counter } from "./caching";

export default {
    methods: {
        subToCounter(name) {
            return interval(500).pipe(
                counter(),
                finalize(() => {
                    console.log("sub completed inside component");
                })
            ).subscribe(val => console.log("clicky", name, val));
        },
        clicky() {
            if (this.sub) {
                this.sub.unsubscribe();
                this.sub = null;
            } else {
                this.sub = this.subToCounter("clicky");
            }
        },
        clickyTwo() {
            if (this.sub2) {
                this.sub2.unsubscribe();
                this.sub2 = null;
            } else {
                this.sub2 = this.subToCounter("clicky Two");
            }
        }
    }
};

</script>

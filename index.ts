type IResolveReject = (val: Promise | any) => void;
type IExecutor = (resolve: IResolveReject, reject: IResolveReject) => void;

const [PENDING, FULFILLED, REJECTED] = [
	Symbol("PENDING"),
	Symbol("FULFILLED"),
	Symbol("REJECTED")
];

class EventBus {
	eventsMap: Map<string, (...val: any) => void> = new Map();

	setEventListener(bucket: string, listener: (...val: any) => void) {
		this.eventsMap.set(bucket, listener);
	}

	executeListener = (bucket: string, ...val: any) => {
		const listener = this.eventsMap.get(bucket);
		if (listener) {
			listener(...val);
			this.removeEventListener(bucket);
		}
	};

	removeEventListener(bucket: string) {
		this.eventsMap.set(bucket, void 0);
	}
}

class Promised {
	static resolve = (val: any) => {
		return new Promised(resolve => {
			setTimeout(() => {
				resolve(val);
			});
		});
	};

	static reject = (val: any) => {
		return new Promised((resolve, reject) => {
			setTimeout(() => {
				reject(val);
			});
		});
	};

	state = PENDING;
	value = void 0;

	eventBus = new EventBus();

	constructor(func: IExecutor) {
		if (!func) {
			throw new Error("Signature should match the typse");
		}
		const resolve = (value: Promise | any) => {
			this.state = FULFILLED;
			this.value = value;
			this.eventBus.executeListener("resolve", value);
		};

		const reject = (err: Promise | any) => {
			this.state = REJECTED;
			this.value = err;
			this.eventBus.executeListener("reject", value);
		};

		func(resolve, reject);
	}

	then(onFulfilled, onRejected) {
		return new this.constructor((resolve, reject) => {
			const onInternalFulfill = val => {
				const result = onFulfilled(val);
				resolve(result);
			};
			const onInternalReject = val => {
				const result = onFulfilled(val);
				reject(result);
			};
			this.eventBus.setEventListener("resolve", onInternalFulfill);
			this.eventBus.setEventListener("reject", onInternalReject);
		});
	}

	catch(onRejected) {
		onRejected(this.value);
	}
	static all(promises: Array<Promised>) {
		return new Promised((resolve, reject) => {
			const val = [];
			for (const p of promises) {
				p.then(v => {
					val.push(v);
					if (val.length === promises.length) {
						resolve(val);
					}
				});
			}
		});
	}
}

// const p = new Promised((resolve, reject) => {

//   setTimeout(() => {
//     console.log('Resolvd');
//     resolve('4444');
//   }, 0);

//       // resolve('4444');

// });

Promised.resolve(34)
	.then(
		res => {
			console.log(4444);
			return "Hola Mundo";
		},
		err => {
			console.error(err);
		}
	)
	.then(res => console.log(res));

Promised.all([Promised.resolve(23), Promised.resolve(34)]).then(res => {
	console.log(...res);
});

const fun = () => {
  console.log(1);
  new Promise((resolve, reject) => {
    console.log(2);
    reject(3)
    console.log(4);
  }).then((resolve) => {
    console.log('resolve', resolve);
  }, (reject) => {
    console.log('reject', reject);
  })
}

// fun()

class selfPromise {
  constructor(fun) {
    this.fun = fun
    this.status = 'pedding'
    this.resArr = []
    this.rejArr = []
    this.resolve = this.resolve.bind(this)
    this.reject = this.reject.bind(this)
    fun(this.resolve, this.reject)
  }
  resolve(res) {
    setTimeout(() => {
      if (this.status === 'pedding') {
        this.status = 'resolve'
        this.resArr.forEach((fun) => {
          fun(res)
        })
      }
    })
  }
  reject(res) {
    setTimeout(() => {
      if (this.status === 'pedding') {
        this.status = 'reject'
        this.rejArr.forEach((fun) => {
          fun(res)
        })
      }
    })
  }
  then(resolveFun, rejectFun) {
    resolveFun = typeof resolveFun === 'function' ? resolveFun : () => {}
    rejectFun = typeof rejectFun === 'function' ? rejectFun : () => {}
    return new selfPromise((resolve, reject) => {
      this.resArr.push(resolveFun);
      this.rejArr.push(rejectFun);
      resolve()
    })
  }
}

new selfPromise((resolve, reject) => {
  console.log(1);
  resolve(3)
  console.log(2);
}).then(res => {
  console.log('res', res);
}).then(res => {
  console.log('res2', res);
})
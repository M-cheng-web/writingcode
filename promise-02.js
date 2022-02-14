class promise {
  constructor(executor) {
    this.callbacks = [] // 回调
    this.status = 'pedding' // pedding resolve reject
    this.result = undefined // 结果    

    const self = this

    function resolve(val) {
      if (self.status !== 'pedding') return
      self.result = val
      setTimeout(() => {
        self.status = 'resolve'
        self.callbacks.forEach((callback) => {
          callback.resolveFun()
        })
      })
    }

    function reject(val) {
      if (self.status !== 'pedding') return
      self.result = val
      setTimeout(() => {
        self.status = 'reject'
        self.callbacks.forEach((callback) => {
          callback.rejectFun()
        })
      })
    }

    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then(resolveFun, rejectFun) {
    resolveFun = typeof resolveFun === 'function' ? resolveFun : (value) => value
    rejectFun = typeof rejectFun === 'function' ? rejectFun : (reason) => { throw reason }

    const self = this

    return new promise((resolve, reject) => {
      function callback(fun) {
        try {
          const res = fun(self.result)
          if (res instanceof promise) {
            res.then(r => {
              resolve(r)
            }, e => {
              reject(e)
            })
          } else {
            resolve(res)
          }
        } catch (e) {
          reject(e)
        }
      }

      if (self.status === 'resolve') {
        setTimeout(() => { callback(resolveFun) })
      }
      
      if (self.status === 'reject') {
        setTimeout(() => { callback(rejectFun) })
      }

      if (self.status === 'pedding') {
        self.callbacks.push({
          resolveFun: () => { callback(resolveFun) },
          rejectFun: () => { callback(rejectFun) }
        })
      }

    })
  }

  catch(rejectFun) {
    return this.then(undefined, rejectFun)
  }

  finally(cb) {
    return this.then((value) => {
      return promise.resolve(cb()).then(() => value)
    }, (err) => {
      return promise.resolve(cb()).then(() => { throw err })
    })
  }

  static resolve(value) {
    return new promise((resolve, reject) => {
      if (value instanceof promise) {
        value.then(r => {
          resolve(r)
        }, e => {
          reject(e)
        })
      } else {
        resolve(value)
      }
    })
  }

  static reject(reason) {
    return new promise((resolve, reject) => {
      reject(reason)
    })
  }

  static all(promises) {
    return new promise((resolve, reject) => {
      const arr = []
      let sum = 0
      promises.forEach((pro, index) => {
        pro.then((res) => {
          sum++
          arr[index] = res
          if (sum === promises.length) {
            resolve(arr)
          }
        }, (err) => {
          reject(err)
        })
      })
    })
  }

  static allSettled(promises) {
    return new promise((resolve, reject) => {
      const arr = []
      let sum = 0
      promises.forEach((pro, index) => {
        pro.then((res) => {
          arr[index] = {
            status: 'resolved',
            value: res
          }
        }, (err) => {
          arr[index] = {
            status: 'rejected',
            reason: err
          }
        }).finally(() => {
          sum++
          if (sum === promises.length) {
            resolve(arr)
          }
        })
      })
    })
  }

  static race(promises) {
    return new promise((resolve, reject) => {
      promises.forEach((pro) => {
        pro.then((res) => {
          resolve(res)
        }).catch((err) => {
          reject(err)
        })
      })
    })
  }

  static any(promises) {
    return new promise((resolve, reject) => {
      let sum = 0
      promises.forEach((pro) => {
        pro.then((res) => {
          resolve(res)
        }).finally(() => {
          sum++
          if (sum === promises.length) {
            reject(new Error('All promises were rejected'))
          }
        })
      })
    })
  }
}


// -------------------------- 测试 any race
const pr1 = new promise((resolve, reject) => {
  setTimeout(() => {
    resolve('p1')
  }, 1000)
})
const pr2 = new promise((resolve, reject) => {
  setTimeout(() => {
    resolve('p2')
  }, 200)
})

promise.race([pr1, pr2]).then((res) => {
  console.log('成功', res);
}).catch((err) => {
  console.log('失败', err);
})

// promise.any([pr1, pr2]).then((res) => {
//   console.log('成功', res);
// }).catch((err) => {
//   console.log('失败', err);
// })


// -------------------------- 测试 all allSettled

// const pr = [1, 2, 3, 4, 5].map((item) => {
//   return new promise((resolve, reject) => {
//     setTimeout(() => {
//       if (item === 3) {
//         reject(item)
//       } else {
//         resolve(item)
//       }
//     }, 5000 - item * 1000)
//   })
// })

// promise.allSettled(pr).then(res => {
//   console.log(res);
// })

// promise.all(pr).then(res => {
//   console.log(res);
// }).catch((err) => {
//   console.log(err);
// })



// new promise((resolve, reject) => {
//   console.log(1);
//   resolve(2)
// }).then(res => {
//   console.log('then', res);
//   return 3
// }).then(res => {
//   console.log('then2', res);
//   throw new Error('finally') // 错误会传递
// }).finally(() => {
//   console.log('结速了');

//   // 会保持上一个promise的结果 无论成功的还是失败的
//   // finally自己创建的promise以及return 都不会传递给下一位
//   // 除非创建错误

//   // throw new Error('finally') // 错误会传递
  
//   // new promise 和 return 都不能传递给下个then
//   // return 'finally'
//   // return new Promise((resolve, reject) => {
//   //   resolve('finally')
//   // })
// }).then((res) => {
//   console.log(res + '还没有结束');
// }).catch((e) => {
//   console.log(e + '还没有结束');
// })
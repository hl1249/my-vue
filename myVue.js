(function(){
	class Vue{
		constructor(options){
			this.$options =options
			this._data = options.data
			this.initData()
			this.initComputed()
			this.initWtch()
			
		}
		initData(){
			
			// 访问劫持 使 this. 指向 data
			let data = this._data
			let keys = Object.keys(data)
			for(let i = 0; i <keys.length ; i ++){
				Object.defineProperty(this,keys[i],{
					enumerable:true,
					configurable:true,
					get:function proxyGetter(){
						return data[keys[i]]
					},
					set:function proxySetter(value){
						data[keys[i]] = value
					}
				})
			}
			
			observe(data)
		}
		
		initComputed(){
			let computed = this.$options.computed
			if(computed){
				let keys = Object.keys(computed)
				for(let i = 0 ; i < keys.length; i ++){
					const watcher =  new Watcher(this,computed[keys[i]],function(){
						
					},{lazy:true})
					Object.defineProperty(this,keys[i],{
						enumerable:true,
						configurable:true,
						get:function computedGetter(){
							// console.log('我是computed',watcher.dirty)
							if(watcher.dirty){
								watcher.get()
								watcher.dirty = false
							}
							// watcher.exp.call(watcher.vm)
							if(Dep.target){
								// 1号watcher收集到的dep 把这些dep一个个拿出来通知他们收集 现在任然在台上的2号watcher
								for(let j = 0 ; j < watcher.deps; j ++){
									watcher.deps[j].depend()
								} 
							}
							
							return watcher.value
						},
						set:function computedSetter(){
							console.warn('计算属性不可赋值')
						}
					})
				}
			}
		}
		
		initWtch(){
			let watch = this.$options.watch
			// console.log('watch',watch)
			if(watch){
				// console.log("我进来")
				let keys = Object.keys(watch)
				// console.log("keys",keys)
				for(let i = 0 ; i < keys.length ; i++){
					new Watcher(this,keys[i],watch[keys[i]])
				}
			}
		}
		
		$watch(key,cb){
			new Watcher(this,key,cb)
		}
		
		$set(target,key,value){
			defineReactive(target,key,value)
			target.__ob__.dep.notify()
		}
		
	}
	
	function observe(data){
		//data是基础类型
		let type = Object.prototype.toString.call(data)
		if(type !== "[object Object]" && type !== "[object Array]"){
			return
		}
		if(data.__ob__) return data.__ob__
		// 对data
		return new Observer(data)
	}
	
	// 递归对象属性/对象 转化成响应式   对象 属性 值
	function defineReactive(obj,key,value){
		let childOb = observe(obj[key])
		// console.log('childOb',key,childOb)
		let dep = new Dep()
		// console.log('dep',dep)
		Object.defineProperty(obj,key,{
			enumerable:true,
			configurable:true,
			get:function reactiveGetter(){
				// console.log(`${key}被访问了`)
				dep.depend()
				if(childOb){
					childOb.dep.depend()
				}
				return value
			},
			set:function reactiveSetter(val){
				// console.log(`${key}被修改了`)
				if(val === value){
					return
				}
				
				dep.notify()
				
				value = val
			}
		})
		
	}
	
	class Observer{
		constructor(data){
			// console.log('data',data)
			this.dep = new Dep()
			if(Array.isArray(data)){
				data.__proto__ = ArrayMethods
				this.observeArray(data)
			}else{
				this.walk(data)
			}
			Object.defineProperty(data,"__ob__",{
				value:this,
				enumerable:false,
				configurable:true,
				writable:true
			})
		}
		// 对象属性转成响应式
		walk(data){
			let keys = Object.keys(data)
			for(let i = 0 ; i < keys.length ; i++){
				defineReactive(data,keys[i],data[keys[i]])
			}
		}
		// 数组内属性转成响应式
		observeArray(arr){
			for(let i = 0 ; i < arr.length ; i ++){
				observe(arr[i])
			}
		}
	}
	
	let targetStack = []
	class Dep{
		constructor(){
			this.subs = []
		}
		addSub(watcher){
			this.subs.push(watcher)
		}
		depend(){
			// console.log(Dep.target)
			// console.log("Dep.target",Dep.target)
			// console.log('this.subs',this.subs)
			if(Dep.target){
				Dep.target.addDep(this)
			}
		}
		notify(){
			// console.log(this.subs)
			// console.log("wathc",this.subs)
			// 以此执行回调函数
			this.subs.forEach((wathc)=>{
				wathc.update()
			})
		}
	}
	
	let watcherId = 0
	// watcher队列
	let watcherQueue = []
	class Watcher{
		constructor(vm,exp,cb,options = {}){
			// console.log(vm,exp,cb)
			this.dirty = this.lazy = !!options.lazy
			// console.log('options',this.dirty)
			this.vm = vm
			this.exp = exp
			this.cb = cb
			this.id = ++watcherId
			this.deps = []
			if(!this.lazy){
				this.get()
			}
		}
		addDep(dep){
			//dep实例有可能被收集过 如果收集过 则直接返回
			if(this.deps.indexOf(dep) !== -1){
				return
			}
			
			this.deps.push(dep)
			dep.addSub(this)
		}
		// 求值
		get(){
			targetStack.push(this)
			Dep.target = this
			if(typeof this.exp === 'function'){
				this.value = this.exp.call(this.vm)
			}else{
				this.value = this.vm[this.exp]
			}
			targetStack.pop()
			if(targetStack.length > 0){
				// 将栈顶的watcher拿出来放到 "舞台"
				Dep.target = targetStack[targetStack.length - 1]
			}else{
				Dep.target = null
			}
		}
		update(){
			if(this.lazy){
				this.dirty = true
			}else{
				this.run()
			}
		}
		run(){
			
			// 如果已经
			if(watcherQueue.indexOf(this.id) !== -1){
				return
			}
			watcherQueue.push(this.id)
			
			let index = watcherQueue.length-1
			Promise.resolve().then(()=>{
				this.get()
				this.cb.call(this.vm)
				watcherQueue.splice(index,1)
			})
		}
	}
	
	const ArrayMethods = {}
	ArrayMethods.__proto__ = Array.prototype
	const methods = [
		'push',
		'pop',
		// 其他需要拦截的方法
	]
	
	methods.forEach(method => {
		ArrayMethods[method] = function(...args){
			// 处理push的对象 进行响应式转换
			if(method === 'push'){
				this.__ob__.observeArray(args)
			}
			const reslut = Array.prototype[method].apply(this,args)
			this.__ob__.dep.notify()
			return reslut
		}
	})
	
	window.Vue = Vue
})(window)
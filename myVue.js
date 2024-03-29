(function(){
	class Vue{
		constructor(options){
			this.$options =options
			this._data = options.data
			this.initData()
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
			this.initWtch()
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
	
	// 递归对象属性转化成响应式   对象 属性 值
	function defineReactive(obj,key,value){
		let childOb = observe(obj[key])
		
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
		
		setTimeout(()=>{
			// console.log(dep)
		})
	}
	
	class Observer{
		constructor(data){
			this.dep = new Dep()
			this.walk(data)
			Object.defineProperty(data,"__ob__",{
				value:this,
				enumerable:false,
				configurable:true,
				writable:true
			})
		}
		
		walk(data){
			let keys = Object.keys(data)
			for(let i = 0 ; i < keys.length ; i++){
				defineReactive(data,keys[i],data[keys[i]])
			}
		}
	}
	
	class Dep{
		constructor(){
			this.subs = []
		}
		depend(){
			// console.log(Dep.target)
			// console.log("Dep.target",Dep.target)
			// console.log('this.subs',this.subs)
			if(Dep.target){
				this.subs.push(Dep.target)
			}
		}
		notify(){
			// console.log(this.subs)
			// console.log("wathc",this.subs)
			// 以此执行回调函数
			this.subs.forEach((wathc)=>{
				wathc.run()
			})
		}
	}
	
	let watcherId = 0
	// watcher队列
	let watcherQueue = []
	class Watcher{
		constructor(vm,exp,cb){
			// console.log(vm,exp,cb)
			this.vm = vm
			this.exp = exp
			this.cb = cb
			this.id = ++watcherId
			this.get()
		}
		// 求值
		get(){
			Dep.target = this
			this.vm[this.exp]
			Dep.target = null
		}
		
		run(){
			// 如果已经
			if(watcherQueue.indexOf(this.id) !== -1){
				return
			}
			watcherQueue.push(this.id)
			
			let index = watcherQueue.length-1
			Promise.resolve().then(()=>{
				this.cb.call(this.vm)
				watcherQueue.splice(index,1)
			})
		}
	}
	
	
	window.Vue = Vue
})(window)
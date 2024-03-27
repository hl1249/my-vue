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
		let wathc = this.$options.watch
		// console.log('wathc',wathc)
		if(wathc){
			// console.log("我进来")
			let keys = Object.keys(wathc)
			// console.log("keys",keys)
			for(let i = 0 ; i < keys.length ; i++){
				new Watcher(this,keys[i],wathc[keys[i]])
			}
		}
	}
	
	$watch(key,cb){
		new Watcher(this,key,cb)
	}
}

function observe(data){
	//data是基础类型
	let type = Object.prototype.toString.call(data)
	if(type !== "[object Object]" && type !== "[object Array]"){
		return
	}
	
	// 对data
	new Observer(data)
}

// 递归数据转化成响应式   对象 属性 值
function defineReactive(obj,key,value){
	observe(obj[key])
	let dep = new Dep()
	// console.log('dep',dep)
	Object.defineProperty(obj,key,{
		enumerable:true,
		configurable:true,
		get:function reactiveGetter(){
			// console.log(`${key}被访问了`)
			dep.depend()
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
		this.walk(data)
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
		console.log(Dep.target)
		// console.log("Dep.target",Dep.target)
		// console.log('this.subs',this.subs)
		if(Dep.target){
			this.subs.push(Dep.target)
		}
	}
	notify(){
		console.log(this)
		// console.log("wathc",this.subs)
		// 以此执行回调函数
		this.subs.forEach((wathc)=>{
			wathc.run()
		})
	}
}

class Watcher{
	constructor(vm,exp,cb){
		// console.log(vm,exp,cb)
		this.vm = vm
		this.exp = exp
		this.cb = cb
		this.get()
	}
	// 求值
	get(){
		Dep.target = this
		this.vm[this.exp]
		Dep.target = null
	}
	
	run(){
		this.cb.call(this.vm)
	}
}
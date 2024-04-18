class Vue{
	constructor(options){
		this.$options = options
		this._data = options.data
		this.initData()
	}
	
	initData(){
		let data = this._data
		let keys = Object.keys(data)
		for(let i = 0 ; i < keys.length; i ++){
			Object.defineProperty(this,keys[i],{
				get(){
					// 我代理了vue data数据
					console.log("我被获取了")
					return this._data[keys[i]]
				},
				set(val){
					// 我代理了vue data数据
					console.log("我被修改了")
					this._data[keys[i]] = val
				}
			})
		}
		
		console.log(this._data)
	}
}
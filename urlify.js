function urlifyObj(obj, nameKey, valueKey){
	if(typeof nameKey === "undefined"){
		nameKey = {};
	}
	if(typeof valueKey === "undefined"){
		valueKey = {};
	}
	if(typeof obj === "string"){
		if(obj in valueKey){
			return sanitize(valueKey[obj],true);
		}
		return sanitize(obj,true);
	}
	if(typeof obj === "number"){
		return sanitize(obj);
	}
	if(typeof obj === "bigint"){
		return sanitize(obj);
	}
	if(typeof obj === "boolean"){
		return (obj?"_T":"_F");
	}
	if(Array.isArray(obj)){
		var string = "_A";
		for(var obj2 of obj){
			string+=urlifyObj(obj2, nameKey, valueKey)+".";
		}
		return string.substring(0,string.length-1)+"_E";
	}
	if(typeof obj === "object"){
		if(obj === null){
			return "_N";
		}
		var string = "_O"
		for(var key in obj){
			if(key){
				if(key in nameKey){	
					string+=sanitize(nameKey[key]);
				}
				else
				{
					string+=sanitize(key);
				}
				string+="__";
				string+=urlifyObj(obj[key], nameKey, valueKey)+".";
			}
		}
		return string.substring(0,string.length-1)+"_E";
	}
}
function deurlify(string, start, nameKey, valueKey){
	var current = "";
	if(typeof start === "undefined"){
		start = 0;
	}
	if(typeof nameKey === "undefined"){
		nameKey = {};
	}
	if(typeof valueKey === "undefined"){
		valueKey = {};
	}
	var stringMode = false;
	for (var i = start; i < string.length; i++) {
		current += string.charAt(i);
		if(current == "_N"){
			return [null,i];
		}
		if(current == "_T"){
			return [true,i];
		}
		if(current == "_F"){
			return [false,i];
		}
		if(current == "_A"){
			var array = [];
			while(string.substring(i+1,i+3) != "_E"){
				var next = deurlify(string,i+1,nameKey,valueKey);
				i = next[1];
				array.push(next[0]);
			}
			return [array,i+3];
		}
		if(current.length > 1 && current.endsWith("__")){
			var name = current.substring(0,current.length-2);
			var next = deurlify(string,i+1,nameKey,valueKey);
			var val = {};
			val[name] = next[0];
			return [val,next[1]];
		}
		if(current == "_O"){
			var obj = {};
			while(string.substring(i+1,i+3) != "_E"){
				var next = deurlify(string,i+1,nameKey,valueKey);
				i = next[1];
				Object.assign(obj, next[0]);
			}
			return [obj,i+3];
		}
		if(current == "~" || current == "S~"){
			if(current == "S~"){
				stringMode = true;
			}
			current="";
			while(string.charAt(++i) != "~"){
				current += string.charAt(i);
			}
		}
		if(string.substring(i-2,i+1)=="_E.")
		{
			continue;
		}
		if(current.endsWith(".")){
			current = current.substring(0,current.length-1);
			
			break;
		}
		else if(current.endsWith("_E")){
			current = current.substring(0,current.length-2);
			i-=2;
			break;
		}
		
	}
	if(!stringMode){
		var num = Number.parseFloat(current);
		if(num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER && !current.includes(".") && !current.includes("Infinity")){
			num = BigInt(current);
		}
		return [num,i];
	}
	return [current.replace(/_S/g, ''),i];
}
function deurlifyArray(string, nameKey, valueKey){
	var current = ""
	var array = [];
	for (var i = 0; i < string.length; i++) {
	  current += string.charAt(i);
	  var val = undefined;
	  if(string == "_N"){
		val = null;
	  }
	  if(string == "_T"){
		val = true;
	  }
	  if(string == "_F"){
		val = false;
	  }
	  if(string == "_A"){
		return false;
	  }
	}
}
function sanitize(string,force){
	var str = string+"";
	str = str.replace(/[~]/g, '-');
	if(str.includes(".")||str.includes("_")||force){
		return (force?"S":"")+"~"+str+"~"
	}
	return str;
}
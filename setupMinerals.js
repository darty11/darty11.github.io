var default_config = {
    "sort":["level","name"],
    "sort_high_to_low":[false,false],
}
var config = {}
//copies the default config to the current config
function restoreConfigToDefault(){
    config = $.extend(true,{},default_config);
}
restoreConfigToDefault();
var miningData = {}

//populates the table 
function repopulateTable(data){
    saveConfigToQuery();
    var sortedData = sortData(data);
    var headers = $("#main thead tr th");
    var tableBody = $("#main").find("tbody");
    tableBody.empty();
    for(var key of sortedData){
        var row = document.createElement("tr");
        var mineral = key[1];
		row.dataset.mineral = key[0];
        headers.each(function(){
            row.appendChild(createTableData(mineral,this));
        });
        tableBody.append($(row));
    }
}
/*populates an individual cell of the table with data (does not place said cell into the html though) 
    Uses the data- attribute of the provided header to pull/generate a value from the mineral object. 
*/
function createTableData(mineral, header){
    var key = $(header).data("key")
    var value = "";
    if(key.startsWith("#")){
        key = key.substring(1,key.length)
        switch(key){
            case "icon":
                value = '<img width=30 height=30 src="'+getLargeIcon(mineral.id)+'"></img>';
                break;
            default:
                break;
        }
    }
    else{
		if(key.startsWith("%")){
			value = getCaledValue(mineral, key);
		}
		else{
			value = mineral[key];
		}
        if(!isNaN(parseInt(value)) && "" != value){
            value = Math.round(value*1000)/1000;
        }
        
    }
    var td = document.createElement("td");
    if($(header).data("scroll")){
        value = "<div class=scroll-cell>"+value+"</div>"
    }
    td.innerHTML = value;
    return td;
}
function getCaledValue(mineral, calc){
	var key = calc.substring(1,calc.length);
	var value = 0;
	switch(key){
		case "yield":
			value = getAverageYield(mineral.scarcity)*mineral.price;
			break;
		case "maxyield":
			value = getMaxYield(mineral.scarcity)*mineral.price;
			break;
		case "sectorYield":
			var distance = benRound(distanceToSector(0,0,1,0));
			var density = lerp(mineral.density, 0, distance / mineral.spawnRange);
			value = getAverageYield(mineral.scarcity)*mineral.price*density*(25+45)/2;
			break;
		case "sectorHaul":
			var distance = benRound(distanceToSector(0,0,1,0));
			var density = lerp(mineral.density, 0, distance / mineral.spawnRange);
			value = getAverageYield(mineral.scarcity)*density*(25+45)/2;
			break;
		default:
			break;
	}
	return value;
}

//Sorts the ship object dictionary based off of the config object. Takes and ordinary object and returns an ordered map. 
function sortData(data){
    var pairs = []
    for(var key in data){
        pairs.push([key,data[key]]);
    }
    pairs.sort(function(ship1, ship2){
        return compareViaConfig(ship1[1],ship2[1],0);
    });
    var sorted_data = new Map(pairs);
    return sorted_data;
}
/*A recursive function that takes two ship objects and an index, and compares them using the field in the config objects sort array
that corresponds to the index. If the values are equal it increments the index and calls itself.*/ 
function compareViaConfig(ship1, ship2, index){
    if(index>=config.sort.length){
        return 0;
    }
    var key = config.sort[index];
    var backwards = config.sort_high_to_low[index];
    var val = 0;
	if(key.startsWith("%")){
		var calc1 = getCaledValue(ship1,key);
		var calc2 = getCaledValue(ship2,key)
		if(calc1==calc2){
			return compareViaConfig(ship1, ship2, index+1);
		}
		else if(calc1>calc2){
			val = 1;
		}
		else{
			val = -1
		}
		
	}
	else{
		if(ship1[key]==ship2[key]){
			return compareViaConfig(ship1, ship2, index+1);
		}
		else if(ship1[key]>ship2[key]){
			val = 1;
		}
		else{
			val = -1
		}
	}
    return val*(backwards?-1:1);
}

//makes the sorting arrows match the sorting status of their collumn 
function synchronizeSortingButtons(){
    $(".sorter").each(function(){
        var key = $(this).data("key");
        if(config.sort.includes(key)){
            var index = config.sort.indexOf(key);
            var reverse = config.sort_high_to_low[index];
            if(reverse){
                $(this).children(".sort-arrow").html(repeatString("&uarr;",index+1));
            }
            else
            {
                $(this).children(".sort-arrow").html(repeatString("&darr;",index+1));
            }
        }
        else{
            $(this).children(".sort-arrow").html("&varr;");
        }
    });
}
//Adds span elements to each sorter header containing an arrow indicating if its sorting the data or not. and which way.
function addSortingButtons(){
    
    var span = $("<span class=sort-arrow></span>");
    $(".sorter").append(span);
    synchronizeSortingButtons();
}
//Changes the sorting order of the ships based on the the headed clicked. Also updates the headers UI to reflect the new order.
function doSort(){
    var key = $(this).data("key");
    if(config.sort.includes(key)){
        var reverse = config.sort_high_to_low[config.sort.indexOf(key)];
        if(reverse){
            while(config.sort.includes(key)){
               var index = config.sort.indexOf(key)
               config.sort.splice(index,1);
               config.sort_high_to_low.splice(index,1);
            }
        }
        else
        {
            var index = config.sort.indexOf(key)
            config.sort_high_to_low[index]=true;
        }
    }
    else
    {
        config.sort.unshift(key);
        config.sort_high_to_low.unshift(false);
    }
    synchronizeSortingButtons();
    repopulateTable(miningData);
}
//synchs the ui with the config by changing the value of ui elements to match the config.
function synchronizeConfig(){
    synchronizeSortingButtons();
}
//puts the config in the query. This allows users to sort and filter a page and then send it to other users (once the page is hosted) and have them see the same thing.
function saveConfigToQuery(){
    var query = {};
    for(line in config){
        query[line] = JSON.stringify(config[line]);
    }
    setQuerys(query);
}

function resetConfig(){
    restoreConfigToDefault();
    synchronizeConfig();
    repopulateTable(miningData);
}

getJsonP("minerals");

//Once the dom has loaded, load the miningData info via json-p.
$(document).ready(function(){
    synchronizeConfig();
    addSortingButtons();
	
	miningData = constants.minerals;
    var query = getQuerys();
    if(!$.isEmptyObject(query)){
        for(var item in query){
            if(item in config){
                config[item] = JSON.parse(query[item]);
            }
        }
        synchronizeConfig();
    }
    repopulateTable(miningData);
    
    $(document).on("click",".sorter",doSort);
   
});

var default_config = {
    "sort":["race","name"],
    "sort_high_to_low":[false,false],
}
var config = {}
//copies the default config to the current config
function restoreConfigToDefault(){
    config = $.extend(true,{},default_config);
}
restoreConfigToDefault();
var miningData = {};
var orgData = {};
var mineralArray = [];
var mineralIDs = {};
//populates the table 
function repopulateTable(data){
    saveConfigToQuery();
    var sortedData = sortData(data);
    var headers = $("#main thead tr th");
    var tableBody = $("#main").find("tbody");
    tableBody.empty();
    for(var key of sortedData){
        var row = document.createElement("tr");
        var org = key;
		row.dataset.race = key.name;
        headers.each(function(){
            row.appendChild(createTableData(org,this));
        });
        tableBody.append($(row));
    }
}
/*populates an individual cell of the table with data (does not place said cell into the html though) 
    Uses the data- attribute of the provided header to pull/generate a value from the mineral object. 
*/
function createTableData(race, header){
    var key = $(header).data("key")
    var value = "";
    if(key.startsWith("#")){
        key = key.substring(1,key.length)
        switch(key){
            case "icon":
                value = '<img width=30 height=30 src="'+getLargeIcon(race.id)+'"></img>';
                break;
            default:
                break;
        }
    }
    else{
		if(key.startsWith("%")){
			value = getCaledValue(race, key);
		}
		else{
			value = race[key];
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
function getCaledValue(org, calc){
	var key = calc.substring(1,calc.length);
	var value = 0;
	switch(key){
		case "mineral":
			value = org.engineBossMineral || "N/A";
			if(value in mineralIDs)
			{
				value = mineralIDs[org.engineBossMineral].name;
			}
			break;
		case "mineralCost":
		
			var mineral = mineralIDs[org.engineBossMineral];
			if(mineral){
				value = benRoundMeaningful(3333 * mineral.scarcity * mineral.density / (mineral.level + 1));
			}
			else{
				value = "N/A";
			}
			break;
		case "cost":
			value = org.engineBossPrice;
			break;
		case "race":
			value = constants.races[org.race].name;
			break;
		case "allowInChaosEngine":
			value = constants.races[org.race].allowInChaosEngine;
			break;
		case "raceInfo":
			value = constants.races[org.race].info;
			break;
		default:
			break;
	}
	return value;
}

//Sorts the ship object dictionary based off of the config object. Takes and ordinary object and returns an ordered map. 
function sortData(data){
    var vals = []
    for(var key of data){
        vals.push(key);
    }
    vals.sort(function(ship1, ship2){
        return compareViaConfig(ship1,ship2,0);
    });
    return vals;
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
    repopulateTable(orgData);
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
    repopulateTable(orgData);
}

getJsonP("minerals");
getJsonP("orgs");

//Once the dom has loaded, load the miningData info via json-p.
$(document).ready(function(){
    synchronizeConfig();
    addSortingButtons();
	
	miningData = constants.minerals;
	for(var key in miningData){
		var index = miningData[key].baseID;
		if(index>-1){
			mineralArray[index] = miningData[key];
		}
		mineralIDs[miningData[key].id] = miningData[key];
	}
/* 	var mineralID = 0;
	for(var race of constants.races){
		if(race.race>1){
			//if([16].includes(race.race))
			//{
			//	race.mineral = "N/A";
			//	race.mineralCost = "N/A";
			//	continue;
			//}
			
			
			mineralID = mineralID % mineralArray.length
			if(race.race == 15){
				mineralID = 1;
			}
			while(mineralArray[mineralID].isRare){
				mineralID = (mineralID+1) % mineralArray.length;
			}
			var mineral = miningData["Enriched_"+mineralArray[mineralID].name.split(" ").join("_")];
			race.mineral = mineral.name;
			race.mineralCost = benRoundMeaningful(3333 * mineral.scarcity * mineral.density / (mineral.level + 1) * 10.0) / 10.0;
			mineralID++;
			if(race.race == 15){
				mineralID = 15;
			}
			if([5].includes(race.race)){
				mineralID++;
			}
			
		}
		else{
			race.mineral = "N/A";
			race.mineralCost = "N/A";
		}
	} 
*/
	orgData = constants.orgs
    var query = getQuerys();
    if(!$.isEmptyObject(query)){
        for(var item in query){
            if(item in config){
                config[item] = JSON.parse(query[item]);
            }
        }
        synchronizeConfig();
    }
    repopulateTable(orgData);
    
    $(document).on("click",".sorter",doSort);
   
});

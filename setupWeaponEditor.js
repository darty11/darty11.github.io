//Setting up global variables 
var default_config = {
    "sort":["name"],
    "sort_high_to_low":[false]
}
var configs = {};
var config = {};
var currentTable = "primary_weapon";
//copies the default config to the current config
function restoreConfigToDefault(){
    config = $.extend(true,{},default_config);
}
restoreConfigToDefault();
var weaponData = {};
var weapons = {};

//creates a list of "extensions" which are table headers whose key data starts with a % or #.
function compileExtensions(table){
    var headers = $("#"+table+" thead tr th");
    var extensions = ["%type","%weaponType"];
    for(var header of headers){
        header = $(header);
        var key = header.data("key");
        if(key.startsWith("%")||key.startsWith("#")){
            extensions.push(key);
        }
    }
    return extensions;
}


//populates the table 
function repopulateTable(data){
    saveToQuery();
    var extensions = compileExtensions(currentTable);
    var filteredSortedData = sortData(extendData(extensions,$.extend(true,{},data)));
    var headers = $("#"+currentTable+" thead tr th");
    var tableBody = $("#"+currentTable).find("tbody");
    tableBody.empty();
    for(var key of filteredSortedData){
        var row = document.createElement("tr");
        var wep = key[1];
        headers.each(function(){
            row.appendChild(createTableData(wep,this));
        });
        
        tableBody.append($(row));
    }
}
/*populates an individual cell of the table with data (does not place said cell into the html though)
    Uses the data- attribute of the provided header to pull/generate a value from the ship object. 
*/
function createTableData(wep, header){
    var key = $(header).data("key")
    var value = "";
    
    value = wep[key];
    if(!isNaN(parseInt(value)) && "" != value){
        value = Math.round(value*1000)/1000;
    }
        
    var td = $(document.createElement("td"));
	if(key.startsWith("#")||key == "name"){
		td.html(value);
	}
	else{
		var input = $("<input></input>");
		input.val(value)
		input.attr("data-stat", key);
		input.attr("data-target", wep.id);
		td.append(input);
	}
	if(wep[key] != weaponData[wep.id][key]){
		td.addClass("changed");
	}
    return td[0];
}
//Sorts the weapon object dictionary based off of the config object. Takes and ordinary object and returns an ordered map.
function sortData(data){
    var pairs = []
    for(var key in data){
        pairs.push([key,data[key]]);
    }
    pairs.sort(function(wep1, wep2){
        return compareViaConfig(wep1[1],wep2[1],0);
    });
    var sorted_data = new Map(pairs);
    return sorted_data;
}
/*A recursive function that takes two weapon objects and an index, and compares them using the field in the config objects sort array
that corresponds to the index. If the values are equal it increments the index and calls itself.*/ 
function compareViaConfig(wep1, wep2, index){
    if(index>=config.sort.length){
        return 0;
    }
    var key = config.sort[index];
    var backwards = config.sort_high_to_low[index];
    var val = 0;
    if(wep1[key]==wep2[key]){
        return compareViaConfig(wep1, wep2, index+1);
    }
    else if(wep1[key]>wep2[key]){
        val = 1;
    }
    else{
        val = -1
    }
    return val*(backwards?-1:1);
}
//manages user input for changing tables. 
function updateTabeles(){
    configs[currentTable] = config;
    currentTable = $(this).data("target");
    if(currentTable in configs){
        config = configs[currentTable];
    }
    else{
        resetConfig();
        repopulateTable(weapons);
    }
    synchronizeTables();
    synchronizeConfig();
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
    synchronizeSortingButtons()
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
    repopulateTable(weapons);
}
//synchs the ui with the config by changing the value of ui elements to match the config.
function synchronizeConfig(){

    $("#need_buyable").prop("checked",config.need_buyable);
    $("#max_level").val(config.max_level);
    $(".races-container input").each(function(){
        var input = $(this);
        if(config.races.includes(input.data("index"))){
            input.prop("checked", true);
        }
        else{
            input.prop("checked", false);
        }
    });
    $(".skills-container input").each(function(){
        var input = $(this);
        input.val(config.skills[input.data("name")]);
       
    });
    synchronizeSortingButtons();
}
//makes sure the table currentTable points to is the only visible table and that its button is disabled
function synchronizeTables(){
    
    $(".table-control").prop("disabled",false);
    $("[data-target="+currentTable+"]").prop("disabled",true);
    $(".table").hide();
    $("#"+currentTable).show();
}
//saves the config and edited weapons to the query string, so users can share their changes.
function saveToQuery(){
    var query = {};
	var weaponsDic = {};
	var configDic = {};
    for(var line in config){
        configDic[line] = config[line];
    }

    for(var wep in weapons){
        weaponsDic[wep] = {};
		for(var field in weapons[wep]){
			if(!(field.startsWith("%")||field.startsWith("#")))
			{
				if(weapons[wep][field] != weaponData[wep][field])
				{
					weaponsDic[wep][field] = weapons[wep][field];
				}					
			}
		}
    }
	query.weapons = JSON.stringify(weaponsDic);
	query.config = JSON.stringify(configDic);
    query.table = currentTable;
    setQuerys(query);
}

function resetConfig(){
    restoreConfigToDefault();
    synchronizeConfig();
    repopulateTable(weapons);
}
//Sets the stored javascript weapon stat to the user inputed stat.
function changeStat(){
	var input = $(this);
	var value = input.val();
	if(value == "false")
	{
		value = false;
	}
	else if(value == "true"){
		value = true;
	}
	else{
		value = Number(value);
	}
	weapons[input.attr("data-target")][input.attr("data-stat")] = value;

    repopulateTable(weapons);
}

getJsonP("weapons");

//Once the dom has loaded, load the weapondata info via json-p.
$(document).ready(function(){
    
	
	weaponData = constants.weapons;
	try {
			
		var qWeapons = JSON.parse(getQuerys().weapons);

		for(var id in qWeapons){
			weapons[id] = qWeapons[id];
			for(var prop in weaponData[id]){
				if(!(prop in weapons[id])){
					weapons[id][prop] = weaponData[id][prop];
				}
			}
		}
	}
	catch(e){
		window.alert("Invalid Query:"+e);
	}
	var extensions = compileExtensions(currentTable);
	extendData(extensions,weaponData);
	repopulateTable(weapons);
	
    var query = getQuerys();
    if(!$.isEmptyObject(query)){
        for(var item in query){
            if(item in config){
                config[item] = JSON.parse(query[item]);
            }
        }
        if(query.table){
            currentTable = query.table;
        }
    }
    synchronizeConfig();
    synchronizeTables();
    
    $(document).on("click",".sorter",doSort);
	
    $(document).on("change","input",changeStat); //use change instead of input because the input being edited gets recreated with this method.
    //prevent the user from inputing invalid characters into number type inputs.
    $(document).on('keydown', 'input[type=number]', function(e) {
      if(e.key.match(/[0-9]|(Backspace)/)){
        return true;
      }
      return false;
    });
    
   
})

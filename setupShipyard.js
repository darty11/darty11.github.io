//Setting up global variables 
var default_config = {
    "max_level":120,
    "races":[0,1],
    "sort":["unlockLevel"],
    "sort_high_to_low":[false],
    "need_buyable":true
}
var config = {}
//copies the default config to the current config
function restoreConfigToDefault(){
    config = $.extend(true,{},default_config);
}
restoreConfigToDefault();
var shipData = {}

//Json-p callback
function loadShipData(data){
    shipData = data;
    var query = getQuerys();
    if(!$.isEmptyObject(query)){
        for(var item in query){
            if(item in config){
                config[item] = JSON.parse(query[item]);
            }
        }
        synchronizeConfig();
    }
    repopulateTable(data);
    
}
//populates the table 
function repopulateTable(data){
    saveConfigToQuery();
    var filteredSortedData = sortData(filterData(data));
    var headers = $("#main thead tr th");
    var tableBody = $("#main").find("tbody");
    tableBody.empty();
    for(var key of filteredSortedData){
        var row = document.createElement("tr");
        var ship = key[1];
		row.dataset.ship = key[0];
        headers.each(function(){
            row.appendChild(createTableData(ship,this));
        });
        tableBody.append($(row));
    }
}
/*populates an individual cell of the table with data (does not place said cell into the html though)
    Uses the data- attribute of the provided header to pull/generate a value from the ship object. 
*/
function createTableData(ship, header){
    var key = $(header).data("key")
    var value = "";
    if(key.startsWith("#")){
        key = key.substring(1,key.length)
        switch(key){
            case "icon":
                value = '<img width=30 height=30 src="'+getBigShipIcon(ship.name)+'"></img>';
                break;
            default:
                break;
        }
    }
    else{
        value = ship[key];
        if(!isNaN(parseInt(value)) && "" != value){
            value = Math.round(value*10000)/10000;
        }
        
    }
    var td = document.createElement("td");
    if($(header).data("scroll")){
        value = "<div class=scroll-cell>"+value+"</div>"
    }
    td.innerHTML = value;
    return td;
}
//Filters the ship data based off of the config object.
function filterData(data){
    var filtered_data = $.extend(true,{},data);
    for(var key in filtered_data){
        if(config.max_level<filtered_data[key].unlockLevel){
            delete filtered_data[key];
        }
        else if(!config.races.includes(filtered_data[key].race)){
            delete filtered_data[key];
        }
        else if(!filtered_data[key].buyable && config.need_buyable){
            delete filtered_data[key];
        }
    }
    return filtered_data;
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
    if(ship1[key]==ship2[key]){
        return compareViaConfig(ship1, ship2, index+1);
    }
    else if(ship1[key]>ship2[key]){
        val = 1;
    }
    else{
        val = -1
    }
    return val*(backwards?-1:1);
}
//manages user input for the buyable button.
function updateBuyable(){
    config.need_buyable=$(this).prop("checked");
    repopulateTable(shipData);
}
//manages user inputs for race buttons.
function updateRace(){
    var index = $(this).data("index")
    var checked = $(this).prop("checked");
    
    if(checked){
        config.races.push(index);
    }
    else{
        if(config.races.length == 1){
            $(this).prop("checked",true);
            return;
        }
        config.races.remove(index);
    }
    
    repopulateTable(shipData);
}
//manages user input for the level field
function updateLevel(){
    if($(this).val()>120){
        $(this).val(120);
    }
    else if($(this).val()<0){
        $(this).val(0);
    }
    config.max_level=$(this).val();
    repopulateTable(shipData);
}
//creates checkboxes for each race.
function populateRaceButtons(){
    for(var i = 0; i<constants.races.length; i++){
        var race = constants.races[i];
        if(!race){
            continue;
        }
        var div = $("<div></div>");
        var label = $('<label for="race_'+race.name+'"></label>').text(race.name);
        var input = $('<input id="race_'+race.name+'" type="checkbox" data-index="'+i+'">');
        
        div.append(input,label);
        $(".races-container").append(div);
    }
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
    repopulateTable(shipData);
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
    repopulateTable(shipData);
}
//Opens the ship builder in a new tab
function goToShipBuilder(){
	var ship = $(this).attr("data-ship");
	var locationString = location.href;
	locationString = locationString.substring(0, locationString.lastIndexOf("/"));
	locationString += '/ShipBuilder.html?'+"ship="+encodeURIComponent(ship);
	var win = window.open(locationString, '_blank');
	win.focus();
}

//Once the dom has loaded, load the shipdata info via json-p.
$(document).ready(function(){
    config.need_buyable = $("#need_buyable").prop("checked");
    config.max_level = $("#max_level").val();
    populateRaceButtons();
    synchronizeConfig();
    addSortingButtons();
    var script = document.createElement("script");
    script.id = "jsonp";
    script.src = "ShipData.json-p"
    document.body.appendChild(script);
    
    $(document).on("input","#need_buyable",updateBuyable);
    $(document).on("input","#max_level",updateLevel);
    $(document).on("input",".races-container input",updateRace);
    $(document).on("click",".sorter",doSort);
	$(document).on("click","tbody tr",goToShipBuilder);
    //prevent the user from inputing invalid characters into number type inputs.
    $(document).on('keydown', 'input[type=number]', function(e) {
      if(e.key.match(/[0-9]|(Backspace)/)){
        return true;
      }
      return false;
    });
   
});

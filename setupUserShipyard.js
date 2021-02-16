//This file is meant as an extension to setupShipyard.js. Some data processing functions are replaced, while most sorting and filtering functions are left alone.

var customShips = {};
var shipData = {};
var weaponData = {};
var weaponRanges = {};
var weaponVariants = [];

//loads ships from local storage and put them into the main table
function onDataLoad(){
	linkRangesAndSubWeapons(weaponRanges,weaponVariants,weaponData);
	fixEngines(weaponRanges,weaponData);
	var shipNames = JSON.parse(window.localStorage.getItem("ships")) || [];
	for(var name of shipNames){
		var ship = JSON.parse(window.localStorage.getItem("ships_"+name));
		if(ship){
			customShips[name] = $.extend(
				false,
				{
					"shipID":ship.ship,
					"customName":ship.name,
					"loadout":ship.loadout
				},
				shipData[ship.ship]
			);
		}
	}
	var headers = $("#main thead tr th");
	for(var header of headers){
		header = $(header);
		var key = header.data("key");
		if(key.startsWith(".")){
			for(var shipName in customShips){
				customShips[shipName][key] = getShipStat(customShips[shipName], customShips[shipName].loadout, weaponData, key.substring(1,key.length));
			}
		}
	}
	
	repopulateTable({});
		
}

//populates the table 
function repopulateTable(data){
    saveConfigToQuery();
	
    var filteredSortedData = sortData(filterData(customShips));
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
			case "delete":
                value = '<button class="delete-button">Delete</button>';
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
//Opens the ship builder in a new tab
function goToShipBuilder(){
	var ship = customShips[$(this).attr("data-ship")];
	
	var locationString = location.href;
	locationString = locationString.substring(0, locationString.lastIndexOf("/"));
	var query = {};
    for(line in ship.loadout){
        if(ship.loadout[line].length){
            query[line] = JSON.stringify(ship.loadout[line]);
        }
    }
    query.ship = ship.shipID;
	query.name = ship.customName;
	locationString += '/ShipBuilder.html'+genQuerys(query);
	var win = window.open(locationString, '_blank');
	win.focus();
}
//Remove the ship belonging to the row this button sits in from local storage
function deleteShip(){
	var ship = $(this).parent().parent().attr("data-ship");
	var shipNames = JSON.parse(window.localStorage.getItem("ships")) || [];
	shipNames.remove(ship);
	delete customShips[ship];
	window.localStorage.setItem("ships",JSON.stringify(shipNames));
	window.localStorage.removeItem("ships_"+ship);
	repopulateTable({});
	return false;
}

getJsonP("ships");
getJsonP("weapons");
getJsonP("ranges");
getJsonP("variant_ranges");


//Once the dom has loaded, load the shipdata info via json-p.
$(document).ready(function(){
	shipData = constants.ships;
	weaponData = constants.weapons;
    weaponRanges = constants.ranges;
    weaponVariants = constants.variant_ranges;
	onDataLoad();
	
	$(document).on("click",".delete-button",deleteShip);
   
})

//global variables
var defaultShip = "Starfighter";
var currentShip = "";
var loadout = {
    "PRIMARY_WEAPON":["pl"],
    "ENGINE":["s"],
    "SHIELD":["b"],
    "AUGMENTATION":[],
    "SECONDARY_WEAPON_STANDARD":["st"],
    "SECONDARY_WEAPON_UTILITY":["min"],
    "SECONDARY_WEAPON_MINE":[],
    "SECONDARY_WEAPON_PROXIMITY":[],
    "SECONDARY_WEAPON_LARGE":[]
};

var shipData = {};
var weaponData = {};
var weaponRanges = {};
var weaponVariants = [];
var craftables = {};

var selectedWeapon = "";
var selectedSlotType = "";
var selectedSlot;

var activeAug = false;
//JSON-p callbacks. Save the data and then call onDataLoad, which checks if all the data is loaded and if it is starts setting up the page.
function loadShipData(data){
    shipData = data;
    onDataLoad()
}
function loadWeaponData(data){
    weaponData = data;
    onDataLoad()
}
function loadWeaponRangeAndVariantData(rages, variants, craft){
    weaponRanges = rages;
    weaponVariants = variants;
	craftables = craft;
    onDataLoad()
}
function onDataLoad(){
    if(!$.isEmptyObject(shipData) && !$.isEmptyObject(weaponData) && !$.isEmptyObject(weaponRanges)){
		//found in common.js
        linkRangesAndSubWeapons(weaponRanges,weaponVariants,weaponData);
        //found in common.js
		linkCraftables(craftables,weaponData);
		//found in common.js
        fixEngines(weaponRanges,weaponData);
        initializeShipbuilder();
    }
}
//loads data from the query string, validates it, then sets up the weapon slots and populates them with the current loadout.
function initializeShipbuilder(){
    var query = getQuerys();
    if(!$.isEmptyObject(query)){
        for(var item in query){
            if(item in loadout){
                loadout[item] = JSON.parse(query[item]);
            }
        }
        if(query.ship){
            currentShip = query.ship;
        }
		if(query.name){
            $("#ship_custom_name").val(query.name);
        }
    }
    if(!(currentShip in shipData)){
        currentShip = defaultShip;
    }
    validateLoadout();
	
    var ship = shipData[currentShip];
    $("#ship_name").text(ship.name);
    addSlot($("#primaries_container"),"PRIMARY_WEAPON");
    addSlot($("#engine_container"),"ENGINE");
    addSlot($("#shield_container"),"SHIELD");
    
    addSlot($("#augmentation_container"),"AUGMENTATION",ship.augmentations);
    addSlot($("#secondary_container"),"SECONDARY_WEAPON_STANDARD",ship.standardSecondary);
    addSlot($("#secondary_container"),"SECONDARY_WEAPON_UTILITY",ship.utilitySecondary);
    addSlot($("#secondary_container"),"SECONDARY_WEAPON_MINE",ship.mineSecondary);
    addSlot($("#secondary_container"),"SECONDARY_WEAPON_PROXIMITY",ship.proximitySecondary);
    addSlot($("#secondary_container"),"SECONDARY_WEAPON_LARGE",ship.largeSecondary);
    $("head").append($('<link rel="icon" type="image/png" href="'+getSmallShipIcon(currentShip)+'">'));
    updateShiploadout();
    updateLeftPanel();
}

//goes through the loadout and splices the weapon lists so that they are as long as the max length they can be.
function validateLoadout(){
    var ship = shipData[currentShip];
    for(var slotType in loadout){
		var length = 0;
        switch(slotType){
            case "PRIMARY_WEAPON":
            case "ENGINE":
            case "SHIELD":
                length = 1;
                break;
            case "AUGMENTATION":
                length = ship.augmentations;
				
                break;
            case "SECONDARY_WEAPON_STANDARD":
                length = ship.standardSecondary;
                break;
            case "SECONDARY_WEAPON_UTILITY":
                length = ship.utilitySecondary;
                break;
            case "SECONDARY_WEAPON_MINE":
                length = ship.mineSecondary;
                break;
            case "SECONDARY_WEAPON_PROXIMITY":
                length = ship.proximitySecondary;
                break;
            case "SECONDARY_WEAPON_LARGE":
                length = ship.largeSecondary;
                break;
            
        }
		loadout[slotType] = loadout[slotType].splice(0,length);
		if(length>0){
		
			loadout[slotType][length-1] = loadout[slotType][length-1] || null;
		}	
		
    }
}
//Calculates and displays various statistics about the ship with its current loadout.
function calculateStats(){
    var values = $("#bottom_panel .value");
    var ship = shipData[currentShip];
    for(var element of values){
        var value = $(element);
        var type = value.attr("data-type");
        value.html(String(getShipStat(ship,loadout, weaponData, type)));
        
    }
}
//Adds weapons from weaponData to table of the provided type if they match the type. 
//originally this method used jquery to construct the table body by constructing jquery objects of each row and modifying them via jquery, but that lead to 
//significantly increased loading times, so an unglier method is used.
function populateWeaponsTable(tableType){
    
    var table = $('table.weapons-table[data-type="'+tableType+'"]');
    var html = "";
    for(rangeId in weaponRanges){
        var range = weaponRanges[rangeId];
        if(weaponData[range.items[0]]){
            var weps = [];
            var topWep = null;
            for(var i = 0; i<range.items.length; i++){
                var weapon = weaponData[range.items[i]];
                if(rightType(weapon,tableType)){
                    topWep = weapon;
                    weps.push(weapon);
                }
            }
            
            if(rightType(weaponData[range.items[range.levels-1]],tableType)){
                topWep = weps.splice(range.levels-1,1)[0];
            }
            else{
                weps.remove(topWep);
            }
            var htmlFrag = "";
            if(topWep){
                htmlFrag += '<tr class = "'+getWeaponClass(topWep)+'" data-top = true data-range="'+rangeId+'" data-id="'+topWep.id+'"><td class="expander '+((weps.length==0)?"disabled":"")+'"><span class="expand">+</span><span class="collapse">-</span></td><td "><img src='+ getSmallItemIcon(topWep.iconName) +' width="30" height="30"></img></td><td>'+ topWep.name +'</td></tr>'

                for(weapon of weps){
                    htmlFrag += '<tr class = "'+getWeaponClass(weapon)+'" style = "display:none" data-range="'+rangeId+'" data-id="'+weapon.id+'"><td></td><td><img src='+ getSmallItemIcon(weapon.iconName) +' width="30" height="30"></img></td><td>'+ weapon.name +'</td></tr>'
                }
                html += htmlFrag;
            }
        }
    }
    table.find("tbody").append(html);
}
//Adds the html for a slot to the container. 
function addSlot(container, slotType, count){
    if(typeof count === "undefined"){
        count = 1;
    }
    for(var i = 0; i<count; i++){
        var slot = $('<div class = "slot empty"></div>');
        slot.attr("data-type",slotType)
        var img = $('<img></img>');
        var name = slotType;
        if(name.toLowerCase().startsWith("secondary_weapon")){
            name = name.toLowerCase().replace("secondary_weapon_","") + "_secondary";
        }
        name = toCamelCase(name.replace(/\_/g," ")).replace(/ /g,"<br/>");
        var para = $('<p class = "slot-name">'+name+'</p>');
        var name = $('<p class = "weapon-name"></p>');
        var square = $('<div class = "square"></div>');
        square.append(img);
        square.append(para);
        square.append(name);
        slot.append(square);
        container.children(".slot-container").append(slot);
    }
}
//Makes sure there is no more than 1 active aug. If there is 1 active aug, sets a class on the aug table that highlights active augs in red.
function checkAugs(){
    activeAug = false;
    var oldActive = activeAug;
    var activeIndex;
    for(var i = 0; i<loadout["AUGMENTATION"].length;i++ ){
        if(loadout["AUGMENTATION"][i]){
            var aug = weaponData[loadout["AUGMENTATION"][i]];
            if(!aug.passive){
                if(activeAug)
                {
                    loadout["AUGMENTATION"][i] = null;
                }
                else{
                    activeAug = true;
                    activeIndex = i;
                }
            }
        }
    }
    if(activeAug && activeIndex != 0){
        var old = loadout["AUGMENTATION"][0];
        loadout["AUGMENTATION"][0] = loadout["AUGMENTATION"][activeIndex];
        loadout["AUGMENTATION"][activeIndex] = old;
    }
    var table = $('table.weapons-table[data-type="AUGMENTATION"]');
    if(activeAug){
        table.addClass("passive");
    }
    else{
        table.removeClass("passive");
    }
}
//marks an row in the augmentations table as active if it is active.
function markActive(){
    var row = $(this);
    var weapon = weaponData[row.attr("data-id")];
    if(!weapon.passive){
        row.attr("data-active",true);
    }
}
//Ensures the html display of the loadout reflects the javascript loadout object.
function synchronizeWeaponIcons(){
    
    for(var name in loadout){
        var weapons = loadout[name]
        var slots = $('.slot[data-type="'+name+'"]');
        for(var i = 0; i<slots.length; i++){
            if(typeof slots[i] !=="undefined"){
                var slot = $(slots[i]);
                if(weapons[i] != undefined){ //not null or undefined
                    var weapon = weaponData[weapons[i]];
                    slot.removeClass("empty");
                    slot.find("img").attr("src",getSmallItemIcon(weapon.iconName));
                    slot.attr("data-weapon",weapon.id);
                    slot.find(".weapon-name").text(shortenWeaponName(weapon.name))
					slot.find(".weapon-name").removeClass( "craftable npr buyable seasonal locked").addClass(getWeaponClass(weapon));
					
                }
                else{
                    slot.addClass("empty");
                    slot.attr("data-weapon","");
                }
            }
        }
    }

}
//Marks the slot clicked on as active. This tells the app what weapons to display as options and where to put them.
function selectSlot(){
    var slot = $(this).parent();;
    selectedSlotType = slot.attr("data-type");
    selectedWeapon = slot.attr("data-weapon");
    selectedSlot = slot;
    $(".slot").removeClass("selected");
    slot.addClass("selected");
    updateLeftPanel();
    updateRightPanel();
}
//expands a parent row to show all its child rows. parent and child rows are created in populateWeaponsTable.
function expandRow(){
    row = $(this).parent();
    $('tr[data-range="'+row.attr("data-range")+'"]').show();
    $(this).removeClass("expander");
    $(this).addClass("collapser");
}
//collapses a parent row to hide all its child rows.
function collapseRow(){
    row = $(this).parent();
    $('tr[data-range="'+row.attr("data-range")+'"]').hide();
    row.show();
    $(this).removeClass("collapser");
    $(this).addClass("expander");
}
//puts the selected weapon into the active slot. called when a weapon row in the left pannel is clicked
function selectWeapon(){
    var slot = selectedSlot
    var slotType = slot.attr("data-type")
    var index = $('div[data-type="'+slotType+'"]').index(selectedSlot);
    var weapon = $(this).parent().attr("data-id");
    loadout[slotType][index] = weapon;
    selectedWeapon = weapon;
    checkAugs();
    updateShiploadout();
}
//when a slot is right clicked, this function removes its weapon.
function removeWeapon(){
    var slot = $(this).parent();
    var slotType = slot.attr("data-type")
    var index = $('div[data-type="'+slotType+'"]').index(slot);
    loadout[slotType][index] = null;
    selectedWeapon = null;
    checkAugs();
    updateShiploadout();
    return false;
}
//Hides the current weapons table and shows the table that matches the current slot's slot type. Also populates that table if its empty.
function updateLeftPanel(){
    $('table.weapons-table').hide();
    $('table.weapons-table[data-type="'+selectedSlotType+'"]').show();
    if($('table.weapons-table[data-type="'+selectedSlotType+'"] tbody').children().length==0){
        populateWeaponsTable(selectedSlotType);
		if(selectedSlotType == "AUGMENTATION"){
			$('table.weapons-table[data-type="'+selectedSlotType+'"] tbody').children().each(markActive);
		}
    }
	
}
//updates the query string, stats, slot icons and weapon stat displays
function updateShiploadout(){
    synchronizeWeaponIcons();
    calculateStats();
    var query = {};
    for(line in loadout){
        if(loadout[line].length){
            query[line] = JSON.stringify(loadout[line]);
        }
    }
    query.ship = currentShip;
	query.name = $("#ship_custom_name").val();
    setQuerys(query);
    updateRightPanel();
}
//Displays the stats of the weapon in the selected slot.
function updateRightPanel(){
    
    $('table.stat-table').hide();
    var table = $('table.stat-table[data-type="'+selectedSlotType+'"]')
    if(selectedWeapon){
        table.show();
        table.find("th").each(setValue);
    }
}
//places the right weapon stat into the provided row (the header of the row is actually provided)
function setValue(index, element){
    var header = $(element);
    var data = header.parent().children("td");
    var value = getExtendedValue(weaponData[selectedWeapon],header.attr("data-key"))
    if(!isNaN(parseInt(value)) && "" != value){
        value = Math.round(value*1000)/1000;
    }
    data.html(String(value));
}
//Saves the ship loadout to local storage
function saveToStorage(){
    var shipObj = {};
    shipObj.loadout = loadout;
    shipObj.ship = currentShip;
    var name = $("#ship_custom_name").val();
    shipObj.name = name;
    if(name){
		window.localStorage.setItem("ships_"+name,JSON.stringify(shipObj));
		var shipsArray = JSON.parse(window.localStorage.getItem("ships")) || [];
		if(!shipsArray.includes(name)){
			shipsArray.push(name);
		}
		window.localStorage.setItem("ships",JSON.stringify(shipsArray));
        window.alert("Ship saved!");
    }
    else{
        window.alert("Ship must have a name!");
    }
}
function generateBenString(){
	var benString = shipData[currentShip].id;
	benString+="|";
	benString+=loadout.PRIMARY_WEAPON[0];
	benString+="|";
	var weapons = loadout.SECONDARY_WEAPON_STANDARD.concat(loadout.SECONDARY_WEAPON_UTILITY,loadout.SECONDARY_WEAPON_MINE,loadout.SECONDARY_WEAPON_PROXIMITY,loadout.SECONDARY_WEAPON_LARGE)
	for(var weapon of weapons){
		benString+=weapon+",";
	}
	if(weapons.length){
		benString = benString.substring(0,benString.length-1)
	}
	benString+="|";
	benString+=loadout.ENGINE[0];
	benString+="|";	
	benString+=loadout.SHIELD[0];
	benString+="|";	
	for(var aug of loadout.AUGMENTATION){
		benString+=aug+",";
	}
	if(loadout.AUGMENTATION.length){
		benString = benString.substring(0,benString.length-1)
	}
	//benString = benString.replace(/null,/g,"");
	//benString = benString.replace(/,null/g,"");
	benString = benString.replace(/null/g," ");
	window.alert(benString);
}


//Once the dom has loaded, setup the rest of it
$(document).ready(function(){
    
    var script = document.createElement("script");
    script.id = "jsonp";
    script.src = "ShipData.json-p"
    document.body.appendChild(script);
    script = document.createElement("script");
    script.id = "jsonp2";
    script.src = "WeaponData.json-p"
    document.body.appendChild(script);
    script = document.createElement("script");
    script.id = "jsonp3";
    script.src = "WeaponExtraData.json-p"
    document.body.appendChild(script);
    
    $(document).on("click",".slot .square",selectSlot);
    $(document).on("contextmenu",".slot .square",removeWeapon);
    $(document).on("click",".expander",expandRow);
    $(document).on("click",".collapser",collapseRow);
    $(document).on("click",".weapons-table td:not(:nth-child(1))",selectWeapon);
    $(document).on("input",".display-group input",calculateStats);
    $(document).on("input","#ship_custom_name",updateShiploadout);
    $(document).on('keydown', 'input[type=number]', function(e) {
      if(e.key.match(/[0-9]|(Backspace)/)){
        return true;
      }
      if(e.key.match(/\./)&&!this.value.includes(".")&&this.value){
        return true;
      }
      return false;
    });
})
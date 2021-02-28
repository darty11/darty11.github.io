//Setting up global variables 
var default_config = {
	"races":[0],
    "sort":["name"],
    "sort_high_to_low":[false],
    "need_buyable":false,
    "skills":{
        "Shields":11,
        "Propulsion":11,
        "Energy":11,
        "Lasers":11,
        "Explosives":11,
        "Light":11,
        "Support":11,
        "Chemistry":11,
        "Gravity":11,
        "Programming":11
    },
    "hidden":[]
}
if(constants.races.length>2){
	for(var i = 2; i<constants.races.length; i++){
		default_config.races[i-1] = i;
	}
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
var weaponRanges = {};
var weaponVariants = [];
var craftables = {};

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
    saveConfigToQuery();
    var extensions = compileExtensions(currentTable);
    var filteredSortedData = sortData(filterData(extendData(extensions,data)));
    var headers = $("#"+currentTable+" thead tr th");
    var tableBody = $("#"+currentTable).find("tbody");
    tableBody.empty();
	
	var array = new Array();
    for(var key of filteredSortedData){
        //var row = document.createElement("tr");
		var wep = key[1];
		var start = "<tr>"
		if(config.hidden.includes(wep["id"]))
        {
            start = '<tr class = "hidden">'
        }
		array[array.length] = "<tr>";
        
        headers.each(function(){
            array[array.length] = createTableData(wep,this);
        });
        array[array.length] = "</tr>";
        //tableBody.append($(row));
    }
	tableBody.html(array.join(""));
}
/*populates an individual cell of the table with data (does not place said cell into the html though)
    Uses the data- attribute of the provided header to pull/generate a value from the weapon object. 
*/
function createTableData(wep, header){
    var key = $(header).data("key")
    var value = "";
    
    value = wep[key];
    if(!isNaN(parseInt(value)) && "" != value){
        value = Math.round(value*1000)/1000;
    }
        
    //var td = document.createElement("td");
    if($(header).data("scroll")){
        value = "<div class=scroll-cell>"+value+"</div>"
    }
    //td.innerHTML = value;
    return "<td>"+value+"</td>";
}

//Filters the weapon data based off of the config object.
function filterData(data){
    var filtered_data = $.extend(true,{},data);
    for(var key in filtered_data){
        if(!config.races.includes(filtered_data[key].race)){
            delete filtered_data[key];
        }
        else if(!filtered_data[key].buyable && config.need_buyable){
            delete filtered_data[key];
        }
        else if(!rightType(filtered_data[key],currentTable)){
            delete filtered_data[key];
        }
        else if(config.skills[filtered_data[key]["#skill"]]<filtered_data[key]["#level"]){
            delete filtered_data[key];
        }
    }
    return filtered_data;
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
//manages user input for the buyable button.
function updateBuyable(){
    config.need_buyable=$(this).prop("checked");
    repopulateTable(weaponData);
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
    
    repopulateTable(weaponData);
}
function updateRaceSingle(){
    var index = $(this).data("index")
    
    config.races = [index];
	$(".races-container input").prop("checked",false);
    $(this).prop("checked",true);
    
    repopulateTable(weaponData);
}
//manages user inputs for kill inputs.
function updateSkill(){
    var name = $(this).data("name")
    var value = $(this).val();
    
    config.skills[name] = value;
    
    repopulateTable(weaponData);
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
        repopulateTable(weaponData);
    }
    synchronizeTables();
    synchronizeConfig();
}

//creates checkboxes for each race.
function populateRaceButtons(){
    
    var div = $("<div></div>");
    var label = $('<label for="race_human_aralien"></label>').text("Human/Aralien");
    var input = $('<input id="race_human_aralien" type="checkbox" data-index="0">');
    
    div.append(input,label);
    $(".races-container").append(div);
    for(var i = 2; i<constants.races.length; i++){
        var race = constants.races[i];
        if(typeof(race)=="undefined"){
            continue;
        }
        var div = $("<div></div>");
        var label = $('<label for="race_'+race.name+'"></label>').text(race.name);
        var input = $('<input id="race_'+race.name+'" type="checkbox" data-index="'+i+'">');
        
        div.append(input,label);
        $(".races-container").append(div);
    }
}
//creates inputs for each skill.
function populateSkillInputs(){

    for(var i = 0; i<constants.skills.length; i++){
        var skill = constants.skills[i];
        var div = $("<div></div>");
        var label = $('<label for="race_'+skill.name+'"></label>').text(skill.name+": ");
        var input = $('<input min = 0 max = 11 id="race_'+skill.name+'" type="number" data-name="'+skill.name+'">');
        
        div.append(label,input);
        $(".skills-container").append(div);
    }
}
//creates tab buttons for each table
function populateTableButtons(){
    var tables = $(".table");
    var container = $("#tabs");
    for(table of tables){
        var id = table.id;
        var name = id.toLowerCase();
        if(name.toLowerCase().startsWith("secondary_weapon")){
            name = name.replace("secondary_weapon_","") + "_secondary";
        }
        name = toCamelCase(name.replace(/\_/g," "));
        var button = $('<button class = "table-control"></button>');

        button.attr("data-target",id);
        button.text( name );
        var div = $("<div></div>");
        div.append(button);
        container.append(div);
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
    repopulateTable(weaponData);
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
//puts the config in the query. This allows users to sort and filter a page and then send it to other users (once the page is hosted) and have them see the same thing.
function saveConfigToQuery(){
    var query = {};
    for(line in config){
        query[line] = JSON.stringify(config[line]);
    }
    query.table = currentTable;
    setQuerys(query);
}
function resetConfig(){
    restoreConfigToDefault();
    synchronizeConfig();
    repopulateTable(weaponData);
}
//User controls for hiding/showing weapons
function showAll(){
    $("#"+currentTable).find("input.show-hide-selector").parent().parent().show();
    config.hidden = [];
    saveConfigToQuery();
}
function hideSelected(){
    var selected = $("#"+currentTable).find("input.show-hide-selector:checked");
    selected.prop("checked",false);
    selected.parent().parent().hide();
    for(var i of selected){
        config.hidden.push($(i).data("id"));
    }
    saveConfigToQuery();
}
function showOnlySelected(){
    var notSelected = $("#"+currentTable).find("input.show-hide-selector:not(:checked)");
    notSelected.parent().parent().hide();
    $("#"+currentTable).find("input.show-hide-selector:checked").prop("checked",false);
    for(var i of notSelected){
        config.hidden.push($(i).data("id"));
    }
	
    saveConfigToQuery();
}
function editSelected(){
	var selected = $("#"+currentTable).find("input.show-hide-selector:checked");
	var weapons = {};
	selected.each(function(){
		weapons[$(this).attr("data-id")]={};
	});
	var locationString = location.href;
	locationString = locationString.substring(0, locationString.lastIndexOf("/"));
	locationString += '/WeaponsEditor.html?'+"weapons="+encodeURIComponent(JSON.stringify(weapons))+"&table="+encodeURIComponent(currentTable);
	var win = window.open(locationString, '_blank');
	win.focus();
}
getJsonP("weapons");
getJsonP("ranges");
getJsonP("craftable");
getJsonP("variant_ranges");

//Once the dom has loaded, load the weapondata info via json-p.
$(document).ready(function(){
    //config.need_buyable = $("#need_buyable").prop("checked");
    populateRaceButtons();
    populateSkillInputs();
    addSortingButtons();
    populateTableButtons();
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
    
    weaponData = constants.weapons
	weaponRanges = constants.ranges;
    weaponVariants = constants.variant_ranges;
	craftables = constants.craftable;
	//found in common.js
	linkRangesAndSubWeapons(weaponRanges,weaponVariants,weaponData);
	//found in common.js
	linkCraftables(craftables,weaponData);
	//found in common.js
	fixEngines(weaponRanges,weaponData);
    repopulateTable(weaponData);
    
    $(document).on("input","#need_buyable",updateBuyable);
    $(document).on("input",".races-container input",updateRace);
    $(document).on("dblclick",".races-container input",updateRaceSingle);
    $(document).on("input",".skills-container input",updateSkill);
    $(document).on("click",".table-control",updateTabeles);
    $(document).on("click",".sorter",doSort);
    //prevent the user from inputing invalid characters into number type inputs.
    $(document).on('keydown', 'input[type=number]', function(e) {
      if(e.key.match(/[0-9]|(Backspace)/)){
        return true;
      }
      return false;
    });
    
   
})

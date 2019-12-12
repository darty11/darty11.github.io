var shipData = {}
var aralien = false;


//Json-p callback
function loadShipData(data){
    shipData = data;
    repopulateTree();
    var race = getQuerys().race;
    if(race == "aralien"){
        enable_aralien();
    }
    else{
        enable_human();
    }
}
//Recreates the tree
function repopulateTree(){
    $("#HumanShips").children(".tree-node").remove();
    var node = createNode(constants.tree_human)
    $("#HumanShips").append(node);
    $("#HumanShips").hide();
    
    $("#AralienShips").children(".tree-node").remove();
    node = createNode(constants.tree_aralien);
    $("#AralienShips").append(node);
    $("#AralienShips").hide();

}
//creates an individual node of the tree
function createNode(nodeObject){
    var node = $($("#tree-node").html());
	var id = nodeObject.name.split(" ").join("_"); 
	node.attr("data-ship",id);
    node.find(".image-container img").attr("src",getBigShipIcon(nodeObject.name));
	node.find(".image-container img").attr("alt",nodeObject.name);
    var childrenElement = node.find(".children");    
    for(var child of nodeObject.children){
        var childNode = createNode(child);
        childrenElement.append(childNode);
    }
    return node;
}
//draws a beizier curve from the parent node to each child node
function setupLines(svg,headElement){
    var children = headElement.children(".children").children(".tree-node");
    var epos = expandedPosition(headElement.children(".image-container"));
    for(var child of children){
        var path = document.createElementNS("http://www.w3.org/2000/svg","path");
        var childEpos = expandedPosition($(child).children(".image-container"));
        var d = "M "+epos.x+" "+epos.bottom+" C "+[epos.x,childEpos.top,childEpos.x,epos.bottom,childEpos.x,childEpos.top].join(" ")
        path.setAttribute("d", d);
        svg[0].appendChild(path);
        setupLines(svg,$(child));
    }
}

//control functions
function enable_human(){
    aralien = false;
    $("#AralienShips").hide();
    $("#HumanShips").show();
    $("#AralienLines").hide();
    $("#HumanLines").show();
    update_buttons();
    redrawLines()
    
    setQuerys({"race":"human"})
}
function enable_aralien(){
    aralien = true;
    $("#HumanShips").hide();
    $("#AralienShips").show();
    $("#HumanLines").hide();
    $("#AralienLines").show();
    update_buttons();
    
    redrawLines()
    setQuerys({"race":"aralien"})
}
function redrawLines(){
    $(".line-container").empty();
    setupLines($(".line-container"),aralien?$("#AralienShips").children(".tree-node"):$("#HumanShips").children(".tree-node"));
}
function update_buttons(){
    $("#human_button").prop('disabled', !aralien);
    $("#aralien_button").prop('disabled', aralien);
}
//sends the user to the ship builder page.
function goToShipBuilder(){
	var ship = $(this).parent().attr("data-ship");
	var locationString = location.href;
	locationString = locationString.substring(0, locationString.lastIndexOf("/"));
	locationString += '/ShipBuilder.html?'+"ship="+encodeURIComponent(ship);
	var win = window.open(locationString, '_blank');
	win.focus();
}

$(document).ready(function(){
    var script = document.createElement("script");
    script.id = "jsonp";
    script.src = "ShipData.json-p"
    document.body.appendChild(script);
	
    $(document).on("click",".image-container",goToShipBuilder);
    $(window).resize(redrawLines);

});
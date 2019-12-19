var galaxyData = {};
var miningData = {};
var system = "Delta_Trianguli";


//Json-p callback
function loadGalaxyData(data){
    galaxyData = data;
	checkData();
}
//Json-p callback
function loadMiningData(data){
    miningData = data;
	checkData();
}
function checkData(){
	if(!$.isEmptyObject(miningData) && !$.isEmptyObject(galaxyData)){
		if(getQuerys().system){
			system = getQuerys().system;
		}
		setupSystem();
	}
}


function setupSystem(){
    var systemObj = galaxyData[system];
	for(var spawn of systemObj.mineralSpawns){
		systemObj.sectors[spawn.location.y].columns[spawn.location.x].spawner = spawn;
	}
	for(var i = 0; i < systemObj.sectors.length; i++){
		var columns = systemObj.sectors[i].columns;
		for(var j = 0; j < columns.length; j++){
			var sector = createSector(columns[j],j,i);
			$("#sectors")[0].appendChild(sector);
		}
	}
	
	var viewbox = "-1 -1";
	viewbox += " "+Math.round(getSectorX(j,1)-8.6603+2.5);
	viewbox += " "+Math.round(getSectorY(i)-5+2.5);
	$("#sectors")[0].setAttribute("viewBox", viewbox);
	$("#sector_name").html(systemObj.name);
}
function getSectorType(id){
	return constants.lookup.sectorType[id];
}

function createSector(sectorObject, x, y){
    var node = document.createElementNS("http://www.w3.org/2000/svg","g");
	var translate = "translate("+getSectorX(x,y) +" "+getSectorY(y)+")";
	node.setAttribute("transform",translate);
	var outline = document.createElementNS("http://www.w3.org/2000/svg","use");
	outline.setAttribute("href","#sector_outline");
	if(getSectorType(sectorObject.type) != "Empty"){
		var ast = document.createElementNS("http://www.w3.org/2000/svg","use");
		if($("#"+getSectorType(sectorObject.type)).length){
			ast.setAttribute("href","#"+getSectorType(sectorObject.type) );
			switch(sectorObject.owner){
				case 0:
					ast.setAttribute("class","org-HA");
					break;
				case 1:
					ast.setAttribute("class","org-AE");
					break;
				case 2:
					ast.setAttribute("class","org-FI");
					break;
				case 3:
					ast.setAttribute("class","org-PI");
					break;
			}
		}
		else{
			ast.setAttribute("href","#Unknown" );
		}
		
		node.appendChild(ast);
	}
	if(sectorObject.spawner){
		var spawn = document.createElementNS("http://www.w3.org/2000/svg","use");
		var mineral = miningData[sectorObject.spawner.name.split(" ").join("_")];
		spawn.setAttribute("href","#spawn_point");
		spawn.setAttribute("fill",getRGB(mineral.color));
		spawn.setAttribute("stroke",getRGB(mineral.secondaryColour));
		spawn.setAttribute("class","mineral-spawn");
		var radius = document.createElementNS("http://www.w3.org/2000/svg","circle");
		radius.setAttribute("class","mineral-spawn-radius");
		radius.setAttribute("r",(mineral.spawnRange-0.5)*17.3206);
		radius.setAttribute("fill","none");
		radius.setAttribute("stroke",getRGB(mineral.secondaryColour));
		node.appendChild(radius);
		node.appendChild(spawn);
	}
	node.setAttribute("class","sector");
	var html = "";
	html += "<h1>"+sectorObject.name+"</h1>"
	html += getMinerals(x,y);
	node.setAttribute("data-popup",html);
	node.appendChild(outline);
    return node;
}
function getRGB(colorObj){
	return "rgb("+255*colorObj.r+","+255*colorObj.g+","+255*colorObj.b+")";
}
function toggleSpawns(){
	$("#sectors").toggleClass("spawns")
}
function getMinerals(x, y){
    var systemObj = galaxyData[system];
	var val = "";
	for(var spawn of systemObj.mineralSpawns){
		var mineral = miningData[spawn.name.split(" ").join("_")];
		var distance = round(distanceTo(x,y,spawn.location.x,spawn.location.y));
		var density = lerp(mineral.density, 0, distance / mineral.spawnRange);
		if(density){
			val += "<p>"+spawn.name+":"+Math.round(density*100)/100+"</p>";
		}
	}
	return val;
}
function round(val){
	var fraction = val % 1;
	var floor = val - fraction;
	if(fraction == 0.5){
		if(floor % 2 ){
			return floor+1;
		}
	}
	else if(fraction> 0.5){
		return floor+1;
	}
	return floor;
}
function lerp(start, end, progress){
	if(progress < 0){
		progress = 0;
	}
	else if(progress > 1){
		progress = 1;
	}
	return start + (end - start) * progress;
}
function distanceTo(x,y,x2,y2){
	if(y % 2 == 1){
		x += 0.5;
	}
	if(y2 % 2 == 1){
		x2 += 0.5;
	}
	var x3 = x-x2;
	var y3 = y-y2;
	return Math.sqrt(x3*x3 + y3*y3);
}
function getSectorX(column, row){
	var x = 8.6603 + column * 17.3206;
	if(row % 2){
		x+=8.6603;
	}
	return x;
}
function getSectorY(row){
	var y = 10 + row * 15;
	return y;
}
function showTooltip(){
	$(this).parent().addClass("selected");
	$(this).parent().append($(this));
	$(".tooltip").html($(this).attr("data-popup"));
}
$(document).ready(function(){
    var script = document.createElement("script");
    script.id = "jsonp";
    script.src = "GalaxyData.json-p"
    document.body.appendChild(script);
	
	
    var script = document.createElement("script");
    script.id = "jsonp2";
    script.src = "MiningData.json-p"
    document.body.appendChild(script);
	$(document).on("click", ".sector", showTooltip);

});
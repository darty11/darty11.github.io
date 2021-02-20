var galaxyData = {};
var miningData = {};
var warpData = {};
var idToName = {};
var system = "Delta_Trianguli";

function setupSystem(){
    var systemObj = galaxyData[system];
	for(var spawn of systemObj.mineralSpawns){
		systemObj.sectors[spawn.location.y].columns[spawn.location.x].spawner = spawn;
	}
	for(var warp in warpData){
		var warpObject = warpData[warp];
		var loc1 = buildLocation(warpObject.fromLocation,warpObject);
		var loc2 = buildLocation(warpObject.toLocation,warpObject);
		if(idToName[loc1.starSystemID] == system){
			systemObj.sectors[loc1.y].columns[loc1.x].warp = loc2;
		}
		if(idToName[loc2.starSystemID] == system){
			systemObj.sectors[loc2.y].columns[loc2.x].warp = loc1;
		}
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

function buildLocation(loc, warp){
	loc.name = warp.name;
	loc.team = warp.team;
	loc.isWormhole = warp.isWormhole;
	return loc;
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
	var backline = document.createElementNS("http://www.w3.org/2000/svg","use");
	backline.setAttribute("href","#sector_outline2");
	backline.setAttribute("transform",translate);
	document.getElementById("backlines").appendChild(backline);
	if(getSectorType(sectorObject.type) != "Empty"){
		if(getSectorType(sectorObject.type) == "Asteroids"){
			node.classList.add("Asteroids");
			backline.classList.add("Asteroids");
		}
		var ast = document.createElementNS("http://www.w3.org/2000/svg","use");
		var subType = sectorObject.subType;
		subType = subType < 0? 0:subType;
		var iconID = "#"+getSectorType(sectorObject.type)+"-"+subType;
		if($(iconID).length){
			ast.setAttribute("href",iconID);
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
			ast.setAttribute("href","#Unfound");
		}
		
		node.appendChild(ast);
	}
	
	if(sectorObject.nebulaDensity > 0){
		var fog = document.createElementNS("http://www.w3.org/2000/svg","use");
		fog.setAttribute("href","#nebula-fill");
		fog.setAttribute("fill-opacity",sectorObject.nebulaDensity);
		node.appendChild(fog);
	}
	if(sectorObject.warp){
		if(sectorObject.warp.isWormhole){
			var ast = document.createElementNS("http://www.w3.org/2000/svg","use");
			ast.setAttribute("href","#WormHole-0");
			node.appendChild(ast);
		}
		else{
			var ast = document.createElementNS("http://www.w3.org/2000/svg","use");
			var warpType = "#BigWarp";
			var angle = 0;
			var warpSystemName = idToName[sectorObject.warp.starSystemID];
			if(idToName[sectorObject.warp.starSystemID] == system){
				warpType = "#SmallWarp";
				angle = angleTo(sectorObject.warp.x, sectorObject.warp.y,x,y);
			}
			else{
				angle = -Math.atan2(galaxyData[warpSystemName].position.z-galaxyData[system].position.z,galaxyData[warpSystemName].position.x-galaxyData[system].position.x)* 180 / Math.PI;
			}
			ast.setAttribute("transform","rotate("+angle+")");
			ast.setAttribute("href",warpType);
			switch(sectorObject.warp.team){
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
			node.appendChild(ast);
		}
	}

	node.classList.add("sector");
	var [rates, hotspots, gradiant] = getMinerals(x,y);
	var html = "";
	html += "<h1>"+sectorObject.name+"</h1>";
	html += '<div class="tooltip-info">';
	html += '<div class="rates">';
	html += '<h3>Rates</h3>';
	html += rates;
	html += '</div>';
	html += '<div class="hotspots">';
	html += '<h3>Hotspots</h3>';
	html += hotspots;
	html += '</div>';
	html += '</div>';
	node.setAttribute("data-popup",html);
	var gradId = "sectorGradiant-"+x+"-"+y;
	gradiant.id = gradId;
	document.getElementById("gradiantsDef").appendChild(gradiant);
	var minerals = document.createElementNS("http://www.w3.org/2000/svg","use");
	minerals.setAttribute("href","#mineralComposition");
	minerals.setAttribute("fill","url(#"+gradId+")");
	minerals.setAttribute("class","mineral-density");
	node.appendChild(minerals)
	
	if(sectorObject.spawner){
		var spawnOutline = document.createElementNS("http://www.w3.org/2000/svg","use");
		spawnOutline.setAttribute("href","#spawn_outline");
		spawnOutline.setAttribute("class","mineral-outline");
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
		node.appendChild(spawnOutline);
		node.appendChild(radius);
		node.appendChild(spawn);
	}
	
	
	node.appendChild(outline);
	
	
    return node;
}
function getRGB(colorObj){
	return "rgb("+255*colorObj.r+","+255*colorObj.g+","+255*colorObj.b+")";
}
function toggleSpawns(){
	$("#sectors").toggleClass("spawns");
}
function toggleDensities(){
	$("#sectors").toggleClass("densities")
}
function getMinerals(x, y){
    var systemObj = galaxyData[system];
	var hotspots = "";
	var rates = {}
	var remainder = 1;
	for(var spawn of systemObj.mineralSpawns){
		var mineral = miningData[spawn.name.split(" ").join("_")];
		var distance = round(distanceTo(x,y,spawn.location.x,spawn.location.y));
		var density = lerp(mineral.density, 0, distance / mineral.spawnRange);
		if(density){
			hotspots += "<p>"+spawn.name+":"+Math.round(density*100)/100+"</p>";
			if(!(spawn.name in rates)){
				rates[spawn.name] = 0;
			}
			var add = remainder * density;
			remainder -= add;
			rates[spawn.name] += add;
		}
	
	}
	rates["Nickel"] = remainder;
	
	var mineralRates = Object.entries(rates).sort(function(a,b){return b[1]-a[1]});
	var ratesHTML = "";

	var gradiant = document.createElementNS("http://www.w3.org/2000/svg","radialGradient");
	gradiant.setAttribute("cx",0);
	gradiant.setAttribute("cy",0);
	gradiant.setAttribute("r",8);
	gradiant.setAttribute("gradientUnits","userSpaceOnUse");
	position = 0;
	
	for(mineral of mineralRates){
		if(mineral[0] != "Nickel"){
			addColorStops(gradiant,mineral[0],position,position+=mineral[1]*100);
		}
		ratesHTML += "<p>"+mineral[0]+":"+Math.round(mineral[1]*100)/100+"</p>";
	}
	addColorStops(gradiant,"Nickel",position,100);
	
	return [ratesHTML, hotspots, gradiant];
}
function addColorStops(gradiant,mineralName,start,finish){
	var mineralObj = miningData[mineralName.split(" ").join("_")];
	var oreStart = document.createElementNS("http://www.w3.org/2000/svg","stop");
	oreStart.setAttribute("offset",start+"%");
	oreStart.setAttribute("stop-color",getRGB(mineralObj.color));
	var oreEnd = document.createElementNS("http://www.w3.org/2000/svg","stop");
	oreEnd.setAttribute("offset",finish+"%");
	oreEnd.setAttribute("stop-color",getRGB(mineralObj.secondaryColour));
	gradiant.appendChild(oreStart);
	gradiant.appendChild(oreEnd);
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

function angleTo(x,y,x2,y2){
	if(y % 2 == 1){
		x += 0.5;
	}
	if(y2 % 2 == 1){
		x2 += 0.5;
	}
	var x3 = x-x2;
	var y3 = y-y2;
	return Math.atan2(y3,x3) * 180 / Math.PI;
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

getJsonP("systems");
getJsonP("minerals");

$(document).ready(function(){
	
	
	galaxyData = constants.systems;
    miningData = constants.minerals;
	if(getQuerys().system){
		system = getQuerys().system;
	}
	setupSystem();
	
	$(document).on("click", ".sector", showTooltip);

});
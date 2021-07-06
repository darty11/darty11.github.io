var galaxyData = {};
var warpData = {};
var idToName = [];

function curveX(xPos){
	return curveLimit((xPos-2)/8)*8;
}
function curveLimit(x){
	if(x>1){
		return 2-1/x;
	}
	if(x<-1){
		return -2-1/x;
	}
	return x;
}
function setupGalaxy(){
   
	for(warpName in warpData){
		var warp = warpData[warpName];
		for(var warp in warpData){
			var warpObject = warpData[warp];
			var system1 = galaxyData[idToName[warpObject.fromLocation.starSystemID]];
			var system2 = galaxyData[idToName[warpObject.toLocation.starSystemID]];
			if(system1.name != system2.name){
				var line = document.createElementNS("http://www.w3.org/2000/svg","line");
				line.setAttribute("x1",curveX(system1.position.x));
				line.setAttribute("x2",curveX(system2.position.x));
				line.setAttribute("y1",-system1.position.z);
				line.setAttribute("y2",-system2.position.z);
				var color = "org-Worm";
				if(!warpObject.isWormhole){
					switch(warpObject.team){
						case 0:
							color = "org-HA";
							break;
						case 1:
							color = "org-AE";
							break;
						case 2:
							color = "org-FI";
							break;
						case 3:
							color = "org-PI";
							break;
					}
				}
				if(warpObject.oneWay){
					line.setAttribute("marker-end","url(#arrow)");
					line.setAttribute("marker-start","url(#tail)");
				}
				line.setAttribute("class",color);
				
				line.setAttribute("stroke-width",0.15);
				$("#systems")[0].appendChild(line);
			}
		}
	}
	for(var systemName in galaxyData){
		
		var system = galaxyData[systemName];
		if(system.whiteHole){
			var line = document.createElementNS("http://www.w3.org/2000/svg","line");
				line.setAttribute("x1",curveX(system.position.x));
				line.setAttribute("x2",curveX(galaxyData.Sheenland.position.x));
				line.setAttribute("y1",-system.position.z);
				line.setAttribute("y2",-galaxyData.Sheenland.position.z);
				var color = "org-White";
				
			
				line.setAttribute("marker-end","url(#arrow-white)");
				line.setAttribute("marker-start","url(#tail-white)");

				line.setAttribute("class",color);
				
				line.setAttribute("stroke-width",0.15);
				$("#systems")[0].insertBefore(line,$("#systems")[0].childNodes[0]);  
		}
		var systemGroup = document.createElementNS("http://www.w3.org/2000/svg","g");
		var translate = "translate("+curveX(system.position.x) +" "+-system.position.z+")";

		var outline = document.createElementNS("http://www.w3.org/2000/svg","use");
		outline.setAttribute("href","#Outline");
		systemGroup.setAttribute("transform",translate);
		systemGroup.appendChild(outline);
		for(var starObject of system.stars){
			var star = document.createElementNS("http://www.w3.org/2000/svg","use");
			star.setAttribute("href","#Star-0");
			star.setAttribute("class","color-"+starObject.color);
			var translateStar = "translate("+ 1.5*(starObject.location.x-system.gridSize/2)/system.gridSize +" "+1.5*(starObject.location.y-system.gridSize/2)/system.gridSize+")";
			star.setAttribute("transform",translateStar);
			systemGroup.appendChild(star);
		}
		$("#systems")[0].appendChild(systemGroup);
	}
	
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
	if(getSectorType(sectorObject.type) != "Empty"){
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
getJsonP("gates");
getJsonP("systems");
$(document).ready(function(){
	galaxyData = constants.systems;
	warpData = constants.gates;
	for(var gal in galaxyData){
		idToName[galaxyData[gal].id-1] = gal;
	}
	setupGalaxy();
	$(document).on("click", ".sector", showTooltip);

});
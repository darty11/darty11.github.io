//Modifying the array prototype to include a remove function. Used by several pages
Array.prototype.remove = function(e) { 
    for(var i=0; i<this.length;i++){
        if(this[i] === e){
            this.splice(i,1);
        }
    }
}
//repeats a string
function repeatString(string,times){
    var val = "";
    for(var i = 0; i<times;i++){
        val+=string;
    }
    return val;
}
//simple helper methods to create urls pointing to ship and weapon icons on the official site.
function getSmallShipIcon(name){
    return 'http://www.starfighterinfinity.com/sf/sfinew/icons/Ships/'+encodeURIComponent(name)+'.png';
}
function getSmallItemIcon(name){
    return 'http://www.starfighterinfinity.com/sf/sfinew/icons/Items/'+encodeURIComponent(name)+'.png';
}
function getBigShipIcon(name){
    return 'http://www.starfighterinfinity.com/sf/sfinew/icons/shipsBig/'+encodeURIComponent(name)+'.png';
}
//helper function used to get extra positional data about a jquery element
function expandedPosition(jElement){
    var epos = {};
    var offset = jElement.offset();
    var width = jElement.width();
    var height = jElement.height();
    epos.x = offset.left + width/2;
    epos.y = offset.top + height/2;
    epos.left = offset.left;
    epos.top = offset.top;
    epos.right = offset.left + width;
    epos.bottom = offset.top + height;
    return epos;
}
function getWeaponClass(weapon){
	return weapon.craftable?'craftable':weapon.race?"npr":weapon.buyable?"buyable":weapon.seasonal?"seasonal":"locked";
}
//parses the query string into a string dictionary.
function getQuerys(){
    var string = location.search;
    var obj = {};
    if(string){
        var querys = string.substring(1,string.length).split('&');
        for(query of querys){
            var split = query.split("=");
            obj[decodeURIComponent(split[0])] = decodeURIComponent(split[1]);
        }
    }
    return obj;
}
//helper functions for setQuerys
function genLocationAndQuerys(queryObj){
    var string = location.href.replace(location.search, '')
    
    return string + genQuerys(queryObj);
}
function genQuerys(queryObj)
{
	var string = "?";
    for(name in queryObj){
        string+=encodeURIComponent(name)+"="+encodeURIComponent(queryObj[name])+"&"
    }
	return string.substring(0,string.length-1);
}
//takes a string dictionary object and uses it to replace the current query string.
function setQuerys(queryObj){
    var url = genLocationAndQuerys(queryObj);
    history.replaceState({"path":url},"Update Query",url);
}
//takes an ID and returns a name corresponding to the name of the effect stored in constants.effects
function effectName(id){
    return id==-1||isNaN(id)?"None":constants.effects[id].name;
}
//takes an effect name and returns how much damage it does
function effectDamage(name){
    return name in constants.effectDamages? constants.effectDamages[name]:0;
}
//extends data with calculated values. Values that start with a # are calculated via hardcoded methods, while values that start with % refer to a dictionary in constants.lookup.
//takes in a list of extensions and lookups (values starting with # or %) and a dictionary of weapons. It then generates values for the extensions and lookups and places them into the weapons. 
function extendData(extensions, data){
    for(wep in data){
        var weapon = data[wep];
        extendWeapon(extensions, weapon);
    }
    return data;
}
function extendWeapon(extensions, weapon)
{
    for(extension of extensions){
        if(extension.startsWith("#")){
            calcExtension(weapon, extension);
        }
        else if(extension.startsWith("%")){
            calcLookup(weapon, extension);
        }
    }
}
//similar to extendData but only takes one value, which can be a normal attribute of the weapon or an extension/lookup, returns the value as well as placing it in the weapon
function getExtendedValue(weapon, extension){
    if(extension.startsWith("#")){
        return calcExtension(weapon, extension);
    }
    else if(extension.startsWith("%")){
        return calcLookup(weapon, extension);
    }
    return weapon[extension];
}
//takes a weapon and a name that starts with %. Uses the name excluding the percent both as a key to get an array, which is then uses to get a value based off of the value of the name in the weapon
function calcLookup(wep, name){
    if(name in wep){
        return wep[name];
    }
    var id = name.substring(1,name.length);
    var value = constants.lookup[id][wep[id]];
    wep[name] = value;
    return value;
}
//an extensive list of case statements used to calculate a bunch of stats about weapons. Some are self explanatory, others are explained in WeaponsList.html
function calcExtension(wep, name){
    if(!wep || $.isEmptyObject(wep)){
		return 0;
	}
	if(name in wep){
        return wep[name];
    }
    var id = name.substring(1,name.length);
    
    var val = 0;
    switch(id){
        case "icon":
            val = '<img width=30 height=30 src="'+getSmallItemIcon(wep.iconName)+'"/>';
            break;
        case "selector":
            val = '<input type = checkbox class = "show-hide-selector" data-id="'+wep.id+'"/>';
            break;
        case "dps":
            val = wep.damage * calcExtension(wep,"#shots") / (wep.fireRate==0?1:wep.fireRate);//beams have a fire rate of 0 in the game files but deal their hit damage every second.
            break;
        case "effect":
            val = effectName(wep.effect);
            break;
        case "effectDamage":
            val = effectDamage(effectName(wep.effect))*wep.effectTime;
            break;
        case "dpshot":
            val = (calcExtension(wep, "#effectDamage")+wep.damage) * calcExtension(wep,"#shots");
            break;
        case "energy":
            val = wep.energyBased? wep.ammoOrEnergyUsage:"";
            break;
        case "ammo":
            val = wep.energyBased? "" : wep.ammoOrEnergyUsage;
            break;
        case "shots":
            
            val = wep.amount;
            if(wep.variant && wep.variant.overrideName == "Cluster [name] Torpedo"){
                val *= 10;
            }
            
            if(wep.name.includes("Broadside")){
                val *= 4;
            }
			if(wep.name.includes("Radial")){
                val *= 8;
				if(wep.name.includes("Plus")){
					val*=2;
				}
            }
            if(getDamageSource(wep) == "Thunder"){
                val *= wep.life;
            }
            break;
        case "range":
            val = wep.maxSpeed*wep.life;
            break;
        case "dpm":
            if(wep.energyBased)
            {
                val = (100/wep.ammoOrEnergyUsage) * calcExtension(wep,"#dpshot");
            }
            else{
                val = wep.ammoOrEnergyUsage * calcExtension(wep,"#dpshot");
            }
            break;
        case "effectDps":
            val = calcExtension(wep, "#effectDamage") * calcExtension(wep,"#shots")/ (wep.fireRate==0?1:wep.fireRate);//beams have a fire rate of 0 in the game files but deal their hit damage every second.
            break;
        case "tdps":
            val = calcExtension(wep, "#effectDps") + calcExtension(wep,"#dps");
            break;
        case "ips":
            val = wep.impact * calcExtension(wep,"#shots")/ (wep.fireRate==0?1:wep.fireRate);//beams have a fire rate of 0 in the game files but deal their hit damage every second.
            break;
        case "kps":
            val = wep.kickback/ (wep.fireRate==0?1:wep.fireRate);//beams have a fire rate of 0 in the game files but deal their hit damage every second.
            break;
        case "race":
            val = wep.race == 0? "Human/Aralien" : constants.races[wep.race].name;
            break;
        case "skill":
            val = constants.skills[wep.skillRequirement.skill].name; 
            break;
        case "level":
            val = wep.skillRequirement.level;
            break;
        case "fireRate":
            val = 1/wep.fireRate;
            break;
        case "ttts":
            val = (wep.maxSpeed-wep.initSpeed)/wep.acceleration;
            break;
        case "epm":
            if(wep.energyBased)
            {
                val = (100/wep.ammoOrEnergyUsage) * wep.effectTime;
            }
            else{
                 val = wep.ammoOrEnergyUsage * wep.effectTime;
            }
            break;
        case "turnR":
            val = (wep.maxSpeed) * (360/(wep.turning*30)) / (2*Math.PI);
            break;
        case "turns":
            val = wep.life/(360/(wep.turning*30));
            break;
        case "minrangeturn":
            val = 2 * (calcExtension(wep, "#turnR") * Math.sin(degToRad(Math.min(wep.accuracy*2,180))/2));
            break;
        case "minrangearm":
            var ttts = calcExtension(wep,"#ttts");
            if(ttts > wep.armingTime){
                val = wep.armingTime * wep.armingTime * wep.acceleration/2 + wep.armingTime * wep.initSpeed;
            }
            else{
                val = ttts * ttts * wep.acceleration/2 + ttts * wep.initSpeed + wep.maxSpeed*(wep.armingTime-ttts);
            }
            break;
        case "stackCount":
            val = wep.fireRate/0.3;
            break;
        case "stackedDps":
            var stackSize = -Math.round(-calcExtension(wep,"#stackCount")-0.5)
            val = calcExtension(wep,"#stackDps")/Math.min(6,stackSize);
            break;
        case "stackDps":
            var stackSize = -Math.round(-calcExtension(wep,"#stackCount")-0.5)
            val = calcExtension(wep,"#dpshot")*Math.min(6,stackSize)/(stackSize*0.3); //can't stack more than 6 weapons
            break;
        case "topBoost":
            val = wep.maxSpeedMod * wep.propulsionEnhance;
            break;
        case "averageBoost":
			if(wep.propulsionEnhanceCooldown < 1){ //speed will always be above max speed. 
				val = (calcExtension(wep,"#topBoost")*2 + (wep.propulsionEnhanceCooldown*(wep.maxSpeedMod-calcExtension(wep,"#topBoost"))))/2 //averages the top speed and a lerp between top speed and max speed.
			}
			else
			{
				val = (calcExtension(wep,"#topBoost")-wep.maxSpeedMod)/(2*wep.propulsionEnhanceCooldown)+wep.maxSpeedMod
			}
            break;
        case "boostCost":
            val = 15/(wep.propulsionEnhanceTime*wep.propulsionEnhanceCooldown);
            break;
        case "reverseSpeed":
            val = wep.maxSpeedMod * wep.reverseSpeedMod;
            break;
        case "description":
            val = wep.range.description;
			if(wep.descriptionOverride){
				val = wep.descriptionOverride;
			}
            else if(wep.variant && wep.variant.descriptionAppend){
            
                val+=" "+wep.variant.descriptionAppend;
            }
			var type = calcLookup(wep,"%type");
			switch(type){
				case "SECONDARY_WEAPON":
					val = val.replace(/\[lockingRange\]/g,wep.lockingRange);
					val = val.replace(/\[life\]/g,wep.life);
					val = val.replace(/\[amount\]/g,wep.amount);
					val = val.replace(/\[effectTime\]/g,wep.effectTime);
					val = val.replace(/\[levelPlusTwo\]/g,wep.level + 2);
					val = val.replace(/\[effect\]/g,calcExtension(wep,"#effect"));
					if(wep.subWeapon){
						val = val.replace(/\[subWeapon\]/g, wep.subWeapon.name);
						val = val.replace(/\[subWeaponLockingRange\]/g,wep.subWeapon.lockingRange);
					}
					break;
				case "AUGMENTATION":
					val = val.replace(/\[effectTime\]/g,wep.effectTime);
					val = val.replace(/\[effectPerc\]/g,wep.effectTime*100 +"%");
					val = val.replace(/\[level\]/g,wep.level + 1);
					if(wep.weapon){
						val = val.replace(/\[weapon\]/g, wep.weapon.name);
					}
					break;
				case "SHIELD":
					val = val.replace(/\[invEffectPerc\]/g,Math.round((1-wep.effectAmount)*100) +"%");
					val = val.replace(/\[effectPerc\]/g,Math.round(wep.effectAmount*100) +"%");
					break;
			}
            break;
		
    }
    wep[name] = val;
    return val;
}
//gets the cumulative level of all augmentations of this type.
function getAugmentationLevel(augmentations, weaponData, type){
    level = 0;
    for(var augmentation of augmentations){
        if(augmentation){
            var aug = weaponData[augmentation];
            if(calcLookup(aug, "%augType") == type){
                level += aug.level + 1;
            }
        }
    }
    return level;
}
//gets the cumulative effect time of all augmentations of this type.
function getAugmentationEffectTime(augmentations, weaponData, type){
    time = 0;
    for(var augmentation of augmentations){
        if(augmentation){
            var aug = weaponData[augmentation];
            if(calcLookup(aug, "%augType") == type){
                time += aug.effectTime;
            }
        }
    }
    return time;
}
//gets the multiplicative effect time of all augmentations of this type.
function getAugmentationEffectTimeMultiplier(augmentations, weaponData, type){
    time = 1;
    for(var augmentation of augmentations){
        if(augmentation){
            var aug = weaponData[augmentation];
            if(calcLookup(aug, "%augType") == type){
                time *= aug.effectTime;
            }
        }
    }
    return time;
}
//Calculates how many seconds of an effect all utilities on the ship provide for the ship per second. When effect times reach a certian point, they speed up, using more than 1 second of effect time per second, but also doing more of their function.
function getEffectTimePerSecond(utilities, weaponData, effect, reloadTime){
    time = 0;
    for(var utility of utilities){
        if(utility){
            var util = weaponData[utility];
            if(calcExtension(util, "#effect") == effect){
                if(calcLookup(util, "%guidance") == "ATTACHED"){
                    time += util.effectTime/util.fireRate; //utility is attached to ship and therefore applies its effect once.
                }
                else if(calcLookup(util, "%guidance") == "NO_COLLISION"){
                    time += (util.life/2)*util.effectTime / util.fireRate; //utility is a support device that applies its effect every 2 seconds.
                }
            }
        }
    }
    return time;
}
//calculates what the "source" of damage the of the weapon is. A bit hacky because these sources are hardcoded into the game and not accessible via the datamining used to get the weapons.
function getDamageSource(weapon){
    if(weapon.name.toLowerCase().includes("thunder")){
        return "Thunder";
    }
    if(calcLookup(weapon,"%guidance") == "ATTACHED" && calcLookup(weapon,"%type") == "SECONDARY_WEAPON" &&
    calcLookup(weapon,"%weaponType") == "PROXIMITY" && !weapon.name.toLowerCase().includes("ring") && !weapon.name.toLowerCase().includes("radial")){
        return "Proximity";
    }
    if(weapon.fireRate == 0 || weapon.name.toLowerCase().includes("chain laser")){
        return "Beam";
    }
    if(calcLookup(weapon,"%guidance") == "HOMING" || weapon.name.toLowerCase().includes("smart torpedo") || weapon.name.toLowerCase() == "splicer glaive"){
        return "Guided";
    }
    return "Dumbfire";
}
//an extensive list of case statements used to calculate a bunch of stats about ships with specific loadouts. Some are self explanatory, others are explained in ShipBuilder.html
function getShipStat(ship, loadout, weaponData, stat){
    var val = 0;
    var shield = weaponData[loadout.SHIELD[0]];
    var engine = weaponData[loadout.ENGINE[0]];
    var effect = shield?calcLookup(shield,"%effect"):"";
    var primary = weaponData[loadout.PRIMARY_WEAPON[0]];
    var solarCharging = $("#solar_charging").val();
    var reload =50/(1+(1/3)*(getAugmentationLevel(loadout.AUGMENTATION, weaponData, "ReloadAccelerator")+1));
	if(!primary){
		primary = {};
	}
	if(!shield){
		shield = {};
	}
	if(!engine){
		engine = {};
	}
	//values starting with a % indicated a damage type lookup.
    if(stat && stat.startsWith("%")){
        var damageType = stat.substring(1,stat.length);
        var stack = 0;
        var biggestStack = 0;
        var dps = 0;
        for(var list in loadout){
            var weapons = loadout[list];
            for(var weapon of weapons){
                var wep = weaponData[weapon];
                if(wep){
                    if(wep.damage){
                        if(calcLookup(wep,"%damageType") == damageType){
                            val += wep.damage * calcExtension(wep,"#shots");
							if(dps<calcExtension(wep, "#dps")){
								dps = calcExtension(wep, "#dps");
							}
                            stack++;
                            var stackSize = getExtendedValue(wep, "#stackCount");
                            if(stackSize>biggestStack){
                                biggestStack = stackSize;
                            }
                        }
                    }
                }
            }
        }
        if(stack == 1){
            val = dps;
        }
        else{
            if(biggestStack > stack){
                stack = biggestStack;
            }
            if(stack){
				val /= -Math.round(-stack-0.5)*0.3;
			}
        }
		if(val < dps){
			val = dps; //if firing multiple weapons in a stack has less dps than just one, only fire that weapon.
		}
    }
	//values starting with a # indicated a damage source lookup. Each weapon can have a damage source and damage type independant of eachother (for the most part) so this is a separate lookup.
    if(stat && stat.startsWith("#")){
        var damageSource = stat.substring(1,stat.length);
        var stack = 0;
        var biggestStack = 0;
        var dps = 0;
        for(var list in loadout){
            var weapons = loadout[list];
            for(var weapon of weapons){
				var wep = weaponData[weapon];
					
                if(wep){
                    if(wep.damage){
                        if(getDamageSource(wep) == damageSource){
                            
                            val += calcExtension(wep,"#dpshot");
							if(dps<calcExtension(wep, "#tdps")){
								dps = calcExtension(wep, "#tdps");
							}
                            stack++;
                            var stackSize = getExtendedValue(wep, "#stackCount");
                            if(stackSize>biggestStack){
                                biggestStack = stackSize;
                            }
                        }
                    }
                }
            }
        }
        if(stack == 1){
            val = dps;
        }
        else{
            if(biggestStack > stack){
                stack = biggestStack;
            }
			
            if(stack){
				val /= -Math.round(-stack-0.5)*0.3;
			}
        }
		if(val < dps){
			val = dps; //if firing multiple weapons in a stack has less dps than just one, only fire that weapon.
		}
            
    }
    
    switch(stat){
        case "totalShield":
            val = ship.maxShield * shield.maxModifier ;
            break;
        case "regenShield":
            val = 3 * shield.chargeModifier;
            break;
        case "interuptLossShield":
            val = getShipStat(ship, loadout, weaponData, "regenShield") * shield.chargeDelay;
            break;
        case "radiusShield":
            val = ship.shieldSize;
            break;
        case "effectiveStrongShield":
            var div = 1;
            if(effect in constants.shieldEffectMultipliers){
                var mult = constants.shieldEffectMultipliers[effect];
                if(mult<0){
                    div = div + mult * shield.effectAmount;
                }
                else{
                    div = mult * shield.effectAmount;
                }
            }
            val = Math.round(10*getShipStat(ship, loadout, weaponData, "totalShield")/div)/10; // round here because rounding errors are so large we can only display the tens place.
            break;
        case "effectiveWeakShield":
            var div = 1;
            if(effect in constants.shieldEffectMultipliersNegative){
                var mult = constants.shieldEffectMultipliersNegative[effect];
                if(mult<0){
                    div = mult*(shield.effectAmount-2);
                }
                else{
                    div = 1+ mult * shield.effectAmount;
                }
            }
            val = Math.round(10*getShipStat(ship, loadout, weaponData, "totalShield")/div)/10; // round here because rounding errors are so large we can only display the tens place.
            break;
        case "cruiseSpeed":
            val = ship.maxSpeed * engine.maxSpeedMod * 1.25;
            break;
        case "turnSpeed":
            val = ship.turning * engine.turningMod;
            break;
        case "boostSpeed":
            val = getShipStat(ship, loadout, weaponData, "cruiseSpeed") * engine.propulsionEnhance;
            break;
        case "boostAverageSpeed":
            val = getShipStat(ship, loadout, weaponData, "cruiseSpeed") * (1 + engine.propulsionEnhance) / 2;
            break;
        case "boostTimeSpeed":
            val = engine.propulsionEnhanceTime;
            break;
        case "boostEnergySpeed":
            val = getExtendedValue(engine, "#boostCost");
            break;
        case "reverseSpeed":
            val = getShipStat(ship, loadout, weaponData, "cruiseSpeed") * engine.reverseSpeedMod;
            break;
        case "accelSpeed":
            val = ship.accel * engine.accelMod * 15 * 1.25;
            break;
        case "autopilotSpeed":
            val = getShipStat(ship, loadout, weaponData, "cruiseSpeed") + engine.autoPilotSpeedInc;
            break;
        case "cruiseTimeSpeed":
            var speed = 0;
            var time = 0;
            var step = 0.04;
            var max = getShipStat(ship, loadout, weaponData, "cruiseSpeed");
            var accel = getShipStat(ship, loadout, weaponData, "accelSpeed");
            var target = max-0.1;
            while(speed < target){
                speed += (1 - speed/max) * accel * step;
                time += step;
                if(time >= 120){
                    break;
                }
            }
            val = time;
            break;
        case "totalEnergy":
            val = 100 + 20 * getAugmentationLevel(loadout.AUGMENTATION, weaponData, "EnergyOvercharge");
            break; 
        case "regenEnergy":
            var APS = getAugmentationEffectTime(loadout.AUGMENTATION, weaponData, "AndromedanPowerSource");
            var DEC = getAugmentationLevel(loadout.AUGMENTATION, weaponData, "DarkEnergyCharging");
            var SPU = getAugmentationLevel(loadout.AUGMENTATION, weaponData, "SolarPanelUpgrade");
            if(APS || DEC){
                val = Math.max(APS,5 * (1 + DEC * 0.6) / solarCharging);
            }
            else{
                val = Number(solarCharging) + SPU * 0.15
            }
            break;
        case "effectRegenEnergy":
			var val = 0;
			for (var effect in constants.effectRecharge) {
				val += getEffectTimePerSecond(loadout.SECONDARY_WEAPON_UTILITY, weaponData, effect) * constants.effectRecharge[effect];
			}
			var DEC = getAugmentationLevel(loadout.AUGMENTATION, weaponData, "DartianConverter");
			val += DEC * Math.min(getShipStat(ship, loadout, weaponData, "totalEnergy"),150)/10;
            break;
        case "allRegenEnergy":
            val = getShipStat(ship, loadout, weaponData, "effectRegenEnergy") + getShipStat(ship, loadout, weaponData, "regenEnergy");
            break;
        case "dpsPrimary":
            val = getExtendedValue(primary, "#tdps");
            break;
        case "energyPrimary":
            val = primary.ammoOrEnergyUsage/primary.fireRate;
            break;
        case "firingRegenPrimary":
            val = getShipStat(ship, loadout, weaponData, "regenEnergy") * Math.max(0,primary.fireRate-1)/primary.fireRate;
            break;
        case "netRegenPrimary":
            val = getShipStat(ship, loadout, weaponData, "firingRegenPrimary") - getShipStat(ship, loadout, weaponData, "energyPrimary");
            break;
        case "drainTimePrimary":
            val = getShipStat(ship, loadout, weaponData, "totalEnergy")/-getShipStat(ship, loadout, weaponData, "netRegenPrimary");
            break;
        case "drainTimeEffectPrimary":
            val = getShipStat(ship, loadout, weaponData, "totalEnergy")/-(getShipStat(ship, loadout, weaponData, "effectRegenEnergy")+getShipStat(ship, loadout, weaponData, "netRegenPrimary"));
            break;
        case "dpsEnergySecondary":
            var stack = 0;
            var biggestStack = 0;
            for(secondary of loadout.SECONDARY_WEAPON_STANDARD){
                if(secondary){
                    var sec = weaponData[secondary];
                    if(sec.energyBased&&sec.fireRate != 0){
                        val += getExtendedValue(sec, "#dpshot");
                        stack++;
                        var stackSize = getExtendedValue(sec, "#stackCount");
                        if(stackSize>biggestStack){
                            biggestStack = stackSize;
                        }
                    }
                }
                
            }
            if(biggestStack > stack){
                stack = biggestStack;
            }
            val /= -Math.round(-stack-0.5)*0.3;
            if(stack == 0){
				val = 0;
			}
            
            break;
        case "energySecondary":
            var stack = 0;
            var biggestStack = 0;
            for(secondary of loadout.SECONDARY_WEAPON_STANDARD){
                if(secondary){
                    var sec = weaponData[secondary];
                    if(sec.energyBased&&sec.fireRate != 0){
                        val += sec.ammoOrEnergyUsage;
                        stack++;
                        var stackSize = getExtendedValue(sec, "#stackCount");
                        if(stackSize>biggestStack){
                            biggestStack = stackSize;
                        }
                    }
                }
                
            }
            if(biggestStack > stack){
                stack = biggestStack;
            }
            val /= -Math.round(-stack-0.5)*0.3;
			
            if(stack == 0){
				val = 0;
			}
            break;
        case "firingRegenSecondary":
            var stack = 0;
            var biggestStack = 0;
            for(secondary of loadout.SECONDARY_WEAPON_STANDARD){
                if(secondary){
                    var sec = weaponData[secondary];
                    if(sec.energyBased&&sec.fireRate != 0){
                        stack++;
                        var stackSize = getExtendedValue(sec, "#stackCount");
                        if(stackSize>biggestStack){
                            biggestStack = stackSize;
                        }
                    }
                }
                
            }
            val = getShipStat(ship, loadout, weaponData, "regenEnergy") * Math.max(0,1-(stack*0.3+1)/(biggestStack*0.3));
			
            if(stack == 0){
				val = getShipStat(ship, loadout, weaponData, "regenEnergy");
			}
            break;
        case "netRegenSecondary":
            val = getShipStat(ship, loadout, weaponData, "firingRegenSecondary") - getShipStat(ship, loadout, weaponData, "energySecondary");
            break;
        case "drainTimeSecondary":
            val = getShipStat(ship, loadout, weaponData, "totalEnergy")/-getShipStat(ship, loadout, weaponData, "netRegenSecondary");
            break;
        case "drainTimeEffectSecondary":
            val = getShipStat(ship, loadout, weaponData, "totalEnergy")/(-getShipStat(ship, loadout, weaponData, "netRegenSecondary")-(getShipStat(ship, loadout, weaponData, "effectRegenEnergy")));
            break;
        case "dpsAmmoSecondary":
            var stack = 0;
            var biggestStack = 0;
            for(secondary of loadout.SECONDARY_WEAPON_STANDARD){
                if(secondary){
                    var sec = weaponData[secondary];
                    if(!sec.energyBased){
                        val += getExtendedValue(sec, "#dpshot");
                        stack++;
                        var stackSize = getExtendedValue(sec, "#stackCount");
                        if(stackSize>biggestStack){
                            biggestStack = stackSize;
                        }
                    }
                }
                
            }
            if(biggestStack > stack){
                stack = biggestStack;
            }
            val /= -Math.round(-stack-0.5)*0.3;
            
            if(stack == 0){
				val = 0;
			}
            break;
        case "ammoTimeSecondary":
            var stack = 0;
            var biggestStack = 0;
            var smallestAmmo = Number.MAX_VALUE;
            for(secondary of loadout.SECONDARY_WEAPON_STANDARD){
                if(secondary){
                    var sec = weaponData[secondary];
                    if(!sec.energyBased){
                        
                        stack++;
                        var stackSize = getExtendedValue(sec, "#stackCount");
                        if(stackSize>biggestStack){
                            biggestStack = stackSize;
                        }
                        if(smallestAmmo>sec.ammoOrEnergyUsage){
                            smallestAmmo = sec.ammoOrEnergyUsage;
                        }
                    }
                }
                
            }
            if(biggestStack > stack){
                stack = biggestStack;
            }
            val = smallestAmmo * -Math.round(-stack-0.5)*0.3;
            
            break;
        case "downtimeSecondary":
            var stack = 0;
            var biggestStack = 0;
            for(secondary of loadout.SECONDARY_WEAPON_STANDARD){
                if(secondary){
                    var sec = weaponData[secondary];
                    if(!sec.energyBased){
                        
                        stack++;
                        var stackSize = getExtendedValue(sec, "#stackCount");
                        if(stackSize>biggestStack){
                            biggestStack = stackSize;
                        }
                    }
                }
                
            }
            if(biggestStack > stack){
                stack = biggestStack;
            }
            val = Math.max(-Math.round(-stack-0.5)*0.3,reload)+Math.round(-stack-0.5)*0.3;
            
            break;
        case "sustainedDpsSecondary":
            var dps = getShipStat(ship, loadout, weaponData, "dpsAmmoSecondary");
            var fireTime = getShipStat(ship, loadout, weaponData, "ammoTimeSecondary");
            var reloadTime = getShipStat(ship, loadout, weaponData, "downtimeSecondary");
            val = dps * fireTime / (fireTime + reloadTime);
            break;
        case "totalDamageSecondary":
            for(secondary of loadout.SECONDARY_WEAPON_STANDARD){
                if(secondary){
                    var sec = weaponData[secondary];
                    if(!sec.energyBased){
                        val += getExtendedValue(sec, "#dpm")*6;
                    }
                }
                
            }
            break;
        case "effectDamage":
            
            var stack = 0;
            var biggestStack = 0;
            var dps = 0;
            for(var list in loadout){
                var weapons = loadout[list];
                for(var weapon of weapons){
                    var wep = weaponData[weapon];
                    
                    if(wep){
                        if(wep.effect){
                            if(calcExtension(wep,"#effectDamage")){
                                val += calcExtension(wep,"#effectDamage") * calcExtension(wep,"#shots");
                                if(dps<calcExtension(wep, "#effectDps")){
                                    dps = calcExtension(wep, "#effectDps");
                                }
                                stack++;
                                var stackSize = getExtendedValue(wep, "#stackCount");
                                if(stackSize>biggestStack){
                                    biggestStack = stackSize;
                                }
                            }
                        }
                    }
                }
            }
            
            if(biggestStack > stack){
                stack = biggestStack;
            }
            
            val /= -Math.round(-stack-0.5)*0.3;
            if(val < dps){
                val = dps; //if firing multiple weapons in a stack has less dps than just one, only fire that weapon.
            }
            if(stack == 0){
				val = 0;
			}
            break;
		case "totalStandardDps":
			
            var stack = 0;
            var biggestStack = 0;
            var dps = 0;
            for(var list in loadout){
                var weapons = loadout[list];
                for(var weapon of weapons){
                    var wep = weaponData[weapon];
                    
                    if(wep){
                        if(calcLookup(wep,"%weaponType")=="STANDARD"){
							if(wep.fireRate){ //only add weapon to the stack if its not a beam
								stack++;
								val += calcExtension(wep,"#dpshot");
								var stackSize = getExtendedValue(wep, "#stackCount");
								if(stackSize>biggestStack){
									biggestStack = stackSize;
								}
							}
							if(dps<calcExtension(wep, "#tdps")){
								dps = calcExtension(wep, "#tdps");
							}
							
                        }
                    }
                }
            }
            
            if(biggestStack > stack){
                stack = biggestStack;
            }
            
            val /= -Math.round(-stack-0.5)*0.3;
            if(val < dps){
                val = dps; //if firing multiple weapons in a stack has less dps than just one, only fire that weapon.
            }
			break;
		case "reload":
			val = reload;
			break;
		case "hyperspaceTime":
			val = 180/getAugmentationLevel(loadout.AUGMENTATION, weaponData, "HyperspaceRechargeBooster");
			break;
		
		case "lockingAngle":
			val = (ship.lockingAngle/2)*getAugmentationEffectTimeMultiplier(loadout.AUGMENTATION, weaponData, "LockingWidener");
			break;
    }
    return Math.round(1000*val)/1000;
}
function degToRad(deg){
    return (deg/180)*Math.PI
}
//capitalizes every letter after a space, lowercases every letter not after a space. "UPPER CASE" becomes "Upper Case", "lower case" becomes "Lower Case", "raNdOm CAPitAlIzatION" becomes "Random Capitalization"
function toCamelCase(string){
    var strings = string.split(" ");
    for(var i = 0; i<strings.length; i++){
        strings[i] = strings[i].substring(0,1).toUpperCase()+strings[i].substring(1,strings[i].length).toLowerCase()
    }
    return strings.join(" ");
}
//adds the varient weapon ids to weapon ranges. Additionally, links each weapon to its range and sub weapons.
function linkRangesAndSubWeapons(weaponRanges, variants, weaponData){
    
    for(var rangeName in weaponRanges){
        var range = weaponRanges[rangeName];
        var ids = range.items.slice(0);
        if(range.variants){
            for(var variantIndex=0;variantIndex<range.variants.length;variantIndex++){
                for(id of ids){
                    var split = id.split("_")
                    var varID = split[0]+"v"+variantIndex;
                    if(split[1]){
                        varID +="_"+split[1];
                    }
                    if(varID in weaponData){
                        range.items.push(varID);
                        weaponData[varID].variant = variants[range.variants[variantIndex]];
                    }
                    
                }
            }
        }
        for(var weapon of range.items){
            weaponData[weapon].range = range;
			if(weaponData[weapon].subWeaponID){
				weaponData[weapon].subWeapon = weaponData[weaponData[weapon].subWeaponID];
			}
			if(range.range)
			{
				weaponData[weapon].weapon = weaponData[range.range + (weaponData[weapon].level?("_"+weaponData[weapon].level):"")];
			}
        }

    }
}
//links the weapons to their craftable
function linkCraftables(craftables, weaponData){
    
    for(var craftableName in craftables){
        var craft = craftables[craftableName];
        
        for(var weapon of craft.items){
            weaponData[weapon].craftable = craft;
        }
    }
}
//very expensive function used to fix a bug in the game that prevents engine ranges from containing their items.
function fixEngines(weaponRanges, weaponData){
    for(rangeId in weaponRanges){
        var range = weaponRanges[rangeId];
        if(range.items.length == 0 && (range.type == 0 || range.type == 4)){
            var id = range.id;
            for(weaponId in weaponData){

                if(weaponId.startsWith(id+"_") || weaponId==id){
                    var index = 0;
                    var end = weaponId.replace(id+"_"," ");
                    if(!isNaN(end)){
                        index = end;
                    }
                    range.items[Number(index)] = weaponId;
					weaponData[weaponId].range = range;
                }
            }
        }
    }
}
//checks to see if the weapon is of the right type and weapon type. Used when populating tables of weapons
function rightType(wep,type){
    if(type.toUpperCase() == "ALL"){
        return true;
    }
    var wep_type = calcLookup(wep,"%type");
    if(wep_type.toUpperCase() == "SECONDARY_WEAPON"){
        var wep_wepType = calcLookup(wep,"%weaponType").toUpperCase();
        return "SECONDARY_WEAPON_"+wep_wepType == type.toUpperCase()
    }
    if(wep_type.toUpperCase() == type.toUpperCase()){
        return true;
    }
    return false
}
//abbreviates strings longer than 15 characters
function shortenWeaponName(name){
    if(name.length <= 15){
        return name;
    }
    var roman = /^(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/
    var numeric = /^[0-9]+$/
    var split = name.split(" ");
    var shortend = ""
    for(var i = 0; i<split.length-1; i++){
        shortend += split[i].substring(0,1).toUpperCase();
    }
    var last = split[split.length-1];
    if(roman.test(last) || numeric.test(last)){
        shortend += " "+last;
    }
    else{
        shortend += last.substring(0,1).toUpperCase();
    }
    return shortend;
}
//sets up the navbar for each page
function setupNav(){
	var nav = $("nav");
	for(page of constants.pages){
		var url = location.pathname;
		url = url.substring(0, url.lastIndexOf("/"));
		url +="/"+page[0];
		var anchor = $('<a href="'+url+'">'+page[1]+"</a>");
		if(location.href.includes("/"+page[0])){
			anchor.attr("disabled", true);
		}
		var div = $("<div></div>");
		div.append(anchor);
		nav.append(div);
	}
}
$(document).ready(function(){
	setupNav();
});
//-----------------------------------------
// GENERIC UTILITY FUNCTIONS
towerdef.getRandomNumber = function (num) {
    return Math.floor((Math.random()*num)-1)
}

//get distance between two sprites
towerdef.distance = function(sprite1, sprite2) {
	var x1 = sprite1.getPosition().x;
	var x2 = sprite2.getPosition().x;
	
	var y1 = sprite1.getPosition().y;
	var y2 = sprite2.getPosition().y;
	
	var xd = x2 - x1;
	var yd = y2 - y1;
	
	return Math.sqrt ( xd * xd + yd * yd);
}

//-----------------------------------------
// POKEMON-RELATED UTILITY FUNCTIONS - TYPES
towerdef.strengths = {
    "fire" : "grass",
    "grass" : "water",
    "water" : "fire"
};

towerdef.weaknesses = {
    "fire" : "water",
    "grass" : "fire",
    "water" : "grass"
};

towerdef.getWeakness = function(type) {
	return towerdef.weaknesses[type];
}

towerdef.getStrength = function(type) {
	return towerdef.strengths[type];
}

//get the sprite image for the building of that type
towerdef.getImageFromType = function(type) {
	switch(type) {
		case 'fire':
			return "fire_building.png";
			break;
		case 'water':
			return "water_building.png";
			break;
		case 'grass':
			return "grass_building.png";
		default:
			return null;
	}
}

//get color from the type passed in
towerdef.getColor = function(type) {
		var color;
		
		if (type == "fire") {color = '#F00';}
		else if (type == "grass") {color = '#360';}
		else {color = '#00F';}
	
		return color;
}

towerdef.pokemonHealthBar = function (pokemon, healthLayer) {
	
		if(!pokemon.collided){
		var pos = pokemon.sprite.getPosition();
		
		pokemon.healthBackground.setPosition(pos.x, pos.y - 20);
		pokemon.healthLevel.setPosition(pos.x, pos.y - 20).setSize(pokemon.health*(pokemon.maxHealth/200), 5);
		}
		else {
			healthLayer.removeChild(pokemon.healthBackground);
			healthLayer.removeChild(pokemon.healthLevel);
		}
}


//-----------------------------------------
//CHECK FOR END ROUND CONDITIONS
towerdef.playerAllCollidedOrDead = function(player) {
	for (i = 0; i < player.pokemon.length; i++) {
		if (player.pokemon[i].collided == false && player.pokemon[i].health > 0) {
			return false;
		}
	}
	return true;
}

//check if all of the pokemon in the round have either collided with the opponent Gym or have 0 health
towerdef.checkIfPokemonGone = function() {
	return towerdef.playerAllCollidedOrDead(towerdef.lPlayer) && towerdef.playerAllCollidedOrDead(towerdef.rPlayer);
}	

towerdef.numberOpponentFaintedPokemon = function(opponent) {
	var count = 0;
	for (i=0; i<opponent.pokemon.length; i++){
		if (opponent.pokemon[i].checkFainted()){
			count++;
		}
	}
	return count;
}

//-----------------------------------------
//DAMAGE CALCULATIONS - GYMS
//check for a collision between pokemon and gym
towerdef.checkGymCollision = function(gym, pokemon, player) {
	if(goog.math.Box.intersects(gym.getBoundingBox(), pokemon.sprite.getBoundingBox()) && !pokemon.collided){
		//colliding with Gym
		if (player.health > 0) {
			player.health -= towerdef.getGymDamage(pokemon);
			pokemon.collided = true;
			pokemon.sprite.runAction(new lime.animation.FadeTo(0.1).setDuration(0.5));
			//console.log(player.gym.location + " gym health: " + player.health);
		}
		else 
		{
			//TODO: lose screen
			if (gym.location = "left"){
				alert("Game over! You lose!");
			}
			else 
			{
				alert("Game over! You win!");
			}
            towerdef.menuScene();
		}
   	}
}

//get the amount of damage done to a gym by pokemon
towerdef.getGymDamage = function(pokemon) {
	return pokemon.level * towerdef.gymDamage;
}

towerdef.displayGymHealth = function(gameLayer) {
	var healthLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
	gameLayer.appendChild(healthLayer);
	
	towerdef.lPlayer.displayHealth(healthLayer);
	towerdef.rPlayer.displayHealth(healthLayer);
}

//TODO: clean all of this up
towerdef.updateHealth = function(myplayer, healthLayer) {
		var pos = myplayer.gym.getPosition();
		
		var healthBackground = new lime.RoundedRect().setSize(myplayer.healthBarSize, 5).setRadius(2).setFill('#FFF').setPosition(pos.x - 25, pos.y - 50).setAnchorPoint(0,0);
		healthLayer.appendChild(healthBackground);
		
		var healthLevel = new lime.RoundedRect().setSize(myplayer.health*(myplayer.healthBarSize/100), 5).setRadius(2).setFill('#F00').setPosition(pos.x  - 25, pos.y - 50).setAnchorPoint(0,0);
		healthLayer.appendChild(healthLevel);
	}


//-----------------------------------------
//BUILDING UTILITIES - TOWERS

//get the amount of damage a building of buildingType does to a pokemon of pokemonType
towerdef.damageAmount = function(buildingType, pokemonType) {
	var weakness = towerdef.getWeakness(pokemonType);
	var strength = towerdef.getStrength(pokemonType);
	
	if (buildingType == weakness) { return towerdef.strongAttack;}
	else if (buildingType == strength) { return towerdef.weakAttack;}
	else {return towerdef.medAttack;}
	
}

towerdef.shoot = function(pokemon, building, buildingsLayer) {
		var color = building.getColor();
		
		//console.log("All pokemon done with level: " + towerdef.checkIfPokemonGone(towerdef.lPlayer, towerdef.rPlayer));

		var bullet = new lime.Circle().setSize(10, 10).setFill(building.getColor()).setPosition(building.sprite.getPosition().x, building.sprite.getPosition().y);
		buildingsLayer.appendChild(bullet);
		
		//TODO: move to position where pokemon will be
		var shoot = new lime.animation.MoveTo(pokemon.sprite.getPosition().x, pokemon.sprite.getPosition().y).setDuration(0.1);
		goog.events.listen(shoot,"stop",function(){
			towerdef.finishShoot(bullet, pokemon, buildingsLayer);	
		}); 
		bullet.runAction(shoot, 0.1);
	}
	
towerdef.finishShoot = function (bullet, pokemon, buildingsLayer) {
	buildingsLayer.removeChild(bullet);
	if (!pokemon.checkFainted()) {
		pokemon.health -= towerdef.damageAmount(this.type, pokemon.type);
	}
	else {
		if (pokemon.sprite.parent_ != undefined) {
			pokemon.sprite.parent_.removeChild(pokemon.sprite);
			
		}
	}
	
}


//-----------------------------------------
// HOVER CODE
towerdef.addHoverListener = function() {
    /**
    Test for correctly dispatching mouseover/mouseout for LimeJS objects
    Usage: scene.listenOverOut(shape,function(e){ console.log('over'); }, function(e){ console.log('out'); });
    Advice welcome about how to have the same result with more LimeJS/Closure style API.
    */
    lime.Scene.prototype.listenOverOut = (function(){
     
        var moveHandler = function(e){
            for(var i in this.registeredOverOut_){
                var item = this.registeredOverOut_[i];
                var shape = item[0];
                if(!shape.inTree_) 
                    continue;
                var insideShape = shape.hitTest(e);
                if(!shape.insideShape_ && insideShape && goog.isFunction(item[1])){
                    item[1].call(shape,e);
                }
                if(shape.insideShape_ && !insideShape && goog.isFunction(item[2])){
                    item[2].call(shape,e);
                }
                shape.insideShape_ = insideShape;
            }
        };
         
        return function(shape,over,out){
            if(shape==this) return; //scene itself is always full
         
            if(!this.registeredOverOut_){
            this.registeredOverOut_ = {};
            }
         
            var uuid = goog.getUid(shape);
             
            if(!over && !out) //clear if empty
            delete this.registeredOverOut_[uuid];
         
            if(!this.isListeningOverOut_){
                goog.events.listen(this,"mousemove",moveHandler,false,this);
                this.isListeningOverOut_ = true;
            }
         
            this.registeredOverOut_[uuid] = [shape,over,out];
        }
    })();
    
}
    
towerdef.hoverInHandler = function (item, size) {

    return function(e){
        //animate
        item.runAction(new lime.animation.ScaleTo(size).setDuration(.05));
    };

};

towerdef.hoverOutHandler = function (item, size) {
    
    return function() {
        item.runAction(new lime.animation.ScaleTo(size).setDuration(.05));
    }
};

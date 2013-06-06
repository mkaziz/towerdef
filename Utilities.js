// GENERIC UTILITY FUNCTIONS
towerdef.getRandomNumber = function (num) {
    return Math.floor((Math.random()*num)-1)
}

towerdef.distance = function(sprite1, sprite2) {
	var x1 = sprite1.getPosition().x;
	var x2 = sprite2.getPosition().x;
	
	var y1 = sprite1.getPosition().y;
	var y2 = sprite2.getPosition().y;
	
	var xd = x2 - x1;
	var yd = y2 - y1;
	
	return Math.sqrt ( xd * xd + yd * yd);
}

// POKEMON-RELATED UTILITY FUNCTIONS
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

towerdef.damageAmount = function(buildingType, pokemonType) {
	var weakness = towerdef.getWeakness(pokemonType);
	var strength = towerdef.getStrength(pokemonType);
	
	if (buildingType == weakness) { return 15;}
	else if (buildingType == strength) { return 1;}
	else {return 5;}
	
}

towerdef.getGymDamage = function(pokemon) {
	// TODO: level up?
	return 5;
}

towerdef.playerAllCollidedOrDead = function(player) {
	for (i = 0; i < player.pokemon.length; i++) {
		if (player.pokemon[i].collided == false) {
			return false;
		}
		if (player.pokemon[i].health <= 0) {
			return false;
		}
	}
	return true;
}

towerdef.checkIfPokemonGone = function() {
	return towerdef.playerAllCollidedOrDead(towerdef.lPlayer) && towerdef.playerAllCollidedOrDead(towerdef.rPlayer);
}	

towerdef.checkGymCollision = function(gym, pokemon, player) {
	if(goog.math.Box.intersects(gym.getBoundingBox(), pokemon.sprite.getBoundingBox()) && !pokemon.collided){
		//colliding with Gym
		if (player.health > 0) {
			player.health -= towerdef.getGymDamage(pokemon);
			pokemon.collided = true;
			pokemon.sprite.runAction(new lime.animation.FadeTo(0.1).setDuration(0.5));
			console.log(player.gym.location + " gym health: " + player.health);
		}
		else 
		{
			console.log ("You lose!");
		}
   	}
}

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

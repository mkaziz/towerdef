//set main namespace
goog.provide('towerdef');

//get requirements
goog.require('lime');
goog.require('lime.Director');
goog.require('lime.Scene');
goog.require('lime.Layer');
goog.require('lime.Circle');
goog.require('lime.Label');
goog.require('lime.GlossyButton');
goog.require('lime.audio.Audio');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.FadeTo');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.MoveTo');
goog.require('lime.CoverNode');
goog.require('lime.animation.ColorTo');
goog.require('lime.animation.Sequence');
goog.require('goog.events.EventTarget');


// GLOBALS
towerdef.lPlayer = null;
towerdef.rPlayer = null;
towerdef.roundRunTime = 5000; //milliseconds
towerdef.director = null;
towerdef.music = false;
towerdef.buildingCost = 50;

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

// GAME CLASSES
towerdef.player = function(gym, opponent) {
    
    this.pokemon = [];
    this.buildings = [];
    this.health = 100;
    // left or right
    this.gym = gym;
    this.money = 100;
	this.opponent = opponent;
	
	this.buildingAttack = function (buildingsLayer) {
		for (i = 0; i< this.buildings.length; i++) {
			for (j = 0; j < this.opponent.pokemon.length; j++) {
				//console.log ("Building " + i, ", " + this.buildings[i].name + " is shooting " + this.opponent.pokemon[j].type + ", pokemon " + j);
				this.buildings[i].attack(this.opponent.pokemon[j], buildingsLayer);
			}
		}
	}
	
	this.pintervalID;
	this.handleGymCollisions = function () {
		var myGym = this.gym;
		var player = this;
		for (i = 0; i<this.opponent.pokemon.length; i++) {
			var myPokemon = this.opponent.pokemon[i];
    		this.pintervalID = setInterval(function () { towerdef.checkGymCollision(myGym, myPokemon, player); }, 250);
		}
	}
	

	
	this.healthBarSize=50;
	this.hintervalID;
	
	this.stopUpdates = function () {
		clearInterval(this.pintervalID);
		clearInterval(this.hintervalID); //todo: update health if a collision is detected	
	}
	
	this.displayHealth = function(healthLayer){
		var player = this;
		this.hintervalID = setInterval(function () { towerdef.updateHealth (player, healthLayer);}, 250);
	}
	
        
}

towerdef.pokemon = function(health,attack,type,player,spriteUrl) {
    this.health = health;
    this.attack = attack;
    this.type = type;
    this.player = player;
    this.level = 1;
    this.sprite = new lime.Sprite().setSize(19,19).setFill(spriteUrl).setPosition(player.gym.position_.x+towerdef.getRandomNumber(40)-20,player.gym.position_.y+50+towerdef.getRandomNumber(40)).setAnchorPoint(0.5,0.5);
    this.route = Math.floor((Math.random()*3)+1);
    this.collided = false;
    
    this.refreshRoutes = function() {this.route = Math.floor((Math.random()*100)+1); };
    this.resetRoundPosition = function () {
        this.sprite.setPosition(player.gym.position_.x+towerdef.getRandomNumber(40)-20,
        player.gym.position_.y+50+towerdef.getRandomNumber(40)).setAnchorPoint(0.5,0.5)
        this.collided = false;
    };
	
	this.checkFainted = function () {
		if (this.health <= 0) {
			return true;
		}
		return false;
	}
}

//TODO: clean all of this up
towerdef.updateHealth = function(myplayer, healthLayer) {
		var pos = myplayer.gym.getPosition();
		
		var healthBackground = new lime.RoundedRect().setSize(myplayer.healthBarSize, 5).setRadius(2).setFill('#FFF').setPosition(pos.x, pos.y - 50);
		healthLayer.appendChild(healthBackground);
		
		var healthLevel = new lime.RoundedRect().setSize(myplayer.health*(myplayer.healthBarSize/100), 5).setRadius(2).setFill('#F00').setPosition(pos.x, pos.y - 50);
		healthLayer.appendChild(healthLevel);
	}

towerdef.displayGymHealth = function(gameLayer) {
	var healthLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
	gameLayer.appendChild(healthLayer);
	
	towerdef.lPlayer.displayHealth(healthLayer);
	towerdef.rPlayer.displayHealth(healthLayer);
}

towerdef.shoot = function(pokemon, building, buildingsLayer) {
		var color = building.getColor();
		
		console.log("All pokemon done with level: " + towerdef.checkIfPokemonGone(towerdef.lPlayer, towerdef.rPlayer));

		var bullet = new lime.Circle().setSize(5, 5).setFill(building.getColor()).setPosition(building.sprite.getPosition().x, building.sprite.getPosition().y);
		buildingsLayer.appendChild(bullet);
		
		//TODO: move to position where pokemon will be
		var shoot = new lime.animation.MoveTo(pokemon.sprite.getPosition().x, pokemon.sprite.getPosition().y);
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
		if (pokemon.sprite.parent != undefined) {
			pokemon.sprite.parent.removeChild(pokemon);
			
		}
	}
	
}

towerdef.building = function (name, health, attack, type, player, sprite_name)  {
	this.name = name;
	this.health = health;
	this.attack_power = attack;
	this.type = type;
	this.player = player;
	this.sprite = new lime.Sprite().setFill(sprite_name).setAnchorPoint(0.5, 0.5).setSize(20,20);
	this.level = 1;
	this.attack_radius = 700;
	this.attack_interval = 500; //milliseconds
	this.intervalID;
	this.placed = false;
	
	this.isInRange = function(pokemon) {
		if (towerdef.distance(pokemon.sprite, this.sprite) < this.attack_radius) {return true;}
		return false;
	}
	
	this.getColor = function () {
		var color;
		
		if (this.type == "fire") {color = '#F00';}
		else if (this.type == "grass") {color = '#360';}
		else {color = '#00F';}
	
		return color;
	}
	
	this.attack = function(pokemon, buildingsLayer) {
		var building = this;
		if (this.isInRange(pokemon) && this.intervalID == undefined) {
			this.intervalID = setInterval(function () {towerdef.shoot(pokemon, building, buildingsLayer);}, this.attack_interval);
		}
	}
	
	this.stopShooting = function() {
		clearInterval(this.intervalID);
	}

}


// SCENES
towerdef.menuScene = function (director) {
    var menuScene = new lime.Scene();
    director.replaceScene(menuScene);
    
    var layer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
    
    var background = new lime.Sprite().setSize(900,506).setFill("background.png").setPosition(0,0).setAnchorPoint(0,0);
    var logo = new lime.Sprite().setSize(700,256).setFill("pokemon-logo.png").setPosition(450,153).setAnchorPoint(0.5,0.5).setScale(0.6,0.6);
    var start = new lime.Sprite().setSize(330,330).setFill("start.png").setPosition(450,350).setAnchorPoint(0.5,0.5).setScale(0.6,0.6);
    
    layer.appendChild(background);
    layer.appendChild(logo);
    layer.appendChild(start);
    
    menuScene.appendChild(layer);
    
    menuScene.listenOverOut(start, towerdef.hoverInHandler(start, 0.7), towerdef.hoverOutHandler(start, 0.6));

    goog.events.listen(start,['mousedown','touchstart'],function(e) {
        towerdef.gameScene(director);
    });

}

towerdef.gameScene = function (director) {
   
    var gameScene = new lime.Scene();
    director.replaceScene(gameScene);
    
	if (towerdef.music) {
    var music = new lime.audio.Audio("sd.ogg");
    music.play();
    
    // workaround to allow for looping
    lime.scheduleManager.scheduleWithDelay(function (dt) {
        if (this.playing_ == false) {
            this.play();
        }
    }, music, 7000);
	}
    
	
    var gameLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
    var background = new lime.Sprite().setSize(900,506).setFill("background.png").setPosition(0,0).setAnchorPoint(0,0);
     
    gameLayer.appendChild(background);
    gameScene.appendChild(gameLayer);
    
    var lGym = new lime.Sprite().setSize(96,80).setFill("gym.png").setPosition(50,250).setAnchorPoint(0.5,0.5);
    lGym.location = "left";
    var rGym = new lime.Sprite().setSize(96,80).setFill("gym.png").setPosition(850,250).setAnchorPoint(0.5,0.5);
    rGym.location = "right";
    
    gameLayer.appendChild(rGym);
    gameLayer.appendChild(lGym);
    
	towerdef.rPlayer = new towerdef.player(rGym, towerdef.lPlayer);
    towerdef.lPlayer = new towerdef.player(lGym, towerdef.rPlayer);
	towerdef.rPlayer.opponent = towerdef.lPlayer; //doesn't seem to want to add this when rPlayer is created and lPlayer is still null.
   
    
    towerdef.console(gameScene, gameLayer);

}


// CONSOLE
towerdef.updateConsole = function (gameScene, pokemonLayer, moneyLayer, buildingsLayer) {
    
    var initX = 200;
    
    pokemonLayer.removeAllChildren();

    for (i = 0; i < towerdef.lPlayer.pokemon.length; i++) {
        var pokemon = towerdef.lPlayer.pokemon[i];
        pokemon.sprite.removeAllChildren();
        pokemonLayer.appendChild(pokemon.sprite);

        var label = new lime.Label()
            .setPosition(0, 12)
            .setFontSize(7);

        if (pokemon.type == "fire")
            label.setText("Charmander - lvl" + pokemon.level.toString());
        else if (pokemon.type == "grass")
            label.setText("Bulbasaur - lvl" + pokemon.level.toString());
        else if (pokemon.type == "water")
            label.setText("Squirtle - lvl" + pokemon.level.toString());
            
        var lvlUpButton = new lime.GlossyButton("Lvl up!");
        lvlUpButton.pokemon = pokemon;
        lvlUpButton.setPosition(0, 22).setSize(30,15).setFontSize(7);
        
        // lvl up
        goog.events.listen(lvlUpButton, ['mousedown','touchstart'], function(e) {
            if (towerdef.lPlayer.money >= 5) {
                this.pokemon.attack += 2
                this.pokemon.health += 2
                this.pokemon.level += 1;
                towerdef.lPlayer.money -= 5;
                towerdef.updateConsole(gameScene, pokemonLayer, moneyLayer, buildingsLayer);
            }
            else {
                alert("Not enough money to level up.");
            }
        });

        pokemon.sprite.appendChild(label);
        pokemon.sprite.appendChild(lvlUpButton);
        pokemon.sprite.setPosition(initX + i * 90, 130);
        pokemon.sprite.runAction(new lime.animation.ScaleTo(1.5),0.5);
    }
	
	//add building sprites to HUD
	for (i=0; i < towerdef.lPlayer.buildings.length; i++) {
		/*var s = towerdef.lPlayer.buildings[i].sprite;
		var fill = s.getFill();
		var building = new lime.Sprite();
		building.setFill('#F00');*/
		var building = towerdef.lPlayer.buildings[i].sprite;
		building.setPosition(initX + i * 40, 200);
		building.runAction(new lime.animation.ScaleTo(1.5),0.5);
		buildingsLayer.appendChild(building);
	}
    
    var moneyLabel = new lime.Label().setPosition(160,100).setFontSize(22).setText(towerdef.lPlayer.money.toString());
    moneyLayer.removeAllChildren();
    moneyLayer.appendChild(moneyLabel);
    
}

towerdef.addBuildingsToConsole = function(gameScene, consoleLayer, pokemonLayer, moneyLayer, buildingsLayer) {
	var fire_building_icon = new lime.Sprite().setFill('fire_building_large.png').setPosition(575, 350).setAnchorPoint(0.5,0.5);
	var grass_building_icon = new lime.Sprite().setFill('grass_building_large.png').setPosition(700, 350).setAnchorPoint(0.5,0.5);
	var water_building_icon = new lime.Sprite().setFill('water_building_large.png').setPosition(825, 350).setAnchorPoint(0.5,0.5);
	
	consoleLayer.appendChild(fire_building_icon);
	consoleLayer.appendChild(grass_building_icon);
	consoleLayer.appendChild(water_building_icon);	
	
	gameScene.listenOverOut(fire_building_icon, towerdef.hoverInHandler(fire_building_icon, 1.2), towerdef.hoverOutHandler(fire_building_icon, 1.0));
    gameScene.listenOverOut(grass_building_icon, towerdef.hoverInHandler(grass_building_icon, 1.2), towerdef.hoverOutHandler(grass_building_icon, 1.0));
    gameScene.listenOverOut(water_building_icon, towerdef.hoverInHandler(water_building_icon, 1.2), towerdef.hoverOutHandler(water_building_icon, 1.0));
	
	buyBuildings  = function(createBuildingFn, buildingName) {
	
		if (towerdef.lPlayer.money >= towerdef.buildingCost) {
			towerdef.lPlayer.money -= towerdef.buildingCost
			createBuildingFn(); //create building
			towerdef.updateConsole(gameScene, pokemonLayer, moneyLayer, buildingsLayer);
		}
		else {
			alert("You don't have enough money to buy a " + buildingName);
		}
		
	}
	
	createBuildingEventListener = function(large_icon_name, small_icon_name, type, name) {
		goog.events.listen(large_icon_name, ['mousedown','touchstart'], function(e) {
		var b = new towerdef.building(name, 100,10,type,towerdef.lPlayer, small_icon_name);
			buyBuildings(function () {
                towerdef.lPlayer.buildings.push(b);
            }, name);
			e.event.stopPropagation(); 
		});
	}

	
	createBuildingEventListener(fire_building_icon, "fire_building.png", "fire", "fire type building");
	createBuildingEventListener(grass_building_icon, "grass_building.png", "grass", "grass type building");
	createBuildingEventListener(water_building_icon, "water_building.png", "water", "water type building");	
	
}

towerdef.makeDraggable = function (item, layer, foundations) {
	goog.events.listen(item, 'mousedown', function(e){
		var drag = e.startDrag(false, null, item); 
		
		for (i = 0; i < foundations.length; i++) {
			drag.addDropTarget(foundations[i]);
		}
		
		e.event.stopPropagation(); 
		
		 var lastPosition = item.getPosition();
		goog.events.listen(drag, lime.events.Drag.Event.CANCEL, function(){
			item.runAction(new lime.animation.MoveTo(lastPosition).setDuration(.5));
		});
	
	});
}

towerdef.makeDroppable = function(sprite) {
  sprite.showDropHighlight = function(){
    this.runAction(new lime.animation.ColorTo('#FFF').setDuration(.3));
  };
  sprite.hideDropHighlight = function(){
    this.runAction(new lime.animation.ColorTo(255, 200, 200, 0.5).setDuration(.1));
  };
}

towerdef.placeBuildings = function (player, gameScene, gameLayer) {
	var  placeBuildingsScene = new lime.Scene();
    //towerdef.director.pushScene(gameScene);
	towerdef.director.pushScene(placeBuildingsScene);
	
	var bLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
	placeBuildingsScene.appendChild(bLayer);
	
	var background = new lime.Sprite().setSize(900,506).setFill("background.png").setPosition(0,0).setAnchorPoint(0,0);
	var doneButton = new lime.GlossyButton("Done!");
	doneButton.setPosition(700, 450).setSize(100,40).setFontSize(18).setColor('#B0171F');
	
	//TODO: add lGym
	 var gym = new lime.Sprite().setSize(96,80).setFill("gym.png").setPosition(50,250).setAnchorPoint(0.5,0.5);
	//var foundations = new lime.RoundedRect().setSize(420, 505).setFill('#0F0').setPosition(0,0).setAnchorPoint(0,0);//.setText('Buildings');//.setFintSize(26);
	
	var all_foundations = [];
	
	var initX = 30;
	var initY = 30;
	var f_across = 9;
	var f_down = 10;
	var x_gap = 40;
	var y_gap = 50;

	
	bLayer.appendChild(background);
	bLayer.appendChild(gym);
	bLayer.appendChild(doneButton);
	
	for (i = 0; i < f_down; i++) {
		var myY = initY + y_gap * i;
		for (j = 0; j < f_across; j++ ) {
			var myX = initX + x_gap * j;
			if ( myX < 150 && (myY < 300 && myY > 200)) {} //leave space for Gym
			else { 
				var temp = new lime.RoundedRect().setSize(30, 30).setFill(255, 200, 200, 0.5).setPosition(myX, myY);
				all_foundations.push(temp)
				towerdef.makeDroppable(temp);
				bLayer.appendChild(temp);
			}
		}
	}
	
	var initX = 600;
	var initY = 200;
	var interval = 40;
	
	var c = new lime.RoundedRect().setFill(255, 255, 255, 0.5).setPosition(550, 20).setSize(300, 400).setAnchorPoint(0,0);
	var cl = new lime.Sprite().setPosition(700, 80).setSize(150, 35).setFill("buildings_header.png");//setFontSize(26);
	bLayer.appendChild(c);
	bLayer.appendChild(cl);
	
	//populate console with buildings to place
	for (i = 0;  i<player.buildings.length; i++) {
		bLayer.appendChild(player.buildings[i].sprite.setPosition(initX, initY + i * interval));
		towerdef.makeDraggable(player.buildings[i].sprite, bLayer, all_foundations);
	}
	
	goog.events.listen(doneButton, ['mousedown','touchstart'], function(e) {
		towerdef.director.popScene();
		e.event.stopPropagation();
    });
	
}

towerdef.console = function (gameScene, gameLayer) {
    
    var consoleLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
    gameLayer.appendChild(consoleLayer);
    
    var console = new lime.Sprite().setSize(900,506).setFill("Console.png").setPosition(450,253).setAnchorPoint(0.5,0.5);
    
    var charmander_icon = new lime.Sprite().setFill('charmander_icon.png').setPosition(100, 350).setAnchorPoint(0.5,0.5);
    var bulbasaur_icon = new lime.Sprite().setFill('bulbasaur_icon.png').setPosition(225, 350).setAnchorPoint(0.5,0.5);
    var squirtle_icon = new lime.Sprite().setFill('squirtle_icon.png').setPosition(350, 350).setAnchorPoint(0.5,0.5);
    
    consoleLayer.appendChild(console);
    
    consoleLayer.appendChild(charmander_icon);
    consoleLayer.appendChild(bulbasaur_icon);
    consoleLayer.appendChild(squirtle_icon);
	
	
    //TODO: find workaround so you're not passing sprite in twice
    gameScene.listenOverOut(charmander_icon, towerdef.hoverInHandler(charmander_icon, 1.2), towerdef.hoverOutHandler(charmander_icon, 1.0));
    gameScene.listenOverOut(bulbasaur_icon, towerdef.hoverInHandler(bulbasaur_icon, 1.2), towerdef.hoverOutHandler(bulbasaur_icon, 1.0));
    gameScene.listenOverOut(squirtle_icon, towerdef.hoverInHandler(squirtle_icon, 1.2), towerdef.hoverOutHandler(squirtle_icon, 1.0));
    
    var pokemonLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
    consoleLayer.appendChild(pokemonLayer);
    
    var moneyLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
    consoleLayer.appendChild(moneyLayer);

    var buildingsLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
    consoleLayer.appendChild(buildingsLayer);
	
	towerdef.addBuildingsToConsole(gameScene, consoleLayer, pokemonLayer, moneyLayer, buildingsLayer);

    var buyPokemon = function (createPokemonFn, pokemonName) {
        
        if (towerdef.lPlayer.pokemon.length >= 8) {
            alert("You can't buy more than 8 pokemon");
            return;
        }
        
        if (towerdef.lPlayer.money >= 20) {
            towerdef.lPlayer.money -= 20;
            createPokemonFn();
            towerdef.updateConsole(gameScene, pokemonLayer, moneyLayer, buildingsLayer);
        }
        else {
            alert("You don't have enough money to buy a " + pokemonName);
        }
        
    }
    
    var playButton = new lime.GlossyButton("Play Round");
    playButton.setPosition(450, 450).setSize(100,40).setFontSize(18).setColor('#B0171F');
	
	var placeBuildingsButton = new lime.GlossyButton("Place Buildings");
	placeBuildingsButton.setPosition(700, 450).setSize(150,40).setFontSize(18).setColor('#00C');
    
    consoleLayer.appendChild(playButton);
	consoleLayer.appendChild(placeBuildingsButton);
    towerdef.updateConsole(gameScene, pokemonLayer, moneyLayer, buildingsLayer);
    
    goog.events.listen(playButton, ['mousedown','touchstart'], function(e) {
        gameLayer.removeChild(consoleLayer);
        towerdef.playRound(gameScene, gameLayer);
    });
	
	goog.events.listen(placeBuildingsButton, ['mousedown','touchstart'], function(e) {
		towerdef.placeBuildings(towerdef.lPlayer, gameScene, gameLayer);
    });
    
    goog.events.listen(charmander_icon, ['mousedown','touchstart'], function(e) {
        buyPokemon(function () {
                towerdef.lPlayer.pokemon.push(new towerdef.pokemon(100,10,"fire",towerdef.lPlayer,"charmander.png"));
            }, "Charmander");
    });

    goog.events.listen(bulbasaur_icon, ['mousedown','touchstart'], function(e) {
        buyPokemon(function () {
            towerdef.lPlayer.pokemon.push(new towerdef.pokemon(100,10,"grass",towerdef.lPlayer,"bulbasaur.png"));
            }, "Bulbasaur");
    });

    goog.events.listen(squirtle_icon, ['mousedown','touchstart'], function(e) {
        buyPokemon(function () {
            towerdef.lPlayer.pokemon.push(new towerdef.pokemon(100,10,"water",towerdef.lPlayer,"squirtle.png"));
        }, "Squirtle");
    });
    
}


// ROUND
towerdef.addBuildingsToRound = function(roundLayer, player) {
	for (i=0; i < player.buildings.length; i++) {
		if (player.buildings[i].sprite.getPosition().x < 500) {
			roundLayer.appendChild(player.buildings[i].sprite);
		}
	}
}

towerdef.addPokemonToRound = function(roundLayer, player, opponent) {
    for (i = 0; i < player.pokemon.length; i++) {
		var mySprite = player.pokemon[i].sprite;
        roundLayer.appendChild(mySprite);
        mySprite.removeAllChildren();
        player.pokemon[i].resetRoundPosition();

		// pokemon movng towards opposite gym action
        player.pokemon[i].sprite.runAction(
			//new lime.animation.MoveTo(opponent.gym.position_.x+towerdef.getRandomNumber(40)-20,opponent.gym.position_.y+50+towerdef.getRandomNumber(40)));
			new lime.animation.MoveTo(opponent.gym.position_.x,opponent.gym.position_.y)); //testing collisions
    }
}

towerdef.stopShooting = function(player) {
	for (i = 0; i < player.buildings.length; i++) {
		player.buildings[i].stopShooting();
	}
}

towerdef.playRound = function (gameScene, gameLayer) {
    
    var roundLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
    var starting = new lime.Sprite().setSize(540,160).setFill("starting.png").setPosition(450,150).setAnchorPoint(0.5,0.5).setScale(1.5,1.5);
    
    gameLayer.appendChild(roundLayer);
    roundLayer.appendChild(starting);
    
    starting.runAction(new lime.animation.Spawn(
                new lime.animation.FadeTo(0),
                new lime.animation.ScaleTo(0.5)
            ).setDuration(1));
    
	//opponent test pokemon
    towerdef.rPlayer.pokemon.push(new towerdef.pokemon(100,10,"fire",towerdef.rPlayer,"Pikachu_1.png"));
	
	towerdef.addBuildingsToRound(gameLayer, towerdef.lPlayer);

	towerdef.lPlayer.buildingAttack(gameLayer);
	towerdef.rPlayer.buildingAttack(gameLayer);
	
	towerdef.addPokemonToRound(gameLayer, towerdef.lPlayer, towerdef.rPlayer);
	towerdef.addPokemonToRound(gameLayer, towerdef.rPlayer, towerdef.lPlayer);
	
	towerdef.lPlayer.handleGymCollisions();
	towerdef.rPlayer.handleGymCollisions();
	
	towerdef.displayGymHealth(gameLayer); //for both gyms
    

    
    var handleConsoleSwitch = function (dt) {
        
        if (towerdef.checkIfPokemonGone(towerdef.lPlayer, towerdef.rPlayer)) {
            towerdef.stopShooting(towerdef.lPlayer);
            towerdef.stopShooting(towerdef.rPlayer);            
            towerdef.lPlayer.stopUpdates();
            towerdef.rPlayer.stopUpdates();
            lime.scheduleManager.callAfter(function (dt) {
                gameLayer.removeChild(roundLayer);
                towerdef.lPlayer.money += 20;
                towerdef.console(gameScene, gameLayer);
            }, gameScene, 2000);
            lime.scheduleManager.unschedule(handleConsoleSwitch, gameScene);
        }
    };
    
    lime.scheduleManager.scheduleWithDelay(handleConsoleSwitch, gameScene, 500);
}


// INITIAL FUNCTION
towerdef.start = function(){          
    var director = new lime.Director(document.body,900,506);   
	towerdef.director = director;
    director.makeMobileWebAppCapable();     
    director.setDisplayFPS(true);          
    
    towerdef.addHoverListener();
    towerdef.menuScene(director);
}



//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('towerdef.start', towerdef.start);

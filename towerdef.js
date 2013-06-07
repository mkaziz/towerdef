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

// --------------------------------------------------
// GLOBALS
towerdef.lPlayer = null;
towerdef.rPlayer = null;
towerdef.roundRunTime = 5000; //milliseconds
towerdef.director = null;
towerdef.music = false;
towerdef.soundtrack;

//--------------------------------
//GAME VARIABLES
towerdef.pokemonLimit = 8; 		//max number of pokemon player can buy
towerdef.buildingLimit = 6;

towerdef.buildingCost = 50; 	//amt of coin to buy a building
towerdef.pokemonCost = 15;		//amt of coin to buy a pokemon
//towerdef.levelUpCost = 5; 	//amt of coin to level up a pokemon - see function

towerdef.levelUpMoney = 30; 	//amt of coin each player gets at the end of the level, in addition to money for any fainted pokemon
towerdef.moneyFaintPokemon = 5; //amt of coin each player gets for an opponent's fainted pokemon

towerdef.opponentDifficulty = 1; //increase in probability that they will be able to fund new units

towerdef.strongAttack = 20; 	//amt of damage a building does if it is a strength
towerdef.medAttack = 15;		//amt of damage a building does if it is a normal strength
towerdef.weakAttack = 10;		//amt of damage a building does if it is a weakness

towerdef.towerRadius = 200;     //distance a pokemon must be under from a tower for it to attack
towerdef.attackInterval = 500; 	//a building attacks after this many milliseconds 

towerdef.gymDamage = 8; 		//damage an individual pokemon can do to a gym at level 1

towerdef.speed = 100; //pokemon peed modifier

// --------------------------------------------------
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
			
            this.buildings[i].attack(buildingsLayer);
		}
	}
	
	this.pintervalID;
	this.handleGymCollisions = function () {
		var myGym = this.gym;
		var player = this;
		this.pintervalID = setInterval(function () {
            for (i = 0; i<player.opponent.pokemon.length; i++) {
            	//if (player.health > 0) {
                var myPokemon = player.opponent.pokemon[i];
                towerdef.checkGymCollision(myGym, myPokemon, player); 
               //}

            }
        }, 250);
	}
	
	this.healthBarSize=50;
	this.hintervalID;
	
	this.stopUpdates = function () {
		clearInterval(this.pintervalID);
		clearInterval(this.hintervalID); //todo: update health if a collision is detected
		for (i = 0; i<this.pokemon.length; i++){
			this.pokemon[i].stopUpdates();
		}	
	}
	
	this.displayHealth = function(healthLayer){
		var player = this;
		this.hintervalID = setInterval(function () { towerdef.updateHealth (player, healthLayer);}, 250);
	}
	
        
}

towerdef.pokemon = function(health,attack,type,player,spriteUrl) {
    this.maxHealth = health;
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
        player.gym.position_.y).setAnchorPoint(0.5,0.5);
		this.sprite.runAction(new lime.animation.FadeTo(1).setDuration(0));
        this.health = this.maxHealth;
        this.collided = false;
    };
    
    this.levelUpCost = function () {
        return 2*(this.level) + 5;
    }
    
    this.levelUp = function () {
        this.attack += 0
        this.maxHealth += 3
        this.level += 1;
    }
	
	this.isFainted = function () {
		if (this.health <= 0) {
			return true;
		}
		return false;
	}
	
	this.hintervalID;
	this.healthBackground;
	this.healthLevel;
	this.displayHealth = function(healthLayer){
		var pokemon = this;
		var pos = this.sprite.getPosition();
        
        if (this.healthBackground == null) {
            this.healthBackground = new lime.RoundedRect().setSize(pokemon.maxHealth/2, 5).setRadius(2).setFill('#FFF').setPosition(pos.x - 25, pos.y - 20).setAnchorPoint(0,0);
            healthLayer.appendChild(this.healthBackground);
        }
        else {
            this.healthBackground.setPosition(pos.x - 25, pos.y - 20);
        }
        
        if (this.healthLevel == null) {        
            this.healthLevel = new lime.RoundedRect().setSize(pokemon.health*(pokemon.maxHealth/200), 5).setRadius(2).setFill('#F00').setPosition(pos.x - 25, pos.y - 20).setAnchorPoint(0,0);
            healthLayer.appendChild(this.healthLevel);
        }
        else {
            this.healthLevel.setPosition(pos.x - 25, pos.y - 20);
        }
		
		
		this.hintervalID = setInterval(function () { towerdef.pokemonHealthBar (pokemon, healthLayer);}, 50);
	}
	
	this.stopUpdates = function() {
        
        if (this.sprite.parent_ != undefined) {
            this.sprite.parent_.removeChild(this.sprite);
        }
        //this.moving = false;
		this.healthBackground = null;
		this.healthLevel = null;
		clearInterval(this.hintervalID);
	}
	
	//FSM-based path finding
	this.moveNext = function(owner,direction) {
		var movement = null;
		var entity = this;
		var moving = true;
		
		var rand = (Math.random() + 0.5);
		// pokemon movng towards opposite gym action
		if(owner==towerdef.lPlayer){
			if(this.sprite.position_.x<owner.gym.position_.x+135){
				movement = new lime.animation.MoveTo(owner.gym.position_.x+135,owner.gym.position_.y).setDuration((owner.gym.position_.x+135-this.sprite.position_.x)/(towerdef.speed * rand));
			}else if(this.sprite.position_.x==owner.gym.position_.x+135 && this.sprite.position_.y==owner.gym.position_.y){
				if(direction == 0) 
					movement = new lime.animation.MoveTo(owner.opponent.gym.position_.x-115,owner.gym.position_.y).setDuration((owner.opponent.gym.position_.x-115-this.sprite.position_.x)/(towerdef.speed * rand));
				else if(direction == 1)
					movement = new lime.animation.MoveTo(owner.gym.position_.x+135,owner.gym.position_.y-190).setDuration(190/(towerdef.speed * rand));
				else if(direction == 2)
					movement = new lime.animation.MoveTo(owner.gym.position_.x+135,owner.gym.position_.y+190).setDuration(190/(towerdef.speed * rand));
			}else if(this.sprite.position_.x==owner.gym.position_.x+135){
				movement = new lime.animation.MoveTo(owner.opponent.gym.position_.x-115,this.sprite.position_.y).setDuration((owner.opponent.gym.position_.x-115-this.sprite.position_.x)/(towerdef.speed * rand));
			}else if(this.sprite.position_.y != owner.gym.position_.y){
				movement = new lime.animation.MoveTo(this.sprite.position_.x,owner.gym.position_.y).setDuration(190/(towerdef.speed * rand));
			}else{
				moving = false;
				movement = new lime.animation.MoveTo(owner.opponent.gym.position_.x,this.sprite.position_.y).setDuration((owner.opponent.gym.position_.x-this.sprite.position_.x)/(towerdef.speed * rand));
			}
		}else{
			if(this.sprite.position_.x>owner.gym.position_.x-115){
				movement = new lime.animation.MoveTo(owner.gym.position_.x-115,owner.gym.position_.y).setDuration((this.sprite.position_.x-owner.gym.position_.x+115)/(towerdef.speed * rand));
			}else if(this.sprite.position_.x==owner.gym.position_.x-115 && this.sprite.position_.y==owner.gym.position_.y){
				if(direction == 0) 
					movement = new lime.animation.MoveTo(owner.opponent.gym.position_.x+135,owner.gym.position_.y).setDuration((this.sprite.position_.x-owner.opponent.gym.position_.x-135)/(towerdef.speed * rand));
				else if(direction == 1)
					movement = new lime.animation.MoveTo(owner.gym.position_.x-115,owner.gym.position_.y-190).setDuration(190/(towerdef.speed * rand));
				else if(direction == 2)
					movement = new lime.animation.MoveTo(owner.gym.position_.x-115,owner.gym.position_.y+190).setDuration(190/(towerdef.speed * rand));
			}else if(this.sprite.position_.x==owner.gym.position_.x-115){
				movement = new lime.animation.MoveTo(owner.opponent.gym.position_.x+135,this.sprite.position_.y).setDuration((this.sprite.position_.x-owner.opponent.gym.position_.x-135)/(towerdef.speed * rand));
			}else if(this.sprite.position_.y != owner.gym.position_.y){
				movement = new lime.animation.MoveTo(this.sprite.position_.x,owner.gym.position_.y).setDuration(190/(towerdef.speed * rand));
			}else{
				moving = false;
				movement = new lime.animation.MoveTo(owner.opponent.gym.position_.x,this.sprite.position_.y).setDuration((this.sprite.position_.x-owner.opponent.gym.position_.x)/(towerdef.speed * rand));
			}
        }this.sprite.runAction(movement.setEasing(lime.animation.Easing.LINEAR));

		//checks when pokemon stop moving, recall function to continue movement
		goog.events.listen(movement,lime.animation.Event.STOP,function(){
			if(moving) entity.moveNext(owner,direction);
			else entity.collided = true;
		})
	}
}

towerdef.checkAttack = function(pokemon, building, buildingsLayer) {
	if (building.isInRange(pokemon) && building.attacking == false){
		towerdef.shoot(pokemon, building, buildingsLayer);
	}
	else if (building.isInRange(pokemon) && building.attacking) {
		building.attacking = false;
		clearInterval(building.intervalID);
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
	this.attack_radius = towerdef.towerRadius;
	this.attack_interval = towerdef.attackInterval; //milliseconds
	//this.intervalID;
	this.placed = false;
	this.droppable = false;
	this.attacking = false;
	
    this.getBestTarget = function () {
        var opponentPokemon = this.player.opponent.pokemon;
        var chosenPokemon = null;
        var chosenPokemonDist = towerdef.towerRadius;
        for (i = 0; i < opponentPokemon.length; i++) {
            if (this.isInRange(opponentPokemon[i])) {
                var dist = towerdef.distance(opponentPokemon[i].sprite, this.sprite);
                if (dist < chosenPokemonDist) {
                    chosenPokemonDist = dist;
                    chosenPokemon = opponentPokemon[i];
                }
            }
        }
        
        return chosenPokemon;
        
    }
    
	this.isInRange = function(pokemon) {
		if (towerdef.distance(pokemon.sprite, this.sprite) < this.attack_radius && !pokemon.collided && !pokemon.isFainted()) {return true;}
		return false;
	}
	
	this.getColor = function () {
		var color;
		
		if (this.type == "fire") {color = '#F00';}
		else if (this.type == "grass") {color = '#360';}
		else {color = '#00F';}
	
		return color;
	}
	
	this.attackIntervalID;
	
	this.attack = function(buildingsLayer) {
		var building = this;
		if (this.attackIntervalID == undefined){
			this.attackIntervalID = setInterval(function () {
                pokemon = building.getBestTarget();
                if (pokemon !== null)
                    towerdef.checkAttack(pokemon, building, buildingsLayer);
                }, this.attack_interval);
		}
	}
	
	this.stopShooting = function() {
        
		clearInterval(this.attackIntervalID);
		this.attackIntervalID = undefined;
	}

}


// --------------------------------------------------
// SCENES
//starting scene "Pokemon Tower Defense"
towerdef.menuScene = function () {
    var menuScene = new lime.Scene();
    towerdef.director.replaceScene(menuScene);
    
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
        towerdef.gameScene();
    });

}

//setup for the game scene, then calls console window
towerdef.gameScene = function () {
   
    var gameScene = new lime.Scene();
    towerdef.director.replaceScene(gameScene);
    
	if (towerdef.music) {
    var music = new lime.audio.Audio("sd.ogg");
    music.play();
    towerdef.soundtrack = music;
    //towerdef.soundtrack.baseElement.loop = true;
    
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
    towerdef.lPlayer.opponent = towerdef.rPlayer
   
    towerdef.console(gameScene, gameLayer);

}


// --------------------------------------------------
// GAME START POINT
towerdef.start = function(){          
    var director = new lime.Director(document.body,900,506);   
	towerdef.director = director;
    director.makeMobileWebAppCapable();     
    director.setDisplayFPS(true);          
    
    towerdef.addHoverListener();
    towerdef.menuScene();
}


//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('towerdef.start', towerdef.start);

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

towerdef.buildingCost = 50;
towerdef.pokemonCost = 20;
towerdef.pokemonLimit = 8;
towerdef.levelUpCost = 5;
towerdef.levelUpMoney = 50;

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
		this.pintervalID = setInterval(function () {
            for (i = 0; i<player.opponent.pokemon.length; i++) {
                var myPokemon = player.opponent.pokemon[i];
                towerdef.checkGymCollision(myGym, myPokemon, player); 
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

//speed modifier
var speed = 100;

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
	
	this.checkFainted = function () {
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
		this.healthBackground = new lime.RoundedRect().setSize(pokemon.maxHealth/2, 5).setRadius(2).setFill('#FFF').setPosition(pos.x, pos.y - 20);
		this.healthLevel = new lime.RoundedRect().setSize(pokemon.health*(pokemon.maxHealth/200), 5).setRadius(2).setFill('#F00').setPosition(pos.x, pos.y - 20);
		healthLayer.appendChild(this.healthBackground);
		healthLayer.appendChild(this.healthLevel);
		
		this.hintervalID = setInterval(function () { towerdef.pokemonHealthBar (pokemon, healthLayer);}, 50);
	}
	
	this.stopUpdates = function() {
		clearInterval(this.hintervalID);
	}
	
	//FSM-based path finding
	this.moveNext = function(owner,direction) {
		var movement = null;
		var entity = this;
		var moving = true;
		// pokemon movng towards opposite gym action
		if(owner==towerdef.lPlayer){
			if(this.sprite.position_.x<owner.gym.position_.x+135){
				movement = new lime.animation.MoveTo(owner.gym.position_.x+135,owner.gym.position_.y).setDuration((owner.gym.position_.x+135-this.sprite.position_.x)/speed);
			}else if(this.sprite.position_.x==owner.gym.position_.x+135 && this.sprite.position_.y==owner.gym.position_.y){
				if(direction == 0) 
					movement = new lime.animation.MoveTo(owner.opponent.gym.position_.x-115,owner.gym.position_.y).setDuration((owner.opponent.gym.position_.x-115-this.sprite.position_.x)/speed);
				else if(direction == 1)
					movement = new lime.animation.MoveTo(owner.gym.position_.x+135,owner.gym.position_.y-190).setDuration(190/speed);
				else if(direction == 2)
					movement = new lime.animation.MoveTo(owner.gym.position_.x+135,owner.gym.position_.y+190).setDuration(190/speed);
			}else if(this.sprite.position_.x==owner.gym.position_.x+135){
				movement = new lime.animation.MoveTo(owner.opponent.gym.position_.x-115,this.sprite.position_.y).setDuration((owner.opponent.gym.position_.x-115-this.sprite.position_.x)/speed);
			}else if(this.sprite.position_.y != owner.gym.position_.y){
				movement = new lime.animation.MoveTo(this.sprite.position_.x,owner.gym.position_.y).setDuration(190/speed);
			}else{
				moving = false;
				movement = new lime.animation.MoveTo(owner.opponent.gym.position_.x,this.sprite.position_.y).setDuration((owner.opponent.gym.position_.x-this.sprite.position_.x)/speed);
			}
		}else{
			if(this.sprite.position_.x>owner.gym.position_.x-115){
				movement = new lime.animation.MoveTo(owner.gym.position_.x-115,owner.gym.position_.y).setDuration((this.sprite.position_.x-owner.gym.position_.x+115)/speed);
			}else if(this.sprite.position_.x==owner.gym.position_.x-115 && this.sprite.position_.y==owner.gym.position_.y){
				if(direction == 0) 
					movement = new lime.animation.MoveTo(owner.opponent.gym.position_.x+135,owner.gym.position_.y).setDuration((this.sprite.position_.x-owner.opponent.gym.position_.x-135)/speed);
				else if(direction == 1)
					movement = new lime.animation.MoveTo(owner.gym.position_.x-115,owner.gym.position_.y-190).setDuration(190/speed);
				else if(direction == 2)
					movement = new lime.animation.MoveTo(owner.gym.position_.x-115,owner.gym.position_.y+190).setDuration(190/speed);
			}else if(this.sprite.position_.x==owner.gym.position_.x-115){
				movement = new lime.animation.MoveTo(owner.opponent.gym.position_.x+135,this.sprite.position_.y).setDuration((this.sprite.position_.x-owner.opponent.gym.position_.x-135)/speed);
			}else if(this.sprite.position_.y != owner.gym.position_.y){
				movement = new lime.animation.MoveTo(this.sprite.position_.x,owner.gym.position_.y).setDuration(190/speed);
			}else{
				moving = false;
				movement = new lime.animation.MoveTo(owner.opponent.gym.position_.x,this.sprite.position_.y).setDuration((this.sprite.position_.x-owner.opponent.gym.position_.x)/speed);
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
	this.attack_radius = 200;
	this.attack_interval = 500; //milliseconds
	//this.intervalID;
	this.placed = false;
	this.droppable = false;
	this.attacking = false;
	
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
	
	this.attackIntervalID;
	
	this.attack = function(pokemon, buildingsLayer) {
		var building = this;
		if (this.attackIntervalID == undefined){
			this.attackIntervalID = setInterval(function () {towerdef.checkAttack(pokemon, building, buildingsLayer);}, this.attack_interval);
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

//setup for the game scene, then calls console window
towerdef.gameScene = function (director) {
   
    var gameScene = new lime.Scene();
    director.replaceScene(gameScene);
    
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
    towerdef.menuScene(director);
}


//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('towerdef.start', towerdef.start);

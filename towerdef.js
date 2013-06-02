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


towerdef.lPlayer = null;
towerdef.rPlayer = null;


towerdef.player = function(gym) {
    
    this.pokemon = [];
    this.buildings = [];
    this.health = 100;
    // left or right
    this.gym = gym;
    this.money = 100;
        
}

towerdef.getRandomNumber = function (num) {
    return Math.floor((Math.random()*num)-1)
}

towerdef.pokemon = function(health,attack,type,player,spriteUrl) {
    this.health = health;
    this.attack = attack;
    this.type = type;
    this.player = player;
    this.level = 1;
    this.sprite = new lime.Sprite().setSize(19,19).setFill(spriteUrl).setPosition(player.gym.position_.x+towerdef.getRandomNumber(40)-20,player.gym.position_.y+50+towerdef.getRandomNumber(40)).setAnchorPoint(0.5,0.5);
    this.route = Math.floor((Math.random()*3)+1);
    
    this.refreshRoutes = function() {this.route = Math.floor((Math.random()*100)+1); };
    this.resetRoundPosition = function () {
        this.sprite.setPosition(player.gym.position_.x+towerdef.getRandomNumber(40)-20,
        player.gym.position_.y+50+towerdef.getRandomNumber(40)).setAnchorPoint(0.5,0.5)
    };
}

towerdef.buildingCost = 50;
towerdef.building = function (name, health, attack, type, player, sprite_name)  {
	this.name = name;
	this.health = health;
	this.attack = attack;
	this.type = type;
	this.player = player;
	this.sprite = new lime.Sprite().setFill(sprite_name).setAnchorPoint(0.5, 0.5).setSize(20,20);
	this.level = 1;
	this.attack_radius = 30;
	this.attack_interval = 3; //seconds?
}

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
        //console.log("hover in");
    };

};

towerdef.hoverOutHandler = function (item, size) {
    
    return function() {
        //console.log("hover out");
        item.runAction(new lime.animation.ScaleTo(size).setDuration(.05));
    }
};
    
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
    //var player = new towerdef.player();
    //var pokemon = new towerdef.pokemon();
    
    var gameScene = new lime.Scene();
    director.replaceScene(gameScene);
    
    var music = new lime.audio.Audio("sd.ogg");
    music.play();
    
    // workaround to allow for looping
    lime.scheduleManager.scheduleWithDelay(function (dt) {
        if (this.playing_ == false) {
            this.play();
        }
    }, music, 7000);
    
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
    
    towerdef.lPlayer = new towerdef.player(lGym);
    towerdef.rPlayer = new towerdef.player(rGym);
    
    towerdef.console(gameScene, gameLayer);
    
    /*
	var posX = 750; 
	var posY = 450; //Building spawn point
	towerdef.addBuildings(gameLayer, posX, posY); //Add building functionality
	
	towerdef.addPokemonButton(gameLayer, posX, posY-70, lPlayer, rGym);
    * */
}

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
		var building = towerdef.lPlayer.buildings[i];
		//console.log("Building " + i + ": " + building.name);
		console.log("Building sprite: " + building.sprite);
		building.sprite.setPosition(initX + i * 40, 175);
		building.sprite.runAction(new lime.animation.ScaleTo(1.5),0.5);
		buildingsLayer.appendChild(building.sprite);
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
		});
	}

	
	createBuildingEventListener(fire_building_icon, "fire_building.png", "fire", "fire type building");
	createBuildingEventListener(grass_building_icon, "grass_building.png", "grass", "grass type building");
	createBuildingEventListener(water_building_icon, "water_building.png", "water", "water type building");	
	
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
    
    consoleLayer.appendChild(playButton);
    towerdef.updateConsole(gameScene, pokemonLayer, moneyLayer, buildingsLayer);
    
    goog.events.listen(playButton, ['mousedown','touchstart'], function(e) {
        gameLayer.removeChild(consoleLayer);
        towerdef.playRound(gameScene, gameLayer);
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

towerdef.playRound = function (gameScene, gameLayer) {
    
    var roundLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
    var starting = new lime.Sprite().setSize(540,160).setFill("starting.png").setPosition(450,150).setAnchorPoint(0.5,0.5).setScale(1.5,1.5);
    
    gameLayer.appendChild(roundLayer);
    roundLayer.appendChild(starting);
    
    starting.runAction(new lime.animation.Spawn(
                new lime.animation.FadeTo(0),
                new lime.animation.ScaleTo(0.5)
            ).setDuration(1));
    
    //towerdef.lPlayer.pokemon.push(new towerdef.pokemon(100,10,"lightning",towerdef.lPlayer,"Pikachu_1.png"));
    
    for (i = 0; i < towerdef.lPlayer.pokemon.length; i++) {
        roundLayer.appendChild(towerdef.lPlayer.pokemon[i].sprite);
        towerdef.lPlayer.pokemon[i].sprite.removeAllChildren();
        towerdef.lPlayer.pokemon[i].resetRoundPosition();
        towerdef.lPlayer.pokemon[i].sprite.runAction(new lime.animation.MoveTo(towerdef.rPlayer.gym.position_.x+towerdef.getRandomNumber(40)-20,towerdef.rPlayer.gym.position_.y+50+towerdef.getRandomNumber(40)));
    }
    
    lime.scheduleManager.callAfter(function (dt) {
        gameLayer.removeChild(roundLayer);
        towerdef.lPlayer.money += 20;
        towerdef.console(gameScene, gameLayer);
    }, gameScene, 2000);
    
}

towerdef.start = function(){          
    var director = new lime.Director(document.body,900,506);     
    director.makeMobileWebAppCapable();     
    director.setDisplayFPS(true);          
    
    towerdef.addHoverListener();
    towerdef.menuScene(director);
    
    /*
    var mapScene = new lime.Scene();              
    director.replaceScene(mapScene); 
    
    
    var mapLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
    var gameMap = new lime.Sprite().setSize(900,506).setFill("background.png").setPosition(0,0).setAnchorPoint(0,0);
     
    mapLayer.appendChild(gameMap);
    mapScene.appendChild(mapLayer);
    
    
    var pikachu = new lime.Sprite().setSize(19,19).setFill("Pikachu_1.png").setPosition(0,0).setAnchorPoint(0,0);
    
    mapLayer.appendChild(pikachu);
    
    
    lime.scheduleManager.scheduleWithDelay(function (dt) {
        var pikachu = new lime.Sprite().setSize(19,19).setFill("Pikachu_1.png").setPosition(0,0).setAnchorPoint(0,0);
        this.appendChild(pikachu);
        var movement = new lime.animation.MoveTo(Math.floor((Math.random()*500)+1),Math.floor((Math.random()*500)+1)).setDuration(1.0);
        pikachu.runAction(movement);
    }, mapLayer, 10000);
    */
    /*
    goog.events.listen(gameMap,['mousedown','touchstart'],function(e) {
        var movement = new lime.animation.MoveTo(e.position.x,e.position.y).setDuration(0.1);
        pikachu.runAction(movement);
    });
    * */
}
/*
// entrypoint
towerdef.start = function(){

	var director = new lime.Director(document.body,1024,768),
	    scene = new lime.Scene(),

	    target = new lime.Layer().setPosition(512,384),
        circle = new lime.Circle().setSize(150,150).setFill(255,150,0),
        lbl = new lime.Label().setSize(160,50).setFontSize(30).setText('TOUCH ME!'),
        title = new lime.Label().setSize(800,70).setFontSize(60).setText('Now move me around!')
            .setOpacity(0).setPosition(512,80).setFontColor('#999').setFill(200,100,0,.1);


    //add circle and label to target object
    target.appendChild(circle);
    target.appendChild(lbl);

    //add target and title to the scene
    scene.appendChild(target);
    scene.appendChild(title);

	director.makeMobileWebAppCapable();

    //add some interaction
    goog.events.listen(target,['mousedown','touchstart'],function(e){

        //animate
        target.runAction(new lime.animation.Spawn(
            new lime.animation.FadeTo(.5).setDuration(.2),
            new lime.animation.ScaleTo(1.5).setDuration(.8)
        ));

        title.runAction(new lime.animation.FadeTo(1));

        //let target follow the mouse/finger
        e.startDrag();

        //listen for end event
        e.swallow(['mouseup','touchend'],function(){
            target.runAction(new lime.animation.Spawn(
                new lime.animation.FadeTo(1),
                new lime.animation.ScaleTo(1)
            ));

            title.runAction(new lime.animation.FadeTo(0));
        });


    });

	// set current scene active
	director.replaceScene(scene);

}
*/

///Section: building functionality. Add "addBuildings" into main function.

var drop_targets = [];

towerdef.addBuildings = function (layer, posX, posY) 
///Add all building drag-drop functionality to game
/// pass in the layer to add the buildings to, the X and Y position of the building spawn point
{
    towerdef.buildDropMap(layer);

    //var dragLocation = new lime.Sprite().setSize(20,20).setFill('#000').setPosition(posX,posY);
    //layer.appendChild(dragLocation);

    var buildButton = towerdef.addBuildingButton (layer, posX, posY);


}

towerdef.addBuildingButton = function(layer, posX, posY) {
    var buildButton = new lime.Label("Add Building").setPosition(posX, posY);
    buildButton.setFill('#f00');
    buildButton.setPadding(10,10,10,10);
    layer.appendChild(buildButton);
    
    goog.events.listen(buildButton, ['mouseup','touchend'], function(e) {
        var water = towerdef.makeDraggable().setFill('water_building.png').setPosition(posX - 70, posY);
        var fire = towerdef.makeDraggable().setFill('fire_building.png').setPosition(posX - 100, posY);
        var grass = towerdef.makeDraggable().setFill('grass_building.png').setPosition(posX - 130, posY);
        layer.appendChild(water);
        layer.appendChild(fire);
        layer.appendChild(grass);
    });
	
	return buildButton;
}



towerdef.buildDropMap = function (layer) {
//set locations of each building foundation below:
  var location = [
	[600, 40],
	[600, 220],
	[600, 455]
	];

  // create foundations at each location
  for (var i=0; i<location.length; i++) {
	drop_targets.push(towerdef.makeDroppable().setPosition(location[i][0], location[i][1]));
  }
  
  //add each foundation to map
  for (var i=0; i<drop_targets.length; i++) {
	layer.appendChild(drop_targets[i]);
  }
}

towerdef.makeDraggable = function() {
  var sprite = new lime.Sprite().setSize(20,20).setFill('#000'); //TODO: add sprite here
  goog.events.listen(sprite, 'mousedown', function(e){
    var drag = e.startDrag(false, null, sprite); // snaptocenter, bounds, target
    
    // Add drop targets.
	for (var i = 0;i<drop_targets.length;i++) {
		drag.addDropTarget(drop_targets[i]);
	}
    
    e.event.stopPropagation();  // Avoid dragging multiple items together
    
    // Drop into target and animate
    goog.events.listen(drag, lime.events.Drag.Event.DROP, function(e){
      console.log('item was dropped');
      var dropTarget = e.activeDropTarget;
    });
    
    // Move back if not dropped on target.
    var lastPosition = sprite.getPosition();
    goog.events.listen(drag, lime.events.Drag.Event.CANCEL, function(){
      sprite.runAction(new lime.animation.MoveTo(lastPosition).setDuration(.5));
    });
    
    
  });
  return sprite;
}

towerdef.makeDroppable = function() {
  //var sprite = new lime.Label().setText('droppable').setSize(150, 150).setFill('#00f');
  var sprite = new lime.Sprite().setSize(20,20).setFill('foundation.png');
  sprite.showDropHighlight = function(){
    this.runAction(new lime.animation.FadeTo(.6).setDuration(.3));
  };
  sprite.hideDropHighlight = function(){
    this.runAction(new lime.animation.FadeTo(1).setDuration(.1));
  };
  
  return sprite; 
}

/// Section: buy pokemon

towerdef.addPokemonButton = function (layer, posX, posY, player, rGym) {
	var buildButton2 = new lime.Label("Buy Pokemon").setPosition(posX, posY);
	buildButton2.setFill('#f00');
	buildButton2.setPadding(10,10,10,10);
	layer.appendChild(buildButton2);
	
	goog.events.listen(buildButton2, ['mouseup','touchend'], function(e) {
        var charmander = new lime.Sprite().setFill('charmander.png').setPosition(posX - 70, posY);
        var bulbasaur = new lime.Sprite().setFill('bulbasaur.png').setPosition(posX - 100, posY);
		var squirtle = new lime.Sprite().setFill('squirtle.png').setPosition(posX - 130, posY);
		layer.appendChild(charmander);
		layer.appendChild(bulbasaur_icon);
		layer.appendChild(squirtle);
		
		goog.events.listen(charmander,  ['mouseup','touchend'], function(e) {
			console.log("adding charmander");
			towerdef.add_pokemon(new towerdef.pokemon(100,10,"fire",lPlayer,'charmander.png'), player, layer, rGym);
			});
			
		goog.events.listen(bulbasaur_icon,  ['mouseup','touchend'], function(e) {
			console.log("adding bulbasaur_icon");
			towerdef.add_pokemon(new towerdef.pokemon(100,10,"grass",lPlayer,'bulbasaur.png'), player, layer, rGym);
			});
		
		goog.events.listen(squirtle,  ['mouseup','touchend'], function(e) {
			console.log("adding squirtle");
			towerdef.add_pokemon(new towerdef.pokemon(100,10,"water",lPlayer,'squirtle.png'), player, layer, rGym);
			});
		
	});
	return buildButton2;
}

towerdef.add_pokemon = function(mypk, player, layer, rGym) {
	player.pokemon.push(mypk);
	layer.appendChild(mypk.sprite);
	mypk.sprite.runAction(new lime.animation.MoveTo(rGym.position_.x+towerdef.getRandomNumber(40)-20,rGym.position_.y+50+towerdef.getRandomNumber(40)));
}

//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('towerdef.start', towerdef.start);

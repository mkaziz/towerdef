// CONSOLE
towerdef.updateConsole = function (gameScene, pokemonLayer, moneyLayer, buildingsLayer) {
    
    var initX = 200;
    
    pokemonLayer.removeAllChildren();

    for (i = 0; i < towerdef.lPlayer.pokemon.length; i++) {
        
        var pokemon = towerdef.lPlayer.pokemon[i];
        pokemon.sprite.runAction(new lime.animation.FadeTo(1).setDuration(0.1));
        
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

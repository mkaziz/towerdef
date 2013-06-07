//------------------------------------------------------------
//CREATE ICONS FOR PURCHASING ITEMS (BUILDINGS AND POKEMON)
//buy a pokemon or a building by clicking on the respective Clickable Icon
towerdef.buy = function(name, sprite, type, isPokemon, gameScene, pokemonLayer, moneyLayer, buildingsLayer) {
		var cost = 0;
		if(isPokemon) { //buying a pokemon
			if (towerdef.lPlayer.pokemon.length <= towerdef.pokemonLimit) { //under pokemon limit
				if (towerdef.lPlayer.money >= towerdef.pokemonCost) { //enough money
				cost = towerdef.pokemonCost;
				towerdef.lPlayer.money -= cost
				towerdef.lPlayer.pokemon.push(new towerdef.pokemon(100,10,type,towerdef.lPlayer,sprite));
				}
				else { //not enough money
					alert("You don't have enough money to buy a " + name);
				}
			}
			else { //at pokemon limit
				alert("You are at the pokemon limit of " +towerdef.pokemonLimit);
				}
		}
		else { //buying a building
			if(towerdef.lPlayer.money >= towerdef.buildingCost) { //enough money
				towerdef.lPlayer.money -= towerdef.buildingCost;
				towerdef.lPlayer.buildings.push(new towerdef.building(name, 100,10,type, towerdef.lPlayer, sprite));
			}
			else { //not enough money
				alert("You don't have enough money to buy a " + name);
			}
		}

		towerdef.updateConsole(gameScene, pokemonLayer, moneyLayer, buildingsLayer);

}

//add help text to the Clickable Icon
towerdef.addHelpText = function(gameScene, layer, x, y, name, type, isPokemon, help_text) {
	//add icon to hover over for assistance
	var help_icon = new lime.Label().setText("?").setPosition(x, y+60).setFill(towerdef.getColor(type)).setSize(16,16).setFontColor('#FFF').setFontWeight('bold').setFontSize(16).setPadding(2,2,2,2);
	layer.appendChild(help_icon);
	
	//if user has not specified extra text, leave this blank in help text
	if (help_text == undefined) {help_text = "";} 
	
	//change  help text verbiage based upon if it is a building or a pokemon
	var adverb;
	var strength_noun;
	var weakn_noun;
	var opponent;
	if (isPokemon) {
		strength_noun = "Resistant ";
		weak_noun = " Weakness ";
		adverb = "to ";
		opponent = " buildings.";
		}
	else {
		strength_noun = " Powerful ";
		weak_noun = "Weak ";
		adverb = "against ";
		opponent = " pokemon.";
		}
		
	var myText = name + ": " + type + " type. "+ strength_noun+ adverb + towerdef.getStrength(type) + ", "+ weak_noun + adverb + towerdef.getWeakness(type) + opponent + help_text;
	
	var help_text = new lime.Label().setText(myText).setPosition(x, y+100).setFill('#888').setSize(200,75).setFontColor('#FFF').setFontWeight('bold').setFontSize(16);
	gameScene.listenOverOut(help_icon, function() {layer.appendChild(help_text); }, function() {layer.removeChild(help_text);});
}

//create a Clickable Icon
towerdef.createClickableIcon = function(gameScene, pokemonLayer, moneyLayer, buildingsLayer, layer, x, y, icon_fill, sprite, type, name, isPokemon, help_text) {
	var icon = new lime.Sprite().setFill(icon_fill).setPosition(x, y).setAnchorPoint(0.5,0.5);
	layer.appendChild(icon);
	

	
	towerdef.addHelpText(gameScene, layer, x,y,name,type,isPokemon,help_text);
	
	gameScene.listenOverOut(icon, towerdef.hoverInHandler(icon, 1.2), towerdef.hoverOutHandler(icon, 1.0));
	goog.events.listen(icon, ['mousedown','touchstart'], function(e) {
		towerdef.buy(name, sprite, type, isPokemon, gameScene, pokemonLayer, moneyLayer, buildingsLayer);
		e.event.stopPropagation(); 
	});
}

//------------------------------------------------------------
//CREATE AND UPDATE THE CONSOLE WINDOW
//update the console
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
            
        var lvlUpButton = new lime.GlossyButton("Lvl up! $" + pokemon.levelUpCost());
        lvlUpButton.pokemon = pokemon;
        lvlUpButton.setPosition(0, 22).setSize(45,15).setFontSize(7);
        
        // lvl up
        goog.events.listen(lvlUpButton, ['mousedown','touchstart'], function(e) {
            cost = pokemon.levelUpCost();
            if (towerdef.lPlayer.money >= cost) {
                pokemon.levelUp();
                towerdef.lPlayer.money -= cost;
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
		var b = towerdef.lPlayer.buildings[i];
		var building = new lime.Sprite().setFill(towerdef.getImageFromType(b.type)).setSize(25,25);
		building.setPosition(initX + i * 40, 200);
		buildingsLayer.appendChild(building);
	}
    
    var moneyLabel = new lime.Label().setPosition(160,100).setFontSize(22).setText(towerdef.lPlayer.money.toString());
    moneyLayer.removeAllChildren();
    moneyLayer.appendChild(moneyLabel);
    
}
towerdef.firstRound = true;

//configure the console
towerdef.console = function (gameScene, gameLayer) {
    //background and layer setup
    var consoleLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
    gameLayer.appendChild(consoleLayer);
    
    var console_img = new lime.Sprite().setSize(900,506).setFill("Console.png").setPosition(450,253).setAnchorPoint(0.5,0.5);
    consoleLayer.appendChild(console_img);
    
    var pokemonLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
    consoleLayer.appendChild(pokemonLayer);
    
    var moneyLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
    consoleLayer.appendChild(moneyLayer);

    var buildingsLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
    consoleLayer.appendChild(buildingsLayer);
    
   	//coin cost labels
   	//var lvlUpCost = new lime.Label().setText("( Lvl up: " + towerdef.levelUpCost + " coins)").setPosition(30, 148).setFontSize(16).setAnchorPoint(0,0);
    var buildingCost = new lime.Label().setText("(" + towerdef.buildingCost + " coins)").setPosition(770, 265).setFontSize(16);
    var pokemonCost = new lime.Label().setText("(" + towerdef.pokemonCost + " coins)").setPosition(330, 265).setFontSize(16);
    //consoleLayer.appendChild(lvlUpCost);
    consoleLayer.appendChild(buildingCost);
    consoleLayer.appendChild(pokemonCost);
	
	//add pokemon icons
	towerdef.createClickableIcon(gameScene, pokemonLayer, moneyLayer, buildingsLayer, consoleLayer, 100, 350, 
		"charmander_icon.png", "charmander.png", "fire", "Charmander", true);
	towerdef.createClickableIcon(gameScene, pokemonLayer, moneyLayer, buildingsLayer, consoleLayer, 225, 350, 
		'bulbasaur_icon.png', "bulbasaur.png", "grass", "Bulbasaur", true);
	towerdef.createClickableIcon(gameScene, pokemonLayer, moneyLayer, buildingsLayer, consoleLayer, 350, 350, 
		"squirtle_icon.png", "squirtle.png", "water", "Squirtle", true);

	//add building icons
	towerdef.createClickableIcon(gameScene, pokemonLayer, moneyLayer, buildingsLayer, consoleLayer, 575, 350, 
		'fire_building_large.png', "fire_building.png", "fire", "Fire building", false);
	towerdef.createClickableIcon(gameScene, pokemonLayer, moneyLayer, buildingsLayer, consoleLayer, 700, 350, 
		'grass_building_large.png', "grass_building.png", "grass", "Grass building", false);
	towerdef.createClickableIcon(gameScene, pokemonLayer, moneyLayer, buildingsLayer, consoleLayer, 825, 350, 
		'water_building_large.png', "water_building.png", "water", "Water building", false);

	//add a place buildings button
	var placeBuildingsButton = new lime.GlossyButton("Place Buildings");
	placeBuildingsButton.setPosition(450, 450).setSize(150,40).setFontSize(18).setColor('#00C');
    gameScene.listenOverOut(placeBuildingsButton, towerdef.hoverInHandler(placeBuildingsButton, 1.2), towerdef.hoverOutHandler(placeBuildingsButton, 1.0));
    
	consoleLayer.appendChild(placeBuildingsButton);
    towerdef.updateConsole(gameScene, pokemonLayer, moneyLayer, buildingsLayer);
    
    var instructionsButton = new lime.GlossyButton("Instructions").setSize(150,40).setFontSize(18).setColor('#C00').setPosition(100, 450);
    gameScene.listenOverOut(instructionsButton, towerdef.hoverInHandler(instructionsButton, 1.2), towerdef.hoverOutHandler(instructionsButton, 1.0));
    
    consoleLayer.appendChild(instructionsButton);
    
   goog.events.listen(instructionsButton, ['mousedown','touchstart'], function(e) {
        consoleLayer.appendChild(instructions);	
        e.event.stopPropagation();
    });

    var instructions = new lime.Sprite().setSize(900,506).setFill("Instructions.png").setPosition(450,253).setAnchorPoint(0.5,0.5);
    var instructionsContinueButton = new lime.GlossyButton("Continue").setSize(150,40).setFontSize(18).setColor('#C00').setPosition(0, 210);
    gameScene.listenOverOut(instructionsContinueButton, towerdef.hoverInHandler(instructionsContinueButton, 1.2), towerdef.hoverOutHandler(instructionsContinueButton, 1.0));
    
    instructions.appendChild(instructionsContinueButton);
    goog.events.listen(instructionsContinueButton, ['mousedown','touchstart'], function(e) {
        consoleLayer.removeChild(instructions);
        e.event.stopPropagation();
    });
    
    if (towerdef.firstRound) {
        consoleLayer.appendChild(instructions);
        towerdef.firstRound = false;
    }
    
	goog.events.listen(placeBuildingsButton, ['mousedown','touchstart'], function(e) {
		towerdef.placeBuildings(towerdef.lPlayer, gameScene, gameLayer, consoleLayer);
		e.event.stopPropagation();
    });

}

//------------------------------------------------------------
//PLACE BUILDINGS
//make the buildings draggable
towerdef.makeDraggable = function (item) {
    
    var itemSprite = item.sprite;
    var radius = new lime.Circle().setSize(towerdef.towerRadius,towerdef.towerRadius);
    radius.setStroke(new lime.fill.Stroke(towerdef.towerRadius,item.getColor()));
	//make the building draggable
		goog.events.listen(itemSprite, 'mousedown', function(e){
			var drag = e.startDrag(false);
			e.event.stopPropagation(); 
			itemSprite.appendChild(radius);
            
            
			e.swallow(['mouseup','touchend','touchcancel'],function(){
				var myX = itemSprite.getPosition().x;
				var myY = itemSprite.getPosition().y;
                itemSprite.removeChild(radius);
				
				if (myX > 400) {
					itemSprite.runAction(new lime.animation.MoveTo(400, myY).setDuration(0.5));
				}
				else if ( myX < 150 && (myY < 300 && myY > 200)) {
					itemSprite.runAction(new lime.animation.MoveTo(150, myY).setDuration(0.5));
				}
			});
	
		});
}

towerdef.makeTutorialLabel = function(bLayer, sizeX, sizeY, posX, posY, image) {
	var icon = new lime.Sprite().setSize(sizeX,sizeY).setFill(image).setPosition(posX, posY).setAnchorPoint(0.5,0.5);

	bLayer.appendChild(icon);
	
	var icon_anim = new lime.animation.ScaleTo(0.5);
	icon.runAction(icon_anim, 0.5);
	goog.events.listen(icon_anim, lime.animation.Event.STOP, function() {
		icon.runAction(new lime.animation.ScaleTo(0.75), 0.5);
	});
}

//transition to place buildings screen
towerdef.placeBuildings = function (player, gameScene, gameLayer, consoleLayer) {
	// Building layers
	var  placeBuildingsScene = new lime.Scene();
	towerdef.director.pushScene(placeBuildingsScene);
	var bLayer = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
	placeBuildingsScene.appendChild(bLayer);
	
	//Add background, done Button, gym and buildings area
	var background = new lime.Sprite().setSize(900,506).setFill("background.png").setPosition(0,0).setAnchorPoint(0,0);
	//var doneButton = new lime.GlossyButton("Done!").setPosition(700, 450).setSize(100,40).setFontSize(18).setColor('#B0171F');
	var gym = new lime.Sprite().setSize(96,80).setFill("gym.png").setPosition(50,250).setAnchorPoint(0.5,0.5);
	var c = new lime.RoundedRect().setFill(255, 255, 255, 0.85).setPosition(550, 20).setSize(300, 400).setAnchorPoint(0,0);
	var cl = new lime.Sprite().setPosition(700, 80).setSize(150, 35).setFill("buildings_header.png");

	bLayer.appendChild(background);
	bLayer.appendChild(gym);
	bLayer.appendChild(c);
	bLayer.appendChild(cl);
	
	//add tutorial labels
	towerdef.makeTutorialLabel(bLayer, 90, 150, 50, 125, "arrow.png");
	towerdef.makeTutorialLabel(bLayer, 200, 75, 700, 465, "barrow.png");
	towerdef.makeTutorialLabel(bLayer, 175, 50, 200, 475, "dragbuildings.png");

	var initX = 600;
	var initY = 200;
	var interval = 40;
	
	//populate console with buildings to place
	for (i = 0;  i<player.buildings.length; i++) {
		towerdef.makeDraggable(player.buildings[i]);
		bLayer.appendChild(player.buildings[i].sprite.setPosition(initX, initY + i * interval));
		player.buildings[i].sprite.runAction(new lime.animation.ScaleTo(1.5), 0.5);
	}
	
	//listen for "done"
	
	var playButton = new lime.GlossyButton("Play Round");
    playButton.setPosition(450, 450).setSize(100,40).setFontSize(18).setColor('#B0171F');
    gameScene.listenOverOut(playButton, towerdef.hoverInHandler(playButton, 1.2), towerdef.hoverOutHandler(playButton, 1.0));
    bLayer.appendChild(playButton);
	
	goog.events.listen(playButton, ['mousedown','touchstart'], function(e) {
		//move buildings to playble area
		for (i=0; i<towerdef.lPlayer.buildings.length; i++){
			if(towerdef.lPlayer.buildings[i].sprite.getPosition().x > 450) {
				towerdef.lPlayer.buildings[i].sprite.setPosition(250, 450);
			}
		}
        gameLayer.removeChild(bLayer);
        towerdef.director.popScene();
        gameLayer.removeChild(consoleLayer);
        towerdef.playRound(gameScene, gameLayer);
        e.event.stopPropagation();
    });

	
}

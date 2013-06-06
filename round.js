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
		
		player.pokemon[i].moveNext(player,i%3);
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

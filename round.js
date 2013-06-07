// ROUND
towerdef.addBuildingsToRound = function(roundLayer, player) {
	for (i=0; i < player.buildings.length; i++) {
		//if (player.buildings[i].sprite.getPosition().x < 500) {
		
		roundLayer.appendChild(player.buildings[i].sprite);
		player.buildings[i].sprite.runAction(new lime.animation.ScaleTo(1.5).setDuration(0.5));
		//}
	}
}


towerdef.addPokemonToRound = function(roundLayer, player, opponent) {
    for (i = 0; i < player.pokemon.length; i++) {
		var mySprite = player.pokemon[i].sprite;
        roundLayer.appendChild(mySprite);
        mySprite.removeAllChildren();
        player.pokemon[i].resetRoundPosition();
		player.pokemon[i].displayHealth(roundLayer);
		player.pokemon[i].moveNext(player,i%3);
	}
}

towerdef.stopShooting = function(player) {
	for (i = 0; i < player.buildings.length; i++) {
		player.buildings[i].stopShooting();
	}
}

//Places buildings and chooses pokemon/levels
//This is it. The singularity. The point where AI becomes so realistic, you can't tell that it's not human.
towerdef.opponentAI = function() {
	var op = towerdef.rPlayer;
    var pl = towerdef.lPlayer;
	//Balanced strategy - tries to purchase the same amount of all pokemon, place buildings at bridges	
	
    var bp = Math.random(); //buy building or pokemon?
    
    if (bp <= 0.70 || op.buildings.length == 0) {
        
        var r = Math.random(); //type of building?
        //choses a new pokemon with even probability
        var new_building;
        if (r < 0.33) {
            new_building = new towerdef.building("Fire building", 100,10,"fire",op,"fire_building.png");
        }
        else if (r >= 0.33 && r < 0.67) {
            new_building = new towerdef.building("Grass building", 100,10,"grass",op,"grass_building.png");
        }
        else {
            new_building = new towerdef.building("Water building", 100,10,"water",op,"water_building.png");
        }
        
        op.buildings.push(new_building);
        //minX = 550
        //maxX = 900
        //minY = 0
        //maxY = 506
        var X = Math.ceil(Math.random() * 100) + 550;
        var Y = Math.ceil(Math.random() * 500) + 50;
        new_building.sprite.setPosition(X,Y);
    }
    
    for (i = 0; i < 2; i++) {
        if (bp > 0.4) {
            var r = Math.random(); //type of pokemon?
            
            //choses a new pokemon with even probability
            if (r < 0.33) {
                op.pokemon.push(new towerdef.pokemon(100,10,"fire",op,"charmander.png"));
            }
            else if (r >= 0.33 && r < 0.67){
                op.pokemon.push(new towerdef.pokemon(100,10,"grass",op,"bulbasaur.png"));
            }
            else {
                op.pokemon.push(new towerdef.pokemon(100,10,"water",op,"squirtle.png"));
            }
        
        }
    }
    
    for (i = 0; i < op.pokemon.length; i++) {
        if (bp > 0.5) { 
            op.pokemon[i].level += 1;
        }    
    }
    

    //hack to make opponent pokemon the same size as yours
    for (i = 0; i<op.pokemon.length; i++){
        op.pokemon[i].sprite.runAction(new lime.animation.ScaleTo(1.5).setDuration(.05));
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
    
	towerdef.opponentAI();
	//towerdef.rPlayer.pokemon.push(new towerdef.pokemon(100,10,"fire",towerdef.rPlayer,"charmander.png"));
	
	towerdef.addBuildingsToRound(gameLayer, towerdef.lPlayer);
	towerdef.addBuildingsToRound(gameLayer, towerdef.rPlayer);
	
	towerdef.addPokemonToRound(gameLayer, towerdef.lPlayer, towerdef.rPlayer);
	towerdef.addPokemonToRound(gameLayer, towerdef.rPlayer, towerdef.lPlayer);
	
	towerdef.lPlayer.buildingAttack(gameLayer);
	towerdef.rPlayer.buildingAttack(gameLayer);
	
	towerdef.lPlayer.handleGymCollisions();
	towerdef.rPlayer.handleGymCollisions();
	
	towerdef.displayGymHealth(gameLayer); //for both gyms
    
    var handleConsoleSwitch = function (dt) {
    	
        //end round
        if (towerdef.checkIfPokemonGone(towerdef.lPlayer, towerdef.rPlayer)) {
            towerdef.stopShooting(towerdef.lPlayer);
            towerdef.stopShooting(towerdef.rPlayer);            
            towerdef.lPlayer.stopUpdates();
            towerdef.rPlayer.stopUpdates();
            lime.scheduleManager.callAfter(function (dt) {
                gameLayer.removeChild(roundLayer);
                towerdef.lPlayer.money += towerdef.levelUpMoney + towerdef.numberOpponentFaintedPokemon(towerdef.rPlayer) *towerdef.moneyFaintPokemon;
                towerdef.rPlayer.money += towerdef.levelUpMoney + towerdef.numberOpponentFaintedPokemon(towerdef.lPlayer) *towerdef.moneyFaintPokemon;
                towerdef.console(gameScene, gameLayer);
            }, gameScene, 2000);
            lime.scheduleManager.unschedule(handleConsoleSwitch, gameScene);
        }
    };
    
    lime.scheduleManager.scheduleWithDelay(handleConsoleSwitch, gameScene, 500);
}



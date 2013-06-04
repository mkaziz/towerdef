


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

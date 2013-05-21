//set main namespace
goog.provide('towerdef');


//get requirements
goog.require('lime');
goog.require('lime.Director');
goog.require('lime.Scene');
goog.require('lime.Layer');
goog.require('lime.Circle');
goog.require('lime.Label');
goog.require('lime.audio.Audio');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.FadeTo');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.MoveTo');
goog.require('lime.CoverNode');
goog.require('lime.animation.ColorTo');
goog.require('lime.animation.Sequence');


towerdef.player = function(gym) {
    
    this.pokemon = [];
    this.health = 100;
    // left or right
    this.gym = gym;
        
}

towerdef.getRandomNumber = function (num) {
    return Math.floor((Math.random()*num)-1)
}

towerdef.pokemon = function(health,attack,type,player,spriteUrl) {
    this.health = health;
    this.attack = attack;
    this.type = type;
    this.player = player;
    this.sprite = new lime.Sprite().setSize(19,19).setFill(spriteUrl).setPosition(player.gym.position_.x+towerdef.getRandomNumber(40)-20,player.gym.position_.y+50+towerdef.getRandomNumber(40)).setAnchorPoint(0.5,0.5);
    this.route = Math.floor((Math.random()*3)+1);
    
    this.refreshRoutes = function() {this.route = Math.floor((Math.random()*100)+1); };
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
    
    menuScene.listenOverOut(start,function(e){
        //animate
        start.runAction(new lime.animation.ScaleTo(0.7).setDuration(.05));
        
        console.log("hover in");
    }, function() {
        console.log("hover out");
        start.runAction(new lime.animation.ScaleTo(0.6).setDuration(.05));
    });
	
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
    
    var starting = new lime.Sprite().setSize(540,160).setFill("starting.png").setPosition(450,150).setAnchorPoint(0.5,0.5).setScale(1.5,1.5);
    
    gameLayer.appendChild(starting);
    
    starting.runAction(new lime.animation.Spawn(
                new lime.animation.FadeTo(0),
                new lime.animation.ScaleTo(0.5)
            ).setDuration(2));
    
    var lGym = new lime.Sprite().setSize(96,80).setFill("gym.png").setPosition(50,250).setAnchorPoint(0.5,0.5);
    lGym.location = "left";
    var rGym = new lime.Sprite().setSize(96,80).setFill("gym.png").setPosition(850,250).setAnchorPoint(0.5,0.5);
    rGym.location = "right";
    
    gameLayer.appendChild(rGym);
    gameLayer.appendChild(lGym);
    
    lPlayer = new towerdef.player(lGym);
    
    lPlayer.pokemon.push(new towerdef.pokemon(100,10,"lightning",lPlayer,"Pikachu_1.png"));
    lPlayer.pokemon.push(new towerdef.pokemon(80,12,"lightning",lPlayer,"Pikachu_1.png"));
    lPlayer.pokemon.push(new towerdef.pokemon(80,13,"lightning",lPlayer,"Pikachu_1.png"));
    lPlayer.pokemon.push(new towerdef.pokemon(85,11,"lightning",lPlayer,"Pikachu_1.png"));
    
    for (i = 0; i < lPlayer.pokemon.length; i++) {
        gameLayer.appendChild(lPlayer.pokemon[i].sprite);
        lPlayer.pokemon[i].sprite.runAction(new lime.animation.MoveTo(rGym.position_.x+towerdef.getRandomNumber(40)-20,rGym.position_.y+50+towerdef.getRandomNumber(40)));
    }
	
	var posX = 750; 
	var posY = 450; //Building spawn point
	addBuildings(gameLayer, posX, posY); //Add building functionality
	
	addPokemonButton(gameLayer, posX, posY-70, lPlayer, rGym);
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

function addBuildings(layer, posX, posY) 
///Add all building drag-drop functionality to game
/// pass in the layer to add the buildings to, the X and Y position of the building spawn point
{
	buildDropMap(layer);
	
	//var dragLocation = new lime.Sprite().setSize(20,20).setFill('#000').setPosition(posX,posY);
	//layer.appendChild(dragLocation);
	
	var buildButton = addBuildingButton (layer, posX, posY);
	

}

function addBuildingButton (layer, posX, posY) {
	var buildButton = new lime.Label("Add Building").setPosition(posX, posY);
	buildButton.setFill('#f00');
	buildButton.setPadding(10,10,10,10);
	layer.appendChild(buildButton);
	
	goog.events.listen(buildButton, ['mouseup','touchend'], function(e) {
		var water = makeDraggable().setFill('water_building.png').setPosition(posX - 70, posY);
        var fire = makeDraggable().setFill('fire_building.png').setPosition(posX - 100, posY);
        var grass = makeDraggable().setFill('grass_building.png').setPosition(posX - 130, posY);
		layer.appendChild(water);
        layer.appendChild(fire);
        layer.appendChild(grass);
	});
	
	return buildButton;
}



function buildDropMap(layer) {
//set locations of each building foundation below:
  var location = [
	[600, 40],
	[600, 220],
	[600, 455]
	];

  // create foundations at each location
  for (var i=0; i<location.length; i++) {
	drop_targets.push(makeDroppable().setPosition(location[i][0], location[i][1]));
  }
  
  //add each foundation to map
  for (var i=0; i<drop_targets.length; i++) {
	layer.appendChild(drop_targets[i]);
  }
}

function makeDraggable() {
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

function makeDroppable() {
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

function addPokemonButton (layer, posX, posY, player, rGym) {
	var buildButton2 = new lime.Label("Buy Pokemon").setPosition(posX, posY);
	buildButton2.setFill('#f00');
	buildButton2.setPadding(10,10,10,10);
	layer.appendChild(buildButton2);
	
	/*string pikachu_pic = 'Pikachu_1.png';
	string charmander_pic = pikachu_pic;
	string bulbasaur_pic = pikachu_pic;
	string squirtle_pic = pikachu_pic;*/
	
	goog.events.listen(buildButton2, ['mouseup','touchend'], function(e) {
        var charmander = new lime.Sprite().setFill('charmander.png').setPosition(posX - 70, posY);
        var bulbasaur = new lime.Sprite().setFill('bulbasaur.png').setPosition(posX - 100, posY);
		var squirtle = new lime.Sprite().setFill('squirtle.png').setPosition(posX - 130, posY);
		layer.appendChild(charmander);
		layer.appendChild(bulbasaur);
		layer.appendChild(squirtle);
		
		goog.events.listen(charmander,  ['mouseup','touchend'], function(e) {
			console.log("adding charmander");
			add_pokemon(new towerdef.pokemon(100,10,"fire",lPlayer,'charmander.png'), player, layer, rGym);
			});
			
		goog.events.listen(bulbasaur,  ['mouseup','touchend'], function(e) {
			console.log("adding bulbasaur");
			add_pokemon(new towerdef.pokemon(100,10,"grass",lPlayer,'bulbasaur.png'), player, layer, rGym);
			});
		
		goog.events.listen(squirtle,  ['mouseup','touchend'], function(e) {
			console.log("adding squirtle");
			add_pokemon(new towerdef.pokemon(100,10,"water",lPlayer,'squirtle.png'), player, layer, rGym);
			});
		
	});
	return buildButton2;
}

function add_pokemon(mypk, player, layer, rGym) {
	player.pokemon.push(mypk);
	layer.appendChild(mypk.sprite);
	mypk.sprite.runAction(new lime.animation.MoveTo(rGym.position_.x+towerdef.getRandomNumber(40)-20,rGym.position_.y+50+towerdef.getRandomNumber(40)));
}

//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('towerdef.start', towerdef.start);

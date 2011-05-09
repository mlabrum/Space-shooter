/*
	SpaceGame is a simple game created by Matt Labrum ( matt@labrum.me )
	It's a simple 3 life sidescroller where your ship has to dodge/destroy asteroids that are flying past your ship.
	
	How to run the game with this library:
		Create a new instance of the SpaceGame class passing in a config object
		The Config object must have the following Keys
		
		Canvas		: A reference to a canvas html5 element
		Ship		: A reference to an image of the players ship
		Asteroid	: A reference to an image of an astoroid
	
	For example to start an instance of SpaceGame when the page has loaded you would call something like this
	( Example assumes that the html page contains a canvas element with an id of game, and two image elements with ids of ship and asteroid)
	
		document.addEventListener("DOMContentLoaded", function(){
			game = new SpaceGame({
				Canvas   : document.getElementById("game"),
				Ship      : document.getElementById("ship"),
				Asteroid : document.getElementById("asteroid")
			});
		}, false);	
*/

/*
	The constuctor for the SpaceGame class
*/
var SpaceGame = function(config){
	// Check for correctly passed configuration
		if(config.Canvas && config.Ship && config.Asteroid){
		this.canvas		= config.Canvas
		this.shipImage		= config.Ship;
		this.asteroidImage	= config.Asteroid;
		
		// Check if the browser supports the canvas element
		if(this.canvas.getContext){
			this.ctx 		= this.canvas.getContext('2d');
			this.ctx.fillStyle 	= "#FFFFFF"; // Set the default canvas fill to white
			this.currentPlayer = new this.Player(this);
			this.redraw(); // trigger the initial drawing of the game
			
			/*
				Chrome has a bug ( http://code.google.com/p/chromium/issues/detail?id=2606 ) where it fails it raise arrow events for keypress (the ideal method), so to work around that bug, we have to track keydown and keyup events
			*/
			var scope = this; // Save the scope, so that when the function gets called from outside of the object, we can still maintain the scope of the object
			window.addEventListener("keydown", function(e){scope.keyDown(e)}, false);
			window.addEventListener("keyup", function(e){scope.keyUp(e)}, false);
		}else{
			// Canvas is unsupported so the fallback text inside the canvas element will be shown by default
		}
	}else{
		throw "SpaceGame initialized without a required configuration paramter";
	}
};

SpaceGame.prototype = {
	canvas		: false,
	ctx			: false,
	
	// Current page that the game is showing
	page			: "intro",
	
	// Holds references to the DOM Elements containing the ship and astoroid
	shipImage		: false,
	asteroidImage 	: false,
	
	// Maximun number of stars allowed to be shown
	numStars		: 20, 
	
	// Holds references to stars and asteroids that are currently on screen
	stars			: [],
	asteroids		: [],
	
	// Reference to the current player class
	currentPlayer	: false,
	
	// Keyboard event constants
	DOM_VK_LEFT 		: 37,
	DOM_VK_RIGHT 		: 39,
	DOM_VK_UP 		: 38,
	DOM_VK_DOWN 		: 40,
	DOM_VK_SPACE		: 32,
	DOM_VK_RETURN 	: 13,
	DOM_VK_ESCAPE 	: 27,
	DOM_VK_QUESTION	: 63,
	
	// Tracks keys pressed, adds them as keys to the object, until we get a keyup to remove it
	keysPressed : {},
	
	// keyDown sets up an interval to ensure keys being pressed down keep having the event fired until the keyup event is triggered
	keyDown: function(e){
		var code = e.keyCode || e.charCode;
		
		// This code doesn't handle the modifier keys because the only modified key required in the game is the ? key, so we just add a simple case for it
		if(typeof(this.keysPressed[16]) != "undefined" && code == 191){
			this.keyHandler(this.DOM_VK_QUESTION);
			return;
		}

		if(typeof(this.keysPressed[code]) == "undefined"){
			// trigger the keyHandler
			this.keyHandler(code);
			
			// Set up the event to be retriggered every 500milliseconds until canceled
			var scope = this;
			this.keysPressed[code] = setInterval(function(){
				scope.keyHandler(code);
			}, 40);
		}
	},
	
	// KeyUp removes the interval timer and stops the key from being pressed
	keyUp: function(e){
		var code = e.keyCode || e.charCode;
	
		clearInterval(this.keysPressed[code]);
		delete this.keysPressed[code];
	},
	
	
	// Handles keypresses and decides what to make the game do
	keyHandler: function(code){
		
		// On Escape, exit the game back to the intro screen
		if(code == this.DOM_VK_ESCAPE){
			this.page = "intro";

		}else if (this.page == "intro"){
			switch(code){
				case this.DOM_VK_QUESTION : 
					this.page = "help";
				break;
				case this.DOM_VK_RETURN : 
					this.page		= "game"; 
					this.asteroids 	= [];
					this.currentPlayer = new this.Player(this);
				break;
			}
		}else if (this.page == "game"){
			/*
				Controls the direction in which the player moves.
				Moving of the player is handled within the event to prevent slowing down the game with more function call overheads then required
			*/
			switch(code){
				case this.DOM_VK_LEFT: 
					this.currentPlayer.x 	= this.currentPlayer.x > 0 ? this.currentPlayer.x -4 : 0;
				break;
				case this.DOM_VK_RIGHT: 
					var rightBound 		= (this.canvas.width - this.shipImage.width)
					this.currentPlayer.x 	= this.currentPlayer.x < rightBound ? this.currentPlayer.x +4 : rightBound;
				break;
				case this.DOM_VK_UP:
					this.currentPlayer.y 	= this.currentPlayer.y > 0 ? this.currentPlayer.y -4 : 0;
				break;
				case this.DOM_VK_DOWN : 
					var bottomBound		= (this.canvas.height - this.shipImage.height)
					this.currentPlayer.y	= this.currentPlayer.y < bottomBound ? this.currentPlayer.y +4 : bottomBound;
				break;
				
				case this.DOM_VK_SPACE: 
					// Shoot bullets 
					if(this.currentPlayer.canShoot){
						this.currentPlayer.shoot();
					}
				break;
			}
		}
	},
	
	// Sets the game to be redrawn 30times a second, this is a timer instead of an interval to ensure the frame completly renders before scheduling another redraw
	nextTimer : function(){
		var scope = this;
		setTimeout(function(){
			scope.redraw();
		}, 1000/30);
	},
	
	// Handles the games redrawing
	redraw : function(){
		// Clear the canvas
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	
		this.drawSpace(); // Draw the background
		
		// Draw the current page
		switch(this.page){
			case "game" : 
				this.currentPlayer.draw();
				this.drawAsteroids();
			break;
			case "intro": 
				this.drawPageText("\nPress Enter\nTo begin your mission\n\n Press ? for help"); 
			break;
			case "help"		: 
				this.drawPageText("Help:\n Your goal is to survive as long as you can!\n Use the directional keys to control your spaceship\nSPACE to shoot\n ESC to return to the main screen");
			break;
			case "gameover"	: 
				this.drawPageText("\nGame Over \n Press ESC to go back to the main screen");
			break;
		}
		
		this.drawScore();
		this.drawLifes();
	
		// Schedule the next redraw
		this.nextTimer();
	},
	
	// Kills the current player and changes the gamescreen if the player runs out of lifes
	killPlayer : function(){
		if(!this.currentPlayer.kill()){
			this.page = "gameover";
		}
	},
	
	// Draws incoming asteroids and does collision detection on bullets hitting the asteroids
	drawAsteroids : function(){
		// Asteroid base 
		var asteroid = {x: this.canvas.width,y: 50, width: 10, height: 10};
		
		// Generate new Astoroids randomly 1/30 chance of an astoroid being created per frame
		if(Math.floor(Math.random() * 30) == 10){
			asteroid.y = Math.random() * this.canvas.height;
			this.asteroids.push(asteroid);
		}
		
		// Draw existing asteroids
		for(i in this.asteroids){				
			// Test if the two objects overlap 	( http://stackoverflow.com/questions/306316/determine-if-two-rectangles-overlap-each-other )
			if(this.currentPlayer.x < (this.asteroids[i].x +this.asteroidImage.width)	 && // A.X1 < b.x2
			  (this.currentPlayer.x + this.shipImage.width) > this.asteroids[i].x	 && // A.X2 > B.X1
			  this.currentPlayer.y < (this.asteroids[i].y + this.asteroidImage.height) && //A.Y1 < B.Y2
			  (this.currentPlayer.y + this.shipImage.height) > this.asteroids[i].y           // A.Y2 > B.Y1
			){
				this.asteroids.splice(i, 1);
				this.killPlayer();
				continue;
			}
			
			var asteroidExists = true;
			
			// Loop over bullets and ensure none are hitting an asteroid
			for(var x in this.currentPlayer.bullets){
				var bullet = this.currentPlayer.bullets[x]
				
				if(bullet.x < (this.asteroids[i].x +this.asteroidImage.width)	&& // A.X1 < b.x2
				  (bullet.x + 3) > this.asteroids[i].x					&& // A.X2 > B.X1
				   bullet.y < (this.asteroids[i].y + this.asteroidImage.height)	&& //A.Y1 < B.Y2
				   (bullet.y + 2) > this.asteroids[i].y           				     // A.Y2 > B.Y1
				){
					this.asteroids.splice(i, 1);
					this.currentPlayer.bullets.splice(x, 1);
					this.currentPlayer.score += 100;
					
					// Set this because we can't break out of two loops at once
					asteroidExists = false;
					break;
				}
			}
			
			if(asteroidExists){
				this.ctx.drawImage(this.asteroidImage, this.asteroids[i].x, this.asteroids[i].y);
				this.asteroids[i].x -= 1;
			}
		}
	},
	
	drawScore : function(){
		this.ctx.font 	= "10pt sans-serif";
		var text		= "Score: " + this.currentPlayer.score;
		this.ctx.fillText(text, this.canvas.width - this.ctx.measureText(text).width -20, 20);
	},
	
	drawLifes : function(){
		this.ctx.font = "10pt sans-serif";
		this.ctx.fillText("Lifes:", 20, 20);
		
		for(var i=0;i<this.currentPlayer.lifes;i++){
			this.ctx.drawImage(this.shipImage, (20*i + 60), 12, 10, 10);
		}
	},
	
	// This method draws centered full page text onto a frame
	drawPageText : function(text){
		this.ctx.textAlign  = "left";
		this.ctx.font        = "20pt sans-serif";
		
		var lines = text.split("\n");

		for(var i in lines){
			this.ctx.fillText(lines[i], ((this.canvas.width - this.ctx.measureText(lines[i]).width) / 2) ,  (i * 50) + 50); // mesaureText doesn't give the hieght, so we have to guess it
		}
	},

	// This handles drawing the background of the game
	drawSpace : function(){
		this.ctx.save();
		this.ctx.fillStyle = "#000";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		
		// now we need to generate the stars if our star array is empty
		if(this.stars.length < this.numStars){
			// Generate our stars
			var wasEmpty = (this.stars.length == 0);
			
			for(var i = this.stars.length;i<this.numStars;i++){
				var star = {
					x		: wasEmpty ? (Math.random() * this.canvas.width) : this.canvas.width,
					y		: Math.random() * this.canvas.height,
					brightness	: Math.random() + 0.4
				};
				this.stars.push(star);
			}
		}
		
		// Draw and place each star, moving it slightly 
		for(var i in this.stars){
			var star		= this.stars[i];
			this.ctx.fillStyle	= "rgba(255,255,255," + star.brightness + ")";
			
			star.x = star.x -2;
			if(star.x > -1){
				this.ctx.fillRect(star.x, star.y, 2, 2);
			}else{
				this.stars.splice(i, 1);
			}
		}
		this.ctx.restore();
	}
}

/*
	Initializes a new player object taking the parent object as the only arugment
*/
SpaceGame.prototype.Player = function(parent){
	this.parent = parent;
	
	this.x = 10;
	this.y = this.parent.canvas.height /2;
}

SpaceGame.prototype.Player.prototype = {
	parent	: false,
	x		: 10,
	y		: 0,
	score		: 0,
	lifes		: 3,
	bullets	: [],
	canShoot	: true,
	
	// Remove a life and reset position, returns false if no more lifes can be taken
	kill : function(){
		this.x = 10;
		this.y = this.parent.canvas.height /2;
		
		this.lifes -= 1;
		return this.lifes > 0;
	},
	
	// Handles drawing of the player and any bullets the ship fires
	draw : function(){
		this.parent.ctx.drawImage(this.parent.shipImage, this.x, this.y);
		
		// Draw the bullets the player fires
		for(i in this.bullets){
			if(this.bullets[i].x < this.parent.canvas.width){
				this.parent.ctx.fillRect(this.bullets[i].x, this.bullets[i].y, 3, 2);
				this.bullets[i].x += 4;
			}else{
				this.bullets.splice(i, 1);
			}
		}
	},
	
	// Creates a new bullet and adds it to the bullet array
	shoot: function(){
		this.bullets.push({x: this.x + this.parent.shipImage.width+1, y: this.y + (this.parent.shipImage.height/2)});
		this.canShoot = false;
						
		var scope = this; // Ensure our scope doesn't get lost
		setTimeout(function(){scope.canShoot = true;}, 500);
	}
}
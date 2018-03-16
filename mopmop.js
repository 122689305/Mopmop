var GameControl = function () {
    this.game_area = null;
    this.game_objects = [];
    this.frame_no = 0;
    this.freq = 60;
    this.interval = Math.round(1000 / this.freq);
    this.new_game = function () {
        this.init();
    };
    this.stop = function () {};
    this.resume = function () {};
    this.init = function () {
        this.game_area = new GameArea();
        this.game_area.init();
        this.cv = this.game_area.canvas;
        this.ctx = this.cv.getContext("2d");

        var dropController = new DropController(this.ctx);
        dropController.init();

        var mopController = new MopController(this.ctx);
        mopController.init();

        this.game_objects.push(dropController, mopController);

        var clear = function(clear, ctx, width, height, dropController) {
            return function() {clear(ctx, width, height, dropController);};
        };

        setInterval(new this.update_frame(this.game_objects, 
            clear(this.clear, this.ctx, this.cv.width, this.cv.height, dropController)), this.interval);
    };
    this.clear = function (ctx, width, height, dropController) {
        ctx.clearRect(0, 0, width, height);
    };
    this.update_frame = function (game_objects, clear) {
        frame_no = 0;
        return function() {
            clear();
            frame_no += 1;
            game_objects.forEach(function (game_obj) {
                game_obj.frame_update(this.frame_no);
            });
        };
    };
};

var GameArea = function () {
    this.canvas = null;
    this.init = function () {
        this.create_canvas(500, 500);
    };
    this.create_canvas = function (width, height) {
        this.canvas = document.createElement("canvas");
        cv = this.canvas;
        cv.width = width;
        cv.height = height;
        document.body.appendChild(cv);
    };
    this.update = function () {};
    this.update_score = function () {};
    this.update_time = function () {};
};

var GameObjectFactory = {
    MopObject : function (ctx) {
    return (new function(ctx) {
        this.ctx = ctx;
        this.color = "red";
        this.frame_update = function (frame_no) {
            this.spin(frame_no);
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, this.arc_start, this.arc_end);
            this.ctx.lineTo(this.x, this.y);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        };
        this.init = function () {
            this.width = 50;
            this.height = 50;
            this.radius = 50;
            this.x = util.randomInt(this.width/2, this.ctx.canvas.width-this.width/2);
            this.y = util.randomInt(this.height/2, this.ctx.canvas.height-this.height/2);
            this.spin(0);
        };
        this.spin = function (frame_no) {
            this.arc_start = frame_no*0.05 % (2*Math.PI);
            this.arc_end = this.arc_start + 1.8*Math.PI;
        }
    }(ctx));},
    DropObject : function (ctx) {
    return (new function(ctx) {
        this.ctx = ctx;
        this.color = "blue";
        this.frame_update = function (frame_no) {
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        };
        this.init = function () {
            this.width = 50;
            this.height = 50;
            this.radius = 10;
            this.x = util.randomInt(this.width/2, this.ctx.canvas.width-this.width/2);
            this.y = util.randomInt(this.height/2, this.ctx.canvas.height-this.height/2);
        };
    }(ctx));}
};

var MopController = function (ctx) {
    this.init = function () {
        this.mop = new GameObjectFactory.MopObject(ctx);
        this.mop.init();
    }
    this.frame_update = function (frame_no) {
        this.mop.frame_update(frame_no);
    }
}

var DropController = function (ctx) {
	this.drops = [];
	this.numOfDrops = 5;
    this.init = function () {
    	for (var i = 0; i < this.numOfDrops; i++) {
		    this.drops.push(new GameObjectFactory.DropObject(ctx));
		    this.drops[this.drops.length - 1].init();;
    	}
    };
    this.clear = function () {
    	//delete this.drops[this.drops.length - 1];
    };
    this.frame_update = function (frame_no) {
        this.drops.forEach(function (obj) {obj.frame_update(frame_no);});
    }
};

var util = {
    randomInt : function (start, end) {
        var rd = Math.random();
        return Math.floor(rd*(end-start) + start);
    }
}

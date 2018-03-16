
var GameControl = function () {
    this.new_game = function () {
        this.init();
    };
    this.stop = function () {};
    this.resume = function () {};
    this.init = function () {
        this.game_area = new GameArea();
        this.game_area.init();
        this.ctx = this.game_area.canvas.getContext("2d");
        var myMop = new GameObjectFactory.MopObject(this.ctx);
        myMop.init();
        myMop.frame_update();
        console.log(myMop);
    };
    this.clear = function () {};
    this.update_frame = function () {};
    this.game_area = 0;
    this.game_object = [];
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
        this.frame_update = function () {
            console.log(this.ctx);
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI)
            console.log(this.x, this.y, this.radius, 2*Math.PI)
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        };
        this.init = function () {
            this.width = 50;
            this.height = 50;
            this.radius = 50;
            this.x = util.randomInt(this.width/2, this.ctx.canvas.width-this.width/2);
            this.y = util.randomInt(this.height/2, this.ctx.canvas.height-this.height/2);
        };
    }(ctx));},
    DropObject : function () {
        this.frame_update = function () {};
        this.init = function () {};
    }
};

var util = {
    randomInt : function (start, end) {
        console.log("util.randomInt " + start + " " + end);
        var rd = Math.random();
        return Math.floor(rd*(end-start) + start);
    }
}

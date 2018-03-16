
var GameControl = function () {
    this.game_area = null;
    this.game_objects = [];
    this.frame_no = 0;
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

        var myMop = new GameObjectFactory.MopObject(this.ctx);
        myMop.init();
        myMop.frame_update();
        this.game_objects.push(myMop);
        setInterval(new this.update_frame(this.game_objects, function () {this.clear(this.ctx);}), 500);
    };
    this.clear = function (ctx) {
        ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    };
    this.update_frame = function (game_objects, clear) {return function() {
        clear();
        this.frame_no += 1;
        game_objects.forEach(function (game_obj) {
            game_obj.frame_update(this.frame_no);
        });
    };};
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
            this.arc_start = frame_no % (2*Math.PI);
            this.arc_end = this.arc_start + 1.8*Math.PI;
        }
    }(ctx));},
    DropObject : function () {
        this.frame_update = function () {};
        this.init = function () {};
    }
};

var util = {
    randomInt : function (start, end) {
        var rd = Math.random();
        return Math.floor(rd*(end-start) + start);
    }
}

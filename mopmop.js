var GameControl = function () {
    this.game_area = null;
    this.game_objects = [];
    this.frame_no = 0;
    this.freq = 60;
    this.interval = Math.round(1000 / this.freq);
    this.new_game = function () {
        this.init();
        this.game_area.start_tick();
    };
    this.stop = function () {
        this.game_area.stop_tick();
    };
    this.resume = function () {
        this.game_area.start_tick();
    };
    this.init = function () {
        this.game_area = new GameArea();
        this.game_area.init();
        this.cv = this.game_area.canvas;
        this.ctx = this.cv.getContext("2d");
        this.ctx.game_area = this.game_area;

        var dropController = new DropController(this.ctx);
        dropController.init();
        this.ctx.dropController = dropController;

        var mopController = new MopController(this.ctx);
        mopController.init();
        this.ctx.mopController = mopController;

        this.game_objects.push(dropController, mopController);

        var clear = function(clear, ctx, width, height, dropController) {
            return function() {clear(ctx, width, height, dropController);};
        };

        setInterval(new this.update_frame(this.ctx, this.game_objects,
            clear(this.clear, this.ctx, this.cv.width, this.cv.height, dropController)), this.interval);
    };
    this.clear = function (ctx, width, height, dropController) {
        ctx.clearRect(0, 0, width, height);
    };
    this.update_frame = function (ctx, game_objects, clear) {
        frame_no = 0;
        return function() {
            if (!(ctx.game_area.ticking == null)) {
                clear();
                frame_no += 1;
                game_objects.forEach(function (game_obj) {
                    game_obj.frame_update(frame_no);
                });
            }
        };
    };
};

var GameArea = function () {
    this.canvas = null;
    this.init = function () {
        this.tick = 0;
        this.ticking = null; // seconds;
        this.create_canvas(500, 500);
    };
    this.create_canvas = function (width, height) {
        this.area = document.createElement("div");
        this.area.setAttribute('id', 'game_area');
        document.body.appendChild(this.area);

        this.status = document.createElement("div");
        sta = this.status;
        sta.setAttribute('id', 'status');
        this.area.appendChild(sta);

        this.time = document.createElement("div");
        this.time.setAttribute('id', 'time');
        this.status.appendChild(this.time);
        this.time.innerHTML = "<span>time</span><span>60</span>";
        
        this.canvas = document.createElement("canvas");
        cv = this.canvas;
        cv.width = width;
        cv.height = height;
        cv.setAttribute('tabindex', '1');
        this.area.appendChild(cv);
    };
    this.start_tick = function () {
        this.ticking = setInterval(function(game_area) { return function () {
            game_area.tick += 1;
            document.getElementById('time').children[1].innerHTML = 60 - game_area.tick;
            if (game_area.tick == 60) {
                game_area.stop_tick();
            }
        }}(this), 1000);
    };
    this.stop_tick = function () {
        if (this.ticking) {
            clearInterval(this.ticking);
            this.ticking = null;
        }
    }
    this.update = function () {};
    this.update_score = function () {};
    this.update_time = function () {};
};

var GameObjectFactory = {
    MopObject : function (ctx) {
    return (new function(ctx) {
        this.ctx = ctx;
        this.color = "red";
        this.speed_X = 0;
        this.speed_Y = 0;
        this.velocity = 10; // pixel per frame
        this.is_spining = true;
        this.angle = 0;
        this.frame_no = 0;
        this.score = 0;
        this.frame_update = function (frame_no) {
            if (this.is_spining) this.move("spin", frame_no); else this.move("rush", this.angle);
            this.x += this.speed_X;
            this.y += this.speed_Y;
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, this.arc_start, this.arc_end);
            this.ctx.lineTo(this.x, this.y);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
            this.hitborder();
            util.update_position(this);
            this.ctx.dropController.wipe(this);
            this.update_status();
        };
        this.init = function (color, keycode) {
            this.color = color;
            this.name = this.color+'_mop';
            this.width = 50;
            this.height = 50;
            this.radius = 25;
            this.x = util.randomInt(this.width/2, this.ctx.canvas.width-this.width/2);
            this.y = util.randomInt(this.height/2, this.ctx.canvas.height-this.height/2);
            this.spin(0);
            for (var en of ['keydown', 'touchstart']) {
                this.ctx.canvas.addEventListener(en, function (e) {
                    e.preventDefault();
                    var ctx = this.getContext("2d");
                    for (var mop_keycode in ctx.mopController.mops){
                        if (e.which == mop_keycode || e.which == 0) {
                            ctx.mopController.mops[mop_keycode].is_spining = false;
                        }
                    }
                }, false);
            };
            for (var en of ['keyup', 'touchend']) {
                this.ctx.canvas.addEventListener(en, function (e) {
                    e.preventDefault();
                    var ctx = this.getContext("2d");
                    for (var mop_keycode in ctx.mopController.mops){
                        if (e.which == mop_keycode || e.which == 0) {
                            ctx.mopController.mops[mop_keycode].is_spining = true;
                        }
                    }
                }, false);
            };
            var sta = this.ctx.game_area.status;
            this.score_div = document.createElement("div");
            this.score_div.setAttribute('id', this.name);
            this.score_div.innerHTML = "<span>"+this.name+"</span><span></span>"
            sta.appendChild(this.score_div);
        };
        this.hitborder = function () {
            var bottom = this.y + this.height / 2;
            var top = this.y - this.height / 2;
            var left = this.x - this.width / 2;
            var right = this.x + this.width / 2;

            var border_bottom = this.ctx.canvas.height;
            var border_top = 0;
            var border_right = this.ctx.canvas.width;
            var border_left = 0;

            if (bottom > border_bottom) this.y = border_bottom - this.height/2;
            if (top < border_top) this.y = border_top + this.height/2;
            if (left < border_left) this.x = border_left + this.width/2;
            if (right > border_right) this.x = border_right - this.width/2;
        }
        this.spin = function (frame_no) {
            this.frame_no += 1;
            this.speed_X = 0;
            this.speed_Y = 0;
            this.angle = this.frame_no*0.05;
            this.arc_degree = 0.2*Math.PI;
            this.arc_start = (this.angle + this.arc_degree/2) % (2*Math.PI);
            this.arc_end = this.arc_start + (2*Math.PI - this.arc_degree);
        };
        this.rush = function (angle) {
            this.speed_X = Math.cos(angle) * this.velocity;
            this.speed_Y = Math.sin(angle) * this.velocity;
        };
        this.move = function (type, arg) {
            if (type == "spin") this.spin(arg);
            else if (type == "rush") this.rush(arg);
        };
        this.update_status = function() {
            this.score_div.children[1].innerHTML = this.score;            
        };
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

            util.update_position(this);
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
    this.mops = {}
    this.init = function () {
        var mop1 = new GameObjectFactory.MopObject(ctx);
        mop1.init("red");
        this.mops[65] = mop1;
        var mop2 = new GameObjectFactory.MopObject(ctx);
        mop2.init("blue");
        this.mops[76] = mop2;
    }
    this.frame_update = function (frame_no) {
        for (var mop in this.mops) {
            this.mops[mop].frame_update(frame_no);
        }
    }
}

var DropController = function (ctx) {
	this.drops = [];
	this.numOfDrops = 5;
    this.init = function () {
        this.create_drops(this.numOfDrops);
    };
    this.create_drops = function (numOfNewDrops) {
        for (var i = 0; i < numOfNewDrops; i++) {
		    this.drops.push(new GameObjectFactory.DropObject(ctx));
		    this.drops[this.drops.length - 1].init();;
        }
    }
    this.clear = function (drop) {
    	//delete this.drops[this.drops.length - 1];
        var index = this.drops.indexOf(drop);
        this.drops.splice(index, 1);
    };
    this.frame_update = function (frame_no) {
        this.drops.forEach(function (obj) {obj.frame_update(frame_no);});
    };
    this.wipe = function (mop) {
        for (var drop of this.drops) {
            if (util.check_collision(mop, drop)) {
                mop.score += 1;
                this.clear(drop);
                this.create_drops(1);
            }
        };
    };
};

var util = {
    randomInt : function (start, end) {
        var rd = Math.random();
        return Math.floor(rd*(end-start) + start);
    },
    check_collision: function (obj1, obj2) {

        if (!(obj1.right < obj2.left || obj1.left > obj2.right
        || obj1.top > obj2.bottom || obj1.bottom < obj2.top)) {
            return true;
        } else {
            return false;
        }
    },
    update_position: function (obj) {
        obj.left = obj.x - obj.width/2;
        obj.right = obj.x + obj.width/2;
        obj.top = obj.y - obj.height/2;
        obj.bottom = obj.y + obj.height/2;
    }
}

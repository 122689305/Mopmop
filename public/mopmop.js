
var GameControl = function (socket) {
    this.socket = socket;
    this.game_area = null;
    this.game_controllers = [];
    this.frame_no = 0;
    this.frame_freq = 60;
    this.frame_interval = Math.round(1000 / this.frame_freq);
    this.socket_sync_freq = 100;
    this.socket_sync_interval = Math.round(1000 / this.socket_sync_freq);
    this.new_game = function () {
        this.init();
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
        this.ctx.game_control = this;
        this.ctx.game_area = this.game_area;
        this.ctx.socket = this.socket;
        this.ctx.player_id = (new Date).getTime();

        var dropController = new DropController(this.ctx);
        this.ctx.dropController = dropController;

        var mopController = new MopController(this.ctx);
        this.ctx.mopController = mopController;

        this.game_controllers.push(dropController, mopController);
        this.ctx.game_controllers = this.game_controllers;

        var clear = function(clear, ctx, width, height, dropController) {
            return function() {clear(ctx, width, height, dropController);};
        };
        setInterval(new this.update_frame(this.ctx, this.game_objects,
            clear(this.clear, this.ctx, this.cv.width, this.cv.height, dropController), this.sync), this.frame_interval);

        this.ctx.start_game_request = setInterval(
            (ctx => function () {
                ctx.socket.emit('start_game', ctx.player_id);
                console.log(ctx.player_id);
            })(this.ctx)
        , this.socket_sync_interval*100);

        this.socket.on('start_game_ack', (ctx => function(random_seed){
            console.log('start_game_ack');
            clearInterval(ctx.start_game_request);
            mopController.init();
            ctx.dropController.random_seed = random_seed;
            setInterval(
                (ctx => function () {
                    var data = {
                        'x': ctx.mopController.main_mop.x,
                        'y': ctx.mopController.main_mop.y,
                        'arc_start': ctx.mopController.main_mop.arc_start,
                        'arc_end': ctx.mopController.main_mop.arc_end
                    };
                    ctx.socket.emit('sync',
                        data
                    );
                })(ctx), ctx.game_control.socket_sync_interval
            );
        })(this.ctx));

        this.socket.on('sync', (ctx => function(data){
            var is_init = !(-1 in ctx.mopController.mops);
            if (is_init) {
                console.log('sync init');
                ctx.mopController.add_mop();
            }
            var opponent_mop = ctx.mopController.mops[-1];
            opponent_mop.x = data['x'];
            opponent_mop.y = data['y'];
            opponent_mop.arc_start = data['arc_start'];
            opponent_mop.arc_end = data['arc_end'];
            if (is_init) {
                opponent_mop.is_rushing = false;
                opponent_mop.is_spining = false;
            }
            if (is_init) {
                ctx.dropController.init();
                console.log('game start ticking');
                ctx.game_area.start_tick();
            }
        })(this.ctx));


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
                ctx.frame_no = frame_no;
                for (var game_controller of ctx.game_controllers) {
                    game_controller.frame_update(frame_no);
                }
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
            if (this.is_spining) this.move("spin");
            if (this.is_rushing) this.move("rush", this.angle);
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
        this.init = function (color, x, y) {
            this.color = color;
            this.name = this.color+'_mop';
            this.width = 50;
            this.height = 50;
            this.radius = 25;
            if (x == -1 && y == -1) {
                console.log('init mop with random');
                this.x = util.randomInt(this.width/2, this.ctx.canvas.width-this.width/2);
                this.y = util.randomInt(this.height/2, this.ctx.canvas.height-this.height/2);
            }
            this.spin(0);
            for (var en of ['keydown', 'touchstart']) {
                this.ctx.canvas.addEventListener(en, function (e) {
                    e.preventDefault();
                    var ctx = this.getContext("2d");
                    for (var mop_keycode in ctx.mopController.mops){
                        if (e.which == mop_keycode || e.which == 0) {
                            ctx.mopController.mops[mop_keycode].is_spining = false;
                            ctx.mopController.mops[mop_keycode].is_rushing = true;
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
                            ctx.mopController.mops[mop_keycode].is_rushing = false;
                        }
                    }
                }, false);
            };
            util.update_position(this);

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
        this.spin = function () {
            this.frame_no += 1;
            this.angle = this.frame_no*0.05;
            this.arc_degree = 0.2*Math.PI;
            this.arc_start = (this.angle + this.arc_degree/2) % (2*Math.PI);
            this.arc_end = this.arc_start + (2*Math.PI - this.arc_degree);
        };
        this.rush = function (angle) {
            this.speed_X = Math.cos(angle) * this.velocity;
            this.speed_Y = Math.sin(angle) * this.velocity;
            this.x += this.speed_X;
            this.y += this.speed_Y;
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
            this.width = 20;
            this.height = 20;
            this.radius = 10;
            console.log('new drop');
            this.x = util.randomInt(this.width/2, this.ctx.canvas.width-this.width/2);
            this.y = util.randomInt(this.height/2, this.ctx.canvas.height-this.height/2);
            util.update_position(this);
        };
    }(ctx));}
};

var MopController = function (ctx) {
    this.ctx = ctx;
    this.mops = {}
    this.keycode = 65;
    this.init = function () {
        var mop = new GameObjectFactory.MopObject(ctx);
        mop.init("blue", -1, -1);
        this.mops[this.keycode] = mop;
        this.keycode += 1;
        this.main_mop = mop;
    }
    this.frame_update = function (frame_no) {
        for (var mop in this.mops) {
            this.mops[mop].frame_update(frame_no);
        }
    }
    this.add_mop = function() {
        console.log('new mop');
        var mop = new GameObjectFactory.MopObject(ctx);
        mop.init("red", 0, 0);
        this.mops[-1] = mop;
        //keycode += 1;
    }
}

var DropController = function (ctx) {
    this.ctx = ctx;
	this.drops = [];
	this.numOfDrops = 5;
    this.random_seed = 0;
    this.init = function () {
        Math.seedrandom(this.random_seed);
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
                console.log('wiped frame_no ', this.ctx.frame_no);
                console.log('wiped mop ', mop.name, ' ', mop.x, ' ', mop.y);
                console.log('wiped drop ', drop.x, ' ', drop.y);
                console.log(mop);
                console.log(mop.x);
                console.log(drop);
                mop.score += 1;
                this.clear(drop);
                this.create_drops(1);
                break;
            }
        };
    };
};

var util = {
    randomInt : function (start, end) {
        var rd = Math.random();
        console.log('random ', rd);
        return Math.floor(rd*(end-start) + start);
    },
    check_collision: function (obj1, obj2) {
        this.epislon = 1;

        this.update_position(obj1);
        this.update_position(obj2);

        if (!(obj1.right < obj2.left + this.epislon  || obj1.left > obj2.right - this.epislon
        || obj1.top > obj2.bottom - this.epislon || obj1.bottom < obj2.top + this.epislon)) {
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

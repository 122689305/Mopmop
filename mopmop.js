
var GameControl = function () {
    this.new_game = function () {};
    this.stop = function () {};
    this.resume = function () {};
    this.init = function () {};
    this.clear = function () {};
    this.update_frame = function () [};
    this.game_area = 0;
    this.game_object = [];
}

var GameArea = function () {
    this.init = function () {};
    this.create_canvas = function () {};
    this.update = function () {};
    this.update_score = function () {};
    this.update_time = function () {};
}

var GameObjectFactory = function () {
    this.MopObject = function () {
        this.frame_update = function () {};
        this.init = function () {};
    };
    this.DirtObject = function () {
        this.frame_update = function () {};
        this.init = function () {};
    };
}


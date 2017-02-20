"use strict";
var nedb = require("nedb");
var UserMan = (function () {
    function UserMan() {
    }
    UserMan.prototype.authenticate = function (nme, pwd) {
        var usrDB = new nedb({ filename: "./logs/user.db", autoload: true });
        var auth = false;
        var actUsr;
        usrDB.find({ name: nme, password: pwd }, function (err, usr) {
            actUsr = usr;
        });
        return (actUsr.length === 1);
    };
    return UserMan;
}());
exports.UserMan = UserMan;
//# sourceMappingURL=userMan.js.map
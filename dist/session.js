"use strict";
var uuid = require("node-uuid");
var SessionDB = (function () {
    function SessionDB() {
        this.sessions = {};
    }
    SessionDB.prototype.createSession = function () {
        var sessionID = uuid.v4();
        this.sessions[sessionID] = {};
        return sessionID;
    };
    SessionDB.prototype.getSessionStore = function (sessionID) {
        return this.sessions[sessionID];
    };
    SessionDB.prototype.deleteSession = function (sessionID) {
        delete this.sessions[sessionID];
    };
    return SessionDB;
}());
exports.SessionDB = SessionDB;
//# sourceMappingURL=session.js.map
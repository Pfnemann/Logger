"use strict";
var express = require("express");
var bodyParser = require("body-parser");
var nedb = require("nedb");
var cookieParser = require("cookie-parser");
var session_1 = require("./session");
var app = express();
var sessionDB = new session_1.SessionDB();
var userDB = new nedb({ filename: "./logs/user.db", autoload: true });
var logDB = new nedb({ filename: "./logs/logs.db", autoload: true });
// app.all('/*', function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "X-Requested-With");
//     next();
// });
app.use("/", express.static("htdocs"));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//################### USER-SYSTEM ####################
app.post("/user", bodyParser.json(), function (req, res) {
    if (!req.is("application/json")) {
        res.status(406);
        res.header("Content-Type", "text/plain");
        res.end("Content-Type must be application/json.\nParams: name, password");
        return;
    }
    var user = req.body;
    //Check for valid format.
    if (!user.name || !user.password) {
        res.status(420);
        res.header("Content-Type", "text/plain");
        res.end("Policy not fulfilled.\nJSON Format required with params: name, password.");
        return;
    }
    //Check for double Entrys
    userDB.find({ name: user.name, password: user.password }, function (err, usr) {
        if (!err) {
            usr.forEach(function (foundUser) {
                if (user.name === foundUser.name && user.password === foundUser.password) {
                    res.status(409);
                    res.header("Content-Type", "text/plain");
                    res.end("Conflict.\nUser already exists.");
                    return;
                }
            });
        }
    });
    //Check for user as self
    if (user) {
        userDB.insert(user, function (err, usr) {
            if (err) {
                res.status(500);
                res.header("Content-Type", "text/plain");
                res.end("Server Error\n" + err);
            }
            else {
                res.status(201);
                switch (req.header("Accept")) {
                    case "application/json":
                        res.header("Content-Type", "application/json");
                        res.end(JSON.stringify(usr));
                        break;
                    default:
                        res.header("Content-Type", "text/plain");
                        res.end(usr.name + " added.");
                        break;
                }
            }
        });
    }
    else {
        res.status(420);
        res.header("Content-Type", "text/plain");
        res.end("Policy not fulfilled.\nEmpty Request.");
    }
});
app.put("/user/:id", bodyParser.json(), function (req, res) {
    if (!req.is("application/json")) {
        res.status(406);
        res.header("Content-Type", "text/plain");
        res.end("Content-Type must be application/json.\nParams: name, password");
        return;
    }
    var user = req.body;
    var id = req.params.id;
    //Check for valid format.
    if (!user.name || !user.password) {
        res.status(420);
        res.header("Content-Type", "text/plain");
        res.end("Policy not fulfilled.\nJSON Format required with params: name, password.");
        return;
    }
    if (id) {
        userDB.update({ _id: id }, req.body, { multi: false }, function (err) {
            if (err) {
                res.status(500);
                res.header("Content-Type", "text/plain");
                res.end("Server Error\n" + err);
            }
            else {
                res.status(200);
                switch (req.header("Accept")) {
                    case "application/json":
                        res.header("Content-Type", "application/json");
                        res.end(JSON.stringify(req.body));
                        break;
                    default:
                        res.header("Content-Type", "text/plain");
                        res.end(req.body.name + " changed.");
                        break;
                }
            }
        });
    }
    else {
        res.status(500);
        res.header("Content-Type", "text/plain");
        res.end("Server Error");
    }
});
app.delete("/user/:name", bodyParser.json(), function (req, res) {
    var uriName = req.params.name;
    userDB.find({ name: uriName }, function (err, usr) {
        if (!err) {
            if (usr.length > 1) {
                res.status(420);
                switch (req.header("Accept")) {
                    case "application/json":
                        res.header("Content-Type", "application/json");
                        res.end(JSON.stringify(usr));
                        return;
                    default:
                        res.header("Content-Type", "text/plain");
                        res.end("Policy not fulfilled.More than one entry.\nSpecify your deletition by id!\nUse this path: /users/id/:id");
                        return;
                }
            }
            else {
                if (uriName) {
                    userDB.remove({ name: uriName }, { multi: false }, function (err) {
                        if (err) {
                            res.status(500);
                            res.header("Content-Type", "text/plain");
                            res.end("Server Error\n" + err);
                        }
                        else {
                            res.status(200);
                            res.header("Content-Type", "text/plain");
                            res.end("Deleted:\n" + uriName);
                        }
                    });
                }
                else {
                    res.status(500);
                    res.header("Content-Type", "text/plain");
                    res.end("Server Error");
                }
            }
        }
    });
});
app.delete("/users/id/:id", bodyParser.json(), function (req, res) {
    var id = req.params.id;
    if (id) {
        userDB.remove({ _id: id }, { multi: false }, function (err) {
            if (err) {
                res.status(500);
                res.header("Content-Type", "text/plain");
                res.end("Server Error\n" + err);
            }
            else {
                switch (req.header("Accept")) {
                    case "application/json":
                        res.status(406);
                        res.header("Content-Type", "text/plain");
                        res.end("JSON-Format not possible. \nUser deleted.");
                        break;
                    default:
                        res.status(200);
                        res.header("Content-Type", "text/plain");
                        res.end("Deleted.");
                        break;
                }
            }
        });
    }
});
app.get("/users", bodyParser.json(), function (req, res) {
    userDB.find({}, function (err, usr) {
        if (err) {
            res.status(500);
            res.header("Content-Type", "text/plain");
            res.end("Server Error\n" + err);
        }
        else {
            if (usr.length < 1) {
                res.status(416);
                switch (req.header("Accept")) {
                    case "application/json":
                        res.header("Content-Type", "text/plain");
                        res.end(JSON.stringify(usr));
                        return;
                    default:
                        res.header("Content-Type", "text/plain");
                        res.end("Requested range not satisfiable.\nThere is no entry in here.");
                        return;
                }
            }
            res.status(200);
            switch (req.header("Accept")) {
                case "application/json":
                    res.header("Content-Type", "application/json");
                    res.end(JSON.stringify(usr));
                    break;
                default:
                    res.header("Content-Type", "text/plain");
                    res.charset = "utf-8";
                    usr.forEach(function (user) {
                        res.write("User: " + user.name + "\nPassword: " + user.password + "\n\n");
                    });
                    res.end();
                    break;
            }
        }
    });
});

app.get("readinessProbe", bodyParser.json(), function(req,res) {
    res.status(400);
    res.header("Content-Type", "text/plain");
    res.end("Server is ready");
});

app.get("/users/:name", bodyParser.json(), function (req, res) {
    var uriName = req.params.name;
    if (uriName) {
        userDB.find({ name: uriName }, function (err, usr) {
            if (err) {
                res.status(500);
                res.header("Content-Type", "application/json");
                res.end("Server Error\n" + err);
            }
            else if (usr.length < 1) {
                res.status(404);
                res.header("Content-Type", "text/plain");
                res.end("No User found.\nSee all Users at Path: /users");
            }
            else {
                if (usr.length < 1) {
                    res.status(416);
                    switch (req.header("Accept")) {
                        case "application/json":
                            res.header("Content-Type", "text/plain");
                            res.end(JSON.stringify(usr));
                            return;
                        default:
                            res.header("Content-Type", "text/plain");
                            res.end("Requested range not satisfiable.\nThere is no entry in here.");
                            return;
                    }
                }
                res.status(200);
                switch (req.header("Accept")) {
                    case "application/json":
                        res.header("Content-Type", "application/json");
                        res.end(JSON.stringify(usr));
                        break;
                    default:
                        res.header("Content-Type", "text/plain");
                        res.charset = "utf-8";
                        usr.forEach(function (user) {
                            res.write("User: " + user.name + "\nPassword: " + user.password + "\n\n");
                        });
                        res.end();
                        break;
                }
            }
        });
    }
    else {
        res.status(500);
        res.header("Content-Type", "text/plain");
        res.end("Server Error");
    }
});
//################### USER-SYSTEM ####################
//##################### SESSION ######################
app.post("/login", bodyParser.json(), function (req, res) {
    var name = req.body.name;
    var password = req.body.password;
    userDB.find({ name: name, password: password }, function (err, usr) {
        if (!err) {
            if (usr && usr.length == 1) {
                var sessionID = sessionDB.createSession();
                var store = sessionDB.getSessionStore(sessionID);
                store.user = name;
                store.userID = usr[0]._id;
                var hour = 3600000;
                // res.cookie("session-id", sessionID, {maxAge: hour * 11}); //11h
                res.cookie('session-id', sessionID, { expires: new Date(Date.now() + 900000), httpOnly: false });
                res.status(200);
                res.end("Access granted. Authorized. Welcome, " + name);
            }
            else {
                if (req.cookies["session-id"])
                    res.clearCookie("session-id");
                res.status(401);
                res.header("Content-Type", "text/plain");
                res.end("Access denied. Unauthorized.");
            }
        }
    });
});
//##################### SESSION ######################
//##################### SECURE #######################
//###################### LOG #########################
// {userID, type, msg, time}
app.post("/log", bodyParser.json(), function (req, res) {
    var sessionID = req.cookies["session-id"];
    if (sessionID) {
        var store = sessionDB.getSessionStore(sessionID);
        if (store) {
            var user = store.user;
            var usrID_1 = store.userID;
            if (!req.is("application/json")) {
            }
            var log_1 = req.body;
            var entry = {
                userID: usrID_1,
                type: log_1.type,
                msg: log_1.msg,
                time: new Date().getTime()
            };
            //Check for valid format.
            if (!log_1.type || !log_1.msg || !log_1.time) {
                res.status(420);
                res.header("Content-Type", "text/plain");
                res.end("Policy not fulfilled.\nJSON Format required with params: userID, type, msg, time.");
                return;
            }
            //Check for double Entrys
            logDB.find({ userID: usrID_1, type: log_1.type }, function (err, usr) {
                if (!err) {
                    usr.forEach(function (foundUser) {
                        if (usrID_1 === foundUser.userID && log_1.type === foundUser.type && log_1.msg === foundUser.msg) {
                            res.status(409);
                            res.header("Content-Type", "text/plain");
                            res.end("Conflict.\nLog already exists.");
                            return;
                        }
                    });
                }
            });
            //Check for user as self
            if (log_1) {
                logDB.insert(entry, function (err, usr) {
                    if (err) {
                        res.status(500);
                        res.header("Content-Type", "text/plain");
                        res.end("Server Error\n" + err);
                    }
                    else {
                        res.status(201);
                        switch (req.header("Accept")) {
                            case "application/json":
                                res.header("Content-Type", "application/json");
                                res.end(JSON.stringify(usr));
                                break;
                            default:
                                res.header("Content-Type", "text/plain");
                                res.end("Log added.\n\nType: " + log_1.type + "\nMessage: " + log_1.msg);
                                break;
                        }
                    }
                });
            }
            else {
                res.status(420);
                res.header("Content-Type", "text/plain");
                res.end("Policy not fulfilled.\nEmpty Request.");
            }
        }
        else {
            res.status(500);
            res.header("Content-Type", "text/plain");
            res.end("Error. No Store. Please re-login at /login");
        }
    }
    else {
        res.status(401);
        res.header("Content-Type", "text/plain");
        res.end("Access denied. Unauthorized.");
    }
});
app.put("/log/:id", bodyParser.json(), function (req, res) {
    var sessionID = req.cookies["session-id"];
    if (sessionID) {
        var store = sessionDB.getSessionStore(sessionID);
        if (store) {
            var user = store.user;
            var userID = store.userID;
            if (!req.is("application/json")) {
                res.status(406);
                res.header("Content-Type", "text/plain");
                res.end("Policy not fulfilled.\nJSON Format required with params: userID, type, msg, time.");
                return;
            }
            var log = req.body;
            var id = req.params.id;
            //Check for valid format.
            if (!log.userID || !log.type || !log.msg || !log.time) {
                res.status(420);
                res.header("Content-Type", "text/plain");
                res.end("Policy not fulfilled.\nJSON Format required with params: userID, type, msg, time.");
                return;
            }
            if (id) {
                logDB.update({ _id: id }, req.body, { multi: false }, function (err) {
                    if (err) {
                        res.status(500);
                        res.header("Content-Type", "text/plain");
                        res.end("Server Error\n" + err);
                    }
                    else {
                        res.status(200);
                        switch (req.header("Accept")) {
                            case "application/json":
                                res.header("Content-Type", "application/json");
                                res.end(JSON.stringify(req.body));
                                break;
                            default:
                                res.header("Content-Type", "text/plain");
                                res.end(req.body.name + " changed.");
                                break;
                        }
                    }
                });
            }
            else {
                res.status(500);
                res.header("Content-Type", "text/plain");
                res.end("Server Error");
            }
        }
        else {
            res.status(500);
            res.header("Content-Type", "text/plain");
            res.end("Error. No Store. Please re-login at /login");
        }
    }
    else {
        res.status(401);
        res.header("Content-Type", "text/plain");
        res.end("Access denied. Unauthorized.");
    }
});
app.delete("/log/:id", bodyParser.json(), function (req, res) {
    var sessionID = req.cookies["session-id"];
    if (sessionID) {
        var store = sessionDB.getSessionStore(sessionID);
        if (store) {
            var user = store.user;
            var userID = store.userID;
            var id = req.params.id;
            if (id) {
                logDB.remove({ _id: id }, { multi: false }, function (err) {
                    if (err) {
                        res.status(500);
                        res.header("Content-Type", "text/plain");
                        res.end("Server Error\n" + err);
                    }
                    else {
                        switch (req.header("Accept")) {
                            case "application/json":
                                res.status(406);
                                res.header("Content-Type", "text/plain");
                                res.end("JSON-Format not possible. \nUser deleted.");
                                break;
                            default:
                                res.status(200);
                                res.header("Content-Type", "text/plain");
                                res.end("Deleted.");
                                break;
                        }
                    }
                });
            }
        }
        else {
            res.status(500);
            res.header("Content-Type", "text/plain");
            res.end("Error. No Store. Please re-login at /login");
        }
    }
    else {
        res.status(401);
        res.header("Content-Type", "text/plain");
        res.end("Access denied. Unauthorized.");
    }
});
app.get("/logged", bodyParser.json(), function (req, res) {
    var sessionID = req.cookies["session-id"];
    if (sessionID) {
        res.header("Content-Type", "application/json");
        res.end(JSON.stringify(true));
    }
    else {
        res.header("Content-Type", "application/json");
        res.end(JSON.stringify(false));
    }
});
app.post("/logout", bodyParser.json(), function (req, res) {
    var sessionID = req.cookies["session-id"];
    if (sessionID) {
        var store = sessionDB.getSessionStore(sessionID);
        if (store) {
            var user = store.user;
            var usrID = store.userID;
            logDB.find({ userID: usrID }, function (err, log) {
                if (err) {
                    res.status(500);
                    res.header("Content-Type", "text/plain");
                    res.end("Server Error\n" + err);
                }
                else {
                    res.clearCookie("session-id");
                    res.status(200);
                    res.header("Content-Type", "text/plain");
                    res.end("User logout done");
                }
            });
        }
        else {
            res.status(500);
            res.header("Content-Type", "text/plain");
            res.end("Error. No Store. Please re-login at /login");
        }
    }
});
app.get("/logs", bodyParser.json(), function (req, res) {
    var sessionID = req.cookies["session-id"];
    if (sessionID) {
        var store = sessionDB.getSessionStore(sessionID);
        var auth = req.header("Authorization");
        //### Abfrage ob über den Ajax-Call eine Authentifizierung gesetzt ist, immer der Fall nach erfolgreichem Login auf Clientseite.
        if (!auth) {
            res.status(401);
            res.header("Content-Type", "text/plain");
            res.end("Access denied. Unauthorized. Session not available.");
            return;
        }
        if (store && auth) {
            var user = store.user;
            var usrID = store.userID;
            //### Wir splitten beim Leerzeichen, in auth selbst steht etwas nach dem Schema 'Basic TWFyY28gS29ucmFkOnT2bno=' - wir wollen den Teil nach Basic..
            var tmp = auth.split(' ');
            var buf = new Buffer(tmp[1], 'base64');
            //### Wir lesen den Binärinhalt (Nach dem Schema: <Buffer 4d 61 72 63 6f 20 4b 6f 6e 72 61 64 3a 74 f6 6e 7a>) wieder zurück in einen Text.
            var plain_auth = buf.toString();
            //### Inhalt des Strings ist zu diesem Zeitpunkt immer "username:password", welchen wir splitten
            var userData = plain_auth.split(':');
            //### Abfrage ob der angemeldete User auch der authentifizierte User ist.
            if (user != userData[0]) {
                res.clearCookie("session-id");
                res.status(401);
                res.header("Content-Type", "text/plain");
                res.end("Access denied. Unauthorized. Please Login again!");
                return;
            }
            logDB.find({ userID: usrID }, function (err, log) {
                if (err) {
                    res.status(500);
                    res.header("Content-Type", "text/plain");
                    res.end("Server Error\n" + err);
                }
                else {
                    if (log.length < 1) {
                        res.status(416);
                        switch (req.header("Accept")) {
                            case "application/json":
                                res.header("Content-Type", "text/plain");
                                res.end(JSON.stringify(log));
                                return;
                            default:
                                res.header("Content-Type", "text/plain");
                                res.end("Requested range not satisfiable.\nThere is no entry in here.");
                                return;
                        }
                    }
                    res.status(200);
                    switch (req.header("Accept")) {
                        case "application/json":
                            res.header("Content-Type", "application/json");
                            res.end(JSON.stringify(log));
                            break;
                        default:
                            res.header("Content-Type", "text/plain");
                            res.charset = "utf-8";
                            log.forEach(function (logFile) {
                                res.write("Type: " + logFile.type + "\nMessage: " + logFile.msg + "\n\n");
                            });
                            res.end();
                            break;
                    }
                }
            });
        }
        else {
            res.clearCookie("session-id");
            res.status(401);
            res.header("Content-Type", "text/plain");
            res.end("Access denied. Unauthorized. Session not available.");
        }
    }
    else {
        res.status(401);
        res.header("Content-Type", "text/plain");
        res.end("Access denied. Unauthorized.");
    }
});
//###################### LOG #########################
//##################### SECURE #######################
var server = app.listen(8080, function () {
    console.log("Logsystem bereit. Port: 8080.");
});
//# sourceMappingURL=server.js.map
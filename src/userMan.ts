import nedb = require("nedb");

export class UserMan {
    public constructor() {}

    public authenticate(nme, pwd): boolean {    
        let usrDB = new nedb({filename: "./logs/user.db", autoload: true});
        let auth: boolean = false;
        let actUsr: any;

        usrDB.find({name: nme, password: pwd}, (err, usr) => {
            actUsr = usr;
        });

        return (actUsr.length === 1);
    }
}
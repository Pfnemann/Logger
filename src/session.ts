let uuid = require("node-uuid");

export class SessionDB {
    private sessions = {};

    public constructor() {}

    public createSession(): string {
        let sessionID = uuid.v4();
        this.sessions[sessionID] = {};

        return sessionID;
    }

    public getSessionStore(sessionID: string) {
        return this.sessions[sessionID];
    }

    public deleteSession(sessionID: string) {
        delete this.sessions[sessionID];
    }
}
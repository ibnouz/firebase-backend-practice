//import { Request } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { Response } from "firebase-functions/v1";
import express from 'express';
import { UserRecord } from "firebase-admin/auth";
import { setGlobalOptions } from "firebase-functions";
/*
admin.auth().listUsers().then((result) => {
    console.log(result)
})*/

async function fetchUserByUID(uid: any) {
    let user = admin.auth().getUser(uid)
    return user;
}
async function canAuthFromReq(req: any) {
    let result = false;
    let foundUser;
    let foundRoles;
    try {
        const authToken = req.headers.authorization?.split(" ")[1];
        const uid = authToken || req.headers.uid;
        let user = await fetchUserByUID(uid);
        if (user) {
            //let roles = (await fetchUserByUID(uid)).customClaims?.roles ?? {};
            let roles = (await getUserExtraRecords(user)).roles;
            result = true; foundUser = user; foundRoles = roles ?? {};
        };
    } catch (error) {
        result = false;
    }
    return { "can": result, "userobj": foundUser, "roles": foundRoles ?? [] };
}
async function findUsersForRole(somerole: string) {
    let userlist = [];
    const result = await admin.auth().listUsers();
    if (result)
        if (result.users != null && result.users.length > 0) {
            for (const u of result.users) {
                let records = await getUserExtraRecords(u);
                let roles = records.roles
                if (roles != null) {  //u.customClaims?.roles != null){
                    let userroles = roles; //u.customClaims?.roles as string[];
                    if (userroles.includes(somerole) || userroles.includes("admin")){
                        userlist.push(u);
                        //console.log(u);
                    }
                        
                }
            };
        };


    /*let nonAdminUsers = userlist.filter(async (u) =>{
        let userroles =  await getUserExtraRecords(u); // u.customClaims?.roles as string[];
        return !userroles.includes("admin");
    });*/
    let nonAdminUsers :UserRecord[] = [];
    for(var user of userlist){
        try {
            let roles = (await getUserExtraRecords(user)).roles; // u.customClaims?.roles as string[];
            if(!roles.includes("admin")){
                nonAdminUsers.push(user)
            }
        } catch (error) {console.log(error)};
    };
    let leastPrivilegedUser : UserRecord | undefined = undefined;
    if (nonAdminUsers.length > 0)
        leastPrivilegedUser = nonAdminUsers[Math.floor(Math.random() * nonAdminUsers.length)];

    let returning = { success: userlist.length > 0,nonAdminUsers: nonAdminUsers, list: userlist, leastPrivilegedUser: leastPrivilegedUser };
    console.log(returning);
    return returning;
}

async function getAccount(req: any, res: Response) {
    const authToken = req.headers.authorization?.split(" ")[1];
    const uid = authToken || req.headers.uid;
    if (!uid || uid.length == 0) {
        //res.status(401).json({ message: "Unauthorized, no token provided" });
        return [false, {error:"No uid in headers"}];
    }
    try {
        let user = await fetchUserByUID(uid);
        //res.json(user);
        return [true, user];
    } catch (e) {
        //res.status(400).send("No account associated");
        return [false, {error:"No account found from uid"}];
    }
    return [false, false];
}
async function setAccountRole(req: any, res: Response) {
    let can = await canAuthFromReq(req);
    if (!can.can)
        return [false, { error: "no" }];

    let wantedrole = req.headers.role;
    if (wantedrole == undefined)
        return [false, { error: "specify a 'role' header" }];

    let user = can.userobj;
    let currRoles = can.roles;
    currRoles.push(wantedrole);
    try {
        await admin.firestore().collection("users").doc(user!.uid).set({ roles: currRoles }, { merge: true });
        return [true,{rolesnow: currRoles}];
    } catch (e) { return [false, { error: e }]; }

    return [false, { error: "impossible" }];
}
async function getUserExtraRecords(user: UserRecord) {
    let roles: String[] = [];
    try {
        let fields = (await admin.firestore().collection("users").doc(user.uid).get())?.data();
        if (fields)
            roles = fields.roles ?? [];
    } catch (e) { }
    return {
        roles: roles,
    };
}
async function createAccount(req: any, res: Response) {
    let d = {
        "displayName": req.headers.displayname ?? null,
        "email": req.headers.email ?? null,
        "pw": req.headers.password ?? null,
        "roles": [req.headers.isAdmin ? "admin" : "member"],
    }
    for (const [propertyName, value] of Object.entries(d)) {
        let userInput = value;
        if (userInput == null) { res.status(400).send("missing info: " + propertyName); return; }
    };

    admin.auth().createUser({
        "displayName": d.displayName as string,
        "email": d.email as string,
        "emailVerified": false,
        "password": d.pw as string,
    }).then(newUser => {
        admin.auth().setCustomUserClaims(newUser.uid, { roles: d.roles });
        admin.firestore().collection("users").doc(newUser.uid).set({ roles: d.roles, uid: newUser.uid }, { merge: true });
        res.json(newUser);
    }).catch(e => {
        res.json({ "error": e, })
    });
}
let router = express.Router();
router.get("", async (req, res, next) => {
    const [success, msg] = await getAccount(req, res);
    res.status(success ? 200 : 400).send(msg);
});
router.delete("", async (req, res, next) => {
    return await getAccount(req, res);
});
router.post("", async (req, res, next) => {
    return await createAccount(req, res)
});
router.put("/addrole", async (req, res, next) => {
    const [success, msg] = await setAccountRole(req, res);
    res.status(success ? 200 : 400).send(msg);
});
export { getAccount, createAccount, router,fetchUserByUID, getUserExtraRecords, canAuthFromReq, findUsersForRole };
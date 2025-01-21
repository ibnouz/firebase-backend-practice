import { Request } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { Response } from "firebase-functions/v1";
import express from 'express';
/*
admin.auth().listUsers().then((result) => {
    console.log(result)
})*/

async function fetchUserByUID(uid: any) {
    let user = admin.auth().getUser(uid)
    return user;
}
async function canAuthFromReq(req:any){
    let result = false;
    let foundUser;
    let foundRoles;
    try {
        const authToken = req.headers.authorization?.split(" ")[1];
        const uid = authToken || req.headers.uid;
        let user = await fetchUserByUID(uid);
        if(user){
            let roles = (await fetchUserByUID(uid)).customClaims?.roles ?? {};
            result = true; foundUser=user; foundRoles=roles ?? {};
        };
    } catch (error) {
        result = false;
    }
    return {"can": result, "userobj": foundUser, "roles":foundRoles ?? {}};
}

async function getAccount(req:any, res: Response) {
    const authToken = req.headers.authorization?.split(" ")[1];
    const uid = authToken || req.headers.uid;
    if (!uid || uid.length == 0) {
        //res.status(401).json({ message: "Unauthorized, no token provided" });
        return [false,"No uid in headers"];
    }
    try {
        let user = await fetchUserByUID(uid);
        //res.json(user);
        return[true,user];
    } catch (e) {
        //res.status(400).send("No account associated");
        return [false,"No account found from uid"];
    }
    return [false,false];
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
        if(userInput == null)
            {res.status(400).send("missing info: "+propertyName);   return;}
    };
    admin.auth().createUser({
        "displayName": d.displayName as string,
        "email": d.email as string,
        "emailVerified": false,
        "password": d.pw as string,
    }).then(newUser => {
        admin.auth().setCustomUserClaims(newUser.uid,{roles: d.roles});
        res.json(newUser);
    }).catch(e=>{
        res.json({ "error": e, })
    });
}
let router = express.Router();
router.get("", async(req,res,next)=>{
    const [success, msg] = await getAccount(req,res);
    res.status(success ? 200 : 400).send(msg);
});
router.delete("", async(req,res,next)=>{
    return getAccount(req,res);
});
router.post("", async(req,res,next)=>{
    return await createAccount(req,res)
});

export { getAccount, createAccount, router , canAuthFromReq};
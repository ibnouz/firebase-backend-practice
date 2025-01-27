import * as admin from "firebase-admin";
//import { Response } from "firebase-functions/v1";
import express from 'express';
import { UserRecord } from "firebase-admin/auth";
//import { Request } from "express-serve-static-core";
//import { ParsedQs } from "qs";
import { canAuthFromReq, fetchUserByUID } from "./account";


class Report{
    private userRecords : UserRecord[];
    private userids :String[]= [];
    constructor(userRecords: UserRecord[]) {
        this.userRecords = userRecords;
        this.userids = userRecords.map((u)=>{return u.uid});
    }
    async toArray(recent_days:number = 7){
        let result = {tasksCount:0,activeUsers:0,inactiveUsers:0,activeUserIdsList:[] as string[],topTaskCreators:{} as {[key:string]:number},topTaskAssignees:{} as {[key:string]:number},tasksWithNoAssignees:[] as String[],usersWithNoTasksAssigned:[] as String[]};
        result.tasksCount = (await admin.firestore().collection("tasks").where("userid","in",this.userids).get()).size;
        const recentDaysInMillis = recent_days * 24 * 60 * 60 * 1000;
        const recentTimestamp = new Date( new Date().getTime() - recentDaysInMillis);
        var recentlyCreatedTasks = await (await admin.firestore().collection("tasks").where("createdat",">=",recentTimestamp)).get();
        let _activeUserIdsList :string[] = [];
        for(const t of recentlyCreatedTasks.docs){
            const data = t.data();
            if(data && data.userid)
                if (!_activeUserIdsList.includes(data.userid)){
                    _activeUserIdsList.push(data.userid);
                    result.activeUsers += 1;
                    result.topTaskCreators[data.userid] = 0;
                    //result.topTaskAssignees[data.userid] = 0;
                }
                result.topTaskCreators[data.userid] += 1;
                if(data.assignedTo != null){
                    let user = await fetchUserByUID(data.assignedTo)
                    let assignedUserId = user.uid;
                    if (result.topTaskAssignees[assignedUserId] == null)
                        result.topTaskAssignees[assignedUserId] = 0;
                    result.topTaskAssignees[assignedUserId] += 1;
                } else{ result.tasksWithNoAssignees.push(t.id) }
        }
        result.activeUserIdsList = _activeUserIdsList;
        for(const user of this.userRecords){
            if(!_activeUserIdsList.includes(user.uid))
                result.inactiveUsers += 1;

            let hasSomethingAssigned = false;
            for(const t of recentlyCreatedTasks.docs){
                let data = t.data();
                if(data.assignedTo == user.uid)
                    hasSomethingAssigned = true;
            }
            if(!hasSomethingAssigned)
                result.usersWithNoTasksAssigned.push(user.uid);
        }
        return result;
    };
};

async function newReport(req:any /*Request<{}, any, any, ParsedQs, Record<string, any>>*/,res:any, _shouldSaveToFirestore = false){
    let isAuth = canAuthFromReq(req); 
    let shouldSaveToFirestore = req.headers.shouldsave ?? _shouldSaveToFirestore;
    let recent_days = req.headers.recent_days ?? undefined;
    if(recent_days != undefined)
        try { recent_days = parseInt(recent_days)
        } catch (e) { recent_days = undefined;};

    //if(!(await isAuth).can)
    //    return [false,{error: "must be auth with admin account"}];
    //if(!(await isAuth).roles.includes("admin") ) 
    //    return [false,{error:"must be admin"}];
    //let authuser = (await isAuth).userobj;

    // ^^^^ code pour auth, px le uncomment mais schedules de index.ts ne pourront pus utliser cette fonction
    let allUsers: UserRecord[] = [];
    try {
        const listUsersResult = await admin.auth().listUsers();
        listUsersResult.users.forEach(userRecord => {
            allUsers.push(userRecord);
        });
    } catch (error) {
        return [false, { error: "Failed to retrieve users" }];
    }

    let result = await new Report(allUsers).toArray((recent_days));
    let docref;
    if(shouldSaveToFirestore){
        try{
            docref = (await admin.firestore().collection("servicereports").add(
                result
            ));
            await docref.set({ id:docref.id, wasSaved:true, generatedBy: (await isAuth).can ? (await isAuth).userobj?.uid : "system" },{merge:true});
            docref = (await docref.get()).data(); 
        }catch(e){}
    }
    return [true,  docref ?? result];
}

const router = express.Router();
router.get("/new", async (req,res)=>{
    const [success,result] = await newReport(req,res);
    res.status(success ? 200 : 400).send(result);
});

export {router,newReport};
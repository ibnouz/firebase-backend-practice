//import { Request } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
//import { Response } from "firebase-functions/v1";
import { canAuthFromReq, findUsersForRole,getUserExtraRecords } from "./account";
import express from 'express';
import { UserRecord } from "firebase-admin/auth";
import * as functions from "firebase-functions";
//import * as moment from 'moment';
const moment = require("moment");

interface Task {
    concernedrole: string | null;
    userid: string | null,
    type : string | null,
    // other properties of the task
}

async function getTasks(req:any,res:any,removeQueriedTID:boolean = false){
    let queried_tid = req.headers.queried_tid ?? null;
    if (removeQueriedTID == true)
        queried_tid = null;

    let results;

    if(queried_tid != null){
        results = [true,{}]
        await admin.firestore().collection("tasks").doc(queried_tid).get()
        .then((doc)=>{ 
            if(doc.exists)
                results = [true,doc.data()];
            else
                results = [false,[]]
         })
         .catch((e)=>{
            results = [false,{"error":e}]
         })
    } else{
        await admin.firestore().collection("tasks").get()
        .then((snapshot)=>{
            if(snapshot.empty)
                results = [true,[]]
            else{
                let list = snapshot.docs.map(e=>{
                    if(e.exists){
                        let data = e.data();
                        if(e.id != data.id) //input id si jamais ya pas
                            data.id = e.id;
                        return data;
                    }
                    return;
                });
                results = [true,list]
            }
        }).catch(e=>{
            results = [false,{"error":e}];
        })
    }
    //console.log("euh:",queried_tid);
    return results ?? [false,{}];
}


async function filterTasksForUser(user:UserRecord,req: any,res: any){
    let userroles : String[]= (await getUserExtraRecords(user))?.roles ?? [];
    console.log(userroles);
    const  [success,consttasks] = await getTasks(req,res);
    if(!success)
        return [false,["impossible to retrieve"]];

    let resultinglist : Task[];
    let tasks = consttasks as [];
    resultinglist = [];
    tasks.forEach((e : any)=>{
        //if((e.userid) != user.uid) //KEEP COMMENTED OR IT WILL BREAK THE SEARCH
           // return;
        let hasFound = e.concernedrole == "public";
        //console.log(userroles.map(role => { return ""+role +" "+e.concernedrole; }))
        userroles.forEach(role => {
            if(e.concernedrole == role)
                hasFound = true;
        });
        if(userroles.includes("admin")) //force admin role to see all
            hasFound = true;
            
        if(hasFound)
            resultinglist.push(e);
    })
    return [true,resultinglist];
}

async function canEditTask(user:UserRecord, task:any){
    if(user.disabled)
        return false;
    if((await getUserExtraRecords(user)).roles.includes("admin"))
        return true;
    if(user.uid == task.userid)
        return true;
    if(task.assignedTo == user.uid)
        return true;
    return false;
};

async function delTask(req:any,res:any) {
    let canAuth = await canAuthFromReq(req);
    if(!canAuth.can)
        return [false, {"error":"need to be auth"}];

    let queried_tid = req.headers.queried_tid ?? null;
    if(queried_tid == null)
        return [false,{"error":"missing queried_tid in headers"}];
    let doc = await admin.firestore().collection("tasks").doc(queried_tid)
    if(doc == null || !(await doc.get()).exists)
        return [false,{"error":"doc ref doesn't exist"}];
    try{
        if(! await canEditTask(canAuth.userobj!,(await (doc.get())).data()))
            return [false, {"error":"no permission to do this"}]; 

        await doc.delete();
        return [true,{"msg":"delete OK"}];
    } catch(e){
        return [false,{"error":"error deleting"}];
    }
}
async function editTask(req:any,res:any, from_editTaskDeadline = false){
    let canAuth = await canAuthFromReq(req);
    if(!canAuth.can)
        return [false, {"error":"need to be auth"}];

    let queried_tid = req.headers.queried_tid ?? null;
    if(queried_tid == null)
        return [false,{"error":"missing queried_tid in headers"}];
    let key = req.headers.key ?? null;
    const value = req.headers.value ?? null;
    if(key == "deadline")
        return [false, {"error": "can not manually edit deadline"}];
    if(from_editTaskDeadline)
        key = "deadline";//permettre la modification faite par des calls d'autre fonction, notamment editTaskDeadline

    if(key==null||value==null)
        return [false,{"error":"missing 'key' OR 'value' in headers"}];

    let doc = await admin.firestore().collection("tasks").doc(queried_tid)
    if(doc == null || !(await doc.get()).exists)
        return [false,{"error":"doc ref doesn't exist"}];
    try{
        if(! await canEditTask(canAuth.userobj!,(await (doc.get())).data()))
            return [false, {"error":"no permission to do this"}]; 
        await doc.update({ [key]: value })
        return [true,{"msg":"edit OK"}];
    } catch(e){
        return [false,{"error":"error editting: "+e}];
    }
}
async function editTaskDeadline(req:any,res:any){
    let queried_tid = req.headers.queried_tid ?? null;
    if(queried_tid == null)
        return [false,{"error":"missing queried_tid in headers"}];
    return await editTask(req,res,true);
}
async function createTask(req:any,res:any) {
    let canAuth = await canAuthFromReq(req);
    if(!canAuth.can)
        return [false, {"error":"need to be auth"}];
    let user = (await canAuthFromReq(req)).userobj;
    let d = {
        "description": req.headers.description ?? null,
        "title": req.headers.title ?? null,
        "category": req.headers.category ?? "none",
        "deadline": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), //30 jours
        "concernedrole" : req.headers.concernedrole ?? "public", }
    let results: string | any[] = [];
    for (const [propertyName, value] of Object.entries(d)) {
        let userInput = value;
        if(userInput == null)
            {results = [false,"property is missing: "+propertyName];}
    };
    if(results.length != 0) return results;
    try {
        const doc = await admin.firestore().collection("tasks").add({
            ...d,
            userid:user?.uid,
            createdat: new Date(), //admin.firestore.FieldValue.serverTimestamp(),
            concernedrole: d.concernedrole ? d.concernedrole : "public",
        })
        if(doc != null && (await doc.get()).exists){
            await doc.update({id: doc.id});
            return [true,(await doc.get()).data()];
        }
    } catch (error) {
        return [false,{"error":"error when creating: "+error}]; 
    }
    return [false,{"error":"impossible to create"}];
}
let router = express.Router();
router.get("", async (req,res,next) => {
    const [status,result] = await getTasks(req,res);
    res.status(status ? 200 : 404).send(result);
})
router.get("/foryou" , async (req,res,next)=>{
    const canAuth = await canAuthFromReq(req);
    if(!canAuth.can)
        return res.status(400).send({"error":"Need to be auth"});

    const [status,result] = await filterTasksForUser(canAuth.userobj as UserRecord ,req,res);
    //console.log(result)
    res.status(status ? 200 : 404).send(result);
    return true;
});
router.get("/assignedtoyou" , async (req,res,next)=>{
    const canAuth = await canAuthFromReq(req);
    if(!canAuth.can)
        return res.status(400).send({"error":"Need to be auth"});

    const [status,result] = await filterTasksForUser(canAuth.userobj as UserRecord ,req,res);
    let list = result as [];
    var filtered : any = list.filter((e:any)=>{ return e.assignedTo === canAuth.userobj?.uid && e.assignedTo != null })

    res.status(status ? 200 : 404).send(filtered);
    return true;
});
router.delete("", async (req,res,next) => {
    const [status,result] = await delTask(req,res);
    res.status(status ? 200 : 404).send(result);
})
router.put("", async (req,res,next) => {
    const [status,result] = await editTask(req,res);
    res.status(status ? 200 : 404).send(result);
})
router.put("/editdeadline", async (req,res,next) => {
    const [status,result] = await editTaskDeadline(req,res);
    res.status(status ? 200 : 404).send(result);
})
router.post("", async (req,res,next) => {
    const [status,result] = await createTask(req,res);
    res.status(status ? 200 : 404).send(result);
})


var tasksOnDocumentCreatedTrigger = functions.firestore.onDocumentCreated("tasks/{taskId}", async (snapshot) => {
    let newDoc = snapshot.data;
    let taskid = newDoc?.id;
    if (taskid == null) return;

    const usersForRoleSearch = await findUsersForRole(newDoc?.data().concernedrole)
    if (usersForRoleSearch.success) {
        newDoc?.ref.update("assignedTo", usersForRoleSearch.leastPrivilegedUser?.uid)
        const newValue = snapshot.data?.data();
        const token = newValue?.deviceTokenOfAssignedTouid; // Assuming you store the device token on the Firestore doc
        if (token) {
            const message = {
                notification: {
                    title: 'New task assigned to You!',
                    body: `Task ${newValue.title} was assigned to you.`,
                },
                token: token,
            };
            try {
                await admin.messaging().send(message);
            } catch (error) {}
        }
    }
});
var tasksOnDocumentEditTrigger = functions.firestore.onDocumentUpdated("tasks/{taskId}", async (snapshot) => {
    let newDoc = snapshot.data?.after;
    let taskid = newDoc?.id;
    if (taskid == null) return;

    const usersForRoleSearch = await findUsersForRole(newDoc?.data().concernedrole)
    if (usersForRoleSearch.success && newDoc?.data().assignedTo != usersForRoleSearch.leastPrivilegedUser?.uid){
        newDoc?.ref.update("assignedTo", usersForRoleSearch.leastPrivilegedUser?.uid)
        const newValue = snapshot.data?.after.data();
        const token = newValue?.deviceTokenOfAssignedTouid; // Assuming you store the device token on the Firestore doc
        if (token) {
            const message = {
                notification: {
                    title: 'Task now assigned to You!',
                    body: `Task ${newValue.title} was assigned to you.`,
                },
                token: token,
            };
            try {
                await admin.messaging().send(message);
            } catch (error) {}
        }
    }
        
});
async function checkdeadlines(req:any,res:any){
    const now = new Date();
    const deadlineThreshold = moment(now).add(1, 'hours').toDate();
    try {
        const tasksSnapshot = await admin.firestore().collection('tasks')
            .where('deadline', '>', now)
            .where('deadline', '<=', deadlineThreshold)
            .get();
        if (tasksSnapshot.empty) {
            return [true,{msg:"no notif to send for now"}];
        }
        tasksSnapshot.forEach(async (doc) => {
            const task = doc.data();
            const token = task.deviceTokenOfAssignedTouid;
            if (token) {
                const message = {
                    notification: {
                        title: 'Upcoming Task Deadline',
                        body: `Task "${task.title}" is due soon.`,
                    },
                    token: token,
                };
                await admin.messaging().send(message);
            }
        });
        return [true,{msg:"notifications sent"}];
    } catch (error) { return [false,{"error": error}] }
    //return [true,true];
}

router.post("/checkdeadlines",async function(req,res){
    const [status,result] = await checkdeadlines(req,res);
    res.status(status ? 200 : 404).send(result);
});



export {router,tasksOnDocumentCreatedTrigger,tasksOnDocumentEditTrigger,filterTasksForUser, checkdeadlines};
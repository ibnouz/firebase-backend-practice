import { Request } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { Response } from "firebase-functions/v1";
import { canAuthFromReq } from "./account";
import express from 'express';
import { UserRecord } from "firebase-admin/auth";

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
    let userroles : String[]= user.customClaims?.role ?? [];
    console.log(userroles);
    const  [success,consttasks] = await getTasks(req,res);
    if(!success)
        return [false,"impossible to retrieve"];

    let resultinglist: any[];
    //console.log(consttasks);
    let tasks = consttasks as [];
    resultinglist = [];
    tasks.forEach((e : any)=>{
        if((e.userid) != user.uid)
            return false;
        let hasFound = e.concernedrole === null;
        //console.log(userroles.map(role => { return ""+role +" "+e.concernedrole; }))
        userroles.forEach(role => {
            if(e.concernedrole === role)
                hasFound = true;
        });
        if(userroles.includes("admin")) //force admin role to see all
            hasFound = true;
        if(hasFound){
            resultinglist.push(e);
            //console.log(e);
        }
        return true;
    })
    return [true,resultinglist];
}

async function delTask(req:any,res:any) {
    let queried_tid = req.headers.queried_tid ?? null;
    if(queried_tid == null)
        return [false,{"error":"missing queried_tid in headers"}];
    let doc = await admin.firestore().collection("tasks").doc(queried_tid)
    if(doc == null || !(await doc.get()).exists)
        return [false,{"error":"doc ref doesn't exist"}];

    try{
        await doc.delete();
        return [true,{"msg":"delete OK"}];
    } catch(e){
        return [false,{"error":"error deleting"}];
    }
}
async function createTask(req:any,res:any) {
    let canAuth = await canAuthFromReq(req);
    if(!canAuth.can)
        return [false, {"error":"need to be auth"}];
    let user = (await canAuthFromReq(req)).userobj;
    
    let d = {
        "description": req.headers.description ?? null,
        "title": req.headers.title ?? null,
        "category": req.headers.category ?? null,
        "concernedrole" : req.headers.concernedrole ?? "",
    }
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
            concernedrole: d.concernedrole ? d.concernedrole : null,
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
        return res.status(400).send({"e":"Need to be auth"});

    const [status,result] = await filterTasksForUser(canAuth.userobj as UserRecord ,req,res);
    res.status(status ? 200 : 404).send(result);
});
router.delete("", async (req,res,next) => {
    const [status,result] = await delTask(req,res);
    res.status(status ? 200 : 404).send(result);
})
router.post("", async (req,res,next) => {
    const [status,result] = await createTask(req,res);
    res.status(status ? 200 : 404).send(result);
})


export {router}
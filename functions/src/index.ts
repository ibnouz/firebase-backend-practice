import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as functions from 'firebase-functions/v1';
admin.initializeApp();


import * as accountsController from './controllers/account';
import * as tasksController from './controllers/tasks';
import * as servicereportsController from './controllers/servicereports';

import {expressAppFromFile} from './expressApp';
const app = expressAppFromFile;
/*
export const somerequest = onRequest(async (request, response) => {
//admin.auth().listUsers().then((result) => {
//  console.log(result)
//})
  if(request.method == "post")
    return accountsController.createAccount(request,response);

  return accountsController.getAccount(request,response);
});
*/
app.use("/account",accountsController.router);
app.use("/tasks",tasksController.router);
app.use("/reports",servicereportsController.router);

functions.pubsub.schedule("every 1 hours").onRun((ctx)=>{
  tasksController.checkdeadlines({},{});
});

exports.app = onRequest(app);
exports.tasksOnDocumentCreatedTrigger = tasksController.tasksOnDocumentCreatedTrigger;
exports.tasksOnDocumentEditTrigger = tasksController.tasksOnDocumentEditTrigger;

//exports.expressApp = app;
//if (process.env.NODE_ENV !== 'production') {
 // module.exports.expressApp = app;  // Only for local testing or development
//}


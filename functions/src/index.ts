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


//jai appris que les schedules ne fonctionentn pas dans emulateur, elle ne fonctione que deployed
functions.pubsub.schedule("every 1 hours").onRun((ctx)=>{
  tasksController.checkdeadlines({},{});
});
functions.pubsub.schedule("every 24 hours").onRun((ctx)=>{
  servicereportsController.newReport(undefined,undefined,true);
  functions.logger.info("New report was made and saved to firestore");
});

exports.app = onRequest(app);
exports.tasksOnDocumentCreatedTrigger = tasksController.tasksOnDocumentCreatedTrigger;
exports.tasksOnDocumentEditTrigger = tasksController.tasksOnDocumentEditTrigger;


import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
admin.initializeApp();
import * as accountsController from './controllers/account';
import * as tasksController from './controllers/tasks';

import express from 'express';
const app = express();
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


exports.app = onRequest(app);
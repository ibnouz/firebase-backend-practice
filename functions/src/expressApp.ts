import express from 'express';

const expressAppFromFile = express();

const APPURL = "http://127.0.0.1:5001/devxpressbackendtesting/us-central1/app";
// a besoin de finir par /app apres le us-central1

export {expressAppFromFile, APPURL}
import request from 'supertest';
//import * as testdata from './testAccount.json';
//import * as servicereports from '../controllers/servicereports';
import { APPURL } from '../expressApp'; // Import your express app
//const app = expressAppFromFile; // Initialize the express app

let appURL = APPURL;
describe('GET /reports/new', () => {
  it('should return a valid report', async () => {
    const res = await request(appURL)
      .get('/reports/new')

      let stringedlol = JSON.stringify(res.body, null, 2); 

    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(stringedlol).toContain("tasksCount");
 });

});
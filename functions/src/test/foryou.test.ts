import request from 'supertest';
import * as testdata from './testAccount.json';
import { APPURL } from '../expressApp'; // Import your express app
//const app = expressAppFromFile; // Initialize the express app

let appURL = APPURL;
describe('GET /tasks/assignedtoyou', () => {
  it('should return 400 if user is not authenticated', async () => {
    const res = await request(appURL)
      .get('/tasks/assignedtoyou')

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
 });

  it('should return tasks assigned to the authenticated user', async () => {
    const res = await request(appURL)
      .get('/tasks/assignedtoyou') 
      .set('uid', testdata.uid_test_acc);

    let stringedlol = JSON.stringify(res.body, null, 2); 

    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(stringedlol).toContain("assignedTo");
  });

  it('should return 404 if no tasks are found for the user', async () => {
    const res = await request(appURL)
      .get('/tasks/assignedtoyou')
       .set('uid', testdata.uid_test_acc_nothing_assigned);
  
    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(res.body).toHaveLength(0)
  });
});

import request from 'supertest';
import * as testdata from './testAccount.json';
import { APPURL } from '../expressApp'; // Import your express app
//const app = expressAppFromFile; // Initialize the express app

let appURL = APPURL;
describe('GET /tasks/foryou', () => {
  it('should return 400 if no user /foryou', async () => {
    const res = await request(appURL)
      .get('/tasks/foryou')

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
 });

  it('should return /foryou tasks the authenticated user', async () => {
    const res = await request(appURL)
      .get('/tasks/foryou') 
      .set('uid', testdata.uid_test_acc);

    let stringedlol = JSON.stringify(res.body, null, 2); 

    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(stringedlol).toContain("userid");
  });
  /*
  it('should return OK if nothing /foryou', async () => {
    const res = await request(appURL)
      .get('/tasks/foryou')
       .set('uid', testdata.uid_test_acc_nothing_assigned);
  
       let stringedlol = JSON.stringify(res.body, null, 2); 
    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(stringedlol).toBe("[]");
  });*/
  it('should return OK to del something from /foryou', async () => {
    const res = await request(appURL)
      .post('/tasks')
       .set('uid', testdata.uid_test_acc_nothing_assigned)
       .set("description","autogenerated by delete test")
       .set("title","autogenerated by delete test");
  
       if(res.body.id != null)
       {
        const res2 = await request(appURL)
          .del('/tasks')
          .set('uid', testdata.uid_test_acc_nothing_assigned)
          .set("queried_tid",res.body.id);

          expect(res2.statusCode).toBe(200);
          return;
       }
       expect(res.statusCode).toBe(200);
  });
});

import {test,expect} from '@playwright/test';
// No live workbooks are modified by these unauthenticated checks.
test('password recovery forms render without disclosing credentials',async({page})=>{
 await page.goto('/forgot-password');await expect(page.getByRole('heading',{name:'Reset your password'})).toBeVisible();
 await page.goto('/reset-password');await expect(page.getByText('Missing reset token')).toBeVisible();
});
test('new admin APIs and notification endpoints enforce authentication',async({request})=>{
 for(const p of ['/api/admin/management','/api/admin/target-requests','/api/admin/reconcile']){
  const r=await request.get(p);expect([401,403]).toContain(r.status());
 }
 const r=await request.post('/api/cron/notifications');expect(r.status()).toBe(401);
});
test('malformed password reset requests are rejected without existing accounts',async({request,baseURL})=>{
 const r=await request.post('/api/auth/reset-password',{headers:{origin:baseURL??'http://localhost:3000'},data:{token:'short',password:'verylongrandompassword'}});
 expect(r.status()).toBe(400);
});

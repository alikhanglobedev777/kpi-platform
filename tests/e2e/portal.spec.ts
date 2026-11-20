import {test,expect} from "@playwright/test";

test("login and access request pages are available",async({page})=>{
  await page.goto("/login");await expect(page.getByRole("heading",{name:"Welcome back"})).toBeVisible();
  await page.getByRole("link",{name:"Request access"}).click();await expect(page.getByRole("heading",{name:"Request access"})).toBeVisible();
  await expect(page.getByLabel("Requested department")).toBeVisible();
});
test("unauthenticated users cannot retrieve KPI data or enter the admin portal",async({page,request})=>{
  for(const url of ["/api/departments/hr","/api/departments/financial","/api/scorecard"]){const response=await request.get(url);expect(response.status(),url).toBe(401);}
  await page.goto("/admin");await expect(page).toHaveURL(/\/login$/);
});
// Opt-in only: uses a seeded local DEVELOPMENT admin. Never mutates Google Sheets.
test("development admin can read the department and scorecard pages",async({page})=>{
  const email=process.env.KPI_TEST_ADMIN_EMAIL,password=process.env.KPI_TEST_ADMIN_PASSWORD;
  test.skip(process.env.KPI_TEST_RUN_LIVE_READS!=="1"||!email||!password,"Supply local development admin credentials for live read checks.");
  await page.goto("/login");await page.getByLabel("Email",{exact:true}).fill(email!);await page.getByLabel("Password",{exact:true}).fill(password!);await page.getByRole("button",{name:"Sign in"}).click();await expect(page).toHaveURL(/\/admin$/, {timeout:30000});
  await page.goto("/admin/departments/hr");await expect(page.getByRole("heading",{name:"HR Dashboard"})).toBeVisible();await expect(page.getByRole("region",{name:"Records"})).toBeVisible({timeout:30000});
  await page.getByLabel("Show weeks").selectOption("all");await expect(page.getByText("Page 1 of",{exact:false})).toBeVisible();
  await page.getByRole("button",{name:"Details",exact:true}).first().click();await expect(page.getByRole("dialog")).toBeVisible();await page.getByRole("dialog").getByRole("button",{name:"Close",exact:true}).first().click();
  await page.goto("/admin/scorecard");await expect(page.getByRole("heading",{name:"KPI performance"})).toBeVisible({timeout:30000});
});

// Gmail App Password credentials are read only on the server.
export type GmailSmtpSettings={
  host:"smtp.gmail.com";port:465|587;user:string;password:string;from:string;
};
export function gmailSmtpSettings(env:Record<string,string|undefined>):GmailSmtpSettings|null{
  const user=(env.SMTP_USER??"").trim();
  const password=(env.SMTP_APP_PASSWORD??"").replace(/\s+/g,"");
  if(!user&&!password)return null;
  if(!user||!password)throw new Error("Gmail SMTP credentials are incomplete");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user))throw new Error("SMTP_USER must be an email address");
  if(password.length!==16)throw new Error("Google App Password must contain 16 characters");
  const host=(env.SMTP_HOST||"smtp.gmail.com").trim().toLowerCase();
  if(host!=="smtp.gmail.com")throw new Error("Only Gmail SMTP is supported by this configuration");
  const port=Number((env.SMTP_PORT||"465").trim());
  if(port!==465&&port!==587)throw new Error("SMTP_PORT must be 465 or 587");
  const from=(env.NOTIFY_FROM||user).trim();
  // Gmail rewrites foreign senders; use the authenticated account.
  if(from.toLowerCase()!==user.toLowerCase())throw new Error("NOTIFY_FROM must match SMTP_USER for Gmail");
  return {host:"smtp.gmail.com",port,user,password,from};
}

"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {api} from "./client";
export function Logout(){const r=useRouter(),[error,setError]=useState("");return <div><button className="secondary" onClick={async()=>{try{await api("/api/auth/logout","POST",{});r.replace("/login");r.refresh();}catch{setError("Sign out failed. Try again.");}}}>Sign out</button>{error&&<p role="alert">{error}</p>}</div>;}

"use client";
import {useEffect,useRef,useId,type ReactNode} from "react";

export function PortalDialog({title,description,children,onClose,busy=false,wide=false}:{title:string;description?:string;children:ReactNode;onClose:()=>void;busy?:boolean;wide?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  const titleId=useId(),descriptionId=useId();
  useEffect(()=>{const dialog=ref.current;if(!dialog)return;dialog.showModal();return()=>{dialog.close();};},[]);
  return <dialog ref={ref} className={`portal-dialog${wide?" portal-dialog-wide":""}`} aria-labelledby={titleId} aria-describedby={description?descriptionId:undefined} onCancel={event=>{event.preventDefault();if(!busy)onClose();}}>
    <div className="portal-dialog-heading"><div><h2 id={titleId}>{title}</h2>{description&&<p id={descriptionId} className="muted">{description}</p>}</div><button type="button" className="secondary" disabled={busy} onClick={onClose} aria-label="Close dialog">Close</button></div>
    {children}
  </dialog>;
}

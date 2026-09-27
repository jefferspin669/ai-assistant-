(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6255],{22861:(e,t,n)=>{Promise.resolve().then(n.bind(n,71502)),Promise.resolve().then(n.bind(n,67110))},67110:(e,t,n)=>{"use strict";n.d(t,{DocumentStudio:()=>m});var s=n(95155),a=n(12115),o=n(79771);function r(){return new Date().toISOString()}let i=["Proposal","Contract","Report","Letter","Invoice","Policy","Meeting Notes","Business Plan","Custom Document"],l="atlas-user-documents-v1";function c(){var e=[];try{let t=localStorage.getItem(l);if(!t)return e;return JSON.parse(t)}catch{return e}}function d(e){localStorage.setItem(l,JSON.stringify(e))}function u(e,t){let n=c(),s=n.findIndex(t=>t.id===e);return s<0?null:(n[s]={...n[s],...t,updatedAt:r()},d(n),n[s])}function m(){let[e,t]=(0,a.useState)(c()),[n,l]=(0,a.useState)("Proposal"),[m,p]=(0,a.useState)("Create a proposal for a website redesign for ABC Plumbing for $7,500."),[h,b]=(0,a.useState)(e[0]?.id??null),[f,x]=(0,a.useState)(null),j=e.find(e=>e.id===h)??e[0]??null;function N(){let e=c();t(e),!h&&e[0]&&b(e[0].id)}function y(e){var t;if(!j)return;let n=(t=j.body,"shorten"===e?t.split("\n").slice(0,6).join("\n")+"\n\n[Shortened by Atlas]":"professional"===e?t.replace(/\n\n/g,"\n\n").replace(/^/m,"Dear Client,\n\n")+"\n\nRespectfully,\nAtlas on behalf of your team":t+"\n\n[Rewritten for clarity by Atlas]");u(j.id,{body:n,status:"draft"}),N(),x(`Atlas ${"shorten"===e?"shortened":"professional"===e?"made it professional":"rewrote"} the document.`)}let v=(0,a.useMemo)(()=>i,[]);return(0,s.jsxs)("div",{className:"training-studio",children:[(0,s.jsxs)("section",{className:"panel",children:[(0,s.jsx)("h2",{children:"What do you want to create?"}),(0,s.jsx)("div",{className:"pack-grid",children:v.map(e=>(0,s.jsx)("button",{type:"button",className:n===e?"pack-chip active":"pack-chip",onClick:()=>l(e),children:(0,s.jsx)("strong",{children:e})},e))})]}),(0,s.jsxs)("section",{className:"panel",children:[(0,s.jsx)("h2",{children:"Describe your document"}),(0,s.jsx)("p",{className:"panel-lead",children:"Atlas uses customer memory, quotes, and project details when you mention a client — e.g. “Johnson Construction.”"}),(0,s.jsxs)("form",{className:"command-form",onSubmit:function(e){let t,s,a;e.preventDefault();let i=(t=m.match(/for\s+([A-Za-z][\w\s]+?)(?:\s+for|\s*$)/i),s=t?.[1]?.trim(),d([a={id:`doc-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,kind:n,title:m.slice(0,60)||`${n} draft`,body:function(e,t,n){let s,a=n?(s=n.toLowerCase(),o.yR.find(e=>e.name.toLowerCase().includes(s))):null,r=a?`${a.name}
${a.phone||"Contact on file"}
${a.email||""}

`:"",i=t.match(/\$[\d,]+(?:\.\d{2})?/),l=i?.[0]||"$7,500";switch(e){case"Proposal":return`${r}PROPOSAL — ${t}

Scope:
• Discovery and requirements review
• Design and implementation
• Testing and launch support

Total: ${l}
Valid 30 days.

Prepared by Atlas with customer history and pricing from your workspace.`;case"Contract":return`${r}SERVICE AGREEMENT

${t}

Terms: Net 15 \xb7 Warranty 90 days \xb7 Owner approval over ${l}.

Atlas pulled contact details and prior job notes into this draft.`;case"Invoice":return`${r}INVOICE

${t}

Amount due: ${l}
Due upon receipt.

Line items generated from Atlas Money and job records.`;case"Meeting Notes":return`MEETING NOTES

${t}

Decisions:
• Timeline confirmed
• Owners assigned

Action items captured for Project Manager.`;default:return`${r}${e.toUpperCase()}

${t}

— Drafted by Atlas Document Builder with business context.`}}(n,m,s),customerName:s,status:"draft",createdAt:r(),updatedAt:r()},...c()]),a);N(),b(i.id),x(`Generated ${i.kind} — edit, save, or export below.`)},children:[(0,s.jsx)("input",{value:m,onChange:e=>p(e.target.value),placeholder:"Create a proposal for…"}),(0,s.jsx)("button",{className:"btn btn-dark",type:"submit",children:"Generate"})]})]}),f?(0,s.jsxs)("div",{className:"memory-card",children:[(0,s.jsx)("div",{className:"label",children:"Atlas"}),(0,s.jsx)("p",{children:f})]}):null,j?(0,s.jsxs)("div",{className:"split",children:[(0,s.jsxs)("section",{className:"panel",children:[(0,s.jsx)("h2",{children:j.title}),(0,s.jsxs)("p",{className:"muted-line",children:[j.kind," \xb7 ",j.status,j.customerName?` \xb7 ${j.customerName}`:""]}),(0,s.jsx)("textarea",{className:"doc-editor",rows:14,value:j.body,onChange:e=>u(j.id,{body:e.target.value}),onBlur:()=>N()}),(0,s.jsxs)("div",{className:"cta-row",style:{marginTop:"0.75rem"},children:[(0,s.jsx)("button",{className:"btn btn-outline",type:"button",onClick:()=>y("rewrite"),children:"Rewrite"}),(0,s.jsx)("button",{className:"btn btn-outline",type:"button",onClick:()=>y("shorten"),children:"Shorten"}),(0,s.jsx)("button",{className:"btn btn-outline",type:"button",onClick:()=>y("professional"),children:"Make professional"}),(0,s.jsx)("button",{className:"btn btn-dark",type:"button",onClick:function(){j&&(u(j.id,{status:"ready"}),N(),x("Document saved and ready to share."))},children:"Save"}),(0,s.jsx)("button",{className:"btn btn-outline",type:"button",onClick:()=>x("PDF export queued (demo)."),children:"Download PDF"}),(0,s.jsx)("button",{className:"btn btn-outline",type:"button",onClick:()=>x("Word export queued (demo)."),children:"Download Word"}),(0,s.jsx)("button",{className:"btn btn-outline",type:"button",onClick:()=>x("Share link copied (demo)."),children:"Share"})]})]}),(0,s.jsxs)("section",{className:"panel",children:[(0,s.jsx)("h2",{children:"Your documents"}),(0,s.jsx)("div",{className:"list",children:e.map(e=>(0,s.jsxs)("button",{type:"button",className:j.id===e.id?"compliance-row active":"compliance-row",onClick:()=>b(e.id),children:[(0,s.jsx)("span",{className:"badge",children:e.kind}),(0,s.jsxs)("div",{children:[(0,s.jsx)("p",{children:(0,s.jsx)("strong",{children:e.title})}),(0,s.jsx)("small",{className:"muted-line",children:e.status})]})]},e.id))})]})]}):null]})}}},e=>{e.O(0,[9268,8500,4240,9771,4560,9997,1502,8441,3794,7358],()=>e(e.s=22861)),_N_E=e.O()}]);
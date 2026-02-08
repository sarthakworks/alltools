import{c as i}from"./createLucideIcon._FvKnKwF.js";import{r as o}from"./index.BR1w_nJd.js";/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],d=i("copy",s);function u(){const[t,e]=o.useState(null),c=o.useCallback((r,a)=>{navigator.clipboard.writeText(r),e(a),setTimeout(()=>e(null),2e3)},[]);return{copiedId:t,handleCopy:c}}export{d as C,u};

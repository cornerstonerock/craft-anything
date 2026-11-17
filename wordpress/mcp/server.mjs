import express from 'express';
import {createRemoteJWKSet,jwtVerify} from 'jose';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {createTools} from './tools.mjs';

function https(value) {
  const url=new URL(value);
  if(url.protocol!=='https:' || url.username || url.password || url.search || url.hash)
    throw Error('Configuration requires credential-free HTTPS URLs.');
  return url;
}
const resource=https(process.env.WPO_RESOURCE_URL);
if(resource.pathname!=='/mcp') throw Error('Resource URL must end in /mcp.');
const issuer=process.env.WPO_ISSUER;
https(issuer);
const keys=createRemoteJWKSet(https(process.env.WPO_JWKS_URL));
const sites=JSON.parse(process.env.WPO_SITES_JSON);
if (!Array.isArray(sites)) throw Error('Configure the site list.');
const ids=new Set();
for(const site of sites) {
  https(site.url);
  if(![site.id,site.subject,site.user,site.password].every(v=>typeof v==='string' && v.length) || site.user.includes(':'))
    throw Error('Invalid site configuration.');
  const key=JSON.stringify([site.subject,site.id]);
  if(ids.has(key)) throw Error('Duplicate site ID for customer.');
  ids.add(key);
}
const app=express();
app.disable('x-powered-by');
const metadata='/.well-known/oauth-protected-resource';
const scope='wordpress:operate';
app.get([metadata,metadata+'/mcp'],(_req,res)=>res.json({resource:resource.href,authorization_servers:[issuer],scopes_supported:[scope]}));
app.post('/mcp',async(req,res,next)=>{
  const challenge='Bearer resource_metadata="'+resource.origin+metadata+'", scope="'+scope+'"';
  const token=/^Bearer ([^ ]+)$/i.exec(req.get('authorization')||'')?.[1];
  if(!token) return res.set('WWW-Authenticate',challenge).sendStatus(401);
  try {
    const {payload}=await jwtVerify(token,keys,{issuer,audience:resource.href,algorithms:['RS256','ES256'],requiredClaims:['sub','exp']});
    if(typeof payload.sub!=='string' || !payload.sub) throw Error();
    if(typeof payload.scope!=='string' || !payload.scope.split(' ').includes(scope))
      return res.set('WWW-Authenticate',challenge+', error="insufficient_scope"').sendStatus(403);
    res.locals.subject=payload.sub;
  } catch {return res.set('WWW-Authenticate',challenge).sendStatus(401);}
  next();
},express.json({limit:'48kb'}),async(req,res)=>{
  const server=createTools(sites.filter(site=>site.subject===res.locals.subject));
  const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
  res.once('close',()=>{void server.close();});
  await server.connect(transport);
  await transport.handleRequest(req,res,req.body);
});
app.listen(Number(process.env.PORT || 8080),process.env.WPO_BIND || '127.0.0.1');

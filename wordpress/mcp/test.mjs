import test from 'node:test';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {sample} from '../../examples/wp-operations/core.mjs';
import {createTools} from './tools.mjs';

test('MCP client discovers a site, reviews a page and creates the approved draft', async () => {
  const [clientTransport,serverTransport]=InMemoryTransport.createLinkedPair();
  let created;
  const server=createTools([{id:'demo',url:'https://demo.example/',user:'fixture',password:'fixture'}],async(url,options)=>{
    if(url.searchParams.get('rest_route')==='/wp-operations/v1/site') return Response.json({protocol_version:1});
    if(options.method==='GET') return Response.json(created?[created]:[]);
    assert.equal(options.method,'POST');
    const payload=JSON.parse(options.body);
    assert.equal(payload.status,'draft');
    created={id:7,status:payload.status,slug:payload.slug};
    return Response.json(created,{status:201});
  });
  const client=new Client({name:'fixture',version:'1'});
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    assert.equal((await client.listTools()).tools.length,6);
    const run=(name,args)=>client.callTool({name,arguments:args});
    assert.equal((await run('inspect_site',{site:'other'})).isError,true);
    const args={site:'demo',project:sample};
    const review=JSON.parse((await run('review_draft',args)).content[0].text);
    assert.equal((await run('create_draft',{...args,approval:'0'.repeat(64)})).isError,true);
    assert.equal(created,undefined);
    const draft=await run('create_draft',{...args,approval:review.approval});
    assert.equal(JSON.parse(draft.content[0].text).id,7);
  } finally {await client.close();await server.close();}
});

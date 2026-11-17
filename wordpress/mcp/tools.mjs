import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {fields} from '../../examples/wp-operations/core.mjs';
import {prepare, sendDraft} from '../../examples/wp-operations/stage.mjs';

const projectSchema = z.object({
  version: z.literal(1),
  ...Object.fromEntries(Object.entries(fields).map(([name, [label, max]]) =>
    [name, z.string().min(1).max(max).describe(label)])),
});
const pending = new Map();
const reply = value => ({content: [{type:'text', text:JSON.stringify(value)}]});

export function createTools(sites, request = fetch) {
  const server = new McpServer({name:'wp-operations', version:'0.1.0'});
  const siteInput = {site: z.string().describe('Site ID from list_sites')};
  function lookup(id) {
    const site = sites.find(s => s.id === id);
    if (!site) throw new Error('Site is unavailable for this account.');
    return site;
  }
  async function read(site, route, params = {}) {
    const url = new URL(site.url);
    url.search = new URLSearchParams({rest_route:route,...params});
    const response = await request(url, {redirect:'error',signal:AbortSignal.timeout(15000),
      headers:{Authorization:'Basic ' + Buffer.from(site.user + ':' + site.password).toString('base64')}});
    if (!response.ok) throw new Error('Site request returned HTTP ' + response.status);
    return response.json();
  }
  async function connected(id) {
    const site = lookup(id);
    const info = await read(site,'/wp-operations/v1/site');
    if (info.protocol_version !== 1) throw new Error('WP Operations plugin verification failed.');
    return {site, info};
  }
  function register(name, description, inputSchema, readOnlyHint, handler) {
    server.registerTool(name,{description,inputSchema,annotations:{readOnlyHint,destructiveHint:false,openWorldHint:true}},
      async args => reply(await handler(args)));
  }
  register('list_sites','List WordPress sites connected to this account.',{},true,
    () => sites.map(({id,url})=>({id,url})));
  register('inspect_site','Verify plugin access and report site details.',siteInput,true,
    async ({site})=>(await connected(site)).info);
  register('find_pages','Find editable pages by title or keyword.',{...siteInput,search:z.string().max(150)},true,
    async ({site,search})=>read((await connected(site)).site,'/wp/v2/pages',{context:'edit',search,status:'any',per_page:'20',_fields:'id,title,status'}));
  register('read_page','Read an existing WordPress page before drafting changes.',{...siteInput,id:z.number().int().positive()},true,
    async ({site,id})=>read((await connected(site)).site,'/wp/v2/pages/'+id,{context:'edit',_fields:'id,title,content,status,modified_gmt'}));
  register('review_draft','Show proposed page and destination for review.',{...siteInput,project:projectSchema},true,
    ({site,project})=>{
      const draft=prepare(project,lookup(site).url);
      return {destination:draft.site.href,page:draft.payload,approval:draft.approval};
    });
  register('create_draft','After user approval, create the reviewed WordPress draft and return its editing link.',
    {...siteInput,project:projectSchema,approval:z.string().regex(/^[a-f0-9]{64}$/)},false,
    async ({site:id,project,approval})=>{
      const {site}=await connected(id);
      const draft=prepare(project,site.url);
      if (approval !== draft.approval) throw new Error('Review the changed draft first.');
      const key=JSON.stringify([site.url,site.user,approval]);
      if (pending.has(key)) return pending.get(key);
      // Keep requests on the configured origin, including sites using plain permalinks.
      const pagesRequest=(url, options)=>{
        const endpoint=new URL(site.url);
        endpoint.search=url.search;
        endpoint.searchParams.set('rest_route','/wp/v2/pages');
        return request(endpoint,options);
      };
      const write=sendDraft(draft,approval,{WP_STAGING_USER:site.user,WP_STAGING_APP_PASSWORD:site.password},pagesRequest);
      pending.set(key,write);
      try {return await write;} finally {pending.delete(key);}
    });
  return server;
}

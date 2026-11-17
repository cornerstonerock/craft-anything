// Optional UI smoke: requires Playwright and a locally served workbench.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.argv[2] || 'http://127.0.0.1:8765');
  await page.getByRole('button',{name:'Load sample'}).click();
  await page.locator('#handoff').waitFor({state:'visible'});
  await page.getByRole('button',{name:'Save locally'}).click();
  assert.equal(await page.locator('#saved option').count(),2);
  await page.getByRole('button',{name:'Mobile',exact:true}).click();
  assert.equal(await page.locator('#preview').evaluate(e=>e.style.width),'390px');
  const frame=page.frameLocator('#preview');
  await frame.getByRole('heading',{name:'A stronger first impression starts at home'}).waitFor();
  assert.equal(await frame.locator('form,input').count(),0);
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Concept HTML'}).click();
  assert.ok((await downloadPromise).suggestedFilename().endsWith('.html'));
  await page.getByRole('button',{name:'Desktop',exact:true}).click();
  if(process.env.STUDIO_SCREENSHOTS) await page.screenshot({path:process.env.STUDIO_SCREENSHOTS+'-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(process.env.STUDIO_SCREENSHOTS) await page.screenshot({path:process.env.STUDIO_SCREENSHOTS+'-mobile.png',fullPage:true});
  await page.locator('[name=company]').fill('Changed name');
  assert.equal(await page.locator('#handoff').isVisible(),false);
  await page.locator('#file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":99}')});
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('version 1'));
  assert.deepEqual(errors,[]);
  console.log('Browser smoke passed: sample, save, viewport switch, preview, download, mobile width, stale-state invalidation and invalid import; no page errors.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

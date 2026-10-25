import test from 'node:test';
import assert from 'node:assert/strict';
import {collectFeed,normalizeFeed,validReply,METIS_ORIGIN} from '../../public/oren-feed-model.mjs';
test('allowlist excludes secrets and bodies, keeps source and dates',()=>{
 const feed=collectFeed(k=>k==='metis-oren-v3-private'?JSON.stringify({token:'secret',tasks:[{id:'t',title:'Test',details:'private'}],events:[{id:'e',title:'Meeting',date:'2026-10-25'}],mails:[{id:'m',title:'Subject',text:'body',state:'Person <person@example.org>',date:1}]}):null);
 assert.equal(feed.items.length,3);assert.equal(feed.items[1].date,'2026-10-25');assert.equal(feed.items[2].email,'person@example.org');assert.doesNotMatch(JSON.stringify(feed),/secret|private|body/);
});
test('deduplication, invalid sources and unsafe links',()=>{
 const item={source:'MÉTIS',kind:'task',id:'1',title:'A',url:'javascript:alert(1)'};
 const f=normalizeFeed({app:'OREN',version:1,items:[item,item,{...item,source:'FAKE'}]});assert.equal(f.items.length,1);assert.equal(f.items[0].url,'');
 assert.throws(()=>normalizeFeed({version:1,items:[]}));
});
test('receiver authenticates origin, popup and one-time nonce',()=>{
 const popup={},e={origin:METIS_ORIGIN,source:popup,data:{type:'oren:feed',nonce:'n'}};
 assert.equal(validReply(e,popup,'n'),true);
 for(const bad of [{...e,origin:'https://evil.example'},{...e,source:{}},{...e,data:{type:'oren:feed',nonce:'wrong'}}])assert.equal(validReply(bad,popup,'n'),false);
 assert.equal(validReply(e,null,'n'),false);
});
test('empty source stays empty; corrupt storage is surfaced',()=>{
 assert.equal(collectFeed(()=>null).items.length,0);
 assert.throws(()=>collectFeed(()=>'{bad'));
});

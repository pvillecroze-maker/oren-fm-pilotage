// Server-side only. Never import this module into browser code.
export function fiveDayWindow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const value = type => parts.find(p => p.type === type).value;
  const end = value('year')+'-'+value('month')+'-'+value('day');
  const start = new Date(end+'T12:00:00Z'); start.setUTCDate(start.getUTCDate()-4);
  return {start:start.toISOString().slice(0,10),end};
}
export async function readFacebookPosts({pageId, token, version, fetchImpl=fetch, now=new Date(), maxPages=20}) {
  if (!/^\d+$/.test(pageId||'')) throw new Error('META_PAGE_ID_REQUIRED');
  if (!token) throw new Error('META_ACCESS_TOKEN_REQUIRED');
  if (!/^v\d+\.\d+$/.test(version||'')) throw new Error('META_GRAPH_VERSION_REQUIRED');
  if (!Number.isInteger(maxPages)||maxPages<1||maxPages>100) throw new Error('INVALID_PAGE_LIMIT');
  const window=fiveDayWindow(now), posts=[], seen=new Set(); let after;
  // Query one extra day, then filter calendar dates in Europe/Paris exactly.
  const since = Math.floor(Date.parse(window.start+'T00:00:00Z')/1000)-86400;
  for(let page=0;page<maxPages;page++){
    const url=new URL('https://graph.facebook.com/'+version+'/'+pageId+'/posts');
    url.searchParams.set('fields','id,message,created_time,permalink_url');
    url.searchParams.set('limit','100'); url.searchParams.set('since',String(since));
    if(after)url.searchParams.set('after',after);
    const response=await fetchImpl(url.toString(),{headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error('META_HTTP_'+response.status);
    const result=await response.json();
    if(result.error||!Array.isArray(result.data))throw new Error('META_INVALID_RESPONSE');
    for(const item of result.data){
      const d=new Date(item.created_time); if(!Number.isFinite(d.getTime()))continue;
      const day=fiveDayWindow(d).end;
      if(day<window.start||day>window.end||seen.has(item.id))continue;
      seen.add(item.id);
      const link=typeof item.permalink_url==='string' && /^https:\/\/(?:www\.)?facebook\.com\//.test(item.permalink_url)?item.permalink_url:null;
      posts.push({id:item.id,date:item.created_time,text:item.message||'',url:link,source:pageId});
    }
    if(!result.paging?.next)return {posts,window,windowDays:5,partial:false,fetchedAt:now.toISOString()};
    const next=result.paging?.cursors?.after;
    if(!next||next===after)return {posts,window,windowDays:5,partial:true,fetchedAt:now.toISOString()};
    after=next;
  }
  return {posts,window,windowDays:5,partial:true,fetchedAt:now.toISOString()};
}

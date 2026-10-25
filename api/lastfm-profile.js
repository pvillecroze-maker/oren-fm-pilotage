export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Méthode non autorisée'});
 const username=String(req.query?.user||'').trim();
 if(!/^[A-Za-z0-9_-]{2,60}$/.test(username))return res.status(400).json({error:'Identifiant Last.fm invalide'});
 const key=process.env.LASTFM_API_KEY;
 if(!key)return res.status(503).json({error:'Last.fm non configuré : ajouter LASTFM_API_KEY dans Vercel.'});
 async function read(method,params={}){
  const u=new URL('https://ws.audioscrobbler.com/2.0/');
  for(const [k,v] of Object.entries({method,user:username,api_key:key,format:'json',limit:100,...params}))u.searchParams.set(k,String(v));
  const response=await fetch(u,{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('Last.fm HTTP '+response.status);
  const data=await response.json();
  if(data.error)throw Error(data.message||'Erreur Last.fm');
  return data;
 }
 try{
  const [artistsData,tracksData]=await Promise.all([read('user.getTopArtists',{period:'12month'}),read('user.getTopTracks',{period:'12month'})]);
  const artists=(artistsData.topartists?.artist||[]).map(a=>({name:String(a.name||'').slice(0,120),playcount:Number(a.playcount||0)})).filter(a=>a.name);
  const tracks=(tracksData.toptracks?.track||[]).map(t=>({title:String(t.name||'').slice(0,160),artist:String(t.artist?.name||'').slice(0,120)})).filter(t=>t.title&&t.artist);
  return res.status(200).json({username,period:'12month',artists,tracks,updatedAt:new Date().toISOString()});
 }catch(err){return res.status(502).json({error:'Lecture Last.fm impossible : '+String(err.message||err).slice(0,150)})}
}

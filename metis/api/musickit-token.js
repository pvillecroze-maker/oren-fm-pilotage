'use strict';
// Vercel Function: token de développeur Apple Music signé serveur. Ne jamais mettre
// la clé .p8 ni le Team ID privé dans le JavaScript du navigateur.
const crypto=require('node:crypto');
const base64url=(s)=>Buffer.from(s).toString('base64url');
async function handler(event){
 if(event.httpMethod!=='GET')return{statusCode:405,body:'Méthode non autorisée'};
 const team=process.env.APPLE_MUSIC_TEAM_ID;
 const keyId=process.env.APPLE_MUSIC_KEY_ID;
 const privateKey=process.env.APPLE_MUSIC_PRIVATE_KEY?.replace(/\\n/g,'\n');
 if(!team||!keyId||!privateKey)return{statusCode:503,headers:{'Cache-Control':'no-store'},body:JSON.stringify({error:'MusicKit non configuré : renseigner les variables serveur.'})};
 try{
  const now=Math.floor(Date.now()/1000);
  const claims={iss:team,iat:now,exp:now+24*60*60};
  // L'origine doit être configurée par l'opérateur, et non choisie par le visiteur.
  if(process.env.SILLAGE_PUBLIC_ORIGIN)claims.origin=[process.env.SILLAGE_PUBLIC_ORIGIN.replace(/\/$/,'')];
  const message=base64url(JSON.stringify({alg:'ES256',kid:keyId,typ:'JWT'}))+'.'+base64url(JSON.stringify(claims));
  const signature=crypto.sign('sha256',Buffer.from(message),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
  const developerToken=message+'.'+signature;
  return{statusCode:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'},body:JSON.stringify({developerToken,expiresAt:new Date((now+24*60*60)*1000).toISOString()})};
 }catch(err){return{statusCode:500,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({error:'Configuration MusicKit invalide.'})};}
};

module.exports=async function(req,res){const result=await handler({httpMethod:req.method});for(const [key,value] of Object.entries(result.headers||{}))res.setHeader(key,value);res.status(result.statusCode).send(result.body);};

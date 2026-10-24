import test from 'node:test';
import assert from 'node:assert/strict';
import {personId,makeGraph,validateRelation} from '../src/network-model.js';
const a={'First Name':'Personne A','Organization Name':'Atelier','E-mail 1 - Value':'a@example.test'};
const b={'First Name':'Personne B','Organization Name':'Atelier','E-mail 1 - Value':'b@example.test'};
test('Shared organization does not invent interpersonal influence',()=>{
 const g=makeGraph([a,b]);assert.equal(g.edges.length,2);assert(g.edges.every(e=>e.kind==='organization'));assert(g.nodes.filter(n=>n.kind==='person').every(n=>n.degree===0));
});
test('Only documented relations contribute to displayed centrality',()=>{
 const edge={from:personId(a),to:personId(b),source:'Réunion datée',status:'unverified'};
 assert.equal(makeGraph([a,b],[edge]).nodes[0].degree,0);
 assert.equal(makeGraph([a,b],[{...edge,status:'documented'}]).nodes[0].degree,1);
});
test('Filtered views have no dangling edges',()=>{
 const g=makeGraph([a,b],[{from:personId(a),to:personId(b),status:'documented'}],{query:'Personne A'});
 assert(g.edges.every(e=>g.nodes.some(n=>n.id===e.from)&&g.nodes.some(n=>n.id===e.to)));
});
test('Reject self-links and unsourced relations',()=>{
 assert.throws(()=>validateRelation({from:personId(a),to:personId(a),source:'test',status:'documented'},[a,b]));
 assert.throws(()=>validateRelation({from:personId(a),to:personId(b),source:'',status:'documented'},[a,b]));
});
test('Contact identity survives reordered imports',()=>{
 assert.equal(personId(a),personId({...a,'E-mail 1 - Value':'A@EXAMPLE.TEST'}));
 assert.equal(makeGraph([a,a,b]).visible,2);
});

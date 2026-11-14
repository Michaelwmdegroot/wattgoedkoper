import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveContextEntry} from '../assets/context-entry.mjs';
test('only public, exact, non-identifying fragments open explanations',()=>{
  assert.deepEqual(resolveContextEntry('#verken-zonnepanelen'),{kind:'upgrade',id:'solar'});
  assert.deepEqual(resolveContextEntry('#verken-thuisbatterij'),{kind:'upgrade',id:'battery'});
  assert.deepEqual(resolveContextEntry('#verken-energieplan'),{kind:'plan'});
  for(const unsafe of ['#advies','#verken-zonnepanelen?email=x','#verken-zonnepanelen&postcode=1234','#verken-zonnepanelen%00','#verken-evil','#verken-zonnepanelen/','',null,{},undefined]){
    assert.equal(resolveContextEntry(unsafe),null,String(unsafe));
  }
});
test('all five public measure fragments are supported',()=>{
  for(const fragment of ['zonnepanelen','thuisbatterij','slim-verbruik','isolatie','warmtepomp']){
    assert.equal(resolveContextEntry('#verken-'+fragment)?.kind,'upgrade');
  }
});

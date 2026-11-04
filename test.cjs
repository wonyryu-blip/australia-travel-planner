const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const ctx=vm.createContext({console,localStorage:{getItem:()=>null}});
vm.runInContext(source.slice(0,source.indexOf('function toast'))+source.slice(source.indexOf('function safeURL'),source.indexOf('function notFound'))+source.slice(source.indexOf('function validate'),source.indexOf("$('#editor').onsubmit"))+`;globalThis.api={seed,validate,total,dateFor,krw,esc,safeURL,setData:x=>data=x};`,ctx);
const a=ctx.api,copy=()=>JSON.parse(JSON.stringify(a.seed));let tests=0;
function test(name,fn){fn();tests++;console.log('PASS '+name);}
test('Seed references and values validate',()=>a.validate(copy()));
test('7 days, 14 events, 6 bookings, 6 expenses',()=>assert.deepEqual([a.seed.days.length,a.seed.events.length,a.seed.bookings.length,a.seed.expenses.length],[7,14,6,6]));
test('Mixed-currency total is KRW 3,406,500; bookings not counted again',()=>assert.equal(a.total(),3406500));
test('Day 7 resolves to 2027-04-16',()=>assert.equal(a.dateFor('d7'),'2027-04-16'));
test('Moving start date across month shifts all days',()=>{const d=copy();d.trip.start='2027-04-28';a.setData(d);assert.equal(a.dateFor('d7'),'2027-05-04');a.setData(copy());});
test('Reject missing day reference',()=>{const d=copy();d.events[0].dayId='missing';assert.throws(()=>a.validate(d));});
test('Reject duplicate IDs',()=>{const d=copy();d.expenses[1].id=d.expenses[0].id;assert.throws(()=>a.validate(d));});
test('Reject negative money',()=>{const d=copy();d.expenses[0].amount=-1;assert.throws(()=>a.validate(d));});
test('Reject zero exchange rate',()=>{const d=copy();d.trip.rate=0;assert.throws(()=>a.validate(d));});
test('Reject impossible date and time',()=>{const d=copy();d.trip.start='2027-02-30';assert.throws(()=>a.validate(d));const e=copy();e.events[0].time='25:00';assert.throws(()=>a.validate(e));});
test('Reject executable reservation URL',()=>{const d=copy();d.bookings[0].url='javascript:alert(1)';assert.throws(()=>a.validate(d));});
test('Escape user-supplied HTML',()=>assert.equal(a.esc('<img src=x>'),'&lt;img src=x&gt;'));
console.log(`${tests} checks passed.`);


import { emptyTables, type Row, type EntityName, type DataMap, type Snapshot } from '../domain/types';
import { today } from '../domain/logic';
export const DEMO_USER='00000000-0000-4000-8000-000000000001';
export const DEMO_PARTNER='00000000-0000-4000-8000-000000000002';
export function makeDemo():Snapshot {
 const space='demo-space',now=new Date().toISOString(), tables=emptyTables();
 const next=new Date(today()+'T12:00:00+07:00');next.setUTCDate(next.getUTCDate()+3);
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(next);
 function add<K extends EntityName>(kind:K,id:string,data:DataMap[K],plan_id:string|null=null){const row={id,space_id:space,author_id:DEMO_USER,plan_id,item_id:null,data,version:1,created_at:now,updated_at:now} as Row<K>; (tables[kind] as Row<K>[]).push(row);}
 add('plans','demo-picnic',{title:'A little picnic, a lot of us',date,start:'15:00',end:'19:00',location:'Jakarta Selatan',budget:350000,share:50,status:'terjadwal',note:'Sore yang pelan, cerita yang panjang, dan kamu. Jangan lupa bawa kamera ya ♡',rain:'Kalau hujan, pindah ke coffee shop favorit kita.'});
 add('activities','demo-coffee',{title:'Coffee & catch-up',start:'15:00',end:'16:00',place:'Coffee shop favorit',address:'Jakarta Selatan',maps:'',category:'Kuliner',estimate:90000,actual:0,paidFirst:0,position:0,done:false,note:'Dua iced latte, satu cerita panjang.'},'demo-picnic');
 add('activities','demo-picnic-stop',{title:'Golden hour picnic',start:'16:15',end:'17:45',place:'Taman Literasi Martha Christina Tiahahu',address:'Blok M, Jakarta',maps:'',category:'Outdoor',estimate:120000,actual:0,paidFirst:0,position:1,done:false,note:'Bawa alas duduk dan snack favorit.'},'demo-picnic');
 add('activities','demo-dinner',{title:'Dinner for two',start:'18:00',end:'19:00',place:'Blok M',address:'Jakarta Selatan',maps:'',category:'Kuliner',estimate:140000,actual:0,paidFirst:0,position:2,done:false,note:'Pilih tempatnya bareng-bareng.'},'demo-picnic');
 add('checklist_items','demo-check-1',{title:'Kamera & baterai penuh',done:true,assignee:DEMO_USER},'demo-picnic');
 add('checklist_items','demo-check-2',{title:'Alas piknik dan snack',done:false,assignee:DEMO_PARTNER},'demo-picnic');
 add('wishlist_items','demo-wish-1',{title:'Pottery date',category:'Seni',estimate:250000,place:'Jakarta',note:'Bikin mug yang bentuknya sedikit aneh, tapi penuh cinta.'});
 add('wishlist_items','demo-wish-2',{title:'Bookstore hopping',category:'Santai',estimate:100000,place:'Jakarta',note:'Pilih satu buku untuk satu sama lain.'});
 add('wishlist_items','demo-wish-3',{title:'Sunset & gelato',category:'Kuliner',estimate:80000,place:'Jakarta',note:'Dua rasa favorit, satu sore yang manis.'});
 return {space:{id:space,name:'Our little world',sweet_note:'Sama kamu, hari biasa pun jadi istimewa.',created_by:DEMO_USER,version:1},members:[{user_id:DEMO_USER,space_id:space,nickname:'Kamu',slot:1},{user_id:DEMO_PARTNER,space_id:space,nickname:'Dia',slot:2}],tables};
}

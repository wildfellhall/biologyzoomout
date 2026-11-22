import {createSearchIndex,searchEntries,searchHref} from './search-index.js';
import {esc} from './node-detail.js';
import './search.css';

export function createSearch({molecules,ontology,context}){
 const entries=createSearchIndex(molecules,ontology),dialog=document.createElement('dialog');
 dialog.id='search-dialog';dialog.setAttribute('aria-labelledby','search-title');
 const categories=[['all','All'],['models','Models'],['lessons','Lessons'],['paths','Pathways'],['nodes','Concepts']];
 dialog.innerHTML=`<div class="search-heading"><h2 id="search-title">Search Biology Zoomout</h2><button id="search-close" class="icon-button" aria-label="Close search">×</button></div><label class="search-input"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg><span class="sr-only">Find a molecule, organelle, or topic</span><input id="global-search-input" type="search" placeholder="Molecule, organelle, or topic" autocomplete="off" spellcheck="false"></label><div class="search-categories" role="group" aria-label="Search category">${categories.map(([id,name])=>`<button data-search-kind="${id}" aria-pressed="${id==='all'}">${name}</button>`).join('')}</div><p id="search-count" role="status"></p><div id="search-results"></div>`;
 document.body.append(dialog);
 const input=dialog.querySelector('input'),results=dialog.querySelector('#search-results');let kind='all';
 function render(){
  const query=input.value.trim(),matches=searchEntries(entries,query,kind);
  const shown=query||kind!=='all'?matches:entries.filter(e=>e.kind==='models'&&['rough-er','smooth-er','golgi','dna','mitotic-cell','meiotic-cell'].includes(e.id));
  dialog.querySelector('#search-count').textContent=query||kind!=='all'?`${matches.length} result${matches.length===1?'':'s'}`:'Explore a model';
  const limit=kind==='all'?6:shown.length;
  results.innerHTML=categories.slice(1).map(([id,name])=>{
   const group=shown.filter(e=>e.kind===id);if(!group.length)return '';
   return `<section aria-label="${name}"><h3>${name}</h3>${group.slice(0,limit).map(e=>`<a class="search-result" href="${esc(searchHref(e,molecules,context()))}"><span><strong>${esc(e.title)}</strong><small>${esc(e.detail)}</small></span><span aria-hidden="true">↗</span></a>`).join('')}${group.length>limit?`<button class="search-more" data-search-kind="${id}">Show all ${name.toLowerCase()} (${group.length}) →</button>`:''}</section>`;
  }).join('')||'<p class="search-empty">No matches. Try “Golgi”, “amino acid”, or a topic number.</p>';
  results.scrollTop=0;
 }
 function open(){if(dialog.open)return;render();dialog.showModal();input.focus();input.select();}
 input.addEventListener('input',render);
 dialog.querySelector('#search-close').onclick=()=>dialog.close();
 dialog.addEventListener('click',event=>{
  const category=event.target.closest('[data-search-kind]');
  if(category){kind=category.dataset.searchKind;for(const b of dialog.querySelectorAll('.search-categories button'))b.setAttribute('aria-pressed',String(b.dataset.searchKind===kind));render();input.focus();}
  if(event.target.closest('.search-result'))dialog.close();
  if(event.target===dialog){const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();}
 });
 dialog.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dialog.close();return;}
  const links=[...results.querySelectorAll('a')],index=links.indexOf(document.activeElement);
  if(event.key==='ArrowDown'&&(document.activeElement===input||index>=0)){event.preventDefault();links[Math.min(index+1,links.length-1)]?.focus();}
  if(event.key==='ArrowUp'&&index>=0){event.preventDefault();(index?links[index-1]:input).focus();}
  if(event.key==='Enter'&&event.target===input&&input.value.trim()){event.preventDefault();links[0]?.click();}
 });
 document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||document.querySelector('dialog[open]'))return;
  if((event.key==='k'&&(event.metaKey||event.ctrlKey))||(event.key==='/'&&!event.target.closest('input,textarea,select,[contenteditable=true]'))){event.preventDefault();open();}
 });
 window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close();});
 return {open};
}

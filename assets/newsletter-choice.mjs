// A mail client fetching the link cannot confirm or unsubscribe someone.
// The opaque 64-char token only lives in the URL fragment, never in a GET log.
const title=document.querySelector('#choice-title');
const text=document.querySelector('#choice-text');
const button=document.querySelector('#choice-button');
const error=document.querySelector('#choice-error');
const result=document.querySelector('#choice-result');
const hash=location.hash.slice(1);
const [key,token='']=hash.split('=',2);
const choice=key==='bevestig'?'confirm':key==='afmelden'?'unsubscribe':null;
const valid=choice&&/^[a-f0-9]{64}$/.test(token);
if(!valid){
  title.textContent='Deze link is niet geldig.';
  text.textContent='Open de originele link uit de e-mail opnieuw of neem contact op via info@wattgoedkoper.nl.';
}else{
  const unsubscribe=choice==='unsubscribe';
  title.textContent=unsubscribe?'Afmelden voor energietips.':'Bevestig je aanmelding.';
  text.textContent=unsubscribe
    ? 'Je kunt je gratis uitschrijven voor energietips en NIVO-aanbiedingen. Dit verandert niets aan je eerdere rapport of adviesverzoeken.'
    : 'Je hebt gevraagd om ongeveer maandelijks energiebespaartips en af en toe NIVO-aanbiedingen van WattGoedkoper te ontvangen. Alleen na deze bevestiging kom je op de lijst. Gratis afmelden kan altijd.';
  button.textContent=unsubscribe?'Ja, schrijf mij uit':'Ja, bevestig mijn aanmelding';
  button.hidden=false;
}
button.addEventListener('click',async()=>{
  if(!valid)return;
  button.disabled=true;button.textContent='Je keuze verwerken…';
  error.hidden=true;
  try{
    const initial=await fetch('/api/index.php?action=session',{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
    const session=await initial.json();
    if(!initial.ok||!session.ok||!session.csrf)throw Error('We kunnen je keuze nu niet verwerken. Probeer het later.');
    const action=choice==='confirm'?'newsletter_confirm':'newsletter_unsubscribe';
    const response=await fetch('/api/index.php?action='+action,{
      method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json','X-CSRF-Token':session.csrf,Accept:'application/json'},
      body:JSON.stringify({token})
    });
    const data=await response.json();
    if(!response.ok||!data.ok)throw Error(data.error?.message||'Deze link kon niet worden verwerkt.');
    button.hidden=true;
    title.textContent=choice==='confirm'?'Je bent aangemeld.':'Je bent afgemeld.';
    result.textContent=choice==='confirm'
      ? 'Je ontvangt nu alleen de e-mails waarvoor je bewust hebt gekozen. Elke toekomstige nieuwsbrief bevat een afmeldlink.'
      : 'Je e-mailadres is uit de actieve mailinglijst verwijderd. Je blijft je gratis energieplan gewoon gebruiken.';
    result.hidden=false;
    history.replaceState(null,'',location.pathname);
  }catch(e){error.textContent=e.message;error.hidden=false;button.disabled=false;button.textContent=choice==='confirm'?'Probeer bevestiging opnieuw':'Probeer afmelden opnieuw';}
});

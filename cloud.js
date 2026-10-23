/* Cloud sync for the GitHub Pages site: Firebase (Google sign-in + Firestore).
   Exposes the same small interface the app already uses (claude.use('db'|'user')),
   so progress is stored per person at data/users/<uid>/<key>. Inactive until fb-config.js has a config. */
(function(){
  var cfg=window.FB_CONFIG; if(!cfg||!cfg.apiKey) return;
  var V='10.12.2', base='https://www.gstatic.com/firebasejs/'+V+'/';
  function load(src){return new Promise(function(ok,no){var s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
  var ready=load(base+'firebase-app-compat.js')
    .then(function(){return Promise.all([load(base+'firebase-auth-compat.js'),load(base+'firebase-firestore-compat.js')])})
    .then(function(){
      firebase.initializeApp(cfg);
      var auth=firebase.auth(), fs=firebase.firestore();
      try{fs.enablePersistence({synchronizeTabs:true}).catch(function(){})}catch(e){}
      auth.getRedirectResult().catch(function(){});
      return new Promise(function(res){var first=true;
        auth.onAuthStateChanged(function(u){if(first){first=false;res({auth:auth,fs:fs,u:u})}else location.reload()})});
    }).catch(function(){return {u:null}});
  function code(e){return e&&e.code==='permission-denied'?'invalid_argument':(e&&e.code==='resource-exhausted'?'quota_exceeded':'unavailable')}
  window.claude={site:true,use:function(n){return ready.then(function(c){
    if(!c.u)return null;
    if(n==='db')return {doc:function(p){var r=c.fs.doc(p);return {
      get:function(){return r.get().then(function(s){return {exists:s.exists,data:function(){return s.data()}}})},
      set:function(d){return r.set(d).catch(function(e){throw {code:code(e)}})}}}};
    if(n==='user')return {id:function(){return Promise.resolve(c.u.uid)},isOwner:function(){return false},
      me:function(){return Promise.resolve({id:c.u.uid,name:c.u.displayName||c.u.email||''})}};
    return null})}};
  function chip(){return document.getElementById('sync')}
  function signIn(){ready.then(function(c){if(!c.auth)return;var p=new firebase.auth.GoogleAuthProvider();
    c.auth.signInWithPopup(p).catch(function(e){if(e&&/popup|operation-not-supported|web-storage/.test(e.code||''))c.auth.signInWithRedirect(p)})})}
  function signOut(){ready.then(function(c){if(!c.auth)return;
    if(!confirm('Hesabdan çıxılsın? İrəliləyişin buludda qalır.'))return;
    try{var id=localStorage.getItem('cia-p2-v1:uid');Object.keys(localStorage).forEach(function(k){if((id&&k.indexOf('cia-p2-v1:'+id+':')===0)||k==='cia-p2-v1:uid')localStorage.removeItem(k)})}catch(e){}
    c.auth.signOut()})}
  function wire(){var el=chip();if(!el)return setTimeout(wire,200);
    el.style.cursor='pointer';
    ready.then(function(c){
      if(!c.u){el.textContent='Daxil ol';el.title='Google hesabı ilə daxil ol: irəliləyiş bütün cihazlarda eyni olsun';el.classList.add('login')}
      else el.title=(c.u.email||'')+' — çıxmaq üçün toxun';
      el.addEventListener('click',function(){c.u?signOut():signIn()})})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();

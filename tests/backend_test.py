#!/usr/bin/env python3
"""Meaningful integration checks using a temporary private store and an actual PHP server.
Run: python tests/backend_test.py --php /path/to/php
No real contact details or production configuration are read or written.
"""
import argparse, copy, http.cookiejar, json, os, pathlib, secrets, socket, sqlite3, subprocess, tempfile, time, urllib.error, urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--php',default='php');args=parser.parse_args()
checks=0

def check(condition,label):
    global checks
    if not condition: raise AssertionError(label)
    checks+=1
    print('PASS',label)

with tempfile.TemporaryDirectory(prefix='wg-backend-') as temporary:
    private=pathlib.Path(temporary)/'private'
    with socket.socket() as s: s.bind(('127.0.0.1',0));port=s.getsockname()[1]
    origin=f'http://127.0.0.1:{port}'
    env=dict(os.environ,WG_PRIVATE_DIR=str(private))
    log=open(pathlib.Path(temporary)/'server.log','w+')
    server=subprocess.Popen([args.php,'-S',f'127.0.0.1:{port}','scripts/router.php'],cwd=ROOT,env=env,stdout=log,stderr=log)
    jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    def request(action='',data=None,csrf=None,custom_origin=None,raw=None,path=None,content_type='application/json'):
        url=origin+(path if path else '/api/index.php?action='+action)
        headers={}
        body=None
        if data is not None or raw is not None:
            body=raw if raw is not None else json.dumps(data).encode()
            headers={'Content-Type':content_type,'Origin':origin if custom_origin is None else custom_origin}
            if csrf is not None: headers['X-CSRF-Token']=csrf
        req=urllib.request.Request(url,body,headers)
        try: response=client.open(req,timeout=8)
        except urllib.error.HTTPError as error: response=error
        content=response.read();ctype=response.headers.get('Content-Type','')
        value=json.loads(content) if 'application/json' in ctype else content.decode('utf-8-sig')
        return response.status,value,response.headers
    def clear_limits():
        with sqlite3.connect(private/'wattgoedkoper.sqlite') as db: db.execute('DELETE FROM rate_limits')
    try:
        for _ in range(100):
            try: request('health');break
            except Exception: time.sleep(.05)
        code,data,_=request('health');check(code==200 and data['configured'] is False,'unconfigured health reports unavailable lead storage')
        code,data,headers=request('session');check(code==200 and data['csrf'] is None and 'Set-Cookie' not in headers,'unconfigured session does not create a cookie')
        check(request('admin_stats')[0]==503,'unconfigured admin fails closed')
        password=secrets.token_urlsafe(24)
        setup=subprocess.run([args.php,'scripts/setup.php','--origin='+origin,'--username=wgtest'],input=password+'\n',text=True,env=env,cwd=ROOT,capture_output=True)
        check(setup.returncode==0 and password not in setup.stdout+setup.stderr,'setup initializes encrypted private storage without printing password')
        check((private/'config.php').stat().st_mode&0o777==0o600,'private configuration has owner-only mode')
        second=subprocess.run([args.php,'scripts/setup.php','--origin='+origin,'--username=wgtest'],input=password+'\n',text=True,env=env,cwd=ROOT,capture_output=True)
        check(second.returncode!=0,'setup refuses to overwrite existing credentials')
        for path in ['/lib/bootstrap.php','/scripts/setup.php','/.git/config','/docs/frontend-contract.md']:
            check(request(path=path)[0]==404,'development router blocks '+path)
        check(request('health')[1]['configured'] is True,'configured health reports readiness')
        code,session,headers=request('session');csrf=session['csrf']
        check(code==200 and len(csrf)==64,'functional session issues unpredictable CSRF token')
        check('HttpOnly' in headers.get('Set-Cookie','') and 'SameSite=Strict' in headers.get('Set-Cookie',''),'session cookie is HttpOnly and SameSite Strict')
        check(request('admin_leads')[0]==401,'unauthenticated lead access rejected')
        base={'idempotencyKey':secrets.token_hex(16),'name':'=1+1','email':'consumer@example.test','phone':'','postcode':'2311 AB','partner':'nivo','interests':['battery'],'consent':True,'consentVersion':'2026-11-v2','website':'','analyticsConsent':False,'inputs':{'people':3,'electricityUse':3500,'hasSolar':True,'unapprovedPrivateField':'must-not-store'},'summary':{'modelVersion':'test-v1','year':2027,'annualSavingsLow':100,'annualSavingsHigh':250},'note':'Integration test only'}
        check(request('leads',base)[0]==403,'missing CSRF rejected')
        disabled_report={'email':'report@example.test','idempotencyKey':secrets.token_hex(16),'website':'','report':{}}
        code,denied_report,_=request('report_email',disabled_report,csrf=None)
        check(code==403,'report route requires CSRF even when disabled')
        check(request('leads',base,csrf,custom_origin='https://attacker.example')[0]==403,'cross-origin submission rejected')
        check(request('leads',base,csrf,content_type='text/plain')[0]==415,'non-JSON form rejected')
        check(request('leads',csrf=csrf,raw=b'x'*17000)[0]==413,'oversized submission rejected')
        check(request('leads',base,csrf)[0]==429,'instant bot submission rejected')
        code,disabled_report_response,_=request('report_email',disabled_report,csrf)
        check(code==503 and disabled_report_response['error']['code']=='REPORT_MAIL_DISABLED','report endpoint fails closed before Hostinger setup')
        time.sleep(2.1)
        cases=[('missing consent',{'consent':False}),('outdated consent',{'consentVersion':'old'}),('reject historic partner choice',{'partner':'tbt'}),('invalid email',{'email':'invalid'}),('phone without digits',{'phone':'()()()()'}),('honeypot',{'website':'spam'}),('nested scan values',{'inputs':{'people':{'bad':'value'}}}),('invalid summary',{'summary':{'annualSavingsLow':'NaN'}})]
        for label,patch in cases:
            clear_limits();invalid={**base,**patch};check(request('leads',invalid,csrf)[0]==422,label+' rejected')
        clear_limits();code,accepted,_=request('leads',base,csrf);lead_id=accepted.get('id')
        check(code==201 and lead_id and accepted['status']=='new','valid lead accepted only after durable save')
        with sqlite3.connect(private/'wattgoedkoper.sqlite') as db:
            delivery=db.execute('SELECT status,attempts FROM delivery_outbox WHERE lead_id=?',(lead_id,)).fetchone()
            check(delivery==('pending',0),'new consented NIVO lead receives an outbox item in same transaction')
        code,replayed,_=request('leads',base,csrf);check(code==200 and replayed['id']==lead_id and replayed['replayed'],'retry is idempotent')
        check(request('leads',{**base,'name':'Changed'},csrf)[0]==409,'same idempotency key with different content rejected')
        with sqlite3.connect(private/'wattgoedkoper.sqlite') as db:
            encrypted=db.execute('SELECT payload FROM leads').fetchone()[0]
            check('consumer@example.test' not in encrypted and '=1+1' not in encrypted,'contact data is encrypted at rest')
            check(db.execute('SELECT COUNT(*) FROM leads').fetchone()[0]==1,'idempotent retry creates no duplicate')
            check(db.execute('SELECT COUNT(*) FROM delivery_outbox').fetchone()[0]==1,'idempotent retry creates no extra outbox item')
            check(db.execute('SELECT COUNT(*) FROM leads WHERE partner<>\'nivo\'').fetchone()[0]==0,'mail-only test produced no lead and new leads are NIVO-only')
            check(db.execute("SELECT COUNT(*) FROM daily_events WHERE event='lead_accepted'").fetchone()[0]==0,'no analytics counter without consent')
        base2={**base,'idempotencyKey':secrets.token_hex(16),'name':'<img src=x onerror=alert(1)>','analyticsConsent':True}
        code,accepted2,_=request('leads',base2,csrf);check(code==201,'second consented lead accepted')
        check(request('admin_login',{'username':'wgtest','password':'wrong'},csrf)[0]==401,'wrong admin password rejected')
        oldcsrf=csrf;code,login,_=request('admin_login',{'username':'wgtest','password':password},csrf);csrf=login['csrf']
        check(code==200 and csrf!=oldcsrf,'login rotates session and CSRF')
        check(request('admin_status',{'id':lead_id,'status':'contacted'},oldcsrf)[0]==403,'old CSRF cannot mutate admin data')
        code,listing,_=request('admin_leads');check(code==200 and listing['total']==2,'authenticated admin sees persisted leads')
        check(all(item['delivery']['status']=='pending' for item in listing['leads']),'admin reads per-lead delivery state')
        first=next(x for x in listing['leads'] if x['id']==lead_id)
        check(first['data']['email']=='consumer@example.test' and first['data']['postcode']=='2311AB','admin decrypts normalized contact details')
        check(first['data']['inputs']=={'electricityUse':3500,'hasSolar':True,'people':3},'only approved scan fields are persisted')
        check(first['data']['consentVersion']=='2026-11-v2' and first['data']['consentText'] and first['data']['acceptedAt'],'consent evidence persists with server timestamp')
        check(first['partner']=='nivo' and 'NIVO Groep Holland' in first['data']['consentText'],'new leads are always routed to NIVO and consent names recipient')
        stats=request('admin_stats')[1]
        check(stats['delivery']['pending']==2 and stats['delivery']['acknowledged']==0 and stats['deliveryConfigured'] is False,
            'dashboard reports real pending queue, never claims unapproved NIVO delivery')
        operations=request('admin_operations')[1]
        check(operations['ok'] and operations['cron']['status']=='unknown' and
              operations['backup']['status']=='not_verified' and operations['delivery']['pending']==2,
            'admin status reports unknown heartbeat and unverified backups without inventions')
        check(request('admin_delivery_retry',{'id':lead_id},csrf)[0]==409,'unfailed lead cannot be manually retried')
        source=(ROOT/'admin/admin.mjs').read_text();check('innerHTML' not in source and 'textContent' in source,'admin renders untrusted fields as text')
        check(request('events',{'event':'scan_complete','consent':False},csrf)[0]==422,'analytics denied without consent')
        check(request('events',{'event':'lead_accepted','consent':True},csrf)[0]==422,'client cannot forge accepted-lead counter')
        check(request('events',{'event':'scan_complete','consent':True},csrf)[0]==200,'consented aggregate completion recorded')
        stats=request('admin_stats')[1];check(stats['leadCount']==2 and stats['totals']['lead_accepted']==1 and stats['conversion']==100,'conversion uses consent-matched events, separate total leads')
        code,csv,headers=request('admin_export',{},csrf);check(code==200 and "'=1+1" in csv,'CSV escapes spreadsheet formula injection')
        check(headers['Cache-Control'].startswith('no-store'),'personal exports are not cacheable')
        check(request('admin_status',{'id':lead_id,'status':'evil'},csrf)[0]==422,'invalid status cannot be stored')
        check(request('admin_status',{'id':lead_id,'status':'contacted'},csrf)[0]==200,'valid admin status change works')
        with sqlite3.connect(private/'wattgoedkoper.sqlite') as db: db.execute("UPDATE leads SET created_at='2020-01-01T00:00:00Z' WHERE id=?",[accepted2['id']])
        maintenance=subprocess.run([args.php,'scripts/maintenance.php'],cwd=ROOT,env=env,capture_output=True,text=True)
        check(maintenance.returncode==0 and 'Verwijderde aanvragen: 1.' in maintenance.stdout and request('admin_leads')[1]['total']==1,'SQLite maintenance CLI checkpoints and removes expired personal data')
        check(request('admin_delete',{'id':lead_id},csrf)[0]==200 and request('admin_leads')[1]['total']==0,'explicit deletion removes lead')
        with sqlite3.connect(private/'wattgoedkoper.sqlite') as db:
            check(db.execute('SELECT COUNT(*) FROM delivery_outbox').fetchone()[0]==0,'retention and explicit deletion cascade outbox metadata')
        check(request('admin_logout',{},csrf)[0]==200 and request('admin_stats')[0]==401,'logout revokes access')
        csrf=request('session')[1]['csrf'];clear_limits()
        results=[request('admin_login',{'username':'wgtest','password':'wrong'},csrf)[0] for _ in range(9)]
        check(results[-1]==429 and results[0]==401,'repeated login failures are rate-limited')
        with sqlite3.connect(private/'wattgoedkoper.sqlite') as db: buckets=db.execute('SELECT bucket FROM rate_limits').fetchall()
        check(all(len(x[0])==64 and '127.0.0.1' not in x[0] for x in buckets),'rate limiting stores keyed hashes, not raw IP addresses')
        print(f'\n{checks} backend integration checks passed.')
    finally:
        server.terminate()
        try: server.wait(timeout=4)
        except subprocess.TimeoutExpired: server.kill()
        log.close()

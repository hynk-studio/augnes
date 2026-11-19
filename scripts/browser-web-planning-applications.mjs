import assert from 'node:assert/strict';

// The original recipient exercises return/check/use in the surrounding journey.
// This applicant receives a different, deliberately selected ordinary grant.
export async function browserApplications({publisher,visitor,newContext,local,management,link,grant,click,set,settled,wait,navigate,barrier,checks}) {
  const origin = local.origin, publication = link.split('/').at(-1);
  const applicationUrl = origin + '/apply/' + publication;
  const ownerApi = '/api/work/' + management.split('/').at(-1) + '/public-requests/' + publication + '/applications';
  const row = `document.querySelector('#publications a[href="' + new URL(${JSON.stringify(link)}).href + '"]').parentElement`;
  const selected = action => row + '.querySelector(' + JSON.stringify('[data-action="' + action + '"]') + ')';
  async function action(tab, name) { await tab.eval(selected(name) + '.click()'); await settled(tab); }
  async function signIn(session) {
    const tab = await newContext();
    await tab.send('Network.setCookie',{name:'web_planning_local',value:session,url:origin,httpOnly:true,sameSite:'Strict'});
    return tab;
  }
  async function applicantPage(tab) {
    await navigate(tab, applicationUrl);
    await wait(() => tab.eval("typeof current !== 'undefined' && !!current && !busy"), 'applicant status read');
  }
  async function openGrant(tab) {
    await tab.eval("document.getElementById('grant-link').click()");
    await wait(() => tab.eval("typeof state !== 'undefined' && !!state && !busy"), 'ordinary approved recipient page');
  }
  await action(publisher,'review-applications');
  await action(publisher,'toggle-intake');
  await navigate(visitor,link + '.json');
  const published=JSON.parse(await visitor.eval('document.body.innerText'));
  assert.equal(published.intake.schema,'augnes.public-request-intake.v1');
  assert.equal(published.intake.url,applicationUrl);
  await navigate(visitor,link);
  assert.equal(await visitor.eval(`document.querySelector('a[href="${applicationUrl}"]').textContent`),'Apply or check my application');
  assert.equal(await visitor.eval('document.scripts.length + document.forms.length'),0);

  const applicant=await signIn(local.env.LOCAL_APPLICANT_SESSION);
  await applicantPage(applicant);
  const offer='I can check the entrance wording against the booking.';
  await set(applicant,'offer',offer);
  const apply=await barrier(applicant,'/api/applications/'+publication+'/apply');
  await click(applicant,'apply'); await apply.wait(); await apply.release('disconnect');
  const locator=await applicant.eval('JSON.parse(sessionStorage.getItem(locatorKey))');
  assert.deepEqual(Object.keys(locator).sort(),['digest','operation_id']);
  assert.equal(await applicant.eval("document.getElementById('offer-form').hidden"),true);
  await applicantPage(applicant);
  assert.equal(await applicant.eval('current.application.id'),locator.operation_id);
  assert.equal(await applicant.eval('current.application.status'),'pending');
  assert.equal(await applicant.eval('sessionStorage.getItem(locatorKey)'),null);

  const other=await signIn(local.env.LOCAL_OTHER_SESSION);
  await applicantPage(other);
  assert.equal(await other.eval('current.application'),null);
  assert.equal(await other.eval('document.body.innerText.includes('+JSON.stringify(offer)+')'),false);
  assert.equal(await other.eval("document.getElementById('grant').hidden"),true);

  const owner=await signIn(local.env.LOCAL_SESSION);
  await navigate(owner,management);
  await wait(()=>owner.eval("typeof current!=='undefined'&&!!current&&!busy"),'fresh publication owner');
  await action(owner,'review-applications');
  const app=row+'.querySelector('+JSON.stringify('[data-application-id="'+locator.operation_id+'"]')+')';
  assert.equal(await owner.eval(app+'.querySelector("h3").textContent'),local.env.LOCAL_APPLICANT_LOGIN);
  assert.equal(await owner.eval(app+'.innerText.includes('+JSON.stringify(offer)+')'),true);
  assert.equal(await owner.eval(app+'.querySelectorAll("input[name=file]:checked").length'),0);
  await owner.eval(`(()=>{const form=${app}.querySelector('form'),files=form.querySelectorAll('input[name=file]');
    if(files.length!==2 || !files[0].parentElement.textContent.includes('notice.md'))throw Error('missing owner file selection');
    files[0].click();form.elements.brief.value='Verify the entrance in the notice.';
    form.elements.next_action.value='Return your checked correction.';
    const expiry=new Date(Date.now()+1800000);
    form.elements.expires.value=new Date(expiry.getTime()-expiry.getTimezoneOffset()*60000).toISOString().slice(0,16);
  })()`);
  const approve=await barrier(owner,ownerApi+'/decide');
  await owner.eval(selected('approve')+'.click()'); await approve.wait(); await approve.release('disconnect');
  await action(owner,'check-decision');
  assert.equal(await owner.eval(app+'.innerText.includes("approved")'),true);
  const refresh = await barrier(owner,ownerApi);
  await owner.eval(selected('toggle-intake')+'.click()');
  await refresh.wait(); await refresh.release('unavailable');
  assert.match(await owner.eval("document.getElementById('status').textContent"),/Applications are closed.*Refresh participation applications/);
  assert.equal(await owner.eval(selected('toggle-intake')+'===null'),true,'no stale change control after confirmed close');
  await action(owner,'review-applications');
  assert.equal(await owner.eval(selected('toggle-intake')+'.textContent'),'Open applications');

  const fresh=await signIn(local.env.LOCAL_APPLICANT_SESSION);
  await applicantPage(fresh);
  assert.equal(await fresh.eval('current.application.status'),'approved');
  const recipientLink=await fresh.eval("document.getElementById('grant-link').href");
  assert.notEqual(recipientLink,grant.link);
  await openGrant(fresh);
  assert.deepEqual(await fresh.eval('state.items[0].files.map(file=>file.name)'),['notice.md']);
  assert.equal(await fresh.eval("document.body.innerText.includes('budget-private.txt')"),false);
  assert.equal(await fresh.eval('state.can_submit'),true);
  await action(owner,'toggle-intake');
  assert.equal(await owner.eval(selected('toggle-intake')+'.textContent'),'Close applications');
  checks.push('Anonymous application link; isolated applicant and unrelated reader; read-only recovery of lost offer and owner approval; explicit single-file disclosure; fresh login uses separate recipient grant after intake closes');

  return async function checkApplicantAfterAnswer() {
    await navigate(fresh,recipientLink);
    await wait(()=>fresh.eval("typeof state!=='undefined'&&!!state&&!busy"),'applicant observes answered request');
    assert.equal(await fresh.eval('state.can_submit'),false);
    assert.equal(await fresh.eval('state.items.length'),1,'another recipient’s return stays private');
    assert.equal(await fresh.eval("document.getElementById('fields').disabled"),true);
    checks.push('Original recipient answered the shared request; approved applicant sees only its one selected source and the closed return control');
  };
}

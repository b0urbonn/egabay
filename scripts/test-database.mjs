// Real PostgreSQL policies and triggers in an isolated, in-memory PGlite DB.
// No live Supabase users or data are created by these tests.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
let passed = 0;
async function check(name, fn) { await fn(); passed += 1; console.log(`PASS ${name}`); }
async function rows(sql, args = []) { return (await db.query(sql, args)).rows; }
async function asUser(role, uid, fn) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid ?? '']);
  await db.exec(`set role ${role}`);
  try { return await fn(); }
  finally { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub', '', false)"); }
}
const denied = (fn) => assert.rejects(fn, (error) => ['42501', 'P0001'].includes(error.code));

try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb not null default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
    create publication supabase_realtime;`);
  await check('both migrations apply atomically to an empty database', async () => {
    await db.exec('begin');
    for (const file of readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()) await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
    await db.exec('commit');
  });
  for (let n = 1; n <= 8; n++) await db.query('insert into auth.users values($1,$2,$3,$4)', [id(n), n === 1 ? 'owner@example.test' : n === 2 ? 'commuter@example.test' : `fixture${n}@example.test`, n === 1 ? null : new Date().toISOString(), JSON.stringify({ full_name: `User ${n}`, role: 'super_admin', avatar_url: 'https://example.test/avatar.png' })]);
  await check('all sign-ups ignore role metadata and start as commuters', async () => {
    assert.equal((await rows("select count(*)::int as count from public.profiles where role = 'commuter'"))[0].count, 8);
    assert.equal((await rows('select display_name from public.profiles where id=$1', [id(2)]))[0].display_name, 'User 2');
  });
  await check('bootstrap requires a verified owner account', async () => {
    await assert.rejects(() => db.exec(readFileSync('supabase/admin/bootstrap_super_admin.sql', 'utf8').replaceAll('__BOOTSTRAP_ADMIN_EMAIL__', 'owner@example.test')), /verified Google account/);
    await db.exec('rollback');
    await db.query('update auth.users set email_confirmed_at=now() where id=$1', [id(1)]);
    await db.exec(readFileSync('supabase/admin/bootstrap_super_admin.sql', 'utf8').replaceAll('__BOOTSTRAP_ADMIN_EMAIL__', 'owner@example.test'));
    assert.equal((await rows('select role from public.profiles where id=$1', [id(1)]))[0].role, 'super_admin');
    assert.equal((await rows('select role from public.profiles where id=$1', [id(2)]))[0].role, 'commuter');
  });
  await db.exec(`update public.profiles set role='chairperson' where id in ('${id(3)}','${id(4)}'); update public.profiles set role='driver' where id in ('${id(5)}','${id(6)}','${id(7)}');`);
  await db.query("insert into public.groups(id,name,kind,municipality,chairperson_id) values($1,'Group A','jeepney','Boac',$2),($3,'Group B','toda','Mogpog',$4)", [id(1001),id(3),id(1002),id(4)]);
  await db.query("insert into public.terminals(id,group_id,name,municipality,barangay) values($1,$2,'Terminal A','Boac','Poblacion'),($3,$4,'Terminal B','Mogpog','Poblacion')", [id(2001),id(1001),id(2002),id(1002)]);
  await db.query("insert into public.drivers(profile_id,group_id,license_number,contact_number,membership_status) values($1,$2,'PRIVATE-LICENSE-A','PRIVATE-PHONE-A','approved'),($3,$4,'PRIVATE-LICENSE-B','PRIVATE-PHONE-B','approved'),($5,$2,'PENDING-LICENSE','PENDING-PHONE','pending')", [id(5),id(1001),id(6),id(1002),id(7)]);
  await db.query("insert into public.vehicles(id,terminal_id,body_number,plate_number,assigned_driver_id) values($1,$2,'BODY-A','PRIVATE-PLATE-A',$3),($4,$5,'BODY-B','PRIVATE-PLATE-B',$6)", [id(3001),id(2001),id(5),id(3002),id(2002),id(6)]);

  await check('anonymous users only see the public-safe vehicle projection', () => asUser('anon', null, async () => {
    const vehicles = await rows('select * from public.public_vehicle_directory');
    assert.equal(vehicles.length, 2);
    assert.deepEqual(Object.keys(vehicles[0]).sort(), ['id','terminal_id','body_number','vehicle_type','status','driver_name','driver_photo_url'].sort());
    for (const table of ['profiles','drivers','vehicles','vehicle_driver_assignments']) await denied(() => rows(`select * from public.${table}`));
  }));
  await check('commuters can edit display fields but cannot change roles or approve drivers', () => asUser('authenticated', id(2), async () => {
    assert.equal((await rows('select * from public.profiles')).length, 1);
    await rows("update public.profiles set display_name='Updated name' where id=$1", [id(2)]);
    await denied(() => rows("update public.profiles set role='super_admin' where id=$1", [id(2)]));
    await denied(() => rows("select public.set_user_role($1,'super_admin')", [id(2)]));
    await denied(() => rows('select * from public.admin_user_directory()'));
    await denied(() => rows("select public.review_driver_application($1,'approved')", [id(7)]));
    await denied(() => rows("insert into public.groups(name,kind,municipality) values('Spoof','toda','Boac')"));
  }));
  await check('chairpersons can edit their own terminal and cannot edit another group', () => asUser('authenticated', id(3), async () => {
    assert.equal((await rows("update public.terminals set address='Allowed' where id=$1 returning id", [id(2001)])).length, 1);
    assert.equal((await rows("update public.terminals set address='Denied' where id=$1 returning id", [id(2002)])).length, 0);
    await denied(() => rows("insert into public.terminals(group_id,name,municipality,barangay) values($1,'Cross group','Mogpog','Poblacion')", [id(1002)]));
    await denied(() => rows("update public.vehicles set assigned_driver_id=$1 where id=$2", [id(6),id(3001)]));
    await denied(() => rows("update public.vehicles set assigned_driver_id=$1 where id=$2", [id(7),id(3001)]));
    await denied(() => rows("select public.review_driver_application($1,'rejected')", [id(6)]));
    await rows("select public.review_driver_application($1,'approved')", [id(7)]);
  }));
  await check('drivers only read their own private record and cannot approve themselves', () => asUser('authenticated', id(5), async () => {
    const drivers = await rows('select * from public.drivers');
    assert.equal(drivers.length, 1); assert.equal(drivers[0].profile_id, id(5));
    await denied(() => rows("update public.drivers set membership_status='approved' where profile_id=$1", [id(5)]));
    await denied(() => rows("update public.drivers set group_id=$1 where profile_id=$2", [id(1002),id(5)]));
    await denied(() => rows("select public.review_driver_application($1,'approved')", [id(5)]));
    await rows("update public.drivers set contact_number='Updated private number' where profile_id=$1", [id(5)]);
  }));
  await check('the last super admin cannot be demoted and role writes are audited', () => asUser('authenticated', id(1), async () => {
    await denied(() => rows("select public.set_user_role($1,'commuter')", [id(1)]));
    await rows("select public.set_user_role($1,'chairperson')", [id(8)]);
    assert.equal((await rows('select * from public.admin_user_directory()')).length, 8);
    assert.ok((await rows("select * from public.audit_log where actor_id=$1 and table_name='profiles'", [id(1)])).length > 0);
  }));
  await check('role and terminal changes cannot invalidate group assignments', async () => {
    await asUser('authenticated', id(1), async () => {
      await denied(() => rows("select public.set_user_role($1,'commuter')", [id(3)]));
      await denied(() => rows("update public.terminals set group_id=$1 where id=$2", [id(1002),id(2001)]));
    });
  });
  await check('a commuter can submit their own feedback but cannot forge its author', () => asUser('authenticated', id(2), async () => {
    await rows("insert into public.feedback(vehicle_id,kind,body) values($1,'feedback','Example feedback')", [id(3001)]);
    await denied(() => rows("insert into public.feedback(author_id,vehicle_id,kind,body) values($1,$2,'feedback','Spoofed author')", [id(3),id(3001)]));
    await denied(() => rows("insert into public.feedback(kind,body) values('feedback','Missing target')"));
    await denied(() => rows("insert into public.audit_log(action,table_name,detail) values('Spoof','groups','{}')"));
  }));
  await check('driver application is restricted to self and starts pending', () => asUser('authenticated', id(2), async () => {
    await rows("select public.apply_to_group($1,'TEST-LICENSE','TEST-CONTACT')", [id(1001)]);
    const driver = (await rows('select * from public.drivers where profile_id=$1', [id(2)]))[0];
    assert.equal(driver.membership_status, 'pending');
    assert.equal((await rows('select role from public.profiles where id=$1',[id(2)]))[0].role, 'driver');
    await denied(() => rows("select public.apply_to_group($1,'OTHER','OTHER')", [id(1002)]));
  }));
  await check('location writes require an active assigned trip and public reads stop with availability', async () => {
    await asUser('authenticated', id(5), () => denied(() => rows('insert into public.vehicle_positions(vehicle_id,latitude,longitude) values($1,13.4,121.8)', [id(3001)])));
    await db.query("update public.drivers set availability='on_trip' where profile_id=$1", [id(5)]);
    await db.query("update public.vehicles set status='on_route' where id=$1", [id(3001)]);
    await asUser('authenticated', id(5), async () => {
      await rows('insert into public.vehicle_positions(vehicle_id,latitude,longitude) values($1,13.4,121.8)', [id(3001)]);
      await denied(() => rows('insert into public.vehicle_positions(vehicle_id,latitude,longitude) values($1,13.4,121.8)', [id(3002)]));
    });
    assert.equal((await asUser('anon', null, () => rows('select * from public.vehicle_positions'))).length, 1);
    await db.query("update public.drivers set availability='offline' where profile_id=$1", [id(5)]);
    assert.equal((await asUser('anon', null, () => rows('select * from public.vehicle_positions'))).length, 0);
  });
  await check('inactive groups disappear from public directories and lose chairperson write access', async () => {
    await db.query('update public.groups set is_active=false where id=$1', [id(1001)]);
    await asUser('anon', null, async () => {
      assert.equal((await rows('select * from public.terminals')).length, 1);
      assert.equal((await rows('select * from public.public_vehicle_directory')).length, 1);
    });
    await asUser('authenticated', id(3), async () => assert.equal((await rows("update public.terminals set address='Blocked' where id=$1 returning id", [id(2001)])).length, 0));
  });
  console.log(`\n${passed} database integration checks passed.`);
} finally { await db.close(); }

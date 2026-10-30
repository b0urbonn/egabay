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
  await check('all migrations apply atomically to an empty database', async () => {
    await db.exec('begin');
    for (const file of readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()) await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
    await db.exec('commit');
  });
  await check('sample groups, terminals, routes, and schedules are labelled and idempotent', async () => {
    const seed = readFileSync('supabase/seed.sql', 'utf8');
    await db.exec(seed);
    await db.exec(seed);
    const serviceRules = readFileSync('supabase/migrations/20261103000000_municipal_transit_service_rules.sql', 'utf8');
    await db.exec(serviceRules);
    await db.exec(serviceRules);
    const barangayLinks = readFileSync('supabase/migrations/20261105000000_barangay_to_barangay_tricycle.sql', 'utf8');
    await db.exec(barangayLinks);
    await db.exec(barangayLinks);
    const barangayPins = readFileSync('supabase/migrations/20261106000000_barangay_terminal_pins.sql', 'utf8');
    await db.exec(barangayPins);
    await db.exec(barangayPins);
    const pinFixups = readFileSync('supabase/migrations/20261107000000_service_point_and_hub_pins.sql', 'utf8');
    await db.exec(pinFixups);
    await db.exec(pinFixups);
    assert.equal((await rows('select count(*)::int as count from public.groups where is_sample'))[0].count, 20);
    assert.equal((await rows('select count(*)::int as count from public.terminals where is_sample'))[0].count, 675);
    assert.equal((await rows(`select count(*)::int as count from (values
      ('Boac'),('Mogpog'),('Gasan'),('Buenavista'),('Torrijos'),('Santa Cruz')
    ) towns(municipality) where not exists (
      select 1 from public.terminals terminal
      join public.terminal_groups tg on tg.terminal_id = terminal.id
      join public.groups transport_group on transport_group.id = tg.group_id
      where terminal.municipality = towns.municipality and terminal.is_active
        and terminal.is_sample and transport_group.kind = 'jeepney'
    )`))[0].count, 0);
    assert.deepEqual((await rows(`select terminal.municipality, count(distinct terminal.barangay)::int as count
      from public.terminals terminal
      join public.terminal_groups tg on tg.terminal_id = terminal.id
      join public.groups transport_group on transport_group.id = tg.group_id
      where terminal.is_sample and terminal.is_active and transport_group.kind = 'toda'
        and terminal.name like 'Sample TODA%'
      group by terminal.municipality order by terminal.municipality`))
      .map((row) => [row.municipality, row.count]), [
      ['Boac', 61], ['Buenavista', 15], ['Gasan', 25],
      ['Mogpog', 37], ['Santa Cruz', 55], ['Torrijos', 25],
    ]);
    assert.equal((await rows(`select count(*)::int as count from (values
      ('Boac'),('Mogpog'),('Gasan'),('Buenavista'),('Torrijos'),('Santa Cruz')
    ) towns(municipality) where not exists (
      select 1 from public.terminals terminal
      join public.terminal_groups tg on tg.terminal_id = terminal.id
      join public.groups transport_group on transport_group.id = tg.group_id
      where terminal.municipality = towns.municipality and terminal.is_active
        and terminal.is_sample and transport_group.kind = 'toda'
        and terminal.name like '%TODA Service Hub (Sample)'
    )`))[0].count, 0);
    assert.equal((await rows(`select count(*)::int as count from public.terminals terminal
      join public.terminal_groups tg on tg.terminal_id = terminal.id
      join public.groups transport_group on transport_group.id = tg.group_id
      where terminal.is_active and terminal.is_sample and transport_group.kind = 'jeepney'
        and terminal.name like 'Sample jeepney service point:%'`))[0].count, 0);
    assert.equal((await rows(`select count(*)::int as count from public.routes
      where is_active and is_sample and mode = 'jeepney' and code like 'SAMPLE-JEP-BRG-%'`))[0].count, 0);
    assert.equal((await rows(`select count(*)::int as count from public.routes
      where is_active and is_sample and mode = 'tricycle' and code like 'SAMPLE-TRI-LNK-%'`))[0].count, 212);
    assert.equal((await rows(`select count(*)::int as count from public.routes route
      where route.code like 'SAMPLE-TRI-LNK-%'
        and split_part(route.origin_label, ', ', 2) <> split_part(route.destination_label, ', ', 2)`))[0].count, 0);
    assert.equal((await rows(`select count(*)::int as count from public.routes route
      where route.code like 'SAMPLE-TRI-LNK-%' and exists (
        select 1 from public.routes other
        where other.id <> route.id and other.is_sample and other.mode = 'jeepney'
          and other.origin_label = route.origin_label and other.destination_label = route.destination_label
      )`))[0].count, 0);
    assert.equal((await rows("select count(*)::int as count from public.terminals t join public.terminal_groups tg on tg.terminal_id=t.id join public.groups g on g.id=tg.group_id where t.is_sample and not g.is_sample"))[0].count, 0);
    assert.equal((await rows("select count(*)::int as count from public.terminals t where t.is_sample and not exists (select 1 from public.terminal_groups tg where tg.terminal_id=t.id)"))[0].count, 0);
    assert.equal((await rows("select count(*)::int as count from public.terminals t where not exists (select 1 from public.terminal_transport_types tt where tt.terminal_id=t.id) or exists (select 1 from public.terminal_groups tg join public.groups g on g.id=tg.group_id where tg.terminal_id=t.id and not exists (select 1 from public.terminal_transport_types tt where tt.terminal_id=t.id and tt.kind=g.kind))"))[0].count, 0);
    assert.equal((await rows("select count(*)::int as count from public.vehicles where is_sample and (status <> 'offline' or assigned_driver_id is not null)"))[0].count, 0);
    assert.equal((await rows('select count(*)::int as count from public.vehicles where is_sample'))[0].count, 4);
    assert.ok((await rows('select count(*)::int as count from public.routes where is_sample'))[0].count > 200);
    assert.equal((await rows('select count(*)::int as count from public.terminal_schedules where is_sample'))[0].count, 105);
    assert.equal((await rows(`select count(*)::int as count from public.terminals
      where is_sample and is_active and (latitude is null or longitude is null)`))[0].count, 0);
    assert.equal((await rows(`select count(*)::int as count from public.terminals
      where is_sample and latitude is not null
        and (latitude not between 13.05 and 13.72 or longitude not between 121.62 and 122.32)`))[0].count, 0);
    assert.equal((await rows(`select count(*)::int as count from public.route_stops stop
      join public.routes route on route.id = stop.route_id and route.is_sample and route.mode = 'tricycle'
      where stop.locality like '%, %' and stop.latitude is null`))[0].count, 0);
    assert.equal((await rows('select count(*)::int as count from public.routes r where not exists (select 1 from public.route_stops s where s.route_id=r.id)'))[0].count, 0);
    assert.equal((await rows('select count(*)::int as count from public.routes r where not exists (select 1 from public.terminal_routes tr where tr.route_id=r.id)'))[0].count, 0);
    assert.equal((await rows('select count(*)::int as count from auth.users'))[0].count, 0);
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
  await db.query("insert into public.terminals(id,name,municipality,barangay) values($1,'Terminal A','Boac','Poblacion'),($2,'Terminal B','Mogpog','Poblacion')", [id(2001),id(2002)]);
  await db.query("insert into public.terminal_transport_types(terminal_id,kind) values($1,'jeepney'),($2,'toda')", [id(2001),id(2002)]);
  await db.query("insert into public.terminal_groups(terminal_id,group_id) values($1,$2),($3,$4)", [id(2001),id(1001),id(2002),id(1002)]);
  await db.query("insert into public.drivers(profile_id,group_id,license_number,contact_number,membership_status) values($1,$2,'PRIVATE-LICENSE-A','PRIVATE-PHONE-A','approved'),($3,$4,'PRIVATE-LICENSE-B','PRIVATE-PHONE-B','approved'),($5,$2,'PENDING-LICENSE','PENDING-PHONE','pending')", [id(5),id(1001),id(6),id(1002),id(7)]);
  await db.query("insert into public.vehicles(id,terminal_id,body_number,plate_number,assigned_driver_id) values($1,$2,'BODY-A','PRIVATE-PLATE-A',$3),($4,$5,'BODY-B','PRIVATE-PLATE-B',$6)", [id(3001),id(2001),id(5),id(3002),id(2002),id(6)]);
  await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'unassigned-driver@example.test',now())", [id(10)]);
  await db.query("update public.profiles set role='driver' where id=$1", [id(10)]);
  await db.query("insert into public.drivers(profile_id,group_id,license_number,contact_number,membership_status) values($1,$2,'UNASSIGNED-LICENSE','UNASSIGNED-PHONE','approved')", [id(10),id(1001)]);

  await check('anonymous users only see the public-safe vehicle projection', () => asUser('anon', null, async () => {
    const vehicles = await rows('select * from public.public_vehicle_directory');
    assert.equal(vehicles.length, 2);
    assert.deepEqual(Object.keys(vehicles[0]).sort(), ['id','terminal_id','body_number','vehicle_type','status','driver_name','driver_photo_url'].sort());
    for (const table of ['profiles','drivers','vehicles','vehicle_driver_assignments']) await denied(() => rows(`select * from public.${table}`));
    assert.ok((await rows('select * from public.terminal_transport_types')).length > 0);
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
    await denied(() => rows("insert into public.terminal_groups(terminal_id,group_id) values($1,$2)", [id(2001),id(1002)]));
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
    assert.equal((await rows('select * from public.admin_user_directory()')).length, 9);
    assert.ok((await rows("select * from public.audit_log where actor_id=$1 and table_name='profiles'", [id(1)])).length > 0);
  }));
  await check('chairperson access is approved by email and rejects unknown, active, and staff targets', async () => {
    await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'chair-new@example.test',now())", [id(9)]);
    await asUser('authenticated', id(2), () => denied(() => rows("select public.approve_chairperson('chair-new@example.test')")));
    await asUser('authenticated', id(1), async () => {
      await denied(() => rows("select public.approve_chairperson('missing@example.test')"));
      await denied(() => rows("select public.approve_chairperson('owner@example.test')"));
      await denied(() => rows("select public.approve_chairperson('fixture5@example.test')"));
      await rows("select public.approve_chairperson(' Chair-New@EXAMPLE.test ')");
      assert.equal((await rows('select role from public.profiles where id=$1', [id(9)]))[0].role, 'chairperson');
      await denied(() => rows("select public.approve_chairperson('chair-new@example.test')"));
    });
  });
  await check('role and terminal changes cannot invalidate group assignments', async () => {
    await asUser('authenticated', id(1), async () => {
      await denied(() => rows("select public.set_user_role($1,'commuter')", [id(3)]));
      await denied(() => rows("delete from public.terminal_transport_types where terminal_id=$1 and kind='jeepney'", [id(2001)]));
      await denied(() => rows("update public.groups set kind='jeepney' where id=$1", [id(1002)]));
    });
  });
  await check('terminals link to many groups of the types they serve and keep vehicle integrity', async () => {
    await db.query("insert into public.groups(id,name,kind,municipality) values($1,'Group C','toda','Gasan')", [id(1003)]);
    await asUser('authenticated', id(1), async () => {
      await rows("insert into public.terminal_groups(terminal_id,group_id) values($1,$2)", [id(2002),id(1003)]);
      assert.equal((await rows('select count(*)::int as count from public.terminal_groups where terminal_id=$1', [id(2002)]))[0].count, 2);
      await denied(() => rows("insert into public.terminal_groups(terminal_id,group_id) values($1,$2)", [id(2001),id(1003)]));
      await denied(() => rows("insert into public.terminal_groups(terminal_id,group_id) values($1,$2)", [id(2002),id(1001)]));
      await denied(() => rows("delete from public.terminal_groups where terminal_id=$1 and group_id=$2", [id(2002),id(1002)]));
      await rows("delete from public.terminal_groups where terminal_id=$1 and group_id=$2", [id(2002),id(1003)]);
    });
    await asUser('authenticated', id(4), async () => {
      await rows("insert into public.terminals(id,name,municipality,barangay) values($1,'Terminal C','Gasan','Poblacion')", [id(2003)]);
      await rows("insert into public.terminal_transport_types(terminal_id,kind) values($1,'toda')", [id(2003)]);
      await rows("insert into public.terminal_groups(terminal_id,group_id) values($1,$2)", [id(2003),id(1002)]);
      await denied(() => rows("insert into public.terminal_groups(terminal_id,group_id) values($1,$2)", [id(2003),id(1001)]));
    });
  });
  await check('a multi-type terminal hosts different group kinds and cannot drop a used type', async () => {
    await asUser('authenticated', id(1), async () => {
      await rows("insert into public.terminal_transport_types(terminal_id,kind) values($1,'toda')", [id(2001)]);
      await rows("insert into public.terminal_groups(terminal_id,group_id) values($1,$2)", [id(2001),id(1003)]);
      assert.equal((await rows('select count(*)::int as count from public.terminal_groups where terminal_id=$1', [id(2001)]))[0].count, 2);
      await denied(() => rows("delete from public.terminal_transport_types where terminal_id=$1 and kind='toda'", [id(2001)]));
      await denied(() => rows("update public.terminal_transport_types set kind='jeepney' where terminal_id=$1 and kind='toda'", [id(2001)]));
      await assert.rejects(() => rows("insert into public.terminal_transport_types(terminal_id,kind) values($1,'jeepney')", [id(2001)]), (error) => error.code === '23505');
      await assert.rejects(() => rows("insert into public.terminal_transport_types(terminal_id,kind) values($1,'van')", [id(2001)]), (error) => error.code === '23514');
      await rows("delete from public.terminal_groups where terminal_id=$1 and group_id=$2", [id(2001),id(1003)]);
      await rows("delete from public.terminal_transport_types where terminal_id=$1 and kind='toda'", [id(2001)]);
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
  await check('chairpersons can maintain only their own group weekly terminal hours', async () => {
    const schedule = JSON.stringify(Array.from({ length: 7 }, (_, day_of_week) => ({
      day_of_week,
      status: 'open',
      opens_at: '05:00',
      closes_at: '18:00',
    })));
    await asUser('authenticated', id(3), async () => {
      await rows('select public.save_terminal_schedule($1,$2::jsonb)', [id(2001), schedule]);
      assert.equal((await rows('select count(*)::int as count from public.terminal_schedules where terminal_id=$1 and not is_sample', [id(2001)]))[0].count, 7);
      await denied(() => rows('select public.save_terminal_schedule($1,$2::jsonb)', [id(2002), schedule]));
      await denied(() => rows("insert into public.terminal_schedules(terminal_id,day_of_week,status) values($1,0,'closed')", [id(2001)]));
    });
    await asUser('authenticated', id(5), () => denied(() => rows('select public.save_terminal_schedule($1,$2::jsonb)', [id(2001), schedule])));
    await asUser('authenticated', id(1), async () => {
      await rows('select public.save_terminal_schedule($1,$2::jsonb)', [id(2002), schedule]);
    });
    await asUser('authenticated', id(3), () => denied(() => rows('select public.save_terminal_schedule($1,$2::jsonb)', [id(2001), JSON.stringify([{ day_of_week: 0, status: 'open', opens_at: '18:00', closes_at: '05:00' }])])));
    await asUser('anon', null, () => denied(() => rows('select public.save_terminal_schedule($1,$2::jsonb)', [id(2001), schedule])));
  });
  await check('pending drivers must be reviewed before demotion; rejected drivers can return to commuter access', async () => {
    await asUser('authenticated', id(1), () => denied(() => rows("select public.set_user_role($1,'commuter')", [id(2)])));
    await asUser('authenticated', id(3), () => rows("select public.review_driver_application($1,'rejected')", [id(2)]));
    await asUser('authenticated', id(1), async () => {
      await rows("select public.set_user_role($1,'commuter')", [id(2)]);
      assert.equal((await rows('select count(*)::int as count from public.drivers where profile_id=$1', [id(2)]))[0].count, 0);
      assert.equal((await rows('select role from public.profiles where id=$1', [id(2)]))[0].role, 'commuter');
    });
    await asUser('authenticated', id(2), async () => {
      await rows("select public.apply_to_group($1,'REAPPLY-LICENSE','REAPPLY-CONTACT')", [id(1002)]);
      assert.equal((await rows('select group_id,membership_status from public.drivers where profile_id=$1', [id(2)]))[0].group_id, id(1002));
    });
  });
  await check('driver trip state requires an assigned serviceable vehicle and uses the checked RPC', async () => {
    await asUser('authenticated', id(7), () => denied(() => rows("select public.set_driver_availability('on_trip')")));
    await asUser('authenticated', id(10), () => denied(() => rows("select public.set_driver_availability('on_trip')")));
    await asUser('authenticated', id(5), async () => {
      await denied(() => rows("update public.drivers set availability='on_trip' where profile_id=$1", [id(5)]));
      await denied(() => rows("select public.set_driver_availability('driving')"));
      await rows("select public.set_driver_availability('on_trip')");
      assert.equal((await rows('select availability from public.drivers where profile_id=$1', [id(5)]))[0].availability, 'on_trip');
      await rows('insert into public.vehicle_positions(vehicle_id,latitude,longitude) values($1,13.4,121.8)', [id(3001)]);
      await denied(() => rows('insert into public.vehicle_positions(vehicle_id,latitude,longitude) values($1,13.4,121.8)', [id(3002)]));
      await denied(() => rows("select public.set_driver_availability('offline')"));
    });
    assert.equal((await rows('select status from public.vehicles where id=$1', [id(3001)]))[0].status, 'on_route');
    assert.equal((await asUser('anon', null, () => rows('select * from public.vehicle_positions'))).length, 1);
    await asUser('authenticated', id(5), () => rows("select public.set_driver_availability('available')"));
    await db.query("update public.vehicles set status='offline' where id=$1", [id(3001)]);
    await asUser('authenticated', id(5), () => denied(() => rows("select public.set_driver_availability('on_trip')")));
    await db.query("update public.vehicles set status='idle' where id=$1", [id(3001)]);
    assert.equal((await asUser('anon', null, () => rows('select * from public.vehicle_positions'))).length, 0);
  });
  await check('inactive groups disappear from public directories and lose chairperson write access', async () => {
    await db.query('update public.groups set is_active=false where id=$1', [id(1001)]);
    await asUser('anon', null, async () => {
      assert.equal((await rows('select id from public.terminals where id=$1', [id(2001)])).length, 0);
      assert.equal((await rows('select id from public.terminals where id=$1', [id(2002)])).length, 1);
      assert.equal((await rows('select * from public.public_vehicle_directory')).length, 1);
    });
    await asUser('authenticated', id(3), async () => assert.equal((await rows("update public.terminals set address='Blocked' where id=$1 returning id", [id(2001)])).length, 0));
    await asUser('authenticated', id(1), async () => {
      assert.equal((await rows('select * from public.terminal_schedules where terminal_id=$1', [id(2001)])).length, 7);
    });
    await asUser('authenticated', id(3), async () => {
      assert.equal((await rows('select * from public.terminal_schedules where terminal_id=$1', [id(2001)])).length, 0);
    });
  });
  console.log(`\n${passed} database integration checks passed.`);
} finally { await db.close(); }

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const alice = '10000000-0000-4000-8000-000000000001';
const bob = '10000000-0000-4000-8000-000000000002';
const contributor = '10000000-0000-4000-8000-000000000003';
const admin = '10000000-0000-4000-8000-000000000004';
test('profile changes, statement metadata, verified email and deletion obey database ownership', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.uid',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated,service_role;
      grant execute on function auth.uid() to anon,authenticated,service_role;
      alter default privileges in schema public grant all on tables to anon,authenticated,service_role;`);
    await db.exec(
      fs
        .readFileSync('supabase/schema.sql', 'utf8')
        .replace('create extension if not exists "uuid-ossp";', '')
        .replaceAll('uuid_generate_v4()', 'gen_random_uuid()'),
    );
    // New migrations can be reapplied in their own order without narrowing the public view.
    await db.exec(
      fs.readFileSync('supabase/migrations/202611090002_profiles_and_statements.sql', 'utf8'),
    );
    await db.exec(fs.readFileSync('supabase/migrations/202611090003_account_deletion.sql', 'utf8'));
    for (const id of [alice, bob, contributor, admin])
      await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [
        id,
        `${id}@example.test`,
      ]);
    await db.query("update public.profiles set role='contributor' where id=$1", [contributor]);
    await db.query("update public.profiles set role='admin' where id=$1", [admin]);
    const asUser = async (id, operation) => {
      await db.query("select set_config('app.uid',$1,false)", [id]);
      await db.exec('set role authenticated');
      try {
        return await operation();
      } finally {
        await db.exec('reset role');
      }
    };
    const fields = {
      display_name: ' Updated name ',
      avatar_key: 'sprout',
      target_level: 'TOPIK II Level 5',
      daily_goal: 5,
      bio: 'About me',
      korean_background: 'TOPIK learner',
      role: 'admin',
      email: 'spoof@example.test',
      id: bob,
    };
    await asUser(alice, async () => {
      const { rows } = await db.query('select (public.update_own_profile($1)).*', [
        JSON.stringify(fields),
      ]);
      assert.equal(rows[0].id, alice);
      assert.equal(rows[0].role, 'user');
      assert.equal(rows[0].display_name, 'Updated name');
      assert.equal(rows[0].email, `${alice}@example.test`);
      await assert.rejects(
        db.query('select public.update_own_profile($1)', [
          JSON.stringify({ ...fields, daily_goal: 0 }),
        ]),
        /Invalid profile/,
      );
      await assert.rejects(
        db.query("update public.profiles set email='spoof' where id=$1", [alice]),
        /permission denied/,
      );
      const id = '20000000-0000-4000-8000-000000000001';
      const metadata = {
        university: 'University',
        major: 'Major',
        sections: { background: 'A', motivation: 'B', study_plan: 'C', future_goals: 'D' },
        currentStep: 3,
      };
      assert.equal(
        (
          await db.query(
            "select public.save_draft_document($1,'statement','Title','ABCD',4,now(),$2) as saved",
            [id, JSON.stringify(metadata)],
          )
        ).rows[0].saved,
        true,
      );
      assert.deepEqual(
        (await db.query('select metadata from public.drafts where id=$1', [id])).rows[0].metadata,
        metadata,
      );
      assert.equal(
        (
          await db.query(
            "select public.save_draft_if_newer($1,'statement','Title','Only one section',16,now()) as saved",
            [id],
          )
        ).rows[0].saved,
        false,
      );
    });
    assert.equal(
      (await db.query('select display_name from public.profiles where id=$1', [bob])).rows[0]
        .display_name,
      'TOPIK Learner',
    );
    await db.query("update auth.users set email='verified@example.test' where id=$1", [alice]);
    assert.equal(
      (await db.query('select email from public.profiles where id=$1', [alice])).rows[0].email,
      'verified@example.test',
    );
    await db.query(
      "insert into public.vocabularies(id,spoken,written,category,myanmar_meaning,english_meaning,example_korean,example_myanmar,created_by) values('v','s','w','General','m','e','k','m',$1)",
      [contributor],
    );
    await asUser(contributor, () =>
      db.query('select public.update_own_profile($1)', [JSON.stringify(fields)]),
    );
    assert.equal(
      (await db.exec("select author_name from public.vocabularies where id='v'"))[0].rows[0]
        .author_name,
      'Updated name',
    );
    await db.query(
      "insert into public.essay_submissions(student_id,content,prompt_title,question_type,reviewed_by,reviewer_name) values($1,'Private','Prompt','Q53',$2,'Updated name')",
      [bob, contributor],
    );
    await db.query(
      "insert into public.user_feedback(user_id,category,title,message) values($1,'other','Title','Private')",
      [contributor],
    );
    await db.query(
      "insert into public.community_essays(user_id,author_name,type,title,content) values($1,'Name','Q53','Essay','Private')",
      [contributor],
    );
    await assert.rejects(
      db.query('delete from auth.users where id=$1', [admin]),
      /must be demoted/,
    );
    await db.query('delete from auth.users where id=$1', [contributor]);
    assert.equal(
      (await db.query('select * from public.profiles where id=$1', [contributor])).rows.length,
      0,
    );
    assert.equal(
      (await db.query('select * from public.user_feedback where user_id=$1', [contributor])).rows
        .length,
      0,
    );
    assert.equal(
      (await db.query('select * from public.community_essays where user_id=$1', [contributor])).rows
        .length,
      0,
    );
    assert.equal(
      (await db.exec("select author_name,created_by from public.vocabularies where id='v'"))[0]
        .rows[0].author_name,
      'Former Contributor',
    );
    const review = (
      await db.query(
        'select reviewer_name,reviewed_by from public.essay_submissions where student_id=$1',
        [bob],
      )
    ).rows[0];
    assert.equal(review.reviewer_name, 'Former Contributor');
    assert.equal(review.reviewed_by, null);
    await db.query('delete from auth.users where id=$1', [alice]);
    assert.equal(
      (await db.query('select * from public.drafts where user_id=$1', [alice])).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});

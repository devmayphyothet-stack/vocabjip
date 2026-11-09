const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const ids = {
  alice: '10000000-0000-4000-8000-000000000001',
  bob: '10000000-0000-4000-8000-000000000002',
  contributor: '10000000-0000-4000-8000-000000000003',
  admin: '10000000-0000-4000-8000-000000000004',
};

test('database enforces privacy, role assignment, invitations, draft conflicts, and AI budgets', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}', email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;
      grant usage on schema public, auth to anon, authenticated, service_role;
      grant execute on function auth.uid() to anon, authenticated, service_role;
      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    `);
    const schema = fs
      .readFileSync('supabase/schema.sql', 'utf8')
      .replace('create extension if not exists "uuid-ossp";', '')
      .replaceAll('uuid_generate_v4()', 'gen_random_uuid()');
    await db.exec(schema);
    // The migration is intentionally safe to reapply.
    await db.exec(fs.readFileSync('supabase/migrations/202611090001_phase_1_privacy.sql', 'utf8'));
    for (const [name, id] of Object.entries(ids))
      await db.query(
        'insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values ($1,$2,$3,now())',
        [
          id,
          `${name}@example.com`,
          JSON.stringify({ display_name: name, requested_role: 'admin' }),
        ],
      );
    assert.equal(
      (await db.query('select role from public.profiles where id=$1', [ids.alice])).rows[0].role,
      'user',
    );
    await db.query("update public.profiles set role='contributor' where id=$1", [ids.contributor]);
    await db.query("update public.profiles set role='admin' where id=$1", [ids.admin]);
    await db.exec(
      'insert into public.app_settings(key,value) values (\'system_gemini_config\',\'{"primary_key":"test-secret"}\');',
    );
    const as = async (name, action) => {
      await db.exec('reset role');
      await db.query("select set_config('app.uid',$1,false)", [ids[name] || '']);
      await db.exec(
        `set role ${name === 'anon' ? 'anon' : name === 'service_role' ? 'service_role' : 'authenticated'}`,
      );
      try {
        return await action();
      } finally {
        await db.exec('reset role');
      }
    };
    await as('alice', async () => {
      assert.equal((await db.query('select * from public.app_settings')).rows.length, 0);
      assert.equal((await db.query('select * from public.profiles')).rows.length, 1);
      await assert.rejects(
        db.query("update public.profiles set role='admin' where id=$1", [ids.alice]),
        /permission denied/,
      );
      await assert.rejects(
        db.query("select public.set_profile_role($1,'admin')", [ids.alice]),
        /Administrator access/,
      );
      await db.query("update public.profiles set display_name='Alice updated' where id=$1", [
        ids.alice,
      ]);
      await db.query(
        "insert into public.essay_submissions(student_id,content,prompt_title,question_type) values($1,'private essay','topic','Q53')",
        [ids.alice],
      );
      await assert.rejects(
        db.query(
          "insert into public.essay_submissions(student_id,content,prompt_title,question_type) values($1,'spoof','topic','Q53')",
          [ids.bob],
        ),
        /row-level security/,
      );
      await assert.rejects(
        db.query(
          "insert into public.essay_submissions(student_id,content,prompt_title,question_type,score) values($1,'spoof','topic','Q53',30)",
          [ids.alice],
        ),
        /row-level security/,
      );
    });
    await as('bob', async () =>
      assert.equal((await db.query('select * from public.essay_submissions')).rows.length, 0),
    );
    await as('anon', async () => {
      assert.equal((await db.query('select * from public.essay_submissions')).rows.length, 0);
      assert.equal((await db.query('select * from public.app_settings')).rows.length, 0);
      const directory = (await db.query('select * from public.contributor_directory')).rows;
      assert.equal(directory.length, 2);
      assert.equal('email' in directory[0], false);
      await assert.rejects(
        db.exec("update public.contributor_directory set role='user'"),
        /permission denied/,
      );
      await assert.rejects(
        db.exec(
          "insert into public.vocab_lens_cache(word_key,korean,root_word,myanmar_meaning) values ('bad','bad','bad','bad')",
        ),
        /row-level security/,
      );
    });
    await as('contributor', async () => {
      assert.equal((await db.query('select * from public.essay_submissions')).rows.length, 1);
      await assert.rejects(
        db.exec("update public.essay_submissions set content='changed'"),
        /permission denied/,
      );
      await db.query("update public.essay_submissions set status='in_review', reviewed_by=$1", [
        ids.contributor,
      ]);
    });
    await as('contributor', async () => {
      const insertVocab = (status) =>
        db.query(
          "insert into public.vocabularies(id,spoken,written,category,myanmar_meaning,english_meaning,example_korean,example_myanmar,created_by,status) values('test-vocab','a','b','General','m','e','k','m',$1,$2)",
          [ids.contributor, status],
        );
      await assert.rejects(insertVocab('approved'), /row-level security/);
      await insertVocab('draft');
      await assert.rejects(
        db.exec("update public.vocabularies set status='approved' where id='test-vocab'"),
        /row-level security/,
      );
    });
    await as('admin', async () =>
      assert.equal((await db.query('select * from public.app_settings')).rows.length, 1),
    );
    const draftId = '20000000-0000-4000-8000-000000000001';
    const save = (content, date) =>
      db.query("select public.save_draft_if_newer($1,'Q53','Draft',$2,3,$3) as saved", [
        draftId,
        content,
        date,
      ]);
    await as('alice', async () => {
      assert.equal((await save('new', '2026-11-09T12:00:00Z')).rows[0].saved, true);
      assert.equal((await save('old', '2026-11-08T12:00:00Z')).rows[0].saved, false);
      assert.equal((await db.query('select content from public.drafts')).rows[0].content, 'new');
    });
    await as('bob', async () =>
      assert.equal((await db.query('select * from public.drafts')).rows.length, 0),
    );
    await db.exec(
      `insert into public.invitations(code,invited_email,role) values ('INV-PRIVATE','bob@example.com','contributor')`,
    );
    await as('alice', async () => {
      assert.equal((await db.query('select * from public.invitations')).rows.length, 0);
      await assert.rejects(
        db.exec("select public.redeem_contributor_invitation('INV-PRIVATE')"),
        /different email/,
      );
      await assert.rejects(
        db.query('select public.consume_vocab_lens_budget($1)', [ids.alice]),
        /permission denied/,
      );
    });
    await as('bob', async () => {
      await db.exec("select public.redeem_contributor_invitation('INV-PRIVATE')");
      assert.equal(
        (await db.query('select role from public.profiles where id=$1', [ids.bob])).rows[0].role,
        'contributor',
      );
      await assert.rejects(
        db.exec("select public.redeem_contributor_invitation('INV-PRIVATE')"),
        /already used/,
      );
    });
    await as('service_role', async () => {
      for (let count = 0; count < 50; count++)
        assert.equal(
          (await db.query('select public.consume_vocab_lens_budget($1) as allowed', [ids.alice]))
            .rows[0].allowed,
          true,
        );
      assert.equal(
        (await db.query('select public.consume_vocab_lens_budget($1) as allowed', [ids.alice]))
          .rows[0].allowed,
        false,
      );
    });
  } finally {
    await db.close();
  }
});

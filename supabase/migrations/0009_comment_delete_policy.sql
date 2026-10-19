-- FILE: supabase/migrations/0009_comment_delete_policy.sql
-- Drop old author-only delete policy and create scope policy allowing authors AND department leads to delete comments.

drop policy if exists task_comments_delete_author on public.task_comments;
drop policy if exists task_comments_delete_scope on public.task_comments;

create policy task_comments_delete_scope on public.task_comments
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1 from public.tasks t
      where t.id = task_comments.task_id
        and public.can_write_department(t.department)
    )
  );

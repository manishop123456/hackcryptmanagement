# UI style rules

- Mobile-first. Design for a 375 px wide phone first, then scale up.
- Clean, modern, tech-club feel. Dark and light themes. Use shadcn/ui components and Tailwind; no extra UI libraries without asking.
- Primary actions are large and thumb-reachable (check-in button, mark complete).
- Status badges use color AND text/icon (never color alone): Green/Yellow/Red for departments; Present/Late/Flagged/Absent for attendance; the five task statuses.
- Check-in screen: show a short privacy notice, the permission prompt context, clear loading state, and a clear result (verified, late, flagged, rejected) with a human message.
- Empty states and error states are required on every list and form.
- Forms: inline validation, disabled submit while pending, no double submits.
- Tables become cards on small screens.
- Accessible: keyboard navigation, visible focus, contrast AA, labels on inputs.

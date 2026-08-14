# Institution Subaccount and Role Permissions Implementation Plan

**Goal:** Add a first-phase static prototype and product specification for institution subaccounts, roles, and menu permissions.

**Scope:** All institution identities except personal users. No bean recharge, transfer, or consumption-account features.

**Implementation units:**
1. Create `user/member-list.html` for an institution's members, pending activation states, role assignment, and disable interactions.
2. Create `user/member-create.html` to demonstrate registered-account binding and unregistered-phone invitation activation.
3. Create `user/role-list.html` and `user/role-edit.html` to demonstrate built-in/custom roles and menu-operation permission settings.
4. Add the new navigation entry across user-side institution pages and restore the developer-side member entry with the upgraded member page.
5. Create the product proposal, link it from the hub, and add a dated update record.
6. Validate HTML, links, key interaction states, push, and verify the deployed pages.

**Key rules:** A subaccount activates or binds a platform personal account but does not automatically receive personal-user business identity. A first-time account that receives usable agent permissions receives one-time trial eligibility; it never repeats across organizations or roles. Main accounts retain all permissions; a delegated account cannot alter the main account or grant privileges exceeding its own.

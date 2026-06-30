# MoiApp Mobile — One-Page Smoke Test

**Print this page.** ~30 min full path. API: `app.json` → `extra.apiUrl`

| Reviewer | Date | Device | Build (Expo/APK/Web) |
|----------|------|--------|----------------------|
| | | | |

---

## Accounts needed

| Role | Used for |
|------|----------|
| Host | Create event, moi entry, QR |
| Admin | Menu → Admin Panel → **Approvals** |
| Guest | No login — QR or `…/g/{token}` |

---

## Critical path (must pass for release)

| Step | Action | Pass | Fail | Notes |
|:----:|--------|:----:|:----:|-------|
| 1 | Splash → Login (phone or email) → OTP → Home | ☐ | ☐ | |
| 2 | Home → Create New Function → **New Event** → Submit | ☐ | ☐ | |
| 3 | Land on **Pending Approval** (not event dashboard) | ☐ | ☐ | |
| 4 | Try Moi Entry while pending → **blocked** | ☐ | ☐ | |
| 5 | Admin → Approvals → **Approve** that event | ☐ | ☐ | |
| 6 | Host auto-redirects to Event tabs (~5 sec) | ☐ | ☐ | |
| 7 | Event Dashboard → stats + recent entries | ☐ | ☐ | |
| 8 | Add Manual Entry → Payment method → Save moi | ☐ | ☐ | |
| 9 | Moi Entries tab → entry visible, export CSV | ☐ | ☐ | |
| 10 | QR Code → copy link, WhatsApp share | ☐ | ☐ | |
| 11 | Guest opens link → Form → Payment → Receipt | ☐ | ☐ | |
| 12 | Create **Past Event** → moi entry works **without** admin | ☐ | ☐ | |

**Critical path result:** ☐ PASS (all 12) &nbsp; ☐ FAIL (step # _____)

---

## Main tabs (quick check)

| Tab | Open | Data loads | Navigate OK | Pass |
|-----|------|------------|-------------|:----:|
| Home | ☐ | ☐ | ☐ | ☐ |
| Events | ☐ | ☐ | ☐ | ☐ |
| Moi Notebook | ☐ | ☐ | ☐ | ☐ |
| Analytics | ☐ | ☐ | ☐ | ☐ |
| Menu → Settings | ☐ | ☐ | ☐ | ☐ |

---

## Event tabs (approved event)

| Tab | Pass | Notes |
|-----|:----:|-------|
| Dashboard | ☐ | |
| Moi Entries | ☐ | |
| Voice Entry | ☐ | Native = manual text |
| Gift Entry | ☐ | |
| More → Reports / Invitees / Invitation | ☐ | |

---

## Known mobile limits (do not fail smoke test)

- Native Razorpay → browser (use `npm run web` for full checkout)
- Return gifts, reminders, offline sync, language toggle → **web only**
- Forgot password → **web only**

---

## Blockers found

```
1.
2.
3.
```

**Sign-off:** ☐ Ready for testers &nbsp; ☐ Not ready — fix blockers above

**Full checklist:** `mobile/QA_REVIEW_CHECKLIST.md` &nbsp;|&nbsp; **Pre-filled audit:** `mobile/QA_REVIEW_PREFILLED.md`

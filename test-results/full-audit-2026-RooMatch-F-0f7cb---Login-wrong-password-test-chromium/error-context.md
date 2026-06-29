# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-audit-2026.spec.ts >> RooMatch Full UX Audit 2026 >> 07 - Login wrong password test
- Location: e2e/full-audit-2026.spec.ts:259:3

# Error details

```
Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "RooMatch" [level=1] [ref=e6]
      - paragraph [ref=e7]: Welcome back
    - button "Continue with Google" [ref=e8] [cursor=pointer]:
      - img [ref=e9]
      - text: Continue with Google
    - generic [ref=e16]: or
    - generic [ref=e18]:
      - textbox "Email" [ref=e19]: wrong@test.com
      - generic [ref=e20]:
        - generic [ref=e21]:
          - textbox "Password" [ref=e22]: wrongpassword
          - button "Show password" [ref=e23] [cursor=pointer]:
            - img [ref=e24]
        - button "Forgot password?" [ref=e28] [cursor=pointer]
      - button "Sign In" [ref=e29] [cursor=pointer]
    - paragraph [ref=e30]:
      - text: Don't have an account?
      - button "Sign Up" [ref=e31] [cursor=pointer]
```
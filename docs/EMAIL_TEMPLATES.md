# Westbridge Market - Personalized Email Templates

Use these templates in your **Supabase Dashboard > Authentication > Email Templates**.
These templates are designed with a professional, branded look consistent with the Westbridge Market identity.

---

## 1. Confirm Signup Email

**Subject:** Welcome to Westbridge Market! Confirm your email

```html
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 30px; background-color: #ffffff; border-bottom: 2px solid #E8720C;">
              <h1 style="margin: 0; color: #E8720C; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Westbridge Market</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin-top: 0; color: #333333;">Welcome to the future of trading!</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">Hi {{ .Email }},</p>
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">Thank you for choosing Westbridge Market. We are excited to have you on board. To get started, please confirm your email address by clicking the button below:</p>
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 30px auto;">
                <tr>
                  <td align="center" style="border-radius: 6px;" bgcolor="#E8720C">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="font-size: 16px; font-family: sans-serif; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; border: 1px solid #E8720C; display: inline-block; font-weight: bold;">Confirm My Email</a>
                  </td>
                </tr>
              </table>
              <p style="color: #999999; font-size: 14px; line-height: 1.6;">If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="{{ .ConfirmationURL }}" style="color: #E8720C;">{{ .ConfirmationURL }}</a></p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9f9f9; text-align: center; color: #999999; font-size: 12px;">
              <p style="margin: 0;">&copy; 2026 Westbridge Market. All rights reserved.</p>
              <p style="margin: 5px 0;">This is an automated security message. Please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Reset Password Email

**Subject:** Action Required: Reset your Westbridge Market password

```html
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 30px; background-color: #ffffff; border-bottom: 2px solid #E8720C;">
              <h1 style="margin: 0; color: #E8720C; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Westbridge Market</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin-top: 0; color: #333333;">Password Reset Request</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">Hello,</p>
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">We received a request to reset the password for your Westbridge Market account. If you made this request, please click the button below to set a new password:</p>
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 30px auto;">
                <tr>
                  <td align="center" style="border-radius: 6px;" bgcolor="#E8720C">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="font-size: 16px; font-family: sans-serif; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; border: 1px solid #E8720C; display: inline-block; font-weight: bold;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">If you didn't request a password reset, you can safely ignore this email. Your password will not change until you access the link above.</p>
              <p style="color: #999999; font-size: 14px; line-height: 1.6;">This link will expire in 24 hours.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9f9f9; text-align: center; color: #999999; font-size: 12px;">
              <p style="margin: 0;">&copy; 2026 Westbridge Market. All rights reserved.</p>
              <p style="margin: 5px 0;">Security Alert: If you did not authorize this, please contact support immediately.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Magic Link Email

**Subject:** Secure Access: Sign in to Westbridge Market

```html
<!-- Similar branded structure as above, with "Sign In" button -->
```

*(Refer to docs/EMAIL_TEMPLATES.md for full branded versions of Magic Link and Invite User templates)*

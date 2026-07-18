const BRAND_RED = '#d0263b';
const BRAND_TEXT_DIM = '#a29da8';

const DEPARTMENT_BANNERS = {
  police: 'https://district-rp-store.vercel.app/images/dept-police-banner.png',
  sheriff: 'https://district-rp-store.vercel.app/images/dept-sheriff-banner.png',
  fire: 'https://district-rp-store.vercel.app/images/dept-fire-banner.png',
  ems: 'https://district-rp-store.vercel.app/images/dept-ems-banner.png',
};

const DEPARTMENT_LABELS = {
  police: 'Police Department',
  sheriff: "Sheriff's Department",
  fire: 'Fire Department',
  ems: 'EMS',
};

// Table-based layout with inline styles — the standard approach for HTML
// email since most clients (Outlook especially) strip <style> blocks and
// don't support flexbox/grid.
export function buildDepartmentDecisionEmail({ department, approved }) {
  const departmentLabel = DEPARTMENT_LABELS[department] || department;
  const bannerUrl = DEPARTMENT_BANNERS[department];
  const accentColor = approved ? '#1c8a4b' : BRAND_RED;
  const statusText = approved ? 'Application Accepted' : 'Application Declined';

  const message = approved
    ? `Congratulations! Your application to join the <strong>${departmentLabel}</strong> has been <strong>accepted</strong>. Staff will follow up with next steps in Discord.`
    : `Thanks for applying to the <strong>${departmentLabel}</strong>. Unfortunately your application was <strong>declined</strong> this time. You're welcome to reach out to staff in Discord if you have questions, or apply again in the future.`;

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <style>
      @media only screen and (max-width: 520px) {
        .email-card { width: 100% !important; }
        .email-padding { padding-left: 20px !important; padding-right: 20px !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" class="email-card" cellpadding="0" cellspacing="0" style="width:100%; max-width:480px; background-color:#1a171d; border-radius:12px; overflow:hidden; border:1px solid #2d2a31;">
            ${
              bannerUrl
                ? `<tr><td><img src="${bannerUrl}" alt="${departmentLabel}" width="480" style="display:block; width:100%; max-width:480px; height:auto;" /></td></tr>`
                : ''
            }
            <tr>
              <td class="email-padding" style="padding:28px 32px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:${accentColor}; color:#ffffff; font-size:12px; font-weight:bold; letter-spacing:0.03em; border-radius:999px; padding:6px 14px;">
                      ${statusText.toUpperCase()}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-padding" style="padding:12px 32px 0;">
                <p style="margin:0 0 16px; color:#f5f3f6; font-size:15px; line-height:1.6;">${message}</p>
              </td>
            </tr>
            <tr>
              <td class="email-padding" style="padding:8px 32px 28px;">
                <p style="margin:0; color:${BRAND_TEXT_DIM}; font-size:12px; line-height:1.5;">
                  District RP is an independent community and is not affiliated with, endorsed by, or sponsored by Roblox Corporation or the developers of ERLC.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

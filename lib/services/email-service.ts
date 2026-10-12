import fs from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';

// ─── Transport ─────────────────────────────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS?.replace(/\s/g, ''),
    },
    tls: { rejectUnauthorized: false },
  } as nodemailer.TransportOptions);
}

function getLogoPath(): string {
  return path.join(process.cwd(), 'public', 'logo.png');
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
//
//  Primary maroon : #6e1a1f   — deep, rich, institutional
//  Dark maroon    : #4d1116   — header banner
//  Gold accent    : #c8a96a   — decorative rule, subtle accents
//  Warm BG        : #ede9e2   — parchment-like outer background
//  Card           : #ffffff
//  Footer upper   : #2a2a3a   — charcoal
//  Footer lower   : #1a1a28   — near-black
//  Text dark      : #1a1a1e
//  Text mid       : #4a4a5e
//  Text muted     : #8a8a9e
//  Border         : #e2ddd6
//
// All layout is table-based for maximum email client compatibility.
// Inline styles only — no <style> tags (stripped by Gmail, Yahoo, Outlook).
// Logo embedded via CID attachment for offline rendering.

// ─── Shell ─────────────────────────────────────────────────────────────────────

function emailShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Sto. Niño de Praga Academy</title>
</head>
<body style="margin:0;padding:0;background-color:#ede9e2;
             -webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
       style="background-color:#ede9e2;padding:40px 16px 56px;">
<tr><td align="center">

  <!-- Card -->
  <table width="620" cellpadding="0" cellspacing="0" role="presentation"
         style="max-width:620px;width:100%;background-color:#ffffff;
                border:1px solid #d6d0c8;
                box-shadow:0 4px 20px rgba(0,0,0,0.07);">

    <!-- ── GOLD TOP RULE ────────────────────────────────────────────── -->
    <tr>
      <td style="background-color:#c8a96a;height:5px;font-size:0;line-height:0;">&nbsp;</td>
    </tr>

    <!-- ── HEADER ────────────────────────────────────────────────────── -->
    <tr>
      <td style="background-color:#4d1116;padding:36px 48px 30px;text-align:center;">

        <!-- Logo -->
        <img src="cid:school_logo" alt="Sto. Niño de Praga Academy"
             width="72" height="72"
             style="display:inline-block;border-radius:50%;
                    border:2px solid rgba(200,169,106,0.55);
                    margin-bottom:18px;"/>
        <br/>

        <!-- School name -->
        <span style="display:inline-block;color:#ffffff;
                     font-family:Georgia,'Times New Roman',serif;
                     font-size:21px;font-weight:700;letter-spacing:0.5px;
                     line-height:1.35;">
          Sto. Niño de Praga Academy
        </span>
        <br/>

        <!-- Gold decorative rule -->
        <table width="240" cellpadding="0" cellspacing="0" role="presentation"
               style="margin:12px auto 10px;">
          <tr>
            <td style="background-color:#c8a96a;height:1px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>

        <!-- Subtitle -->
        <span style="display:inline-block;color:rgba(255,255,255,0.60);
                     font-family:Georgia,'Times New Roman',serif;
                     font-size:11px;font-style:italic;letter-spacing:0.3px;">
          of La Paz Homes II, Inc.
        </span>
        <br/>

        <!-- Contact -->
        <span style="display:inline-block;color:rgba(255,255,255,0.45);
                     font-family:'Courier New',Courier,monospace;
                     font-size:10px;letter-spacing:1px;
                     text-transform:uppercase;margin-top:10px;">
          <a href="mailto:stninomain@gmail.com"
             style="color:rgba(255,255,255,0.45);text-decoration:none;
                    font-family:'Courier New',Courier,monospace;
                    font-size:10px;letter-spacing:1px;text-transform:uppercase;">
            <span style="color:rgba(255,255,255,0.45);">stninomain@gmail.com</span>
          </a>
          &nbsp;·&nbsp; La Paz Homes II, Philippines
        </span>
      </td>
    </tr>

    <!-- ── MAROON ACCENT LINE ─────────────────────────────────────────── -->
    <tr>
      <td style="background-color:#6e1a1f;height:3px;font-size:0;line-height:0;">&nbsp;</td>
    </tr>

    <!-- ── BODY ──────────────────────────────────────────────────────── -->
    <tr>
      <td style="padding:44px 52px 36px;background-color:#ffffff;">

        <!-- Date reference line -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="margin-bottom:32px;">
          <tr>
            <td style="color:#8a8a9e;font-family:'Courier New',Courier,monospace;
                       font-size:11px;letter-spacing:0.8px;text-transform:uppercase;
                       border-bottom:1px solid #e2ddd6;padding-bottom:14px;">
              ${formatDate()}
            </td>
          </tr>
        </table>

        <!-- Dynamic content -->
        ${bodyHtml}

        <!-- Bottom rule -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="margin-top:36px;">
          <tr>
            <td style="border-top:1px solid #e2ddd6;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- ── FOOTER ─────────────────────────────────────────────────────── -->
    <tr>
      <td style="background-color:#2a2a3a;padding:22px 48px;text-align:center;">

        <!-- Decorative rule -->
        <table width="48" cellpadding="0" cellspacing="0" role="presentation"
               style="margin:0 auto 14px;">
          <tr>
            <td style="background-color:#c8a96a;height:1px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>

        <p style="margin:0 0 4px;color:#f0ece4;font-family:Georgia,'Times New Roman',serif;
                  font-size:12px;font-weight:700;letter-spacing:0.3px;">
          Sto. Niño de Praga Academy of La Paz Homes II, Inc.
        </p>
        <p style="margin:0 0 14px;color:rgba(255,255,255,0.42);
                  font-family:'Courier New',Courier,monospace;
                  font-size:10px;letter-spacing:0.8px;text-transform:uppercase;">
          La Paz Homes II, Philippines &nbsp;·&nbsp;
          <a href="mailto:stninomain@gmail.com"
             style="color:rgba(255,255,255,0.42);text-decoration:none;
                    font-family:'Courier New',Courier,monospace;
                    font-size:10px;letter-spacing:0.8px;text-transform:uppercase;">
            <span style="color:rgba(255,255,255,0.42);">stninomain@gmail.com</span>
          </a>
        </p>
      </td>
    </tr>

    <!-- ── LEGAL FOOTER ───────────────────────────────────────────────── -->
    <tr>
      <td style="background-color:#1a1a28;padding:14px 48px;text-align:center;">
        <p style="margin:0;color:rgba(255,255,255,0.28);font-family:Arial,sans-serif;
                  font-size:10px;line-height:1.7;font-style:italic;">
          This is an official communication from Sto. Niño de Praga Academy.
          Please do not reply directly to this email address.
        </p>
      </td>
    </tr>

    <!-- ── GOLD BOTTOM RULE ───────────────────────────────────────────── -->
    <tr>
      <td style="background-color:#c8a96a;height:3px;font-size:0;line-height:0;">&nbsp;</td>
    </tr>

  </table>
  <!-- /Card -->

</td></tr>
</table>

</body>
</html>`;
}

// ─── Building blocks ────────────────────────────────────────────────────────────

function sectionTitle(text: string): string {
  return `<h2 style="margin:0 0 6px;color:#4d1116;
                     font-family:Georgia,'Times New Roman',serif;
                     font-size:19px;font-weight:700;line-height:1.4;letter-spacing:0.2px;">
    ${text}
  </h2>
  <table width="40" cellpadding="0" cellspacing="0" role="presentation"
         style="margin:0 0 24px;">
    <tr>
      <td style="background-color:#c8a96a;height:2px;font-size:0;line-height:0;">&nbsp;</td>
    </tr>
  </table>`;
}

function salutation(name: string): string {
  return `<p style="margin:0 0 18px;color:#1a1a1e;font-family:Georgia,'Times New Roman',serif;
                    font-size:15px;line-height:1.6;">
    Dear <strong style="color:#1a1a1e;">${name}</strong>,
  </p>`;
}

function para(text: string): string {
  return `<p style="margin:0 0 16px;color:#4a4a5e;font-family:Arial,sans-serif;
                    font-size:14px;line-height:1.85;">${text}</p>`;
}

/**
 * Status badge — displayed just below the section title.
 * type: 'success' | 'danger' | 'warning' | 'info'
 */
function statusBadge(
  label: string,
  type: 'success' | 'danger' | 'warning' | 'info'
): string {
  const colors = {
    success: {
      bg: '#edfaf3',
      text: '#166534',
      border: '#bbf7d0',
      dot: '#22c55e',
    },
    danger: {
      bg: '#fef2f2',
      text: '#991b1b',
      border: '#fecaca',
      dot: '#ef4444',
    },
    warning: {
      bg: '#fffbeb',
      text: '#92400e',
      border: '#fde68a',
      dot: '#f59e0b',
    },
    info: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', dot: '#3b82f6' },
  };
  const c = colors[type];
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 22px;">
    <tr>
      <td style="background-color:${c.bg};color:${c.text};
                 padding:5px 14px 5px 10px;
                 border:1px solid ${c.border};border-radius:3px;
                 font-family:'Courier New',Courier,monospace;
                 font-size:10px;font-weight:700;
                 text-transform:uppercase;letter-spacing:1.2px;
                 white-space:nowrap;">
        <span style="color:${c.dot};margin-right:6px;font-size:9px;">&#9679;</span>${label}
      </td>
    </tr>
  </table>`;
}

/**
 * Info box with optional title and key-value rows.
 */
function infoBox(
  title: string | null,
  rows: string,
  accentColor = '#6e1a1f'
): string {
  const titleHtml = title
    ? `<p style="margin:0 0 14px;color:${accentColor};
                font-family:'Courier New',Courier,monospace;
                font-size:10px;font-weight:700;
                text-transform:uppercase;letter-spacing:1.2px;">
         ${title}
       </p>`
    : '';
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="margin:20px 0;background-color:#faf8f5;
                 border:1px solid #e2ddd6;
                 border-left:4px solid ${accentColor};">
    <tr><td style="padding:18px 20px;">
      ${titleHtml}
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${rows}
      </table>
    </td></tr>
  </table>`;
}

/**
 * Single key-value row inside an infoBox.
 */
function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 16px 6px 0;color:#8a8a9e;
               font-family:'Courier New',Courier,monospace;
               font-size:11px;text-transform:uppercase;letter-spacing:0.6px;
               white-space:nowrap;vertical-align:top;width:38%;">
      ${label}
    </td>
    <td style="padding:6px 0;color:#1a1a1e;font-family:Arial,sans-serif;
               font-size:13px;font-weight:600;vertical-align:top;line-height:1.5;">
      ${value}
    </td>
  </tr>`;
}

/**
 * Warning / security notice box (amber).
 */
function warningBox(text: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="margin:20px 0;background-color:#fefce8;
                 border:1px solid #fde68a;border-left:4px solid #d97706;">
    <tr><td style="padding:14px 18px;">
      <p style="margin:0;color:#78350f;font-family:Arial,sans-serif;
                font-size:13px;line-height:1.7;">
        <strong style="color:#92400e;font-family:'Courier New',Courier,monospace;
                        font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">
          &#9651;&nbsp; Security Notice:
        </strong>
        &nbsp;${text}
      </p>
    </td></tr>
  </table>`;
}

/**
 * Neutral info notice box (blue).
 */
function noteBox(text: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="margin:20px 0;background-color:#f0f7ff;
                 border:1px solid #bfdbfe;border-left:4px solid #3b82f6;">
    <tr><td style="padding:14px 18px;">
      <p style="margin:0;color:#1e3a8a;font-family:Arial,sans-serif;
                font-size:13px;line-height:1.7;">${text}</p>
    </td></tr>
  </table>`;
}

/**
 * CTA button — centered, maroon.
 */
function actionBtn(href: string, label: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="margin:28px 0;">
    <tr><td align="center">
      <a href="${href}"
         style="display:inline-block;background-color:#6e1a1f;color:#ffffff;
                padding:13px 40px;text-decoration:none;border-radius:2px;
                font-family:'Courier New',Courier,monospace;font-weight:700;
                font-size:11px;letter-spacing:1.5px;text-transform:uppercase;
                line-height:1;border-bottom:3px solid #4d1116;">
        <span style="color:#ffffff;text-decoration:none;">${label}</span>
      </a>
    </td></tr>
  </table>`;
}

/**
 * Closing signature block.
 */
function closing(
  signerName = 'The Admissions Office',
  signerTitle = 'Sto. Niño de Praga Academy'
): string {
  return `<p style="margin:28px 0 8px;color:#4a4a5e;font-family:Arial,sans-serif;font-size:14px;">
    Respectfully yours,
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td style="border-left:3px solid #c8a96a;padding:6px 0 6px 14px;">
        <p style="margin:0 0 2px;color:#1a1a1e;
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:14px;font-weight:700;">
          ${signerName}
        </p>
        <p style="margin:0;color:#8a8a9e;
                  font-family:'Courier New',Courier,monospace;
                  font-size:11px;text-transform:uppercase;letter-spacing:0.8px;">
          ${signerTitle}
        </p>
      </td>
    </tr>
  </table>`;
}

// ─── Interfaces ─────────────────────────────────────────────────────────────────

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface LoginCredentials {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'parent' | 'teacher';
  loginUrl: string;
}

interface AdmissionApprovalData {
  parentName: string;
  studentFirstName: string;
  studentLastName: string;
  email: string;
  password: string;
  gradeLevel: string;
  loginUrl: string;
}

interface AdmissionRejectionData {
  parentName: string;
  studentFirstName: string;
  studentLastName: string;
  email: string;
  reason: string;
}

interface AttendanceNotificationData {
  parentEmail: string;
  studentName: string;
  gradeLevel: string;
  section: string;
  scanType: 'timein' | 'timeout';
  scanTime: string;
}

interface EnrollmentRejectionData {
  to: string;
  studentName: string;
  gradeLevel: string;
  schoolYear: string;
  adminNotes?: string | null;
}

interface GradeRejectionData {
  to: string;
  studentName: string;
  subject: string;
  quarter: string | number | null;
  adminNotes?: string | null;
}

interface GradeRejectionToTeacherData {
  to: string;
  teacherName: string;
  studentName: string;
  subject: string;
  quarter: string | number | null;
  reason: string;
}

interface GradesApprovedToTeacherData {
  to: string;
  teacherName: string;
  // One line per subject/quarter in the approved batch
  groups: { subject: string; quarter: string | number | null; passed: number; failed: number }[];
}

interface AutoRejectData {
  to: string;
  studentName: string;
  gradeLevel: string;
  schoolYear: string;
  hoursThreshold: number;
}

// ─── Email service ───────────────────────────────────────────────────────────────

export class EmailService {
  static async sendEmail(options: EmailOptions): Promise<void> {
    const logoPath = getLogoPath();
    const hasLogo = fs.existsSync(logoPath);
    const transporter = createTransporter();
    try {
      const response = await transporter.sendMail({
        from: `"Sto. Niño de Praga Academy" <${process.env.SMTP_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: hasLogo
          ? [{ filename: 'logo.png', path: logoPath, cid: 'school_logo' }]
          : [],
      });
      console.log(`[email] sent to ${options.to} — ${response.messageId}`);
    } finally {
      transporter.close();
    }
  }

  // ── Welcome / Login Credentials ─────────────────────────────────────────────

  static async sendLoginCredentials(
    credentials: LoginCredentials
  ): Promise<void> {
    const role =
      credentials.role.charAt(0).toUpperCase() + credentials.role.slice(1);

    const html = emailShell(`
      ${sectionTitle('Welcome to Sto. Niño de Praga Academy')}
      ${salutation(credentials.name)}
      ${para(`Your <strong>${role.toLowerCase()}</strong> account has been successfully created on the school portal. Please find your login credentials below. Keep this information strictly confidential and do not share it with others.`)}
      ${infoBox(
        'Your Login Credentials',
        infoRow('Email Address', credentials.email) +
          infoRow(
            'Temporary Password',
            `<code style="background:#f3f0ec;padding:3px 8px;border-radius:2px;font-size:12px;font-family:'Courier New',Courier,monospace;color:#4d1116;">${credentials.password}</code>`
          ) +
          infoRow('Account Role', role)
      )}
      ${warningBox('You are required to change your password upon first login. This is mandatory for the security of your account.')}
      ${actionBtn(credentials.loginUrl, 'Access Your Portal')}
      ${para('Should you require any assistance, please do not hesitate to reach out to the school administration.')}
      ${closing()}
    `);

    const text = `Welcome to Sto. Niño de Praga Academy\n\nDear ${credentials.name},\n\nYour account has been created.\nEmail: ${credentials.email}\nPassword: ${credentials.password}\nRole: ${role}\n\nPlease change your password after your first login.\nLogin: ${credentials.loginUrl}\n\nRespectfully yours,\nThe Admissions Office\nSto. Niño de Praga Academy`;

    await this.sendEmail({
      to: credentials.email,
      subject: 'Welcome to Sto. Niño de Praga Academy — Your Login Credentials',
      text,
      html,
    });
  }

  // ── Admission Approved ───────────────────────────────────────────────────────

  static async sendAdmissionApproval(
    data: AdmissionApprovalData
  ): Promise<void> {
    const html = emailShell(`
      ${sectionTitle('Admission Application — Decision')}
      ${statusBadge('Application Approved', 'success')}
      ${salutation(data.parentName)}
      ${para(`We are pleased to inform you that the admission application for <strong>${data.studentFirstName} ${data.studentLastName}</strong> has been reviewed and approved by the Admissions Committee of Sto. Niño de Praga Academy.`)}
      ${para('A student portal account has been created. Please find the access credentials below:')}
      ${infoBox(
        'Student Portal Access',
        infoRow(
          'Student Name',
          `${data.studentFirstName} ${data.studentLastName}`
        ) +
          infoRow('Email Address', data.email) +
          infoRow(
            'Temporary Password',
            `<code style="background:#f3f0ec;padding:3px 8px;border-radius:2px;font-size:12px;font-family:'Courier New',Courier,monospace;color:#4d1116;">${data.password}</code>`
          ) +
          infoRow('Grade Level', data.gradeLevel)
      )}
      ${warningBox('Please change the temporary password immediately upon first login to protect the security of the account.')}
      ${actionBtn(data.loginUrl, 'Access Student Portal')}
      ${para('We look forward to welcoming your child into our school community. Should you have any questions, please contact the admissions office at your earliest convenience.')}
      ${closing('The Admissions Office')}
    `);

    const text = `Admission Approved\n\nDear ${data.parentName},\n\nThe admission application for ${data.studentFirstName} ${data.studentLastName} has been approved.\n\nStudent Portal Access:\nEmail: ${data.email}\nTemporary Password: ${data.password}\nGrade Level: ${data.gradeLevel}\n\nPlease change the password after first login.\nLogin: ${data.loginUrl}\n\nRespectfully yours,\nThe Admissions Office\nSto. Niño de Praga Academy`;

    await this.sendEmail({
      to: data.email,
      subject: 'Sto. Niño de Praga Academy — Admission Application Approved',
      text,
      html,
    });
  }

  // ── Admission Rejected ───────────────────────────────────────────────────────

  static async sendAdmissionRejection(
    data: AdmissionRejectionData
  ): Promise<void> {
    const html = emailShell(`
      ${sectionTitle('Admission Application — Decision')}
      ${statusBadge('Application Not Approved', 'danger')}
      ${salutation(data.parentName)}
      ${para(`Thank you for your interest in enrolling <strong>${data.studentFirstName} ${data.studentLastName}</strong> at Sto. Niño de Praga Academy. We sincerely appreciate the time and effort invested in the application process.`)}
      ${para('After thorough review by the Admissions Committee, we regret to inform you that the application has not been approved at this time.')}
      ${
        data.reason
          ? infoBox(
              'Basis for Decision',
              `<tr><td colspan="2" style="padding:4px 0;color:#4a4a5e;font-family:Arial,sans-serif;font-size:13px;line-height:1.75;">${data.reason}</td></tr>`,
              '#b91c1c'
            )
          : ''
      }
      ${noteBox('We encourage you to contact our admissions office for further guidance or to inquire about the possibility of reapplying in a future enrollment period.')}
      ${closing('The Admissions Office')}
    `);

    const text = `Admission Application Update\n\nDear ${data.parentName},\n\nThe admission application for ${data.studentFirstName} ${data.studentLastName} was not approved at this time.\n\n${data.reason ? `Basis for Decision: ${data.reason}\n\n` : ''}Please contact our admissions office if you have questions.\n\nRespectfully yours,\nThe Admissions Office\nSto. Niño de Praga Academy`;

    await this.sendEmail({
      to: data.email,
      subject: 'Sto. Niño de Praga Academy — Admission Application Update',
      text,
      html,
    });
  }

  // ── Enrollment Rejected (by admin) ───────────────────────────────────────────

  static async sendEnrollmentRejection(
    data: EnrollmentRejectionData
  ): Promise<void> {
    const html = emailShell(`
      ${sectionTitle('Enrollment Request — Decision')}
      ${statusBadge('Request Not Approved', 'danger')}
      ${salutation(data.studentName)}
      ${para(`We regret to inform you that your enrollment request for <strong>${data.gradeLevel}</strong> (S.Y. ${data.schoolYear}) has been reviewed and was not approved at this time.`)}
      ${
        data.adminNotes
          ? infoBox(
              'Basis for Decision',
              `<tr><td colspan="2" style="padding:4px 0;color:#4a4a5e;font-family:Arial,sans-serif;font-size:13px;line-height:1.75;">${data.adminNotes}</td></tr>`,
              '#b91c1c'
            )
          : ''
      }
      ${noteBox('If you have questions or would like to discuss this decision, please contact the school administration directly.')}
      ${closing('The Admissions Office')}
    `);

    const text = `Enrollment Request Update\n\nDear ${data.studentName},\n\nYour enrollment request for ${data.gradeLevel} (S.Y. ${data.schoolYear}) was not approved at this time.\n\n${data.adminNotes ? `Basis for Decision: ${data.adminNotes}\n\n` : ''}Please contact the school administration if you have questions.\n\nRespectfully yours,\nThe Admissions Office\nSto. Niño de Praga Academy`;

    await this.sendEmail({
      to: data.to,
      subject: 'Sto. Niño de Praga Academy — Enrollment Request Update',
      text,
      html,
    });
  }

  // ── Enrollment Auto-Rejected (48-hour cron) ──────────────────────────────────

  static async sendEnrollmentAutoReject(data: AutoRejectData): Promise<void> {
    const html = emailShell(`
      ${sectionTitle('Enrollment Request — Update')}
      ${statusBadge('Automatically Closed', 'warning')}
      ${salutation(data.studentName)}
      ${para(`Your enrollment request for <strong>${data.gradeLevel}</strong> (S.Y. ${data.schoolYear}) has been automatically closed. No administrative action was recorded within <strong>${data.hoursThreshold} hours</strong> of submission.`)}
      ${noteBox('This is an automated system action and does not reflect a judgment on your application. You are welcome to submit a new enrollment request at any time.')}
      ${para('If you believe this was processed in error or require assistance, please contact the school administration at your earliest convenience.')}
      ${closing('The Enrollment System', 'Sto. Niño de Praga Academy')}
    `);

    const text = `Enrollment Request Update\n\nDear ${data.studentName},\n\nYour enrollment request for ${data.gradeLevel} (S.Y. ${data.schoolYear}) has been automatically closed after ${data.hoursThreshold} hours with no administrative action.\n\nYou may submit a new request at any time. Please contact the school administration if you need assistance.\n\nRespectfully yours,\nThe Enrollment System\nSto. Niño de Praga Academy`;

    await this.sendEmail({
      to: data.to,
      subject: 'Sto. Niño de Praga Academy — Enrollment Request Closed',
      text,
      html,
    });
  }

  // ── Grade Submission Rejected ────────────────────────────────────────────────

  static async sendGradeRejection(data: GradeRejectionData): Promise<void> {
    const quarterLabel = data.quarter ? `Quarter ${data.quarter}` : 'N/A';

    const html = emailShell(`
      ${sectionTitle('Grade Submission — Update')}
      ${statusBadge('Submission Returned', 'danger')}
      ${salutation(data.studentName)}
      ${para(`The grade submission for <strong>${data.subject}</strong> (${quarterLabel}) has been reviewed and returned by the school administrator for revision.`)}
      ${
        data.adminNotes
          ? infoBox(
              'Administrator Remarks',
              `<tr><td colspan="2" style="padding:4px 0;color:#4a4a5e;font-family:Arial,sans-serif;font-size:13px;line-height:1.75;">${data.adminNotes}</td></tr>`,
              '#b91c1c'
            )
          : ''
      }
      ${noteBox('Please coordinate with your subject teacher or the school administration for further guidance on resubmitting the corrected grades.')}
      ${closing('The Academic Office')}
    `);

    const text = `Grade Submission Update\n\nDear ${data.studentName},\n\nThe grade submission for ${data.subject} (${quarterLabel}) has been returned by the administrator.\n\n${data.adminNotes ? `Remarks: ${data.adminNotes}\n\n` : ''}Please contact your teacher or the school administration for more details.\n\nRespectfully yours,\nThe Academic Office\nSto. Niño de Praga Academy`;

    await this.sendEmail({
      to: data.to,
      subject: 'Sto. Niño de Praga Academy — Grade Submission Update',
      text,
      html,
    });
  }

  // ── Grade Submission Rejected (notify the submitting teacher) ────────────────

  static async sendGradeRejectionToTeacher(
    data: GradeRejectionToTeacherData
  ): Promise<void> {
    const quarterLabel = data.quarter ? `Quarter ${data.quarter}` : 'N/A';

    const html = emailShell(`
      ${sectionTitle('Grade Submission — Returned for Revision')}
      ${statusBadge('Submission Rejected', 'danger')}
      ${salutation(data.teacherName)}
      ${para(`The grade you submitted for <strong>${data.studentName}</strong> in <strong>${data.subject}</strong> (${quarterLabel}) has been reviewed and rejected by the school administrator.`)}
      ${infoBox(
        'Reason for Rejection',
        `<tr><td colspan="2" style="padding:4px 0;color:#4a4a5e;font-family:Arial,sans-serif;font-size:13px;line-height:1.75;">${data.reason}</td></tr>`,
        '#b91c1c'
      )}
      ${noteBox('Please review and resubmit the corrected grade at your earliest convenience.')}
      ${closing('The Academic Office')}
    `);

    const text = `Grade Submission Returned\n\nDear ${data.teacherName},\n\nThe grade you submitted for ${data.studentName} in ${data.subject} (${quarterLabel}) has been rejected.\n\nReason: ${data.reason}\n\nPlease review and resubmit the corrected grade.\n\nRespectfully yours,\nThe Academic Office\nSto. Niño de Praga Academy`;

    await this.sendEmail({
      to: data.to,
      subject: 'Sto. Niño de Praga Academy — Grade Submission Rejected',
      text,
      html,
    });
  }

  // ── Grade Submission Approved (notify the submitting teacher) ────────────────

  static async sendGradesApprovedToTeacher(
    data: GradesApprovedToTeacherData
  ): Promise<void> {
    const lines = data.groups.map((g) => {
      const quarterLabel = g.quarter ? `Quarter ${g.quarter}` : 'N/A';
      return {
        label: `${g.subject} (${quarterLabel})`,
        value: `${g.passed + g.failed} approved — ${g.passed} passed, ${g.failed} failed`,
      };
    });

    const html = emailShell(`
      ${sectionTitle('Grade Submission — Approved')}
      ${statusBadge('Submission Approved', 'success')}
      ${salutation(data.teacherName)}
      ${para('The grades you submitted have been reviewed and approved by the school administrator.')}
      ${infoBox('Approved Grades', lines.map((l) => infoRow(l.label, l.value)).join(''))}
      ${closing('The Academic Office')}
    `);

    const text = `Grade Submission Approved\n\nDear ${data.teacherName},\n\nThe grades you submitted have been approved:\n\n${lines.map((l) => `- ${l.label}: ${l.value}`).join('\n')}\n\nRespectfully yours,\nThe Academic Office\nSto. Niño de Praga Academy`;

    await this.sendEmail({
      to: data.to,
      subject: 'Sto. Niño de Praga Academy — Grade Submission Approved',
      text,
      html,
    });
  }

  // ── Attendance Notification ──────────────────────────────────────────────────

  static async sendAttendanceNotification(
    data: AttendanceNotificationData
  ): Promise<void> {
    const isTimeIn = data.scanType === 'timein';
    const actionLabel = isTimeIn
      ? 'Time In — Arrived at School'
      : 'Time Out — Left School';
    const accentColor = isTimeIn ? '#15803d' : '#b45309';
    const badgeType = isTimeIn ? 'success' : ('warning' as const);
    const badgeLabel = isTimeIn ? 'Arrived at School' : 'Left School';
    const actionVerb = isTimeIn ? 'arrived at school' : 'left school';

    const html = emailShell(`
      ${sectionTitle('Attendance Notification')}
      ${statusBadge(badgeLabel, badgeType)}
      ${salutation('Guardian')}
      ${para(`This is an automated notification to inform you that your child has <strong>${actionVerb}</strong>, as recorded by the school's RFID attendance monitoring system.`)}
      ${infoBox(
        'Attendance Record',
        infoRow('Student Name', data.studentName) +
          infoRow(
            'Grade &amp; Section',
            `${data.gradeLevel} — ${data.section}`
          ) +
          infoRow('Activity', actionLabel) +
          infoRow('Date &amp; Time', data.scanTime),
        accentColor
      )}
      ${noteBox("If you believe this notification was sent in error or have concerns regarding your child's attendance, please contact the school immediately.")}
      ${closing('Attendance Monitoring System', 'Sto. Niño de Praga Academy')}
    `);

    const text = `Attendance Notification\n\nDear Guardian,\n\nYour child ${data.studentName} has ${actionVerb}.\n\nGrade & Section: ${data.gradeLevel} — ${data.section}\nActivity: ${actionLabel}\nDate & Time: ${data.scanTime}\n\nThis is an automated notification from the RFID attendance system.\n\nRespectfully yours,\nAttendance Monitoring System\nSto. Niño de Praga Academy`;

    await this.sendEmail({
      to: data.parentEmail,
      subject: `Attendance Alert — ${data.studentName} has ${actionVerb}`,
      text,
      html,
    });
  }

  // ── SMTP Test Email ──────────────────────────────────────────────────────────

  static async sendTestEmail(to: string): Promise<void> {
    const now = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' });

    const html = emailShell(`
      ${sectionTitle('SMTP Configuration Test')}
      ${statusBadge('SMTP Working', 'success')}
      ${para('This is a test email dispatched from the Sto. Niño de Praga Academy admin portal to confirm that the SMTP email configuration is functioning correctly.')}
      ${infoBox(
        'Test Details',
        infoRow('Sent At', now) +
          infoRow('Sent To', to) +
          infoRow(
            'Status',
            '<span style="color:#15803d;font-weight:700;font-family:Arial,sans-serif;">Delivered Successfully</span>'
          )
      )}
      ${noteBox('If you received this email, your SMTP configuration is properly set up. No further action is required.')}
      ${closing('System Administrator', 'Sto. Niño de Praga Academy Portal')}
    `);

    const text = `SMTP Test Email\n\nThis is a test email sent at ${now}.\n\nIf you received this, your SMTP configuration is working correctly.\n\n— Sto. Niño de Praga Academy Portal`;

    await this.sendEmail({
      to,
      subject: 'Sto. Niño de Praga Academy — SMTP Configuration Test',
      text,
      html,
    });
  }

  // ── Ad-hoc composed email (wraps plain text in letterhead) ──────────────────

  static async sendComposedEmail(
    to: string,
    subject: string,
    bodyText: string
  ): Promise<void> {
    const bodyHtml = bodyText
      .split(/\n{2,}/)
      .map(
        (block) =>
          `<p style="margin:0 0 16px;color:#4a4a5e;font-family:Arial,sans-serif;
                   font-size:14px;line-height:1.85;">${block
                     .replace(/&/g, '&amp;')
                     .replace(/</g, '&lt;')
                     .replace(/>/g, '&gt;')
                     .replace(/\n/g, '<br/>')}</p>`
      )
      .join('');

    const html = emailShell(bodyHtml);
    await this.sendEmail({ to, subject, text: bodyText, html });
  }
}

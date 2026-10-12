import { getActiveSchoolYear } from '@/lib/school-year'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from "next/server"

// Defaults mirror the content that used to be hardcoded in app/terms/page.tsx
// and app/privacy/page.tsx, so switching to admin-editable content doesn't
// change anything visible until an admin actually edits it.
// Format: blank-line-separated paragraphs, "## " starts a heading, lines
// starting with "- " form a bullet list — parsed by components/LegalContent.tsx.
// Plain text only (no HTML/Markdown lib), since this renders on a public page.
const DEFAULT_TERMS_CONTENT = `## 1. Acceptance of Terms

By accessing or using the Sto. Niño de Praga Academy online portal and related services ("Services"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Services.

## 2. Use of the Portal

The portal is provided exclusively for students, guardians, parents, and school staff of Sto. Niño de Praga Academy. Access credentials are personal and non-transferable. You are responsible for maintaining the confidentiality of your account and password.

- Do not share your login credentials with others.
- Log out after each session, especially on shared devices.
- Report any unauthorized access to the school administration immediately.

## 3. Student and Guardian Accounts

Accounts are created and managed by the school administration. Students and guardians may access their respective portals to view grades, attendance records, announcements, and enrollment information. Any discrepancy in records must be reported to the school registrar.

## 4. Enrollment and Admission

Submission of an enrollment or admission inquiry through this portal does not guarantee enrollment. Final acceptance is subject to the school's admission process, available slots, and compliance with all requirements. The school reserves the right to approve or deny any application.

## 5. Prohibited Conduct

You agree not to:

- Attempt to gain unauthorized access to other accounts or systems.
- Upload or transmit harmful, offensive, or unlawful content.
- Use the portal for commercial purposes unrelated to the school.
- Interfere with or disrupt the integrity of the portal or its data.

## 6. Intellectual Property

All content on this portal, including text, logos, images, and software, is the property of Sto. Niño de Praga Academy. Reproduction or redistribution without written permission is prohibited.

## 7. Limitation of Liability

The school shall not be liable for any indirect, incidental, or consequential damages arising from the use of or inability to use the portal. Service availability is provided on a best-effort basis.

## 8. Changes to Terms

The school reserves the right to update these Terms at any time. Continued use of the portal after changes constitutes acceptance of the revised Terms.

## 9. Contact

For questions about these Terms, contact the school administration at info@stnino.ph.`

const DEFAULT_PRIVACY_CONTENT = `## 1. Overview

Sto. Niño de Praga Academy ("the School", "we", "us") is committed to protecting the privacy of students, parents, guardians, and staff. This Privacy Policy explains how we collect, use, and safeguard personal information in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines.

## 2. Information We Collect

We collect the following types of personal information:

- Students: Full name, date of birth, grade level, section, student number, LRN, address, contact details, attendance records, and academic grades.
- Guardians: Full name, relationship to student, contact number, and email address.
- Teachers / Staff: Full name, employee number, contact details, and assigned classes.
- RFID Data: Card identifiers used for attendance tracking purposes only.
- Admission Inquiries: Name, contact information, and previous school details submitted through the portal.

## 3. How We Use Your Information

Personal information is used solely for the following purposes:

- Managing student enrollment and academic records.
- Monitoring and recording daily attendance via the RFID system.
- Communicating school announcements, grades, and updates to students and guardians.
- Processing admission and enrollment applications.
- Generating reports required by the Department of Education (DepEd).

## 4. Data Sharing

We do not sell, rent, or trade personal information to third parties. Information may be shared only with:

- Government agencies as required by law (e.g., DepEd, PSA).
- Authorized school personnel on a need-to-know basis.
- Service providers who assist in operating our portal, under strict confidentiality agreements.

## 5. Data Security

We implement appropriate technical and organizational measures to protect personal data against unauthorized access, alteration, disclosure, or destruction. Access to the portal is secured through password authentication, and sensitive data is encrypted in transit.

## 6. Data Retention

Student records are retained for a minimum period as required by DepEd regulations. Admission inquiry data not resulting in enrollment is deleted after one school year. RFID attendance logs are retained for the current and immediately preceding school year.

## 7. Your Rights

Under RA 10173, you have the right to:

- Access your personal data held by the School.
- Correct inaccurate or incomplete information.
- Object to the processing of your data in certain circumstances.
- Erasure of data that is no longer necessary for its original purpose.

To exercise these rights, contact our Data Protection Officer at info@stnino.ph.

## 8. Cookies

The portal uses session cookies solely to maintain your login state. No third-party tracking or advertising cookies are used.

## 9. Changes to This Policy

We may update this Privacy Policy periodically. Significant changes will be communicated through the school portal or official announcements.

## 10. Contact Us

For privacy-related concerns or requests, please contact the school administration:
Sto. Niño de Praga Academy
Trece Martires City, Cavite, Philippines
Email: info@stnino.ph`

const DEFAULT_SETTINGS: Record<string, string> = {
  schoolName: "Sto Niño de Praga Academy",
  automaticBackup: "true",
  rfidIntegration: "true",
  emailNotifications: "true",
  studentPortal: "true",
  teacherPortal: "true",
  phone: "(02) 123-4567",
  contactEmail: "info@stonino-praga.edu.ph",
  address: "La Paz Homes II, Trece Martires City, Cavite",
  officeHours: "Monday – Friday, 7:00 AM – 5:00 PM",
  passingThreshold: "75",
  footerTagline: "Excellence in Education Since 1998",
  termsContent: DEFAULT_TERMS_CONTENT,
  privacyContent: DEFAULT_PRIVACY_CONTENT,
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("system_settings")
      .select("setting_key, setting_value")

    if (error) {
      console.error("Error fetching settings:", error)
      return NextResponse.json({ success: true, settings: parseSettings({}) })
    }

    const dbSettings: Record<string, string> = {}
    for (const row of data || []) {
      dbSettings[row.setting_key] = row.setting_value || ''
    }

    return NextResponse.json({ success: true, settings: parseSettings(dbSettings) })
  } catch (error: any) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ success: true, settings: parseSettings({}) })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const settingsToSave: Record<string, string> = {
      schoolName:         body.schoolName         || DEFAULT_SETTINGS.schoolName,
      automaticBackup:    String(body.automaticBackup    ?? true),
      rfidIntegration:    String(body.rfidIntegration    ?? true),
      emailNotifications: String(body.emailNotifications ?? true),
      studentPortal:      String(body.studentPortal      ?? true),
      teacherPortal:      String(body.teacherPortal      ?? true),
      phone:        body.phone        || DEFAULT_SETTINGS.phone,
      contactEmail: body.contactEmail || DEFAULT_SETTINGS.contactEmail,
      address:      body.address      || DEFAULT_SETTINGS.address,
      officeHours:  body.officeHours  || DEFAULT_SETTINGS.officeHours,
      passingThreshold: String(body.passingThreshold ?? DEFAULT_SETTINGS.passingThreshold),
      footerTagline:  body.footerTagline  || DEFAULT_SETTINGS.footerTagline,
      termsContent:   body.termsContent   || DEFAULT_SETTINGS.termsContent,
      privacyContent: body.privacyContent || DEFAULT_SETTINGS.privacyContent,
    }

    for (const [key, value] of Object.entries(settingsToSave)) {
      const { data: existing } = await supabase
        .from("system_settings")
        .select("id")
        .eq("setting_key", key)
        .limit(1)

      let error
      if (existing && existing.length > 0) {
        const result = await supabase
          .from("system_settings")
          .update({ setting_value: value, updated_at: new Date().toISOString() })
          .eq("id", existing[0].id)
        error = result.error
      } else {
        const result = await supabase
          .from("system_settings")
          .insert({ setting_key: key, setting_value: value, updated_at: new Date().toISOString() })
        error = result.error
      }

      if (error) console.error(`Error saving setting ${key}:`, error)
    }

    return NextResponse.json({
      success: true,
      settings: parseSettings(settingsToSave),
      message: "Settings saved successfully",
    })
  } catch (error: any) {
    console.error("Error saving settings:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save settings" },
      { status: 500 }
    )
  }
}

function parseSettings(db: Record<string, string>) {
  return {
    schoolName:         db.schoolName         || DEFAULT_SETTINGS.schoolName,
    academicYear:       getActiveSchoolYear(),
    automaticBackup:    (db.automaticBackup    || DEFAULT_SETTINGS.automaticBackup)    === "true",
    rfidIntegration:    (db.rfidIntegration    || DEFAULT_SETTINGS.rfidIntegration)    === "true",
    emailNotifications: (db.emailNotifications || DEFAULT_SETTINGS.emailNotifications) === "true",
    studentPortal:      (db.studentPortal      || DEFAULT_SETTINGS.studentPortal)      === "true",
    teacherPortal:      (db.teacherPortal      || DEFAULT_SETTINGS.teacherPortal)      === "true",
    phone:        db.phone        || DEFAULT_SETTINGS.phone,
    contactEmail: db.contactEmail || DEFAULT_SETTINGS.contactEmail,
    address:      db.address      || DEFAULT_SETTINGS.address,
    officeHours:  db.officeHours  || DEFAULT_SETTINGS.officeHours,
    passingThreshold: parseFloat(db.passingThreshold || DEFAULT_SETTINGS.passingThreshold),
    footerTagline:  db.footerTagline  || DEFAULT_SETTINGS.footerTagline,
    termsContent:   db.termsContent   || DEFAULT_SETTINGS.termsContent,
    privacyContent: db.privacyContent || DEFAULT_SETTINGS.privacyContent,
  }
}

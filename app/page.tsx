'use client';

import { AddressFields } from '@/components/address-fields';
import { EMPTY_ADDRESS, missingAddressFields } from '@/lib/address';

// Most applicants live in the school's city; one click to change
const DEFAULT_ADDRESS = { ...EMPTY_ADDRESS, province: 'Cavite', city: 'Trece Martires City' };
import type React from 'react';

import { SchoolMap } from '@/components/SchoolMap';
import { TermsPrivacyModal } from '@/components/TermsPrivacyModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  getActiveSchoolYear,
  getEnrollmentSchoolYear,
  getSchoolYearOptions,
} from '@/lib/school-year';
import { useAlert } from '@/lib/use-alert';
import {
  Award,
  BookOpen,
  ChevronDown,
  Clock,
  GraduationCap,
  Mail,
  MapPin,
  Menu,
  Phone,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { latestBirthYear } from '@/lib/person';
import { useUser } from './context/user-context';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useUser();
  const [schoolContact, setSchoolContact] = useState({
    schoolName: 'Sto. Niño de Praga Academy',
    phone: '(02) 123-4567',
    contactEmail: 'info@stonino-praga.edu.ph',
    address: 'La Paz Homes II, Trece Martires City, Cavite',
    officeHours: 'Monday - Friday, 7:00 AM - 5:00 PM',
    footerTagline: 'Excellence in Education Since 1998',
  });
  const [liveStats, setLiveStats] = useState<{
    students: number;
    teachers: number;
    classes: number;
    schoolYear: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings) {
          setSchoolContact({
            schoolName: d.settings.schoolName || schoolContact.schoolName,
            phone: d.settings.phone || schoolContact.phone,
            contactEmail: d.settings.contactEmail || schoolContact.contactEmail,
            address: d.settings.address || schoolContact.address,
            officeHours: d.settings.officeHours || schoolContact.officeHours,
            footerTagline:
              d.settings.footerTagline || schoolContact.footerTagline,
          });
        }
      })
      .catch(() => {});
    fetch('/api/public/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setLiveStats(d.stats);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { showAlert } = useAlert();
  const [admissionForm, setAdmissionForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    suffix: '',
    permanentAddress: DEFAULT_ADDRESS,
    currentAddress: DEFAULT_ADDRESS,
    currentSameAsPermanent: false,
    lrn: '',
    parentName: '',
    parentEmail: '',
    emailAddress: '',
    guardianPhone: '+63',
    intendedGradeLevel: '',
    previousSchool: '',
    enrollmentType: 'new',
    schoolYear: getEnrollmentSchoolYear(),
    additionalMessage: '',
  });

  const ENROLLMENT_TYPE_OPTIONS = [
    { value: 'new', label: 'New Student' },
    { value: 'returning', label: 'Returning Student' },
    { value: 'transferee', label: 'Transferee' },
    { value: 'returnee', label: 'Returnee' },
    { value: 'repeater', label: 'Repeater' },
  ];
  const needsPreviousSchool =
    admissionForm.enrollmentType === 'transferee' ||
    admissionForm.enrollmentType === 'returnee';

  const GRADE_6_AND_BELOW = [
    'kindergarten',
    'grade1',
    'grade2',
    'grade3',
    'grade4',
    'grade5',
    'grade6',
  ];
  const needsParentEmail = GRADE_6_AND_BELOW.includes(
    admissionForm.intendedGradeLevel
  );
  const ADMISSION_SUFFIX_OPTIONS = ['Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V'];
  const [isSubmittingAdmission, setIsSubmittingAdmission] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [agreeAdmissionTerms, setAgreeAdmissionTerms] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [admissionTab, setAdmissionTab] = useState('requirements');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const FAQS = [
    {
      q: 'How much is the tuition fee?',
      a: 'Tuition fees vary by grade level. For the most up-to-date fee schedule, contact our office or send an inquiry through our enrollment form.',
    },
    {
      q: 'How do I enroll a new student?',
      a: 'Go to our Admissions section and fill out the inquiry form. Our admissions team will reach out to guide you through the enrollment process and the next steps.',
    },
    {
      q: 'What are the requirements for a new student?',
      a: 'You will typically need: PSA Birth Certificate (original + photocopy), Report Card / Form 138, Certificate of Good Moral Character, and 2x2 ID photos. Additional requirements may apply depending on grade level.',
    },
    {
      q: 'What grade levels does the school offer?',
      a: 'We offer a complete K-12 program, from Kindergarten through Grade 12, including Junior and Senior High School (JHS and SHS) with a range of strands.',
    },
    {
      q: 'What are the class hours?',
      a: 'Regular classes run from 7:30 AM to 4:00 PM, Monday through Friday. The exact start date is announced before each school year.',
    },
    {
      q: 'Is there a school bus or service?',
      a: 'For the most up-to-date information on school service and other arrangements, contact our office. You may also ask other parents or guardians about their arrangements.',
    },
    {
      q: 'Is there a scholarship or financial assistance program?',
      a: 'We offer merit scholarships for top-performing students. Contact our Student Affairs Office for details on our financial assistance programs.',
    },
  ];

  const scrollToInquiry = () => {
    setAdmissionTab('inquiry');
    document
      .getElementById('admissions')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  // On mobile the tab row scrolls, so the active pill can sit off-screen —
  // scrollToInquiry jumps straight to the last tab. Nudge it into view.
  // Setting scrollLeft (not scrollIntoView) keeps this from touching the
  // page scroll that scrollToInquiry is already animating.
  const tabsListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = tabsListRef.current;
    const active = list?.querySelector<HTMLElement>('[data-state="active"]');
    if (!list || !active) return;
    list.scrollLeft =
      active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
  }, [admissionTab]);

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = [
      ...(/^\d{12}$/.test(admissionForm.lrn) ? [] : ['LRN (12 digits)']),
      ...missingAddressFields(admissionForm.permanentAddress).map((f) => `Permanent ${f}`),
      ...(admissionForm.currentSameAsPermanent
        ? []
        : missingAddressFields(admissionForm.currentAddress).map((f) => `Current ${f}`)),
    ];
    if (missing.length) {
      showAlert({ message: `Please complete: ${missing.join(', ')}`, type: 'warning' });
      return;
    }
    setIsSubmittingAdmission(true);

    try {
      const response = await fetch('/api/admissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: admissionForm.firstName,
          last_name: admissionForm.lastName,
          middle_name: admissionForm.middleName || null,
          date_of_birth: admissionForm.dateOfBirth,
          suffix: admissionForm.suffix || null,
          permanent_address: admissionForm.permanentAddress,
          current_address: admissionForm.currentSameAsPermanent
            ? admissionForm.permanentAddress
            : admissionForm.currentAddress,
          lrn: admissionForm.lrn,
          parent_name: admissionForm.parentName,
          parent_email: admissionForm.parentEmail || null,
          email_address: admissionForm.emailAddress,
          phone_number: admissionForm.guardianPhone,
          guardian_phone: admissionForm.guardianPhone,
          intended_grade_level: admissionForm.intendedGradeLevel,
          previous_school: admissionForm.previousSchool || null,
          enrollment_type: admissionForm.enrollmentType,
          school_year: admissionForm.schoolYear,
          additional_message: admissionForm.additionalMessage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmittedEmail(admissionForm.emailAddress);
        setSubmissionSuccess(true);
        // Reset form
        setAdmissionForm({
          firstName: '',
          lastName: '',
          middleName: '',
          dateOfBirth: '',
          suffix: '',
          permanentAddress: DEFAULT_ADDRESS,
          currentAddress: DEFAULT_ADDRESS,
          currentSameAsPermanent: false,
          lrn: '',
          parentName: '',
          parentEmail: '',
          emailAddress: '',
          guardianPhone: '+63',
          intendedGradeLevel: '',
          previousSchool: '',
          enrollmentType: 'new',
          schoolYear: getEnrollmentSchoolYear(),
          additionalMessage: '',
        });
      } else {
        showAlert({
          message:
            result.error || 'Failed to submit admission. Please try again.',
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Admission submission error:', error);
      showAlert({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setIsSubmittingAdmission(false);
    }
  };

  const link =
    user?.role === 'parent' ? '/parent-dashboard' : `/${user?.role || ''}`;

  const NAV_LINKS = [
    { href: '#home', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#admissions', label: 'Admissions' },
    { href: '#contact', label: 'Contact' },
  ];

  const STATS = liveStats
    ? [
        {
          value: liveStats.students.toLocaleString(),
          label: 'Enrolled Students',
        },
        {
          value: liveStats.teachers.toLocaleString(),
          label: 'Dedicated Educators',
        },
        { value: liveStats.classes.toLocaleString(), label: 'Active Classes' },
      ]
    : [
        { value: null, label: 'Enrolled Students' },
        { value: null, label: 'Dedicated Educators' },
        { value: null, label: 'Active Classes' },
      ];

  const FEATURES = [
    {
      icon: GraduationCap,
      title: 'Academic Excellence',
      desc: 'Rigorous curriculum designed to prepare students for higher education and lifelong success.',
    },
    {
      icon: Users,
      title: 'Small Class Sizes',
      desc: 'Personalized attention through low student-to-teacher ratios for optimal learning.',
    },
    {
      icon: BookOpen,
      title: 'Holistic Education',
      desc: 'Balanced approach combining academics, arts, sports, and spiritual formation.',
    },
    {
      icon: Award,
      title: 'Proven Track Record',
      desc: 'A strong track record of excellence with graduates thriving in top universities and careers.',
    },
  ];

  return (
    <div className="min-h-screen bg-white scroll-smooth">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Sto Niño de Praga Academy"
                width={64}
                height={64}
                className="rounded-full ring-2 ring-red-100 w-10 h-10 sm:w-14 sm:h-14"
              />
              <div className="hidden sm:block">
                <p className="text-md font-bold text-red-900 leading-tight">
                  {schoolContact.schoolName}
                </p>
                <p className="text-sm text-gray-500">
                  {schoolContact.footerTagline}
                </p>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-gray-600 hover:text-red-800 transition-colors relative group"
                >
                  {l.label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-red-800 group-hover:w-full transition-all duration-200" />
                </a>
              ))}
              {user && user.role ? (
                <Link href={link}>
                  <span className="inline-flex items-center text-sm font-semibold bg-red-800 hover:bg-red-700 text-white rounded-full px-5 py-2 transition-colors">
                    Dashboard
                  </span>
                </Link>
              ) : (
                <Link href="/login">
                  <span className="inline-flex items-center text-sm font-semibold bg-red-800 hover:bg-red-700 text-white rounded-full px-5 py-2 transition-colors">
                    Sign In
                  </span>
                </Link>
              )}
            </nav>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 py-4 space-y-1">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-800 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-2 px-3">
                {user && user.role ? (
                  <Link href={link} onClick={() => setMobileMenuOpen(false)}>
                    <span className="flex w-full justify-center text-sm font-semibold bg-red-800 hover:bg-red-700 text-white rounded-full px-5 py-2.5 transition-colors">
                      Dashboard
                    </span>
                  </Link>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <span className="flex w-full justify-center text-sm font-semibold bg-red-800 hover:bg-red-700 text-white rounded-full px-5 py-2.5 transition-colors">
                      Sign In
                    </span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        id="home"
        className="relative overflow-hidden text-white"
        style={{
          backgroundImage: 'url(/stnino_bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-red-950/70" />
        {/* Subtle dot grid on top */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              S.Y. {getActiveSchoolYear()}
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
              Where Young Minds
              <br />
              <span className="text-amber-300">Flourish &amp; Grow.</span>
            </h1>

            <p className="text-base sm:text-lg text-white/70 leading-relaxed mb-10 max-w-xl">
              Nurturing students with quality education, strong Christian
              values, and a community that celebrates every milestone. Serving
              families since 1998.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={scrollToInquiry}
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm px-7 py-3.5 rounded-full transition-all duration-200 active:scale-95 shadow-lg shadow-amber-900/30"
              >
                <GraduationCap className="w-4 h-4" />
                Apply Now
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById('about')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm px-7 py-3.5 rounded-full transition-all duration-200 active:scale-95"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 60L1440 60L1440 30C1200 60 900 0 720 0C540 0 240 60 0 30L0 60Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="bg-white py-10 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                {s.value ? (
                  <p className="text-3xl sm:text-4xl font-extrabold text-red-900 mb-1">
                    {s.value}
                  </p>
                ) : (
                  <div className="h-9 sm:h-10 mb-1 flex items-center justify-center">
                    <span className="inline-block w-14 h-6 sm:h-7 rounded-md bg-red-100 animate-pulse" />
                  </div>
                )}
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT / FEATURES ── */}
      <section id="about" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section label */}
          <div className="max-w-2xl mb-14">
            <span className="text-xs font-bold tracking-widest uppercase text-red-700 mb-3 block">
              Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
              A school that cares about
              <br className="hidden sm:block" /> the whole child.
            </h2>
            <p className="text-gray-500 text-base leading-relaxed">
              We believe education is more than academics. It's about shaping
              confident, compassionate, and capable individuals ready for the
              world.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-6">
            {/* Featured tile: spans 2x2, carries a real photo */}
            <div className="relative overflow-hidden rounded-2xl min-h-[300px] sm:col-span-2 lg:col-span-2 lg:row-span-2 flex flex-col justify-end p-7">
              <img
                src="/stnino1.jpg"
                alt="Students in a Sto. Niño de Praga Academy classroom"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-red-950/50 to-red-950/10" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-5">
                  <GraduationCap className="w-6 h-6 text-amber-300" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">
                  {FEATURES[0].title}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed max-w-xs">
                  {FEATURES[0].desc}
                </p>
              </div>
            </div>

            {/* Two smaller tiles */}
            {[FEATURES[1], FEATURES[2]].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-5 group-hover:bg-red-800 transition-colors">
                  <Icon className="w-6 h-6 text-red-800 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}

            {/* Wide closing tile */}
            <div className="group bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 sm:col-span-2 lg:col-span-2 flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-800 transition-colors">
                <Award className="w-6 h-6 text-red-800 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">
                  {FEATURES[3].title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {FEATURES[3].desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ADMISSIONS ── */}
      <section id="admissions" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto mb-14 text-center">
            <span className="text-xs font-bold tracking-widest uppercase text-red-700 mb-3 block">
              Enrollment
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
              Start your journey
              <br className="hidden sm:block" /> to excellence.
            </h2>
            <p className="text-gray-500 text-base leading-relaxed">
              We welcome students eager to learn, grow, and be part of a
              community that celebrates every achievement.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <Tabs
              value={admissionTab}
              onValueChange={setAdmissionTab}
              className="w-full"
            >
              {/* The four triggers are whitespace-nowrap and total ~635px, so
                  they overflowed the page on a phone. One scrolling row below
                  sm — the pill cut off at the right edge is the affordance —
                  and the plain shrink-to-fit pill row from sm up. */}
              <TabsList
                ref={tabsListRef}
                className="flex w-full h-auto justify-start overflow-x-auto scroll-smooth gap-1 bg-gray-100 rounded-full p-1 mb-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:inline-flex sm:w-auto sm:justify-center sm:overflow-visible"
              >
                <TabsTrigger
                  value="requirements"
                  className="rounded-full shrink-0 text-sm px-5 py-2.5 sm:py-2 data-[state=active]:bg-red-800 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  Requirements
                </TabsTrigger>
                <TabsTrigger
                  value="process"
                  className="rounded-full shrink-0 text-sm px-5 py-2.5 sm:py-2 data-[state=active]:bg-red-800 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  Enrollment Process
                </TabsTrigger>
                <TabsTrigger
                  value="terms"
                  className="rounded-full shrink-0 text-sm px-5 py-2.5 sm:py-2 data-[state=active]:bg-red-800 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  Definition of Terms
                </TabsTrigger>
                <TabsTrigger
                  value="inquiry"
                  className="rounded-full shrink-0 text-sm px-5 py-2.5 sm:py-2 data-[state=active]:bg-red-800 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  Submit Inquiry
                </TabsTrigger>
              </TabsList>

              {/* Requirements tab */}
              <TabsContent value="requirements">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-gray-50 rounded-2xl p-8 border border-gray-100 space-y-8">
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-red-800 text-white text-xs flex items-center justify-center font-bold">
                          1
                        </span>
                        For New Students
                      </h4>
                      <ul className="space-y-2.5">
                        {[
                          'Completed application form',
                          'Birth certificate (original & photocopy)',
                          'Report card from previous school',
                          'Certificate of good moral character',
                          'Medical certificate',
                          '2×2 ID photos (4 pieces)',
                          'Entrance examination (scheduled post-application)',
                        ].map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2.5 text-sm text-gray-600"
                          >
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-red-800 text-white text-xs flex items-center justify-center font-bold">
                          2
                        </span>
                        For Transferees
                      </h4>
                      <ul className="space-y-2.5">
                        {[
                          'All requirements for new students',
                          'Transfer credentials (Form 137)',
                          'Certificate of enrollment from previous school',
                          'Honorable dismissal',
                        ].map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2.5 text-sm text-gray-600"
                          >
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Important dates card */}
                  <div className="bg-red-900 text-white rounded-2xl p-8 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold tracking-widest uppercase text-red-300 mb-4">
                        Important Dates
                      </p>
                      <div className="space-y-5">
                        {[
                          {
                            period: 'March - May',
                            label: 'Application Period',
                          },
                          {
                            period: 'April - May',
                            label: 'Entrance Examination',
                          },
                          { period: 'June', label: 'Enrollment Period' },
                        ].map((d) => (
                          <div
                            key={d.label}
                            className="border-b border-white/10 pb-5 last:border-0 last:pb-0"
                          >
                            <p className="text-lg font-bold text-amber-300">
                              {d.period}
                            </p>
                            <p className="text-sm text-white/70 mt-0.5">
                              {d.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={scrollToInquiry}
                      className="mt-8 w-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm py-3 rounded-xl transition-colors"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              </TabsContent>

              {/* Enrollment Process tab */}
              <TabsContent value="process">
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                  <ol className="space-y-6">
                    {[
                      {
                        title: 'Submit an Inquiry',
                        desc: 'Fill out the Admission Inquiry Form under the "Submit Inquiry" tab with the applicant\'s and guardian\'s information.',
                      },
                      {
                        title: 'Document Submission',
                        desc: "Once contacted by our admissions team, bring the required documents (see the Requirements tab) to the registrar's office.",
                      },
                      {
                        title: 'Entrance Examination',
                        desc: 'New and transferee applicants take a scheduled entrance examination and, when applicable, a brief interview.',
                      },
                      {
                        title: 'Admission Decision',
                        desc: 'The admissions committee reviews the application and examination results, then notifies the guardian by email of the decision.',
                      },
                      {
                        title: 'Enrollment & Payment',
                        desc: 'Approved applicants settle enrollment fees and finalize their class schedule with the registrar.',
                      },
                      {
                        title: 'Start of Classes',
                        desc: "The student attends orientation and begins classes on the school year's official start date.",
                      },
                    ].map((step, i) => (
                      <li key={step.title} className="flex items-start gap-4">
                        <span className="w-7 h-7 rounded-full bg-red-800 text-white text-xs flex items-center justify-center font-bold shrink-0">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-bold text-gray-900 text-sm mb-1">
                            {step.title}
                          </p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </TabsContent>

              {/* Definition of Terms tab */}
              <TabsContent value="terms">
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                  <dl className="divide-y divide-gray-200">
                    {[
                      {
                        term: 'LRN (Learner Reference Number)',
                        def: 'The unique 12-digit number assigned by DepEd to every learner in the Philippine basic education system.',
                      },
                      {
                        term: 'Guardian',
                        def: "The parent or legal guardian responsible for the applicant, and the school's primary point of contact.",
                      },
                      {
                        term: 'New Student',
                        def: 'An applicant enrolling in a Philippine school for the very first time.',
                      },
                      {
                        term: 'Transferee',
                        def: 'A student moving in from another school, currently enrolled in the same grade level they are applying for.',
                      },
                      {
                        term: 'Returnee',
                        def: 'A former student of this school who is re-enrolling after an absence.',
                      },
                      {
                        term: 'Repeater',
                        def: 'A student retaking the same grade level they were previously enrolled in.',
                      },
                      {
                        term: 'School Year (S.Y.)',
                        def: 'The academic year the applicant intends to enroll in, e.g. S.Y. 2026-2027.',
                      },
                      {
                        term: 'Intended Grade Level',
                        def: 'The grade level (Kindergarten to Grade 12) the applicant is applying to enter.',
                      },
                    ].map((row) => (
                      <div key={row.term} className="py-3 first:pt-0 last:pb-0">
                        <dt className="font-bold text-gray-900 text-sm">
                          {row.term}
                        </dt>
                        <dd className="text-sm text-gray-600 mt-1 leading-relaxed">
                          {row.def}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </TabsContent>

              {/* Inquiry form tab */}
              <TabsContent value="inquiry">
                {submissionSuccess ? (
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 sm:p-10 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Application Submitted!
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Thank you for your interest in Sto. Niño de Praga Academy.
                      <br />
                      We will contact you at <strong>
                        {submittedEmail}
                      </strong>{' '}
                      with next steps.
                    </p>
                    <button
                      onClick={() => {
                        setSubmissionSuccess(false);
                        setAgreeAdmissionTerms(false);
                      }}
                      className="inline-flex items-center gap-2 bg-red-900 hover:bg-red-800 text-white font-semibold text-sm px-7 py-3 rounded-xl transition-colors"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 sm:p-10">
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        Admission Inquiry Form
                      </h3>
                      <p className="text-sm text-gray-500">
                        Fill out this form and we'll be in touch with program
                        details.
                      </p>
                    </div>
                    <form
                      onSubmit={handleAdmissionSubmit}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_110px] gap-5">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="firstName"
                            className="text-sm font-medium text-gray-700"
                            required
                          >
                            First Name
                          </Label>
                          <Input
                            id="firstName"
                            value={admissionForm.firstName}
                            placeholder="First name"
                            onChange={(e) =>
                              setAdmissionForm({
                                ...admissionForm,
                                firstName: e.target.value,
                              })
                            }
                            required
                            disabled={isSubmittingAdmission}
                            className="h-11 bg-white border-gray-200"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="middleName"
                            className="text-sm font-medium text-gray-700"
                          >
                            Middle Initial
                          </Label>
                          <Input
                            id="middleName"
                            value={admissionForm.middleName}
                            maxLength={3}
                            placeholder="e.g., D"
                            onChange={(e) =>
                              setAdmissionForm({
                                ...admissionForm,
                                middleName: e.target.value,
                              })
                            }
                            disabled={isSubmittingAdmission}
                            className="h-11 bg-white border-gray-200"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="lastName"
                            className="text-sm font-medium text-gray-700"
                            required
                          >
                            Last Name
                          </Label>
                          <Input
                            id="lastName"
                            value={admissionForm.lastName}
                            placeholder="Last name"
                            onChange={(e) =>
                              setAdmissionForm({
                                ...admissionForm,
                                lastName: e.target.value,
                              })
                            }
                            required
                            disabled={isSubmittingAdmission}
                            className="h-11 bg-white border-gray-200"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700">
                            Suffix
                          </Label>
                          <Select
                            value={admissionForm.suffix || 'none'}
                            onValueChange={(v) =>
                              setAdmissionForm({
                                ...admissionForm,
                                suffix: v === 'none' ? '' : v,
                              })
                            }
                            disabled={isSubmittingAdmission}
                          >
                            <SelectTrigger className="h-11 bg-white border-gray-200">
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {ADMISSION_SUFFIX_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="dateOfBirth"
                            className="text-sm font-medium text-gray-700"
                            required
                          >
                            Date of Birth
                          </Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={admissionForm.dateOfBirth}
                            onChange={(e) =>
                              setAdmissionForm({
                                ...admissionForm,
                                dateOfBirth: e.target.value,
                              })
                            }
                            required
                            max={`${latestBirthYear()}-12-31`}
                            title={`Applicants must be born in ${latestBirthYear()} or earlier`}
                            disabled={isSubmittingAdmission}
                            className="h-11 bg-white border-gray-200"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="lrn"
                            className="text-sm font-medium text-gray-700"
                            required
                          >
                            LRN
                          </Label>
                          <Input
                            id="lrn"
                            value={admissionForm.lrn}
                            placeholder="12-digit Learner Reference Number"
                            maxLength={12}
                            onChange={(e) =>
                              setAdmissionForm({
                                ...admissionForm,
                                lrn: e.target.value.replace(/\D/g, ''),
                              })
                            }
                            required
                            minLength={12}
                            pattern="\d{12}"
                            title="12-digit LRN"
                            disabled={isSubmittingAdmission}
                            className="h-11 bg-white border-gray-200"
                          />
                        </div>
                      </div>

                      <fieldset className="space-y-3">
                        <legend className="text-sm font-semibold text-gray-900">
                          Permanent Address
                        </legend>
                        <AddressFields
                          id="permanentAddress"
                          value={admissionForm.permanentAddress}
                          onChange={(v) =>
                            setAdmissionForm({ ...admissionForm, permanentAddress: v })
                          }
                          disabled={isSubmittingAdmission}
                        />
                      </fieldset>

                      <fieldset className="space-y-3">
                        <legend className="text-sm font-semibold text-gray-900">
                          Current Address
                        </legend>
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={admissionForm.currentSameAsPermanent}
                            onChange={(e) =>
                              setAdmissionForm({
                                ...admissionForm,
                                currentSameAsPermanent: e.target.checked,
                              })
                            }
                            disabled={isSubmittingAdmission}
                            className="rounded border-gray-300"
                          />
                          Same as permanent address
                        </label>
                        {!admissionForm.currentSameAsPermanent && (
                          <AddressFields
                            id="currentAddress"
                            value={admissionForm.currentAddress}
                            onChange={(v) =>
                              setAdmissionForm({ ...admissionForm, currentAddress: v })
                            }
                            disabled={isSubmittingAdmission}
                          />
                        )}
                      </fieldset>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="intendedGradeLevel"
                            className="text-sm font-medium text-gray-700"
                            required
                          >
                            Intended Grade Level
                          </Label>
                          <Select
                            value={admissionForm.intendedGradeLevel}
                            onValueChange={(v) =>
                              setAdmissionForm({
                                ...admissionForm,
                                intendedGradeLevel: v,
                              })
                            }
                            disabled={isSubmittingAdmission}
                          >
                            <SelectTrigger className="h-11 bg-white border-gray-200">
                              <SelectValue placeholder="Select grade level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kindergarten">
                                Kindergarten
                              </SelectItem>
                              {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={`grade${i + 1}`}>
                                  Grade {i + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="enrollmentType"
                            className="text-sm font-medium text-gray-700"
                            required
                          >
                            Enrollment Type
                          </Label>
                          <Select
                            value={admissionForm.enrollmentType}
                            onValueChange={(v) =>
                              setAdmissionForm({
                                ...admissionForm,
                                enrollmentType: v,
                              })
                            }
                            disabled={isSubmittingAdmission}
                          >
                            <SelectTrigger className="h-11 bg-white border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ENROLLMENT_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="schoolYear"
                            className="text-sm font-medium text-gray-700"
                            required
                          >
                            School Year to Enroll
                          </Label>
                          <Select
                            value={admissionForm.schoolYear}
                            onValueChange={(v) =>
                              setAdmissionForm({
                                ...admissionForm,
                                schoolYear: v,
                              })
                            }
                            disabled={isSubmittingAdmission}
                          >
                            <SelectTrigger className="h-11 bg-white border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getSchoolYearOptions().map((sy) => (
                                <SelectItem key={sy} value={sy}>
                                  S.Y. {sy}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {needsPreviousSchool && (
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="previousSchool"
                              className="text-sm font-medium text-gray-700"
                            >
                              Previous School
                            </Label>
                            <Input
                              id="previousSchool"
                              value={admissionForm.previousSchool}
                              placeholder="Previous school name"
                              onChange={(e) =>
                                setAdmissionForm({
                                  ...admissionForm,
                                  previousSchool: e.target.value,
                                })
                              }
                              disabled={isSubmittingAdmission}
                              className="h-11 bg-white border-gray-200"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="emailAddress"
                            className="text-sm font-medium text-gray-700"
                            required
                          >
                            Email Address
                          </Label>
                          <Input
                            id="emailAddress"
                            type="email"
                            value={admissionForm.emailAddress}
                            placeholder="you@example.com"
                            onChange={(e) =>
                              setAdmissionForm({
                                ...admissionForm,
                                emailAddress: e.target.value,
                              })
                            }
                            required
                            disabled={isSubmittingAdmission}
                            className="h-11 bg-white border-gray-200"
                          />
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-6 mt-2 space-y-5">
                        <h4 className="font-bold text-gray-900 text-sm">
                          Guardian Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="parentName"
                              className="text-sm font-medium text-gray-700"
                              required
                            >
                              Guardian Name
                            </Label>
                            <Input
                              id="parentName"
                              value={admissionForm.parentName}
                              placeholder="Full name of parent or guardian"
                              onChange={(e) =>
                                setAdmissionForm({
                                  ...admissionForm,
                                  parentName: e.target.value,
                                })
                              }
                              required
                              disabled={isSubmittingAdmission}
                              className="h-11 bg-white border-gray-200"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="parentEmail"
                              className="text-sm font-medium text-gray-700"
                              required={needsParentEmail}
                            >
                              Guardian Email
                              {needsParentEmail && (
                                <span className="ml-1 text-xs text-gray-400 font-normal">
                                  (required for Grade 6 &amp; below)
                                </span>
                              )}
                            </Label>
                            <Input
                              id="parentEmail"
                              type="email"
                              value={admissionForm.parentEmail}
                              placeholder="guardian@example.com"
                              onChange={(e) =>
                                setAdmissionForm({
                                  ...admissionForm,
                                  parentEmail: e.target.value,
                                })
                              }
                              required={needsParentEmail}
                              disabled={isSubmittingAdmission}
                              className="h-11 bg-white border-gray-200"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="guardianPhone"
                              className="text-sm font-medium text-gray-700"
                              required
                            >
                              Guardian's Phone Number
                            </Label>
                            <Input
                              id="guardianPhone"
                              type="tel"
                              maxLength={13}
                              value={admissionForm.guardianPhone}
                              placeholder="+63XXXXXXXXXX"
                              onChange={(e) => {
                                let val = e.target.value;
                                // Always keep +63 prefix; allow only digits after it
                                if (!val.startsWith('+63')) val = '+63';
                                const digits = val
                                  .slice(3)
                                  .replace(/\D/g, '')
                                  .slice(0, 10);
                                setAdmissionForm({
                                  ...admissionForm,
                                  guardianPhone: '+63' + digits,
                                });
                              }}
                              required
                              disabled={isSubmittingAdmission}
                              className="h-11 bg-white border-gray-200"
                            />
                            {admissionForm.guardianPhone.length > 0 &&
                              admissionForm.guardianPhone.length < 13 && (
                                <p className="text-xs text-red-600 mt-1">
                                  Invalid number format. Enter 10 digits after
                                  +63.
                                </p>
                              )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="additionalMessage"
                          className="text-sm font-medium text-gray-700"
                        >
                          Additional Message
                        </Label>
                        <Textarea
                          id="additionalMessage"
                          placeholder="Tell us about your child's interests, needs, or any questions…"
                          value={admissionForm.additionalMessage}
                          onChange={(e) =>
                            setAdmissionForm({
                              ...admissionForm,
                              additionalMessage: e.target.value,
                            })
                          }
                          rows={4}
                          disabled={isSubmittingAdmission}
                          className="bg-white border-gray-200 resize-none"
                        />
                      </div>

                      <div className="flex items-start gap-3 pt-1">
                        <input
                          id="agreeAdmissionTerms"
                          type="checkbox"
                          checked={agreeAdmissionTerms}
                          onChange={(e) => {
                            if (e.target.checked) {
                              e.preventDefault();
                              setTermsModalOpen(true);
                            } else {
                              setAgreeAdmissionTerms(false);
                            }
                          }}
                          onClick={(e) => {
                            if (!agreeAdmissionTerms) {
                              e.preventDefault();
                              setTermsModalOpen(true);
                            }
                          }}
                          disabled={isSubmittingAdmission}
                          className="mt-0.5 w-4 h-4 accent-red-800 cursor-pointer shrink-0"
                        />
                        <label
                          htmlFor="agreeAdmissionTerms"
                          className="text-sm text-gray-600 cursor-pointer leading-relaxed select-none"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!agreeAdmissionTerms) {
                              setTermsModalOpen(true);
                            } else {
                              setAgreeAdmissionTerms(false);
                            }
                          }}
                        >
                          I have read and agree to the{' '}
                          <span className="text-red-700 font-medium">
                            Terms of Service
                          </span>{' '}
                          and{' '}
                          <span className="text-red-700 font-medium">
                            Privacy Policy
                          </span>{' '}
                          of Sto. Niño de Praga Academy.
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingAdmission || !agreeAdmissionTerms}
                        className="w-full h-12 rounded-xl bg-red-900 hover:bg-red-800 text-white font-semibold text-sm transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                      >
                        {isSubmittingAdmission
                          ? 'Submitting…'
                          : 'Submit Inquiry'}
                      </button>
                    </form>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-gray-500 text-base">
              Answers to the questions parents and guardians ask us most often.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className={`border rounded-2xl overflow-hidden transition-colors duration-200 ${
                    isOpen
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <button
                    className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                  >
                    <span
                      className={`font-semibold text-sm sm:text-base leading-snug ${isOpen ? 'text-red-800' : 'text-gray-800'}`}
                    >
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-red-600' : 'text-gray-400'
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-20 sm:py-28 bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
              We'd love to hear from you.
            </h2>
            <p className="text-gray-400 text-base leading-relaxed">
              Have questions about our programs or admissions? Reach out and our
              team will be happy to help.
            </p>
          </div>

          <div className="grid sm:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {[
              {
                Icon: Phone,
                title: 'Phone',
                lines: [schoolContact.phone],
              },
              {
                Icon: Mail,
                title: 'Email',
                lines: [schoolContact.contactEmail],
              },
              {
                Icon: MapPin,
                title: 'Address',
                lines: [schoolContact.address],
              },
              {
                Icon: Clock,
                title: 'Office Hours',
                lines: [schoolContact.officeHours],
              },
            ].map(({ Icon, title, lines }) => (
              <div
                key={title}
                className="bg-gray-900 rounded-2xl p-7 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-red-900/50 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-3">
                  {title}
                </p>
                {lines.map((line) => (
                  <p
                    key={line}
                    className="text-sm text-gray-300 leading-relaxed"
                  >
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>

          {/* Map */}
          <div className="mt-10 max-w-4xl mx-auto">
            <p className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-3">
              Find Us
            </p>
            <SchoolMap />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-black border-t border-gray-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Logo"
                width={36}
                height={36}
                className="rounded-full opacity-80"
              />
              <div>
                <p className="text-sm font-semibold text-white">
                  {schoolContact.schoolName}
                </p>
                <p className="text-xs text-gray-600">
                  {schoolContact.footerTagline}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-1">
              <div className="flex items-center gap-4">
                <Link
                  href="/terms"
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/privacy"
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Privacy Policy
                </Link>
              </div>
              <p className="text-xs text-gray-600 text-center sm:text-right">
                © {new Date().getFullYear()} {schoolContact.schoolName}. All
                rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      <TermsPrivacyModal
        open={termsModalOpen}
        onOpenChange={setTermsModalOpen}
        onAgree={() => {
          setAgreeAdmissionTerms(true);
          setTermsModalOpen(false);
        }}
      />
    </div>
  );
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError } from './api';

export type Lang = 'ar' | 'en';
export type Theme = 'light' | 'dark';

const ar = {
    'app.title': 'اللجنة الدائمة لإدارة مشروع قرية الخيول بمنطقة العقدة',
    'app.subtitle': 'سجل حصر وتخصيص القسائم، رخص البناء، المرابط، وقرارات السحب والتداول',
    'app.badge': 'المنظومة الرقمية الرسمية',
    'app.project': 'مشروع قرية الخيول بمنطقة العقدة',
    'app.emblem': 'العقدة',

    'common.close': 'إغلاق',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.saving': 'جاري الحفظ...',
    'common.loading': 'جاري التحميل...',
    'common.retry': 'إعادة المحاولة',
    'common.refresh': 'تحديث',
    'common.edit': 'تعديل',

    'login.subtitle': 'المنظومة الرقمية الرسمية - تسجيل الدخول',
    'login.username': 'اسم المستخدم',
    'login.password': 'كلمة المرور',
    'login.submit': 'دخول',
    'login.busy': 'جاري الدخول...',

    'revoked.title': 'تم تعليق / سحب صلاحية الوصول',
    'revoked.body': 'تم إيقاف حسابك من قِبل مقرر اللجنة الدائمة. لم يعد بإمكانك استعراض بيانات قسائم وعقود قرية الخيول بمنطقة العقدة أو تعديلها.',
    'revoked.back': 'العودة لشاشة الدخول',

    'sync.connecting': 'جاري الاتصال...',
    'sync.connected': 'متصل ومحدث لحظياً',
    'sync.reconnecting': 'جاري إعادة الاتصال...',
    'sync.disconnected': 'غير متصل',
    'sync.last': 'آخر مزامنة: {time}',

    'header.security': 'إدارة الصلاحيات',
    'header.logout': 'خروج',
    'header.changePassword': 'تغيير كلمة المرور',
    'header.dark': 'الوضع الداكن',
    'header.light': 'الوضع الفاتح',
    'header.otherLang': 'English',

    'role.SUPER_ADMIN_REPORTER': 'مقرر اللجنة',
    'role.PRESIDENT': 'رئيس اللجنة',
    'role.ENGINEER_INSPECTOR': 'عضو لجنة - تراخيص',

    'status.ACTIVE': 'عقد ساري ومنتظم',
    'status.WITHDRAWN': 'مسحوبة / قرار إلغاء',
    'status.IN_PROGRESS': 'رخص قيد الإجراء',
    'status.SWAPPED': 'تبديل / تنازل قسيمة',
    'status.COMPLETED': 'مكتملة البناء بالكامل',

    'stats.all': 'إجمالي القسائم',
    'stats.capacity': 'من 1,000',

    'table.title': 'سجل الحصر الرسمي للقسائم',
    'table.count': 'عرض {shown} من إجمالي {total} سجل',
    'table.search': 'ابحث برقم القسيمة، رقم العقد، اسم المنتفع، أو اسم المربط...',
    'table.clear': 'مسح',
    'table.allStatuses': 'جميع الحالات',
    'table.loading': 'جاري تحميل السجل...',
    'table.emptyTitle': 'لا توجد سجلات مطابقة للبحث أو التصفية الحالية',
    'table.emptyHint': 'تأكد من إدخال رقم القسيمة أو العقد بصورة صحيحة.',
    'table.expired': 'العقد منتهي',
    'table.sort': 'ترتيب حسب {column}',

    'col.serial': 'م',
    'col.beneficiary': 'اسم المنتفع',
    'col.status': 'الحالة',
    'col.plotNo': 'رقم القسيمة',
    'col.stud': 'اسم المربط',
    'col.contractNo': 'رقم العقد',
    'col.lottery': 'تاريخ القرعة',
    'col.expiry': 'انتهاء العقد',
    'col.contact': 'بيانات التواصل',
    'col.permits': 'تراخيص وإتمام البناء',
    'col.requests': 'الطلبات والقرارات',
    'col.letters': 'مخاطبات الإدارة',
    'col.notes': 'الملاحظات',
    'col.actions': 'الإجراءات',

    'action.add': 'إضافة قسيمة',
    'action.swap': 'مبادلة قسيمتين',
    'action.letter': 'كتاب رسمي',
    'action.export': 'تصدير',
    'action.print': 'طباعة',
    'row.view': 'عرض التفاصيل كاملة',
    'row.edit': 'تعديل السجل',
    'row.status': 'تغيير اللون والحالة',
    'row.delete': 'حذف السجل',

    'page.size': '{n} / صفحة',
    'page.range': '{from} – {to} من {total}',
    'page.first': 'الصفحة الأولى',
    'page.prev': 'السابق',
    'page.next': 'التالي',
    'page.last': 'الصفحة الأخيرة',

    'toast.statusChanged': 'تم تغيير تصنيف قسيمة [{plotNo}] إلى: {status}',
    'toast.deleted': 'تم حذف سجل القسيمة [{plotNo}].',
    'toast.exported': 'تم تصدير كشف القسائم بصيغة Excel/CSV بنجاح!',
    'toast.added': 'تمت إضافة القسيمة [{plotNo}] بنجاح.',
    'toast.updated': 'تم تحديث قسيمة [{plotNo}] ومزامنة التعديلات.',
    'toast.swapped': 'تمت المبادلة بنجاح وتوثيقها في سجل المخاطبات!',
    'toast.letterAdded': 'تم إدراج الكتاب الرسمي في ملف القسيمة [{plotNo}].',
    'toast.passwordChanged': 'تم تغيير كلمة المرور بنجاح.',
    'toast.userAdded': 'تمت إضافة المستخدم [{name}].',
    'toast.userUpdated': 'تم تحديث بيانات وصلاحية [{name}].',
    'toast.revoked': 'تم سحب صلاحيات [{name}] فوراً وإقفال النظام عليه!',
    'toast.restored': 'تمت استعادة صلاحية [{name}] بنجاح.',
    'confirm.delete': 'هل تؤكد حذف سجل القسيمة [{plotNo}] للمنتفع ({name})؟',

    'plot.titleAdd': 'إضافة بيانات قسيمة وعقد جديد',
    'plot.titleEdit': 'تعديل سجل القسيمة [{plotNo}]',
    'plot.limited': 'صلاحيتك تسمح بتعديل الحقول غير المظللة فقط.',
    'plot.serial': 'الرقم التسلسلي (م) *',
    'plot.plotNo': 'رقم القسيمة *',
    'plot.plotNoPh': 'مثال: A-102',
    'plot.stud': 'اسم المربط *',
    'plot.studPh': 'مثال: مربط الشقب الأصيل',
    'plot.beneficiary': 'اسم المنتفع *',
    'plot.beneficiaryPh': 'الاسم الرباعي للمنتفع',
    'plot.contact': 'بيانات التواصل (هاتف / بريد)',
    'plot.contactPh': 'مثال: 97412345678 / info@domain.com',
    'plot.contractNo': 'رقم العقد *',
    'plot.contractNoPh': 'مثال: C-2024-058',
    'plot.lottery': 'تاريخ القرعة',
    'plot.expiry': 'تاريخ انتهاء العقد',
    'plot.statusBox': 'الحالة التشغيلية والتمييز اللوني',
    'plot.preview': 'معاينة اللون: {status}',
    'plot.permits': 'إجراءات تراخيص وإتمام البناء',
    'plot.permitsPh': 'موقف رخصة البناء، إتمام البناء، شهادة النظافة، الكهرباء...',
    'plot.requests': 'الطلبات والقرارات المقدمة',
    'plot.requestsPh': 'طلبات التوسعة، طلب مهلة، قرارات اللجنة الصادرة...',
    'plot.letters': 'مخاطبات الإدارة',
    'plot.lettersPh': 'الكتب الصادرة والواردة، الإنذارات الرسمية، الإخطارات...',
    'plot.notes': 'الملاحظات',
    'plot.notesPh': 'أي ملاحظات فنية أو إدارية تخص القسيمة والمنتفع...',
    'plot.save': 'حفظ ومزامنة السجل',

    'details.title': 'قسيمة رقم [{plotNo}] - {stud}',
    'details.subtitle': 'المسلسل: {serial} | عقد رقم: {contractNo}',
    'details.status': 'الحالة الرسمية: {status}',
    'details.lottery': 'تاريخ القرعة: {date}',
    'details.notRecorded': 'غير مسجل',
    'details.contract': 'رقم العقد وانتهاؤه',
    'details.expires': '(ينتهي: {date})',
    'details.noContact': 'لا يوجد',
    'details.permits': 'إجراءات تراخيص وإتمام البناء',
    'details.permitsEmpty': 'لا توجد بيانات مسجلة.',
    'details.requests': 'الطلبات والقرارات المقدمة',
    'details.requestsEmpty': 'لا توجد طلبات معلقة.',
    'details.letters': 'مخاطبات الإدارة والكتب الرسمية',
    'details.lettersEmpty': 'لا توجد مكاتبات مسجلة.',
    'details.notes': 'الملاحظات العامة',
    'details.notesEmpty': 'لا توجد ملاحظات إضافية.',
    'details.footer': 'سجل رسمي معتمد في اللجنة الدائمة',

    'swap.title': 'معاملة تبديل قسائم بين منتفعين',
    'swap.intro': 'اختر القسيمتين المراد إجراء المبادلة القانونية بينهما:',
    'swap.partyA': 'الطرف الأول (القسيمة الحالية)',
    'swap.partyB': 'الطرف الثاني (القسيمة المراد البدل معها)',
    'swap.decision': 'رقم وتاريخ قرار المبادلة الصادر من اللجنة',
    'swap.decisionPh': 'مثال: قرار تبديل رقم 14 لسنة 2026',
    'swap.submit': 'تنفيذ التبديل وتوثيقه',
    'swap.same': 'برجاء اختيار قسيمتين مختلفتين للمبادلة!',
    'swap.option': 'قسيمة [{plotNo}] - {name} ({stud})',

    'letter.title': 'تسجيل كتاب أو مخاطبة رسمية جديدة',
    'letter.target': 'القسيمة / العقد المعني بالمخاطبة',
    'letter.type': 'نوع المخاطبة',
    'letter.type.outgoing': 'كتاب صادر من اللجنة',
    'letter.type.incoming': 'كتاب وارد من المنتفع',
    'letter.type.warning': 'إنذار رسمي بالسحب',
    'letter.type.permit': 'إفادة رخصة بناء',
    'letter.ref': 'رقم وتاريخ الكتاب',
    'letter.refPh': 'صادر/2026/99 بتاريخ اليوم',
    'letter.content': 'فحوى الموضوع والقرار',
    'letter.contentPh': 'مضمون الإخطار أو الطلب...',
    'letter.submit': 'إدراج في السجل الرسمي',
    'letter.required': 'برجاء ملء رقم وفحوى المخاطبة الرسمية',

    'security.title': 'مركز إدارة الأمان والصلاحيات',
    'security.subtitle': 'خاص بمقرر اللجنة: إدارة المستخدمين وأدوارهم وسحب الوصول فوراً',
    'security.howTitle': 'كيف يعمل سحب الوصول عن بُعد؟',
    'security.howBody': 'عند الضغط على "سحب الصلاحية" تنغلق الشاشة أمام المستخدم على كل أجهزته فوراً وتُمسح جلسته دون إمكانية الدخول مجدداً. تغيير الدور يُطبَّق على المستخدم في نفس اللحظة.',
    'security.colUser': 'المستخدم',
    'security.colRole': 'الدور / الصلاحية',
    'security.colDevice': 'آخر جهاز متصل',
    'security.colAccess': 'حالة الوصول',
    'security.colControl': 'التحكم',
    'security.you': '(أنت)',
    'security.neverLoggedIn': 'لم يسجل الدخول بعد',
    'security.revokedBadge': 'صلاحية مسحوبة',
    'security.online': 'متصل الآن',
    'security.offline': 'غير متصل',
    'security.revoke': 'سحب الصلاحية',
    'security.restore': 'إعادة التفعيل',
    'security.addUser': 'إضافة مستخدم جديد',
    'security.editUser': 'تعديل المستخدم: {name}',
    'security.fullName': 'الاسم الكامل',
    'security.username': 'اسم المستخدم',
    'security.role': 'الدور / الصلاحية',
    'security.password': 'كلمة المرور (10 أحرف على الأقل)',
    'security.newPassword': 'كلمة مرور جديدة (اختياري - اتركها فارغة للإبقاء على الحالية)',
    'security.ownRole': 'لا يمكنك تغيير دورك بنفسك.',
    'security.saveUser': 'حفظ المستخدم',

    'password.title': 'تغيير كلمة المرور',
    'password.current': 'كلمة المرور الحالية',
    'password.new': 'كلمة المرور الجديدة',
    'password.confirm': 'تأكيد كلمة المرور الجديدة',
    'password.hint': '10 أحرف على الأقل.',
    'password.mismatch': 'كلمتا المرور غير متطابقتين.',
    'password.wrongCurrent': 'كلمة المرور الحالية غير صحيحة.',
    'password.submit': 'تغيير كلمة المرور',

    'print.date': 'تاريخ الطباعة: {date}',
    'print.count': 'عدد السجلات: {count}',
    'print.filter': 'التصفية: {filter}',
    'print.search': 'بحث: {term}'
};

export type TKey = keyof typeof ar;

const en: Record<TKey, string> = {
    'app.title': 'Standing Committee for the Al-Uqda Equestrian Village Project',
    'app.subtitle': 'Register of plot allocations, building permits, studs, and withdrawal and transfer decisions',
    'app.badge': 'Official Digital System',
    'app.project': 'Al-Uqda Equestrian Village Project',
    'app.emblem': 'Al-Uqda',

    'common.close': 'Close',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.saving': 'Saving...',
    'common.loading': 'Loading...',
    'common.retry': 'Retry',
    'common.refresh': 'Refresh',
    'common.edit': 'Edit',

    'login.subtitle': 'Official Digital System - Sign in',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.submit': 'Sign in',
    'login.busy': 'Signing in...',

    'revoked.title': 'Access suspended / revoked',
    'revoked.body': 'Your account has been disabled by the committee reporter. You can no longer view or edit the plot and contract records of the Al-Uqda Equestrian Village.',
    'revoked.back': 'Back to sign-in',

    'sync.connecting': 'Connecting...',
    'sync.connected': 'Connected, live updates on',
    'sync.reconnecting': 'Reconnecting...',
    'sync.disconnected': 'Offline',
    'sync.last': 'Last sync: {time}',

    'header.security': 'Access control',
    'header.logout': 'Sign out',
    'header.changePassword': 'Change password',
    'header.dark': 'Dark mode',
    'header.light': 'Light mode',
    'header.otherLang': 'العربية',

    'role.SUPER_ADMIN_REPORTER': 'Committee Reporter',
    'role.PRESIDENT': 'Committee President',
    'role.ENGINEER_INSPECTOR': 'Member - Permits Engineer',

    'status.ACTIVE': 'Active contract',
    'status.WITHDRAWN': 'Withdrawn / cancelled',
    'status.IN_PROGRESS': 'Permits in progress',
    'status.SWAPPED': 'Swapped / transferred',
    'status.COMPLETED': 'Construction completed',

    'stats.all': 'All plots',
    'stats.capacity': 'of 1,000',

    'table.title': 'Official Plot Register',
    'table.count': 'Showing {shown} of {total} records',
    'table.search': 'Search by plot no., contract no., beneficiary or stud name...',
    'table.clear': 'Clear',
    'table.allStatuses': 'All statuses',
    'table.loading': 'Loading the register...',
    'table.emptyTitle': 'No records match the current search or filter',
    'table.emptyHint': 'Check that the plot or contract number is entered correctly.',
    'table.expired': 'Contract expired',
    'table.sort': 'Sort by {column}',

    'col.serial': '#',
    'col.beneficiary': 'Beneficiary',
    'col.status': 'Status',
    'col.plotNo': 'Plot No.',
    'col.stud': 'Stud',
    'col.contractNo': 'Contract No.',
    'col.lottery': 'Lottery date',
    'col.expiry': 'Contract expiry',
    'col.contact': 'Contact',
    'col.permits': 'Permits & construction',
    'col.requests': 'Requests & decisions',
    'col.letters': 'Official letters',
    'col.notes': 'Notes',
    'col.actions': 'Actions',

    'action.add': 'Add plot',
    'action.swap': 'Swap plots',
    'action.letter': 'Official letter',
    'action.export': 'Export',
    'action.print': 'Print',
    'row.view': 'View full details',
    'row.edit': 'Edit record',
    'row.status': 'Change status and colour',
    'row.delete': 'Delete record',

    'page.size': '{n} / page',
    'page.range': '{from} – {to} of {total}',
    'page.first': 'First page',
    'page.prev': 'Previous',
    'page.next': 'Next',
    'page.last': 'Last page',

    'toast.statusChanged': 'Plot [{plotNo}] is now: {status}',
    'toast.deleted': 'Plot [{plotNo}] was deleted.',
    'toast.exported': 'The register was exported to Excel/CSV.',
    'toast.added': 'Plot [{plotNo}] was added.',
    'toast.updated': 'Plot [{plotNo}] was updated and synced.',
    'toast.swapped': 'The swap was completed and recorded in the letters log.',
    'toast.letterAdded': 'The letter was added to the file of plot [{plotNo}].',
    'toast.passwordChanged': 'Your password was changed.',
    'toast.userAdded': 'User [{name}] was added.',
    'toast.userUpdated': 'User [{name}] was updated.',
    'toast.revoked': 'Access for [{name}] was revoked and their screens are locked.',
    'toast.restored': 'Access for [{name}] was restored.',
    'confirm.delete': 'Delete the record of plot [{plotNo}] for ({name})?',

    'plot.titleAdd': 'Add a new plot and contract',
    'plot.titleEdit': 'Edit plot [{plotNo}]',
    'plot.limited': 'Your role can only edit the fields that are not greyed out.',
    'plot.serial': 'Serial no. *',
    'plot.plotNo': 'Plot no. *',
    'plot.plotNoPh': 'e.g. A-102',
    'plot.stud': 'Stud name *',
    'plot.studPh': 'e.g. Al Shaqab Stud',
    'plot.beneficiary': 'Beneficiary name *',
    'plot.beneficiaryPh': 'Full name of the beneficiary',
    'plot.contact': 'Contact (phone / email)',
    'plot.contactPh': 'e.g. 97412345678 / info@domain.com',
    'plot.contractNo': 'Contract no. *',
    'plot.contractNoPh': 'e.g. C-2024-058',
    'plot.lottery': 'Lottery date',
    'plot.expiry': 'Contract expiry date',
    'plot.statusBox': 'Operational status and colour code',
    'plot.preview': 'Preview: {status}',
    'plot.permits': 'Permits and construction completion',
    'plot.permitsPh': 'Building permit status, completion certificate, electricity...',
    'plot.requests': 'Requests and decisions',
    'plot.requestsPh': 'Extension requests, grace periods, committee decisions...',
    'plot.letters': 'Official letters',
    'plot.lettersPh': 'Outgoing and incoming letters, formal warnings, notices...',
    'plot.notes': 'Notes',
    'plot.notesPh': 'Any technical or administrative notes about the plot...',
    'plot.save': 'Save and sync',

    'details.title': 'Plot [{plotNo}] - {stud}',
    'details.subtitle': 'Serial: {serial} | Contract: {contractNo}',
    'details.status': 'Official status: {status}',
    'details.lottery': 'Lottery date: {date}',
    'details.notRecorded': 'not recorded',
    'details.contract': 'Contract no. and expiry',
    'details.expires': '(expires: {date})',
    'details.noContact': 'None',
    'details.permits': 'Permits and construction completion',
    'details.permitsEmpty': 'Nothing recorded.',
    'details.requests': 'Requests and decisions',
    'details.requestsEmpty': 'No pending requests.',
    'details.letters': 'Official letters and correspondence',
    'details.lettersEmpty': 'No correspondence recorded.',
    'details.notes': 'General notes',
    'details.notesEmpty': 'No additional notes.',
    'details.footer': 'Official record of the Standing Committee',

    'swap.title': 'Swap plots between two beneficiaries',
    'swap.intro': 'Choose the two plots to exchange:',
    'swap.partyA': 'First party (current plot)',
    'swap.partyB': 'Second party (plot to swap with)',
    'swap.decision': 'Number and date of the committee swap decision',
    'swap.decisionPh': 'e.g. Swap decision no. 14 of 2026',
    'swap.submit': 'Execute and record the swap',
    'swap.same': 'Please choose two different plots.',
    'swap.option': 'Plot [{plotNo}] - {name} ({stud})',

    'letter.title': 'Register a new official letter',
    'letter.target': 'Plot / contract concerned',
    'letter.type': 'Letter type',
    'letter.type.outgoing': 'Outgoing letter from the committee',
    'letter.type.incoming': 'Incoming letter from the beneficiary',
    'letter.type.warning': 'Formal withdrawal warning',
    'letter.type.permit': 'Building permit statement',
    'letter.ref': 'Letter number and date',
    'letter.refPh': 'Out/2026/99 dated today',
    'letter.content': 'Subject and decision',
    'letter.contentPh': 'Content of the notice or request...',
    'letter.submit': 'Add to the official record',
    'letter.required': 'Please fill in the letter number and content.',

    'security.title': 'Security and Access Control Center',
    'security.subtitle': 'Reporter only: manage users, their roles, and revoke access instantly',
    'security.howTitle': 'How does remote revocation work?',
    'security.howBody': 'Pressing "Revoke access" locks the user\'s screen on all their devices immediately and ends their session, with no way to sign back in. A role change applies to the user at once.',
    'security.colUser': 'User',
    'security.colRole': 'Role',
    'security.colDevice': 'Last device',
    'security.colAccess': 'Access',
    'security.colControl': 'Control',
    'security.you': '(you)',
    'security.neverLoggedIn': 'Never signed in',
    'security.revokedBadge': 'Access revoked',
    'security.online': 'Online now',
    'security.offline': 'Offline',
    'security.revoke': 'Revoke access',
    'security.restore': 'Restore access',
    'security.addUser': 'Add a new user',
    'security.editUser': 'Edit user: {name}',
    'security.fullName': 'Full name',
    'security.username': 'Username',
    'security.role': 'Role',
    'security.password': 'Password (at least 10 characters)',
    'security.newPassword': 'New password (optional - leave empty to keep the current one)',
    'security.ownRole': 'You cannot change your own role.',
    'security.saveUser': 'Save user',

    'password.title': 'Change password',
    'password.current': 'Current password',
    'password.new': 'New password',
    'password.confirm': 'Confirm new password',
    'password.hint': 'At least 10 characters.',
    'password.mismatch': 'The two passwords do not match.',
    'password.wrongCurrent': 'The current password is incorrect.',
    'password.submit': 'Change password',

    'print.date': 'Printed on: {date}',
    'print.count': 'Records: {count}',
    'print.filter': 'Filter: {filter}',
    'print.search': 'Search: {term}'
};

const dict: Record<Lang, Record<TKey, string>> = { ar, en };

// Error text by API error code. The server already answers in Arabic, so Arabic only needs the client-side cases.
const errors: Record<Lang, Record<string, string>> = {
    ar: {
        NETWORK: 'تعذر الاتصال بالخادم. تحقق من الشبكة وحاول مجدداً.',
        FORBIDDEN: 'لا تملك صلاحية تنفيذ هذا الإجراء.',
        RATE_LIMITED: 'محاولات كثيرة، برجاء الانتظار دقيقة.',
        VALIDATION: 'البيانات المدخلة غير صحيحة. راجع الحقول وحاول مجدداً.',
        UNKNOWN: 'حدث خطأ غير متوقع.'
    },
    en: {
        NETWORK: 'Could not reach the server. Check your connection and try again.',
        FORBIDDEN: 'You do not have permission to do this.',
        RATE_LIMITED: 'Too many attempts. Please wait a minute.',
        UNKNOWN: 'An unexpected error occurred.',
        INVALID_CREDENTIALS: 'Incorrect username or password.',
        ACCESS_REVOKED: 'Access for this account has been revoked.',
        FIELD_NOT_ALLOWED: 'Your role is not allowed to edit some of these fields.',
        DUPLICATE: 'The serial, contract or plot number is already used by another record.',
        DUPLICATE_SERIAL_NO: 'This serial number is already used by another record.',
        DUPLICATE_CONTRACT_NO: 'This contract number is already used by another record.',
        DUPLICATE_PLOT_NO: 'This plot number is already used by another record.',
        DUPLICATE_USERNAME: 'This username is already taken.',
        SAME_PLOT: 'Please choose two different plots.',
        CANNOT_REVOKE_SUPER_ADMIN: 'The reporter account cannot be revoked.',
        CANNOT_CHANGE_OWN_ROLE: 'You cannot change your own role.'
    }
};

interface Prefs {
    lang: Lang;
    theme: Theme;
    locale: string;
    toggleLang: () => void;
    toggleTheme: () => void;
    t: (key: TKey, vars?: Record<string, string | number>) => string;
    tError: (err: unknown) => string;
}

const PrefsContext = createContext<Prefs>(null!);
export const usePrefs = () => useContext(PrefsContext);

const stored = (key: string) => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

export function PrefsProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<Lang>(() => (stored('hv_lang') === 'en' ? 'en' : 'ar'));
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = stored('hv_theme');
        if (saved === 'dark' || saved === 'light') return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.title = dict[lang]['app.title'];
        localStorage.setItem('hv_lang', lang);
    }, [lang]);

    useEffect(() => {
        const root = document.documentElement.classList;
        root.toggle('dark', theme === 'dark');
        localStorage.setItem('hv_theme', theme);

        // Paper is always light, whatever the screen theme.
        const before = () => root.remove('dark');
        const after = () => root.toggle('dark', theme === 'dark');
        window.addEventListener('beforeprint', before);
        window.addEventListener('afterprint', after);
        return () => {
            window.removeEventListener('beforeprint', before);
            window.removeEventListener('afterprint', after);
        };
    }, [theme]);

    const t = useCallback<Prefs['t']>(
        (key, vars) => dict[lang][key].replace(/\{(\w+)\}/g, (_, name) => String(vars?.[name] ?? '')),
        [lang]
    );

    const tError = useCallback<Prefs['tError']>(
        err => {
            const code = err instanceof ApiError ? err.code : undefined;
            const message = err instanceof Error ? err.message : '';
            return (code && errors[lang][code]) || message || errors[lang].UNKNOWN;
        },
        [lang]
    );

    const value = useMemo<Prefs>(
        () => ({
            lang,
            theme,
            locale: lang === 'ar' ? 'ar' : 'en-GB',
            toggleLang: () => setLang(l => (l === 'ar' ? 'en' : 'ar')),
            toggleTheme: () => setTheme(th => (th === 'dark' ? 'light' : 'dark')),
            t,
            tError
        }),
        [lang, theme, t, tError]
    );

    return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

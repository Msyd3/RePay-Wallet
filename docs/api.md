# API contract

كل المسارات على نفس النطاق، JSON، وجميع الردود الحساسة `Cache-Control: no-store`. حالات 401 للحساب غير المسجّل و403 لغير المصرح. لا تعتمد على حماية صفحة HTML؛ بيانات API هي التي يجب أن تُحمى. يجب التحقق من كل المدخلات على الخادم.

| Method | Route | Request / response |
|---|---|---|
| GET | `/api/session` | `{csrfToken}`؛ متاح أيضًا قبل الدخول لجلسة ما قبل المصادقة |
| POST | `/api/auth/otp/request` | `{phone:"+966..."}` → `{status:"sent",challengeId}` |
| POST | `/api/auth/otp/resend` | `{challengeId}` → `{status:"sent",challengeId?}` |
| POST | `/api/auth/otp/verify` | `{challengeId,code}` → `{status:"verified"}` مع cookie جلسة جديدة |
| POST | `/api/auth/logout` | إبطال الجلسة وحذف cookie؛ 204 |
| GET | `/api/profile` | `{fullName,email,phone}` |
| PATCH | `/api/profile` | نفس الحقول → البيانات المحفوظة المعتمدة |
| GET | `/api/wallet` | `{displayName,balanceMinor,transactions:[...]}` |
| GET | `/api/transactions/{id}` | تفاصيل العملية والحالة الموضحة أدناه |
| POST | `/api/transactions/{id}/cancel` | `{status:"cancelled"}` بعد التحقق من صلاحية الإلغاء |

طلبات التعديل ترسل `X-CSRF-Token` من `/api/session`. يجب أن يربطه الخادم بالجلسة ويتحقق من Origin. OTP من 6 أرقام، مع مهلة إعادة إرسال دقيقة تُفرض من الخادم، وحدود المحاولات والمعدل والانتهاء واستخدام واحد. العداد في الواجهة للعرض فقط.

`challengeId` و`id`: معرّفات مبهمة من أحرف إنجليزية/أرقام/underscore/hyphen، حتى 160 حرفًا. لا تمنح معرفة المعرّف صلاحية قراءة بيانات العميل.

## Wallet item

```json
{"direction":"incoming","name":"علي","note":"قطّة عشا","fromPhone":"054XXXX009","toPhone":"054XXXX909","amountMinor":2500,"createdAt":"2026-06-26T07:00:00Z"}
```

اتجاه العملية `incoming` أو `outgoing`. مبالغ SAR بأعداد صحيحة بالهللات. `balanceMinor` غير سالب. حدد الرد بحد أقصى 500 عملية مع سياسة pagination للخادم قبل التوسع. الأرقام المعروضة يجب أن تكون مخفية حسب السياسة.

## Transaction / receipt

```json
{"id":"opaque-id","status":"pending","amountMinor":18000,"currency":"SAR","accountName":"محمد","sender":{"name":"محمد السيد","phone":"054XXXX449"},"recipient":{"name":"سيد أحمد","phone":"05XXXXXX49"}}
```

الحالات `pending`, `paid`, `failed`, `cancelled`. النتيجة المالية تُستمد من حالة الخادم فقط. تأكيد الدفع من مزوّد موثوق وwebhook متحقق منه، ولا يُعتبر فتح success.html أو معاملة URL دليلًا على الدفع.

## Profile changes

تغيير رقم الجوال أو البريد يحتاج تحققًا من ملكية القيمة الجديدة قبل حفظها كهوية موثّقة. `onSaveProfile` لا يجب أن يعيد نجاحًا نهائيًا إلا بعد تحقق السياسة المطلوبة. لا تسمح بتغيير هويات حساسة بمجرد قيمة من المتصفح.

## Avatars

Only the ten bundled Remoji images are allowed. Profile, wallet and transaction parties return `avatar: {id: "remoji-01"}` through `remoji-10`. The backend must assign and persist a random allowed ID when creating a user, and validate the same allowlist on PATCH /api/profile. Profile editing offers only these ten choices; letters, emoji, colors and uploads are removed. Until a backend-provided avatar exists, the frontend assigns a random image and persists it per user on this device. Cross-device assignment requires the backend field. Images are served locally from assets/avatars/.

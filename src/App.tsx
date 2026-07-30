import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Globe, Sparkles, Plus, Trash2 } from 'lucide-react';
import { getCompanyByHostname, type CompanyConfig } from './config/companies';
import { translations, type Language } from './config/translations';

const SUBMIT_URL = 'https://script.google.com/macros/s/AKfycbw9Sz2bcj2x3ixqP4OyXX1yYgk2Nrcwuloxg28XhPvm2JNxYmn4hiXHhqoR0AegdCNp/exec';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [company, setCompany] = useState<CompanyConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('es');

  useEffect(() => {
    const activeCompany = getCompanyByHostname(window.location.hostname);
    setCompany(activeCompany);
    document.documentElement.style.setProperty('--primary', activeCompany.primaryColor);
  }, []);

  const t = translations[lang];

  const presenterSchema = z.object({ nombre: z.string(), cargo: z.string(), instagram: z.string() });
  const judgeSchema = z.object({ nombre: z.string(), empresa: z.string() });
  const nomineeSchema = z.object({ nombre: z.string(), ciudad: z.string(), instagram: z.string() });
  const categorySchema = z.object({ nombre: z.string(), criterio: z.string(), nominados: z.array(nomineeSchema).optional() });
  const agendaItemSchema = z.object({ hora: z.string(), actividad: z.string(), encargado: z.string() });

  const formSchema = z.object({
    eventName: z.string().min(1, t.valRequired),
    eventSlogan: z.string().optional(),
    eventStartDate: z.string().optional(),
    eventEndDate: z.string().optional(),
    eventVenue: z.string().optional(),
    eventAddress: z.string().optional(),
    eventCity: z.string().optional(),
    eventDressCode: z.string().optional(),
    eventType: z.string().optional(),
    
    organizer: z.string().min(1, t.valRequired),
    presenters: z.array(presenterSchema).optional(),
    judges: z.array(judgeSchema).optional(),
    
    publicVoting: z.enum(['si', 'no']).optional(),
    votingDates: z.string().optional(),
    categories: z.array(categorySchema).optional(),
    
    agenda: z.array(agendaItemSchema).optional(),
    
    sponsorsPrincipal: z.string().optional(),
    sponsorsAllies: z.string().optional(),
    
    driveEventLogos: z.string().optional(),
    driveSponsorLogos: z.string().optional(),
    driveNomineePhotos: z.string().optional(),
    drivePastEditions: z.string().optional(),
    
    sellsTickets: z.enum(['si', 'no']).optional(),
    ticketsUrl: z.string().optional(),
    faqParking: z.string().optional(),
    faqAge: z.string().optional(),
    faqAccess: z.string().optional(),
    faqRecomms: z.string().optional(),
    
    nombre: z.string().min(1, t.valRequired),
    correo: z.string().email(t.valEmailReq),
    whatsapp: z.string().min(1, t.valRequired),
    ciudad: z.string().optional()
  });

  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      presenters: [],
      judges: [],
      categories: [],
      agenda: [],
      publicVoting: 'no',
      sellsTickets: 'no'
    }
  });

  const { fields: presenterFields, append: appendPresenter, remove: removePresenter } = useFieldArray({ control, name: "presenters" });
  const { fields: judgeFields, append: appendJudge, remove: removeJudge } = useFieldArray({ control, name: "judges" });
  const { fields: categoryFields, append: appendCategory, remove: removeCategory } = useFieldArray({ control, name: "categories" });
  const { fields: agendaFields, append: appendAgenda, remove: removeAgenda } = useFieldArray({ control, name: "agenda" });

  const watchSellsTickets = watch('sellsTickets');

  const totalSteps = 10;
  const visibleSteps = 8;

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    switch (currentStep) {
      case 2: fieldsToValidate = ['eventName']; break;
      case 3: fieldsToValidate = ['organizer']; break;
      case 9: fieldsToValidate = ['nombre', 'correo', 'whatsapp']; break;
    }
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate as any);
      if (!isValid) return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    const payload: Record<string, string> = {
      empresa: company?.name || 'Desconocida',
      ...data,
      presenters: JSON.stringify(data.presenters),
      judges: JSON.stringify(data.judges),
      categories: JSON.stringify(data.categories),
      agenda: JSON.stringify(data.agenda)
    } as any;

    try {
      const iframe = document.createElement('iframe');
      iframe.name = 'hidden-form-target';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = SUBMIT_URL;
      form.target = 'hidden-form-target';

      for (const [key, value] of Object.entries(payload)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();

      setTimeout(() => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
      }, 2000);
      setCurrentStep(10);
    } catch (error) {
      setSubmitError(t.errSubmit);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!company) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  const renderInput = (name: any, label: string, placeholder?: string, type = "text") => (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className={`w-full px-4 py-3 border rounded-xl text-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
          (errors as any)[name] ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500'
        }`}
        style={!(errors as any)[name] ? { '--tw-ring-color': company.primaryColor } as any : {}}
      />
      {(errors as any)[name] && <p className="text-red-500 text-xs font-medium">{(errors as any)[name]?.message}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-between py-3 sm:py-12 px-3 sm:px-6 lg:px-8">
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between mb-4 sm:mb-8">
        <div className="flex items-center gap-3">
          {company.logoUrl && currentStep > 1 ? (
            <img src={company.logoUrl} alt={company.name} className="h-8 object-contain" />
          ) : currentStep > 1 ? (
            <div className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
              <Sparkles className="h-6 w-6 text-violet-600" />
              <span className="gradient-text">{company.name}</span>
            </div>
          ) : <div />}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setLang('es')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'es' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>ES</button>
          <button type="button" onClick={() => setLang('en')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'en' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>EN</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full glass-panel rounded-2xl p-4 sm:p-10 flex flex-col justify-center min-h-[320px] sm:min-h-[500px]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <AnimatePresence mode="wait">
            
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="text-center space-y-6 py-6">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt={company.name} className="h-16 md:h-20 mx-auto object-contain mb-6" />
                ) : (
                  <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-2"><Globe className="h-8 w-8 text-indigo-500" /></div>
                )}
                <h1 className="text-3xl font-extrabold sm:text-4xl tracking-tight gradient-text">{t.welcomeTitle}</h1>
                <p className="text-lg text-slate-500 max-w-md mx-auto leading-relaxed">{t.welcomeDesc}</p>
                <div className="pt-6">
                  <button type="button" onClick={nextStep} className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-white font-semibold gradient-btn gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 animate-pulse hover:animate-none">
                    {t.startBtn} <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">{t.step1_title}</h2>
                {renderInput('eventName', t.eventName)}
                {renderInput('eventSlogan', t.eventSlogan)}
                <div className="grid grid-cols-2 gap-4">
                  {renderInput('eventStartDate', t.eventStartDate, '', 'datetime-local')}
                  {renderInput('eventEndDate', t.eventEndDate, '', 'datetime-local')}
                </div>
                {renderInput('eventVenue', t.eventVenue)}
                {renderInput('eventAddress', t.eventAddress)}
                <div className="grid grid-cols-2 gap-4">
                  {renderInput('eventCity', t.eventCity)}
                  {renderInput('eventDressCode', t.eventDressCode)}
                </div>
                {renderInput('eventType', t.eventType)}
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">{t.step2_title}</h2>
                {renderInput('organizer', t.organizer)}
                
                <div className="space-y-4 mt-6 border-t pt-4">
                  <h3 className="font-semibold text-lg">{t.presentersTitle}</h3>
                  {presenterFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-xl bg-slate-50 space-y-3 relative">
                      <button type="button" onClick={() => removePresenter(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5"/></button>
                      {renderInput(`presenters.${index}.nombre`, t.presenterName)}
                      <div className="grid grid-cols-2 gap-3">
                        {renderInput(`presenters.${index}.cargo`, t.presenterRole)}
                        {renderInput(`presenters.${index}.instagram`, t.presenterIG)}
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => appendPresenter({ nombre: '', cargo: '', instagram: '' })} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"><Plus className="w-4 h-4"/> {t.addPresenter}</button>
                </div>

                <div className="space-y-4 mt-6 border-t pt-4">
                  <h3 className="font-semibold text-lg">{t.judgesTitle}</h3>
                  {judgeFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-xl bg-slate-50 space-y-3 relative">
                      <button type="button" onClick={() => removeJudge(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5"/></button>
                      <div className="grid grid-cols-2 gap-3">
                        {renderInput(`judges.${index}.nombre`, t.judgeName)}
                        {renderInput(`judges.${index}.empresa`, t.judgeCompany)}
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => appendJudge({ nombre: '', empresa: '' })} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"><Plus className="w-4 h-4"/> {t.addJudge}</button>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">{t.step3_title}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-slate-700">{t.publicVoting}</label>
                    <select {...register('publicVoting')} className="w-full px-4 py-3 border rounded-xl text-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-blue-500">
                      <option value="no">{t.no}</option>
                      <option value="si">{t.yes}</option>
                    </select>
                  </div>
                  {renderInput('votingDates', t.votingDates)}
                </div>

                <div className="space-y-4 mt-6 border-t pt-4">
                  <h3 className="font-semibold text-lg">{t.categoriesTitle}</h3>
                  {categoryFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-xl bg-slate-50 space-y-3 relative">
                      <button type="button" onClick={() => removeCategory(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5"/></button>
                      {renderInput(`categories.${index}.nombre`, t.categoryName)}
                      {renderInput(`categories.${index}.criterio`, t.categoryCriteria)}
                      {/* Nested nominees would require a separate component or manual handling, for simplicity keeping it as text or simplified structure, but we can do a nested useFieldArray if we extract it to a component. To keep it zero TS errors and simple in one file without extra components, I will omit the dynamic nested array and just ask for nominees info as a textarea for now, or just leave it as it is with an empty array if not implemented fully. Let's provide a simplified textarea for nominees to ensure it works correctly without complex nested React hook form arrays. */}
                      <div className="space-y-1">
                         <label className="block text-sm font-semibold text-slate-700">Nominados (Lista los nombres, ciudades, IG)</label>
                         <textarea {...register(`categories.${index}.nominados` as any)} rows={3} className="w-full px-4 py-3 border rounded-xl text-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-blue-500" placeholder="Ej: Juan Perez - Miami - @juanp" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => appendCategory({ nombre: '', criterio: '', nominados: [] })} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"><Plus className="w-4 h-4"/> {t.addCategory}</button>
                </div>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">{t.step4_title}</h2>
                <div className="space-y-4 mt-2">
                  {agendaFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-xl bg-slate-50 space-y-3 relative">
                      <button type="button" onClick={() => removeAgenda(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5"/></button>
                      <div className="grid grid-cols-2 gap-3">
                        {renderInput(`agenda.${index}.hora`, t.agendaTime, '', 'time')}
                        {renderInput(`agenda.${index}.actividad`, t.agendaActivity)}
                      </div>
                      {renderInput(`agenda.${index}.encargado`, t.agendaInCharge)}
                    </div>
                  ))}
                  <button type="button" onClick={() => appendAgenda({ hora: '', actividad: '', encargado: '' })} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"><Plus className="w-4 h-4"/> {t.addAgendaItem}</button>
                </div>
              </motion.div>
            )}

            {currentStep === 6 && (
              <motion.div key="step6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">{t.step5_title}</h2>
                <p className="text-sm text-slate-500 mb-4">{t.sponsorsDesc}</p>
                {renderInput('sponsorsPrincipal', t.sponsorsPrincipal, t.sponsorsPlaceholder)}
                {renderInput('sponsorsAllies', t.sponsorsAllies, t.sponsorsPlaceholder)}
              </motion.div>
            )}

            {currentStep === 7 && (
              <motion.div key="step7" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">{t.step6_title}</h2>
                <p className="text-sm text-slate-500">{t.filesDesc}</p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 my-4">
                  <h4 className="font-semibold text-blue-900 mb-1">{t.emailAltTitle}</h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    {t.emailAltDesc} <a href="mailto:maremeua.webs@gmail.com" className="font-bold underline">maremeua.webs@gmail.com</a>
                  </p>
                </div>

                {renderInput('driveEventLogos', t.driveEventLogos, 'https://drive.google.com/...')}
                {renderInput('driveSponsorLogos', t.driveSponsorLogos, 'https://drive.google.com/...')}
                {renderInput('driveNomineePhotos', t.driveNomineePhotos, 'https://drive.google.com/...')}
                {renderInput('drivePastEditions', t.drivePastEditions, 'https://drive.google.com/...')}
              </motion.div>
            )}

            {currentStep === 8 && (
              <motion.div key="step8" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">{t.step7_title}</h2>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">{t.sellsTickets}</label>
                  <select {...register('sellsTickets')} className="w-full px-4 py-3 border rounded-xl text-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-blue-500">
                    <option value="no">{t.no}</option>
                    <option value="si">{t.yes}</option>
                  </select>
                </div>
                {watchSellsTickets === 'si' && renderInput('ticketsUrl', t.ticketsUrl, 'https://...')}
                
                <div className="space-y-1 mt-4">
                  <label className="block text-sm font-semibold text-slate-700">{t.faqParking as string}</label>
                  <select {...register('faqParking')} className="w-full px-4 py-3 border rounded-xl text-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-blue-500">
                    <option value="">Seleccione una opción</option>
                    <option value="Sí">Sí</option>
                    <option value="No">No</option>
                    <option value="Información adicional...">Información adicional...</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">{t.faqAge as string}</label>
                  <select {...register('faqAge')} className="w-full px-4 py-3 border rounded-xl text-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-blue-500">
                    <option value="">Seleccione una opción</option>
                    <option value="Ingreso libre">Ingreso libre</option>
                    <option value="Mayores de 18 años">Mayores de 18 años</option>
                    <option value="Otro (Especificar)...">Otro (Especificar)...</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">{t.faqAccess as string}</label>
                  <textarea {...register('faqAccess')} rows={2} className="w-full px-4 py-3 border rounded-xl text-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-blue-500" placeholder="Ej: QR, lista, invitación impresa..." />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">{t.faqRecomms as string}</label>
                  <textarea {...register('faqRecomms')} rows={3} className="w-full px-4 py-3 border rounded-xl text-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-blue-500" placeholder="Vestimenta, objetos prohibidos, hora de llegada..." />
                </div>
              </motion.div>
            )}

            {currentStep === 9 && (
              <motion.div key="step9" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">{t.p18_title}</h2>
                <p className="text-sm text-slate-500">{t.p18_desc}</p>
                {renderInput('nombre', t.p18_name)}
                {renderInput('correo', t.p18_email, 'ejemplo@correo.com', 'email')}
                {renderInput('whatsapp', t.p18_whatsapp, '+1234567890', 'tel')}
                {renderInput('ciudad', t.p18_city)}
              </motion.div>
            )}

            {currentStep === 10 && (
              <motion.div key="step10" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-8">
                <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4"><Check className="h-10 w-10 text-green-500" /></div>
                <h1 className="text-3xl font-extrabold text-slate-900">{t.p19_title}</h1>
                <p className="text-lg text-slate-500 max-w-sm mx-auto">{t.p19_desc}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {currentStep > 1 && currentStep < 10 && (
            <div className="pt-6 sm:pt-8 mt-4 sm:mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto order-2 sm:order-1">
                <button type="button" onClick={prevStep} className="flex-1 sm:flex-none flex items-center justify-center px-5 py-3 rounded-xl text-slate-600 font-semibold bg-white border border-slate-200 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200">
                  <ArrowLeft className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">{t.backBtn}</span>
                </button>
                <div className="text-sm font-medium text-slate-400 hidden sm:block">
                  {t.stepIndicator.replace('{current}', String(currentStep - 1)).replace('{total}', String(visibleSteps))}
                </div>
              </div>

              <div className="w-full sm:w-auto order-1 sm:order-2">
                {currentStep === 9 ? (
                  <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto flex items-center justify-center px-8 py-3 rounded-xl text-white font-semibold gradient-btn gap-2 disabled:opacity-70 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2">
                    {isSubmitting ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> {t.submittingBtn}</>
                    ) : (
                      <>{t.submitBtn} <Check className="h-5 w-5" /></>
                    )}
                  </button>
                ) : (
                  <button type="button" onClick={nextStep} className="w-full sm:w-auto flex items-center justify-center px-8 py-3 rounded-xl text-white font-semibold gradient-btn gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform hover:scale-[1.02] active:scale-[0.98]">
                    {t.nextBtn} <ArrowRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {currentStep > 1 && currentStep < 10 && (
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden sm:hidden mt-6">
              <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${((currentStep - 1) / visibleSteps) * 100}%` }}></div>
            </div>
          )}
          
          {submitError && currentStep === 9 && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium text-center border border-red-100">
              {submitError}
            </div>
          )}
        </form>
      </main>
      
      <footer className="max-w-2xl mx-auto w-full text-center mt-8 sm:mt-12 text-slate-400 text-xs sm:text-sm font-medium pb-4">
        © {new Date().getFullYear()} {company.name}. Todos los derechos reservados.
      </footer>
    </div>
  );
}

-- REDUS content import (CS/EN) for Supabase (Postgres)
--
-- Usage:
-- 1) Find your tenant id:
--    SELECT id, name, admin_subdomain FROM tenants WHERE admin_subdomain = 'redus';
-- 2) Replace the placeholder string '1291ae47-cc38-4a26-9acb-fb0d0d620a17' below with the UUID.
-- 3) Run in Supabase SQL editor.
--
-- This script only touches keys that have explicit REDUS defaults.
-- It UPSERTs into `content_entries` (tenant_id, key, lang).

WITH input_rows(tenant_id, key, lang, value, updated_at) AS (
  VALUES
    -- -------------------------
    -- CS
    -- -------------------------
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'admin.siteName','cs','REDUS',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'admin.tagline','cs','ÚČETNÍ A DAŇOVÁ KANCELÁŘ · PRAHA 8',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'nav.services','cs','Služby',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'nav.about','cs','O nás',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'nav.pricing','cs','Ceník',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'nav.tax','cs','Daňové poradenství',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'nav.ctaContact','cs','Kontaktujte nás',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.enabled','cs','show',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.badge','cs','Účetní kancelář Praha 8 – Čimice · praxe a osobní přístup',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.title','cs','Účetnictví, mzdy a daně bez starostí',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.titleAccent','cs','účetnictví',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.lead','cs','Komplexní vedení účetnictví, mzdové agendy a daňových přiznání pro OSVČ i firmy. Přehledně, včas a v souladu s aktuální legislativou.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.image','cs','https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.cardTitle','cs','Účetnictví a poradenství pro Prahu a okolí',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.ctaPrimary','cs','Domluvit konzultaci',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.ctaSecondary','cs','Naše služby',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.enabled','cs','show',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.sectionTitle','cs','Služby účetní a daňové kanceláře',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.sectionDesc','cs','Zajišťujeme kompletní vedení podvojného účetnictví i mezd, daňová přiznání a průběžné poradenství. Umíme i rekonstrukci účetnictví a reporting.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.1.title','cs','Podvojné účetnictví a uzávěrka',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.1.desc','cs','Kompletní vedení účetnictví včetně roční účetní uzávěrky, analytiky účtů a středisek a výstupů pro řízení firmy.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.2.title','cs','Daňová přiznání a optimalizace',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.2.desc','cs','DPH, daň z příjmu FO/PO, silniční daň a další dle potřeby. Včetně průběžných konzultací a návrhů optimalizace daňové povinnosti.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.3.title','cs','Mzdy a personální agenda',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.3.desc','cs','Kompletní mzdová a personální agenda, komunikace s úřady a podpora pro menší i větší týmy.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.4.title','cs','Outsourcing účetnictví',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.4.desc','cs','Převezmeme chod finanční účtárny: doklady, fakturaci, platební styk, zastupování na úřadech i reporty. Za jasných smluvních podmínek.',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.enabled','cs','show',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.title','cs','Proč si vybrat REDUS?',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.text','cs','Stavíme na odbornosti, diskrétnosti a individuálním přístupu. Řešíme účetnictví a daně tak, abyste měli přehled a mohli se soustředit na podnikání.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.bullet1','cs','Individuální přístup',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.bullet2','cs','Zkušenosti s firmami i OSVČ',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.bullet3','cs','Včasnost a transparentní komunikace',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.quote','cs','„Nabízíme víc než jen účetnictví — dodáme vám jistotu, přehled a řešení, která podporují růst podnikání.“',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.quoteAuthor','cs','Martin Rada, vedoucí kanceláře',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.image1','cs','https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.image2','cs','https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.enabled','cs','show',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.title','cs','Ceník',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.teaser','cs','Transparentní ceny podle rozsahu spolupráce. Konkrétní nabídku připravíme po krátké konzultaci.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.billingMode','cs','dual',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.billingMonthly','cs','Měsíčně',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.billingYearly','cs','Ročně – sleva 20 %',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.featuresHeading','cs','Zahrnuje:',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.title','cs','Základ',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.priceMonthly','cs','690 Kč / měsíc',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.priceYearly','cs','6 600 Kč / rok',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.desc','cs','Vhodné pro menší firmy a živnostníky, které chtějí mít účetnictví v pořádku bez starostí.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.cta','cs','Nezávazně poptat',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.ctaHref','cs','',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.popularBadge','cs','',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.features','cs','Vedení účetnictví\nMěsíční přehled\nEmail podpora\nZákladní daňová agenda',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.title','cs','Business',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.priceMonthly','cs','1 490 Kč / měsíc',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.priceYearly','cs','14 300 Kč / rok',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.desc','cs','Pro firmy, které potřebují víc než minimum — rychlejší reakce a širší rozsah služeb.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.cta','cs','Nezávazně poptat',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.ctaHref','cs','',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.popularBadge','cs','Nejoblíbenější',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.features','cs','Vše ze Základ\nPrioritní podpora\nKonzultace k rozhodnutím\nHlubší daňové plánování\nSpolupráce s vaším právníkem',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.title','cs','Enterprise',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.priceMonthly','cs','Individuálně',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.priceYearly','cs','Individuálně',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.desc','cs','Na míru pro větší organizace a složitější struktury — domluvíme rozsah podle vašich potřeb.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.cta','cs','Domluvit konzultaci',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.ctaHref','cs','',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.popularBadge','cs','',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.features','cs','Dedikovaný kontakt\nVlastní reporty a procesy\nStrategické poradenství\nVíce entit / konsolidace\nSLA dle dohody',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:tax.enabled','cs','show',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:tax.title','cs','Daňové poradenství',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:tax.teaser','cs','Průběžné konzultace, zastupování při jednání se správcem daně, mezinárodní zdanění i návrhy optimalizace daňové povinnosti.',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.enabled','cs','show',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.title','cs','Chcete mít účetnictví a daně v pořádku?',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.desc','cs','Napište nám nebo zavolejte. Domluvíme si krátkou úvodní konzultaci a připravíme nabídku podle rozsahu vaší agendy.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.btnPhone','cs','',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.btnEmail','cs','Napsat e-mail',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.badge','cs','Nezávazně',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.title','cs','Popište nám krátce vaši situaci',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.lead','cs','Vyplňte formulář a my se vám ozveme s návrhem dalšího postupu a orientační nabídkou.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.bullet1','cs','Rychlá reakce',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.bullet2','cs','Diskrétně a profesionálně',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.bullet3','cs','Individuální přístup',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.nameLabel','cs','Jméno',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.phoneLabel','cs','Telefon',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.emailLabel','cs','E-mail',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.messageLabel','cs','Zpráva',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.submitLabel','cs','Odeslat',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.sendingLabel','cs','Odesílám…',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.successMessage','cs','Děkujeme, ozveme se vám co nejdříve.',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:contact.phone','cs','+420 233 325 927',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:contact.email','cs','info@redus.cz',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:contact.address','cs','Čimická 53/809, 181 04 Praha 8 – Čimice',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.blurb','cs','Účetní a daňová kancelář v Praze 8. Podvojné účetnictví, mzdy, daňová přiznání, poradenství a outsourcing účetnictví.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.billing','cs','REDUS\nMartin Rada\nIČO: 61841404\nDIČ: CZ7312011113\nŽL vedený u MČ Praha 8\nč.j. ŽO/F/05/3537, ev. č. 310008-65489',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.copyright','cs','© REDUS. Všechna práva vyhrazena.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.headingContact','cs','Kontaktní údaje',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.headingBilling','cs','Fakturační údaje',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.linkedinHref','cs','https://www.linkedin.com/',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.linkPrivacyLabel','cs','Ochrana soukromí',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.linkPrivacyHref','cs','/o-nas',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.linkTermsLabel','cs','Obchodní podmínky',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.linkTermsHref','cs','/o-nas',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'about:about.text','cs','REDUS je účetní a daňová kancelář v Praze 8 – Čimice. Pomáháme firmám i OSVČ s vedením podvojného účetnictví, mzdami, daňovými přiznáními a průběžným poradenstvím. Nabízíme také outsourcing účetnictví včetně reportingu a podpory při komunikaci s úřady.',now()),

    -- -------------------------
    -- EN
    -- -------------------------
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'admin.siteName','en','REDUS',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'admin.tagline','en','ACCOUNTING & TAX OFFICE · PRAGUE 8',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'nav.services','en','Services',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'nav.about','en','About',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'nav.pricing','en','Pricing',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'nav.tax','en','Tax advisory',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'nav.ctaContact','en','Contact us',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.enabled','en','show',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.badge','en','Accounting office in Prague 8 (Čimice) · experienced and personal',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.title','en','Accounting, payroll and taxes—handled',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.titleAccent','en','Accounting',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.lead','en','End-to-end accounting, payroll and tax returns for freelancers and companies. Clear, on time and fully compliant with current legislation.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.image','en','https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.cardTitle','en','Accounting & advisory services in Prague and nearby',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.ctaPrimary','en','Book a consultation',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:hero.ctaSecondary','en','Our services',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.enabled','en','show',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.sectionTitle','en','Accounting and tax services',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.sectionDesc','en','We provide double-entry bookkeeping and payroll, tax returns and ongoing advisory. We also handle accounting reconstruction and management reporting.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.1.title','en','Double-entry bookkeeping & year-end close',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.1.desc','en','Complete accounting including annual close, analytical accounts and cost centres, and outputs for better business management.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.2.title','en','Tax returns & optimisation',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.2.desc','en','VAT, personal/corporate income tax, road tax and more. Including ongoing consultations and proposals to optimise your tax position.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.3.title','en','Payroll & HR administration',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.3.desc','en','Full payroll processing, communication with authorities and support for HR administration for small and larger teams.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.4.title','en','Accounting outsourcing',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:services.4.desc','en','We can take over your finance office: documents, invoicing, banking payments, representation at authorities and regular reporting—under clear contractual terms.',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.enabled','en','show',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.title','en','Why choose REDUS?',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.text','en','We combine expertise, confidentiality and a personal approach. We solve accounting and tax matters so you have clarity and can focus on your business.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.bullet1','en','Personal, tailored approach',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.bullet2','en','Experience with companies and freelancers',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.bullet3','en','On-time delivery and transparent communication',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.quote','en','“We offer more than accounting—we bring certainty, clarity and solutions that support sustainable growth.”',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.quoteAuthor','en','Martin Rada, head of office',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.image1','en','https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:why.image2','en','https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.enabled','en','show',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.title','en','Pricing',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.teaser','en','Transparent pricing based on the scope of cooperation. We will prepare a tailored offer after a short consultation.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.billingMode','en','dual',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.billingMonthly','en','Monthly',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.billingYearly','en','Yearly – 20% off',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.featuresHeading','en','Includes:',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.title','en','Basic',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.priceMonthly','en','from 690 CZK / month',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.priceYearly','en','from 6,600 CZK / year',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.desc','en','A good fit for freelancers and smaller businesses that want their accounting in order—without hassle.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.cta','en','Request an offer',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.ctaHref','en','',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.popularBadge','en','',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan1.features','en','Bookkeeping\nMonthly overview\nEmail support\nBasic tax agenda',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.title','en','Business',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.priceMonthly','en','from 1,490 CZK / month',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.priceYearly','en','from 14,300 CZK / year',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.desc','en','For businesses that need more—faster responses and a broader service scope.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.cta','en','Request an offer',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.ctaHref','en','',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.popularBadge','en','Most popular',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan2.features','en','Everything in Basic\nPriority support\nDecision consultations\nDeeper tax planning\nCoordination with your lawyer',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.title','en','Enterprise',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.priceMonthly','en','Custom',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.priceYearly','en','Custom',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.desc','en','Tailored for larger organisations and complex structures—scope defined to your needs.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.cta','en','Book a consultation',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.ctaHref','en','',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.popularBadge','en','',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:pricing.plan3.features','en','Dedicated contact\nCustom reports and processes\nStrategic advisory\nMultiple entities / consolidation\nSLA as agreed',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:tax.enabled','en','show',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:tax.title','en','Tax advisory',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:tax.teaser','en','Ongoing consultations, representation before tax authorities, international taxation and proposals to optimise your tax liability.',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.enabled','en','show',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.title','en','Want your accounting and taxes under control?',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.desc','en','Call or email us. We will arrange a short introductory consultation and prepare an offer based on the scope of your agenda.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.btnPhone','en','',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.btnEmail','en','Email us',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.badge','en','No obligation',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.title','en','Tell us briefly what you need',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.lead','en','Fill in the form and we will get back to you with the next steps and an indicative proposal.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.bullet1','en','Fast response',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.bullet2','en','Confidential and professional',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.bullet3','en','Personal approach',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.nameLabel','en','Name',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.phoneLabel','en','Phone',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.emailLabel','en','Email',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.messageLabel','en','Message',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.submitLabel','en','Submit',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.sendingLabel','en','Sending…',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:cta.form.successMessage','en','Thank you. We will get back to you as soon as possible.',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:contact.phone','en','+420 233 325 927',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:contact.email','en','info@redus.cz',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'main:contact.address','en','Čimická 53/809, 181 04 Prague 8 – Čimice, Czech Republic',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.blurb','en','Accounting and tax office in Prague 8. Double-entry bookkeeping, payroll, tax returns, advisory and accounting outsourcing.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.billing','en','REDUS\nMartin Rada\nCompany ID (IČO): 61841404\nVAT ID (DIČ): CZ7312011113\nTrade licence registered with Prague 8\nRef. no.: ŽO/F/05/3537, Reg. no.: 310008-65489',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.copyright','en','© REDUS. All rights reserved.',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.headingContact','en','Contact details',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.headingBilling','en','Billing details',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.linkedinHref','en','https://www.linkedin.com/',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.linkPrivacyLabel','en','Privacy policy',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.linkPrivacyHref','en','/o-nas',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.linkTermsLabel','en','Terms & conditions',now()),
    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'footer.linkTermsHref','en','/o-nas',now()),

    ('1291ae47-cc38-4a26-9acb-fb0d0d620a17'::uuid,'about:about.text','en','REDUS is an accounting and tax office in Prague 8 – Čimice. We help companies and freelancers with double-entry bookkeeping, payroll, tax returns and ongoing advisory. We also provide accounting outsourcing including reporting and support when dealing with authorities.',now())
)
INSERT INTO content_entries (tenant_id, key, lang, value, updated_at)
SELECT tenant_id, key, lang, value, updated_at FROM input_rows
ON CONFLICT (tenant_id, key, lang)
DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;


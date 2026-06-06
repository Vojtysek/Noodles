-- Katalog NEFINANČNÍCH přínosů rekonstrukcí — komfort, zdraví, prostředí a další.
-- Read-only katalog pro aplikaci: čte ho anon i přihlášený uživatel, klient do něj nezapisuje.
-- Záznamy s project_id = null jsou celostavební přínosy (komplexní renovace celého domu).

create table renovation_benefits (
  id text primary key,
  project_id text,
  category text not null check (category in ('komfort', 'zdravi', 'prostredi', 'hodnota', 'bezpecnost', 'hluk', 'nezavislost')),
  title text not null,
  description text not null,
  meeting_pitch text,
  impact smallint not null check (impact between 1 and 3),
  created_at timestamptz not null default now()
);

-- RLS: read-only katalog — povolíme select všem (anon i authenticated), žádné write policy.
alter table renovation_benefits enable row level security;

create policy "renovation_benefits jsou čitelné pro všechny"
  on renovation_benefits
  for select
  to anon, authenticated
  using (true);

insert into renovation_benefits (id, project_id, category, title, description, meeting_pitch, impact) values
  ('fasada-stabilni-teplota', 'fasada', 'komfort', 'Konec studených zdí', 'Po zateplení jsou obvodové zdi na dotek teplé a byt se prohřeje rovnoměrně. Konec táhnoucího chladu od stěn.', 'Znáte ten pocit, když si v zimě sednete k obvodové zdi a táhne na vás chlad? Po zateplení budou zdi na dotek teplé. Byt se prohřeje rovnoměrně.', 3),
  ('fasada-konec-plisni', 'fasada', 'zdravi', 'Konec plísní a vlhkých stěn', 'Odstranění tepelných mostů a kondenzace znamená zdravější vzduch a žádné mapy vlhkosti.', null, 3),
  ('fasada-reprezentativni-vzhled', 'fasada', 'hodnota', 'Reprezentativní vzhled domu', 'Nová fasáda zvedne celkový dojem z domu i tržní hodnotu jednotlivých bytů.', null, 2),
  ('fasada-nizsi-emise', 'fasada', 'prostredi', 'Nižší emise z vytápění', 'Menší spotřeba energie na topení znamená nižší uhlíkovou stopu celého domu.', null, 2),
  ('okna-mene-hluku', 'okna', 'hluk', 'Výrazně méně hluku z ulice', 'Izolační trojskla utlumí hluk dopravy i ruchu z okolí. Doma je konečně klid.', 'Konečně se vyspíte. Nová okna dokonale odhlučí ulici. I když projede sanitka nebo popeláři, uvnitř uslyšíte jen ticho.', 3),
  ('okna-konec-pruvanu', 'okna', 'komfort', 'Konec průvanu a studených míst', 'Těsná okna odstraní studené sálání i nepříjemný průvan v blízkosti oken.', null, 3),
  ('okna-bezpecnostni-kovani', 'okna', 'bezpecnost', 'Bezpečnostní kování', 'Moderní kování výrazně ztíží vloupání a zvyšuje pocit bezpečí, zejména v nižších patrech.', null, 2),
  ('okna-atraktivita-bytu', 'okna', 'hodnota', 'Vyšší atraktivita bytů', 'Nová okna patří k prvním věcem, které kupci ocení — zvyšují prodejnost i hodnotu bytu.', null, 2),
  ('strecha-ochrana-pred-zatekanim', 'strecha', 'bezpecnost', 'Ochrana před zatékáním', 'Nová střecha ukončí havárie a škody v horních patrech způsobené zatékáním.', null, 3),
  ('strecha-prijemnejsi-klima', 'strecha', 'komfort', 'Příjemnější klima v horních bytech', 'Zateplená střecha zabrání letnímu přehřívání podkroví a horních pater.', 'Sousedé pod střechou už nebudou mít v létě v bytě 35 stupňů a v zimě jim nebude unikat teplo. Navíc nová izolace znamená, že nám do domu další desítky let nezateče.', 2),
  ('strecha-prodlouzeni-zivotnosti', 'strecha', 'hodnota', 'Prodloužení životnosti domu', 'Kvalitní střešní plášť chrání konstrukci domu a oddálí nákladné opravy.', null, 2),
  ('vytah-tichy-provoz', 'vytah', 'komfort', 'Tichý a spolehlivý provoz', 'Moderní výtah jezdí tiše a plynule, bez častých poruch a nečekaných odstávek.', null, 3),
  ('vytah-bezpecnostni-prvky', 'vytah', 'bezpecnost', 'Moderní bezpečnostní prvky', 'Nouzová komunikace a plynulé dojezdy zvyšují bezpečí všech obyvatel domu.', 'Nikdo z nás nechce uvíznout ve starém výtahu mezi patry a marně bouchat na dveře. Nový výtah si v případě poruchy sám přivolá pomoc a vy se hned spojíte se službou.', 3),
  ('vytah-bezbarierovy-pristup', 'vytah', 'komfort', 'Bezbariérový přístup', 'Pohodlí pro seniory, rodiče s kočárky i běžné nošení nákupů do vyšších pater.', null, 2),
  ('zaluzie-leto-bez-klimatizace', 'zaluzie', 'komfort', 'Léto bez klimatizace', 'Venkovní stínění zastaví přehřívání interiéru dřív, než teplo pronikne dovnitř.', 'Už žádné přehřáté byty v červenci. Žaluzie zastaví slunce ještě před oknem. A v noci vám nebudou svítit lampy z ulice přímo do postele.', 3),
  ('zaluzie-lepsi-spanek', 'zaluzie', 'zdravi', 'Lepší spánek díky zatemnění', 'Plné zatemnění místnosti podpoří kvalitnější a klidnější spánek.', null, 2),
  ('zaluzie-vice-soukromi', 'zaluzie', 'komfort', 'Více soukromí', 'Žaluzie spolehlivě cloní pohledy zvenčí a zvyšují pocit soukromí v bytě.', null, 2),
  ('tepelne-cerpadlo-nezavislost-na-plynu', 'tepelne-cerpadlo', 'nezavislost', 'Nezávislost na cenách plynu', 'Vytápění tepelným čerpadlem odpojí dům od kolísání cen plynu a jeho dodávek.', null, 3),
  ('tepelne-cerpadlo-nizsi-uhlikova-stopa', 'tepelne-cerpadlo', 'prostredi', 'Výrazně nižší uhlíková stopa', 'Vytápění čerpadlem výrazně snižuje emise oproti spalování plynu.', null, 3),
  ('tepelne-cerpadlo-bezobsluzny-provoz', 'tepelne-cerpadlo', 'komfort', 'Bezobslužné a stabilní vytápění', 'Systém pracuje automaticky a udržuje stabilní teplo bez nutnosti zásahů.', null, 2),
  ('tepelne-cerpadlo-ochrana-pred-havarii', 'tepelne-cerpadlo', 'bezpecnost', 'Ochrana před havárií', 'Konec rizika výpadku přesluhujícího kotle nebo výměníku. Nový zdroj tepla je spolehlivý a hlídaný.', 'Náš starý kotel (nebo výměník) přesluhuje. Nechceme přece řešit, že se nám uprostřed ledna rozbije a my budeme tři týdny v mrazech čekat na náhradní díly.', 2),
  ('vytapeni-rovnomerne-teplo', 'vytapeni', 'komfort', 'Rovnoměrné teplo ve všech bytech', 'Vyvážená soustava a termostatické hlavice zajistí stejné teplo v celém domě.', 'Konec věčných dohadů, kdo si přetápí a komu naopak pořád zima. Po vyvážení soustavy bude mít každý byt přesně tolik tepla, kolik potřebuje, a topíme spravedlivě.', 3),
  ('vytapeni-mene-havarii', 'vytapeni', 'bezpecnost', 'Méně havárií a odstávek', 'Modernizovaná soustava je spolehlivější a méně náchylná k poruchám a odstávkám.', null, 2),
  ('vytapeni-efektivnejsi-provoz', 'vytapeni', 'prostredi', 'Efektivnější provoz s nižšími emisemi', 'Optimalizovaný systém spotřebuje méně energie a produkuje nižší emise.', null, 2),
  ('rekuperace-cerstvy-vzduch', 'rekuperace', 'zdravi', 'Čerstvý vzduch bez otevírání oken', 'Řízené větrání s filtrací pylu a prachu přivádí čistý vzduch i při zavřených oknech.', 'Budete dýchat čerstvý vzduch 24 hodin denně, i když zapomenete vyvětrat. Pylové filtry navíc uleví všem alergikům v domě a navždy se zbavíme vlhkosti a plísní v rozích.', 3),
  ('rekuperace-mene-co2', 'rekuperace', 'zdravi', 'Méně CO₂ a vlhkosti v bytě', 'Nižší koncentrace CO₂ a stabilní vlhkost podpoří lepší spánek i koncentraci.', null, 2),
  ('rekuperace-vetrani-bez-hluku', 'rekuperace', 'hluk', 'Větrání bez hluku z ulice', 'Vzduch se vyměňuje bez otevírání oken, takže do bytu neproniká hluk z ulice.', null, 2),
  ('rekuperace-zadny-pruvan', 'rekuperace', 'komfort', 'Žádný průvan při větrání', 'Čerstvý vzduch proudí rovnoměrně a nenápadně, bez nepříjemného průvanu.', null, 2),
  ('fotovoltaika-vlastni-elektrina', 'fotovoltaika', 'nezavislost', 'Vlastní elektřina ze střechy', 'Výroba vlastní energie snižuje závislost na dodavatelích i na růstu cen elektřiny.', 'Vyrábíme si vlastní energii na vlastní střeše. Nejsme už stoprocentně závislí na tom, co si diktují velké energetické firmy. Zvyšujeme naši energetickou bezpečnost.', 3),
  ('fotovoltaika-cista-energie', 'fotovoltaika', 'prostredi', 'Čistá energie s nulovými emisemi', 'Sluneční elektřina nahrazuje energii z fosilních zdrojů bez produkce emisí.', null, 3),
  ('fotovoltaika-atraktivita-domu', 'fotovoltaika', 'hodnota', 'Atraktivita domu pro kupce i banky', 'Vlastní zdroj energie zvyšuje hodnotu domu a zlepšuje jeho postavení u kupců i bank.', null, 2),
  ('dum-rust-hodnoty', null, 'hodnota', 'Skokový růst hodnoty bytu', 'Komplexní renovace zvedne tržní hodnotu všech bytů v domě naráz — z paneláku se stává moderní novostavba.', 'Dům už nebude vypadat jako starý panelák, ale jako moderní novostavba. Pokud budete chtít byt někdy prodat nebo odkázat dětem, jeho tržní hodnota stoupne o statisíce.', 3),
  ('dum-reprezentativni-bydleni', null, 'hodnota', 'Reprezentativní bydlení', 'Celkový vzhled domu i okolí se promění — čisté, krásné a moderní prostředí, do kterého se rádi vracíte.', 'Zlepšíme vzhled celého našeho okolí. Budeme se vracet do čistého, krásného a moderního domu, za který se nebudeme muset před návštěvami stydět.', 2);

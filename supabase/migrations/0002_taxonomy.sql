-- Safin Trucks — reference data (brands, models, types, categories, locations).
-- Idempotent: safe to re-run.

insert into locations (country_code, governorate, slug, name_en, name_ku, name_ar, sort_order) values
  ('IQ','Erbil','erbil','Erbil','هەولێر','أربيل',1),
  ('IQ','Sulaymaniyah','sulaymaniyah','Sulaymaniyah','سلێمانی','السليمانية',2),
  ('IQ','Duhok','duhok','Duhok','دهۆک','دهوك',3),
  ('IQ','Halabja','halabja','Halabja','هەڵەبجە','حلبجة',4),
  ('IQ','Kirkuk','kirkuk','Kirkuk','کەرکووک','كركوك',5),
  ('IQ','Baghdad','baghdad','Baghdad','بەغدا','بغداد',6),
  ('IQ','Basra','basra','Basra','بەسڕە','البصرة',7),
  ('IQ','Nineveh','nineveh','Nineveh','نەینەوا','نينوى',8),
  ('IQ','Anbar','anbar','Anbar','ئەنبار','الأنبار',9),
  ('IQ','Najaf','najaf','Najaf','نەجەف','النجف',10),
  ('IQ','Karbala','karbala','Karbala','کەربەلا','كربلاء',11),
  ('IQ','Diyala','diyala','Diyala','دیالە','ديالى',12)
on conflict (slug) do nothing;

insert into truck_brands (slug, name, sort_order) values
  ('volvo','Volvo',1),
  ('scania','Scania',2),
  ('mercedes-benz','Mercedes-Benz',3),
  ('man','MAN',4),
  ('daf','DAF',5),
  ('renault','Renault',6),
  ('iveco','Iveco',7),
  ('isuzu','Isuzu',8),
  ('hino','Hino',9),
  ('kia','Kia',10),
  ('ford','Ford',11),
  ('other','Other',99)
on conflict (slug) do nothing;

insert into truck_models (brand_id, slug, name)
select b.id, m.slug, m.name from truck_brands b
join (values
  ('volvo','fh','FH'), ('volvo','fh16','FH16'), ('volvo','fm','FM'), ('volvo','fmx','FMX'),
  ('scania','r-series','R-Series'), ('scania','s-series','S-Series'), ('scania','g-series','G-Series'), ('scania','p-series','P-Series'),
  ('mercedes-benz','actros','Actros'), ('mercedes-benz','arocs','Arocs'), ('mercedes-benz','atego','Atego'), ('mercedes-benz','axor','Axor'),
  ('man','tgx','TGX'), ('man','tgs','TGS'), ('man','tgm','TGM'),
  ('daf','xf','XF'), ('daf','cf','CF'), ('daf','lf','LF'),
  ('renault','t-series','T-Series'), ('renault','k-series','K-Series'), ('renault','c-series','C-Series'),
  ('iveco','stralis','Stralis'), ('iveco','s-way','S-Way'), ('iveco','trakker','Trakker'), ('iveco','daily','Daily'),
  ('isuzu','npr','NPR'), ('isuzu','forward','Forward'),
  ('hino','500','500 Series'), ('hino','300','300 Series'),
  ('kia','bongo','Bongo'),
  ('ford','cargo','Cargo')
) as m(brand_slug, slug, name) on m.brand_slug = b.slug
on conflict (brand_id, slug) do nothing;

insert into truck_types (slug, name_en, name_ku, name_ar, sort_order) values
  ('tractor-unit','Tractor Unit','یەکەی ڕاکێشەر','رأس قاطرة',1),
  ('tipper','Tipper','قەڵەبدەر','قلاب',2),
  ('tanker','Tanker','تانکەر','صهريج',3),
  ('refrigerated','Refrigerated','ساردکەرەوە','مبرد',4),
  ('construction','Construction','بیناسازی','إنشاءات',5),
  ('flatbed','Flatbed','تەختە','مسطح',6),
  ('box-truck','Box Truck','سندوقدار','صندوق',7),
  ('light-commercial','Light Commercial','بازرگانی سووک','تجاري خفيف',8),
  ('crane','Crane Truck','جەڕەسقە','رافعة',9),
  ('other','Other','هیتر','أخرى',99)
on conflict (slug) do nothing;

insert into part_categories (slug, name_en, name_ku, name_ar, sort_order) values
  ('engine','Engine','بزوێنەر','محرك',1),
  ('gearbox','Gearbox','گێربۆکس','ناقل الحركة',2),
  ('turbo','Turbo','تۆربۆ','تيربو',3),
  ('axle','Axle','تەوەر','محور',4),
  ('lights','Lights','چرا','إضاءة',5),
  ('tyres','Tyres','تایە','إطارات',6),
  ('electronics','Electronics','ئەلیکترۆنیات','إلكترونيات',7),
  ('cabin','Cabin','کابین','كابينة',8),
  ('brake-system','Brake System','سیستەمی بڕێک','نظام الفرامل',9),
  ('suspension','Suspension','سیستەمی هەڵواسین','نظام التعليق',10),
  ('cooling','Cooling','سیستەمی ساردکردنەوە','نظام التبريد',11),
  ('body-parts','Body Parts','پارچەی لەش','قطع الهيكل',12),
  ('other','Other','هیتر','أخرى',99)
on conflict (slug) do nothing;

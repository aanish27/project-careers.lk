/**
 * Sri Lanka's administrative location hierarchy: Province -> District -> City.
 * Source: Sri Lanka Department of Census and Statistics (9 provinces, 25 districts).
 * City-level entries are the district's main towns/suburbs, used for the location
 * selector; province/district slugs double as the SEO location taxonomy
 * (e.g. "jobs in kandy", "jobs in central province").
 */
export const LOCATION_TAXONOMY = {
  'Western Province': {
    slug: 'western-province',
    districts: {
      Colombo: {
        slug: 'colombo',
        cities: {
          Angoda: 'angoda',
          Athurugiriya: 'athurugiriya',
          Avissawella: 'avissawella',
          Battaramulla: 'battaramulla',
          Boralesgamuwa: 'boralesgamuwa',
          'Colombo 1': 'colombo-1',
          'Colombo 10': 'colombo-10',
          'Colombo 11': 'colombo-11',
          'Colombo 12': 'colombo-12',
          'Colombo 13': 'colombo-13',
          'Colombo 14': 'colombo-14',
          'Colombo 15': 'colombo-15',
          'Colombo 2': 'colombo-2',
          'Colombo 3': 'colombo-3',
          'Colombo 4': 'colombo-4',
          'Colombo 5': 'colombo-5',
          'Colombo 6': 'colombo-6',
          'Colombo 7': 'colombo-7',
          'Colombo 8': 'colombo-8',
          'Colombo 9': 'colombo-9',
          Dehiwala: 'dehiwala',
          Embulgama: 'embulgama',
          Godagama: 'godagama',
          Hanwella: 'hanwella',
          Homagama: 'homagama',
          Kaduwela: 'kaduwela',
          Kalubowila: 'kalubowila',
          Kesbewa: 'kesbewa',
          Kohuwala: 'kohuwala',
          Kolonnawa: 'kolonnawa',
          Kotikawatta: 'kotikawatta',
          Kottawa: 'kottawa',
          Kotte: 'kotte',
          Maharagama: 'maharagama',
          Malabe: 'malabe',
          Meegoda: 'meegoda',
          Moratuwa: 'moratuwa',
          'Mount Lavinia': 'mount-lavinia',
          Nawagamuwa: 'nawagamuwa',
          Nawala: 'nawala',
          Nugegoda: 'nugegoda',
          Olaboduwa: 'olaboduwa',
          Padukka: 'padukka',
          Pannipitiya: 'pannipitiya',
          Piliyandala: 'piliyandala',
          Polgasowita: 'polgasowita',
          Rajagiriya: 'rajagiriya',
          Ranala: 'ranala',
          Ratmalana: 'ratmalana',
          Talawatugoda: 'talawatugoda',
          Wellampitiya: 'wellampitiya',
        },
      },
      Gampaha: {
        slug: 'gampaha',
        cities: {
          Biyagama: 'biyagama',
          Bopitiya: 'bopitiya',
          Delathura: 'delathura',
          Delgoda: 'delgoda',
          Divulapitiya: 'divulapitiya',
          Dompe: 'dompe',
          'Gampaha City': 'gampaha-city',
          Ganemulla: 'ganemulla',
          Gonawala: 'gonawala',
          'Ja-Ela': 'ja-ela',
          Kadawatha: 'kadawatha',
          Kalagedihena: 'kalagedihena',
          Kandana: 'kandana',
          Katunayake: 'katunayake',
          Kelaniya: 'kelaniya',
          Kiribathgoda: 'kiribathgoda',
          Kirindiwela: 'kirindiwela',
          Mawaramandiya: 'mawaramandiya',
          Minuwangoda: 'minuwangoda',
          Mirigama: 'mirigama',
          Miriswatta: 'miriswatta',
          Negombo: 'negombo',
          Nilsirigama: 'nilsirigama',
          Nittambuwa: 'nittambuwa',
          Peliyagoda: 'peliyagoda',
          Pugoda: 'pugoda',
          Ragama: 'ragama',
          Seeduwa: 'seeduwa',
          Veyangoda: 'veyangoda',
          Walikatiya: 'walikatiya',
          Wattala: 'wattala',
        },
      },
      Kalutara: {
        slug: 'kalutara',
        cities: {
          Alutgama: 'alutgama',
          Awittawa: 'awittawa',
          Bandaragama: 'bandaragama',
          Beruwala: 'beruwala',
          Gonapola: 'gonapola',
          Horana: 'horana',
          Ingiriya: 'ingiriya',
          Ittapane: 'ittapane',
          'Kalutara City': 'kalutara-city',
          Kevitiyagala: 'kevitiyagala',
          Matugama: 'matugama',
          Meegahathenna: 'meegahathenna',
          Moragala: 'moragala',
          Panadura: 'panadura',
          Pitipana: 'pitipana',
          Polgampola: 'polgampola',
          Talagala: 'talagala',
          Uthumgama: 'uthumgama',
          Wadduwa: 'wadduwa',
          Walallavita: 'walallavita',
        },
      },
    },
  },
  'Central Province': {
    slug: 'central-province',
    districts: {
      Kandy: {
        slug: 'kandy',
        cities: {
          Akurana: 'akurana',
          Ampitiya: 'ampitiya',
          Danthure: 'danthure',
          Deltota: 'deltota',
          Digana: 'digana',
          Dodamwala: 'dodamwala',
          Doluwa: 'doluwa',
          Galagedara: 'galagedara',
          Galaha: 'galaha',
          Gampola: 'gampola',
          Gelioya: 'gelioya',
          Kadugannawa: 'kadugannawa',
          'Kandy City': 'kandy-city',
          Katugastota: 'katugastota',
          Kundasale: 'kundasale',
          'Madawala Bazaar': 'madawala-bazaar',
          Menikhinna: 'menikhinna',
          Nawalapitiya: 'nawalapitiya',
          Pallekele: 'pallekele',
          Pathahewaheta: 'pathahewaheta',
          Peradeniya: 'peradeniya',
          Pilimatalawa: 'pilimatalawa',
          Poththapitiya: 'poththapitiya',
          Pussellawa: 'pussellawa',
          Rattapitiya: 'rattapitiya',
          Tawalantenne: 'tawalantenne',
          Udunuwara: 'udunuwara',
          Urapola: 'urapola',
          Wattegama: 'wattegama',
        },
      },
      Matale: {
        slug: 'matale',
        cities: {
          Dambulla: 'dambulla',
          Galewela: 'galewela',
          'Matale City': 'matale-city',
          Palapathwela: 'palapathwela',
          Pallepola: 'pallepola',
          Rattota: 'rattota',
          Sigiriya: 'sigiriya',
          Ukuwela: 'ukuwela',
          Yatawatta: 'yatawatta',
        },
      },
      'Nuwara Eliya': {
        slug: 'nuwara-eliya',
        cities: {
          Arukwatta: 'arukwatta',
          Ginigathhena: 'ginigathhena',
          Hatton: 'hatton',
          Karametiya: 'karametiya',
          Kotmale: 'kotmale',
          Madulla: 'madulla',
          'Nuwara Eliya City': 'nuwara-eliya-city',
          Ramboda: 'ramboda',
          Rikillagaskada: 'rikillagaskada',
          Udapalatha: 'udapalatha',
          Walapane: 'walapane',
        },
      },
    },
  },
  'Southern Province': {
    slug: 'southern-province',
    districts: {
      Galle: {
        slug: 'galle',
        cities: {
          Ahangama: 'ahangama',
          Ahungalla: 'ahungalla',
          Ambalangoda: 'ambalangoda',
          Atakohota: 'atakohota',
          Baddegama: 'baddegama',
          Balapitiya: 'balapitiya',
          Batapola: 'batapola',
          Bentota: 'bentota',
          Elpitiya: 'elpitiya',
          'Galle City': 'galle-city',
          Hikkaduwa: 'hikkaduwa',
          Karandeniya: 'karandeniya',
          Karapitiya: 'karapitiya',
          Kosgoda: 'kosgoda',
          Neluwa: 'neluwa',
          Opatha: 'opatha',
          Thangalla: 'thangalla',
          Uragasmanhandiya: 'uragasmanhandiya',
        },
      },
      Matara: {
        slug: 'matara',
        cities: {
          Akuressa: 'akuressa',
          Deniyaya: 'deniyaya',
          Dikwella: 'dikwella',
          Gandara: 'gandara',
          Hakmana: 'hakmana',
          Kadihingala: 'kadihingala',
          Kamburugamuwa: 'kamburugamuwa',
          Kamburupitiya: 'kamburupitiya',
          Kekanadurra: 'kekanadurra',
          'Matara City': 'matara-city',
          Weligama: 'weligama',
        },
      },
      Hambantota: {
        slug: 'hambantota',
        cities: {
          Ambalantota: 'ambalantota',
          Beliatta: 'beliatta',
          'Hambantota City': 'hambantota-city',
          Tangalla: 'tangalla',
          Tissamaharama: 'tissamaharama',
        },
      },
    },
  },
  'Northern Province': {
    slug: 'northern-province',
    districts: {
      Jaffna: {
        slug: 'jaffna',
        cities: {
          Chavakachcheri: 'chavakachcheri',
          'Jaffna City': 'jaffna-city',
          Nallur: 'nallur',
        },
      },
      Kilinochchi: {
        slug: 'kilinochchi',
        cities: {
          'Kilinochchi City': 'kilinochchi-city',
        },
      },
      Mannar: {
        slug: 'mannar',
        cities: {
          'Mannar City': 'mannar-city',
        },
      },
      Vavuniya: {
        slug: 'vavuniya',
        cities: {
          'Vavuniya City': 'vavuniya-city',
        },
      },
      Mullaitivu: {
        slug: 'mullaitivu',
        cities: {
          'Mullaitivu City': 'mullaitivu-city',
        },
      },
    },
  },
  'Eastern Province': {
    slug: 'eastern-province',
    districts: {
      Batticaloa: {
        slug: 'batticaloa',
        cities: {
          'Batticaloa City': 'batticaloa-city',
        },
      },
      Ampara: {
        slug: 'ampara',
        cities: {
          Akkarepattu: 'akkarepattu',
          'Ampara City': 'ampara-city',
          'Arugam Bay': 'arugam-bay',
          Dehiattakandiya: 'dehiattakandiya',
          Diyawiddagama: 'diyawiddagama',
          Kalmunai: 'kalmunai',
          Komari: 'komari',
          Lahugala: 'lahugala',
          Mawanagama: 'mawanagama',
          Panama: 'panama',
          Pottuvil: 'pottuvil',
          Sainthamaruthu: 'sainthamaruthu',
        },
      },
      Trincomalee: {
        slug: 'trincomalee',
        cities: {
          Kinniya: 'kinniya',
          'Trincomalee City': 'trincomalee-city',
        },
      },
    },
  },
  'North Western Province': {
    slug: 'north-western-province',
    districts: {
      Kurunegala: {
        slug: 'kurunegala',
        cities: {
          Alawwa: 'alawwa',
          Bingiriya: 'bingiriya',
          Galgamuwa: 'galgamuwa',
          Giriulla: 'giriulla',
          Hettipola: 'hettipola',
          Ibbagamuwa: 'ibbagamuwa',
          Kuliyapitiya: 'kuliyapitiya',
          'Kurunegala City': 'kurunegala-city',
          Mawathagama: 'mawathagama',
          Moonamale: 'moonamale',
          Narammala: 'narammala',
          Nikaweratiya: 'nikaweratiya',
          Pannala: 'pannala',
          Polgahawela: 'polgahawela',
          Wariyapola: 'wariyapola',
        },
      },
      Puttalam: {
        slug: 'puttalam',
        cities: {
          Anamaduwa: 'anamaduwa',
          Chilaw: 'chilaw',
          Dankotuwa: 'dankotuwa',
          Marawila: 'marawila',
          Nattandiya: 'nattandiya',
          'Puttalam City': 'puttalam-city',
          Wennappuwa: 'wennappuwa',
        },
      },
    },
  },
  'North Central Province': {
    slug: 'north-central-province',
    districts: {
      Anuradhapura: {
        slug: 'anuradhapura',
        cities: {
          'Anuradhapura City': 'anuradhapura-city',
          Eppawala: 'eppawala',
          Galenbindunuwewa: 'galenbindunuwewa',
          Galnewa: 'galnewa',
          Habarana: 'habarana',
          Kekirawa: 'kekirawa',
          Medawachchiya: 'medawachchiya',
          Mihintale: 'mihintale',
          Nochchiyagama: 'nochchiyagama',
          Talawa: 'talawa',
          Tambuttegama: 'tambuttegama',
        },
      },
      Polonnaruwa: {
        slug: 'polonnaruwa',
        cities: {
          Hingurakgoda: 'hingurakgoda',
          Kaduruwela: 'kaduruwela',
          Medirigiriya: 'medirigiriya',
          'Polonnaruwa City': 'polonnaruwa-city',
        },
      },
    },
  },
  'Sabaragamuwa Province': {
    slug: 'sabaragamuwa-province',
    districts: {
      Ratnapura: {
        slug: 'ratnapura',
        cities: {
          Balangoda: 'balangoda',
          Botiyatenna: 'botiyatenna',
          Eheliyagoda: 'eheliyagoda',
          Embilipitiya: 'embilipitiya',
          Kahawatta: 'kahawatta',
          Karawita: 'karawita',
          Kuruwita: 'kuruwita',
          Madalagama: 'madalagama',
          Nivithigala: 'nivithigala',
          Pelmadulla: 'pelmadulla',
          'Ratnapura City': 'ratnapura-city',
          Watapotha: 'watapotha',
          Weddagala: 'weddagala',
        },
      },
      Kegalle: {
        slug: 'kegalle',
        cities: {
          Dehiowita: 'dehiowita',
          Deraniyagala: 'deraniyagala',
          Dodammuluwa: 'dodammuluwa',
          Galigamuwa: 'galigamuwa',
          Hemmathagama: 'hemmathagama',
          'Kegalle City': 'kegalle-city',
          Kitulgala: 'kitulgala',
          Mawanella: 'mawanella',
          Rambukkana: 'rambukkana',
          Ruwanwella: 'ruwanwella',
          Warakapola: 'warakapola',
          Yatiyantota: 'yatiyantota',
        },
      },
    },
  },
  'Uva Province': {
    slug: 'uva-province',
    districts: {
      Badulla: {
        slug: 'badulla',
        cities: {
          'Badulla City': 'badulla-city',
          Bandarawela: 'bandarawela',
          Diyatalawa: 'diyatalawa',
          Ella: 'ella',
          'Hali Ela': 'hali-ela',
          Haputale: 'haputale',
          Mahiyanganaya: 'mahiyanganaya',
          Passara: 'passara',
          Rideemaliyadda: 'rideemaliyadda',
          Welimada: 'welimada',
        },
      },
      Monaragala: {
        slug: 'monaragala',
        cities: {
          Bibile: 'bibile',
          Buttala: 'buttala',
          Kataragama: 'kataragama',
          'Monaragala City': 'monaragala-city',
          Wellawaya: 'wellawaya',
        },
      },
    },
  },
} as const;

export type Province = keyof typeof LOCATION_TAXONOMY;
export const PROVINCES = Object.keys(LOCATION_TAXONOMY) as Province[];

export type District<P extends Province = Province> =
  keyof (typeof LOCATION_TAXONOMY)[P]['districts'];

/** All district names across every province. */
export const ALL_DISTRICTS: string[] = PROVINCES.flatMap((province) =>
  Object.keys(LOCATION_TAXONOMY[province].districts),
);

/** All city names across every district. */
export const ALL_CITIES: string[] = ALL_DISTRICTS.flatMap((district) =>
  getCitiesForDistrict(district),
);

export function getDistrictsForProvince(
  province: string | undefined,
): string[] {
  if (!province || !(province in LOCATION_TAXONOMY)) return [];
  return Object.keys(LOCATION_TAXONOMY[province as Province].districts);
}

/**
 * Districts are unique across the whole country, so a district can be
 * looked up on its own without knowing its parent province.
 */
export function getCitiesForDistrict(district: string | undefined): string[] {
  if (!district) return [];
  for (const province of PROVINCES) {
    const districts = LOCATION_TAXONOMY[province].districts as Record<
      string,
      { cities: Record<string, string> }
    >;
    if (district in districts) {
      return Object.keys(districts[district].cities);
    }
  }
  return [];
}

export function getProvinceSlug(province: string | undefined): string | null {
  if (!province || !(province in LOCATION_TAXONOMY)) return null;
  return LOCATION_TAXONOMY[province as Province].slug;
}

export function getDistrictSlug(district: string | undefined): string | null {
  if (!district) return null;
  for (const province of PROVINCES) {
    const districts = LOCATION_TAXONOMY[province].districts as Record<
      string,
      { slug: string }
    >;
    if (district in districts) return districts[district].slug;
  }
  return null;
}

/** slug -> canonical province name, for resolving SEO location routes. */
export const PROVINCE_SLUG_TO_NAME: ReadonlyMap<string, string> = new Map(
  PROVINCES.map((province) => [LOCATION_TAXONOMY[province].slug, province]),
);

/** slug -> canonical district name, for resolving SEO location routes. */
export const DISTRICT_SLUG_TO_NAME: ReadonlyMap<string, string> = new Map(
  PROVINCES.flatMap((province) =>
    Object.entries(LOCATION_TAXONOMY[province].districts).map(
      ([name, { slug }]) => [slug, name] as const,
    ),
  ),
);

/** slug -> canonical city name, for resolving SEO location routes. */
export const CITY_SLUG_TO_NAME: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const province of PROVINCES) {
    const districts = LOCATION_TAXONOMY[province].districts as Record<
      string,
      { cities: Record<string, string> }
    >;
    for (const { cities } of Object.values(districts)) {
      for (const [name, slug] of Object.entries(cities)) {
        map.set(slug, name);
      }
    }
  }
  return map;
})();

export function getCitySlug(city: string | null | undefined): string | null {
  if (!city) return null;
  for (const province of PROVINCES) {
    const districts = LOCATION_TAXONOMY[province].districts as Record<
      string,
      { cities: Record<string, string> }
    >;
    for (const { cities } of Object.values(districts)) {
      if (city in cities) return cities[city];
    }
  }
  return null;
}

/**
 * city -> its district, deterministically derived (mirrors
 * `getSectorForCategory` in job-taxonomy) — a job's district/province are
 * never asked of the AI directly, only derived from a classified city.
 */
const CITY_TO_DISTRICT: ReadonlyMap<string, string> = new Map(
  PROVINCES.flatMap((province) =>
    Object.entries(LOCATION_TAXONOMY[province].districts).flatMap(
      ([district, { cities }]) =>
        Object.keys(cities).map((city) => [city, district] as const),
    ),
  ),
);

export function getDistrictForCity(
  city: string | null | undefined,
): string | null {
  if (!city) return null;
  return CITY_TO_DISTRICT.get(city) ?? null;
}

/** district -> its province, deterministically derived. */
const DISTRICT_TO_PROVINCE: ReadonlyMap<string, string> = new Map(
  PROVINCES.flatMap((province) =>
    Object.keys(LOCATION_TAXONOMY[province].districts).map(
      (district) => [district, province] as const,
    ),
  ),
);

export function getProvinceForDistrict(
  district: string | null | undefined,
): string | null {
  if (!district) return null;
  return DISTRICT_TO_PROVINCE.get(district) ?? null;
}

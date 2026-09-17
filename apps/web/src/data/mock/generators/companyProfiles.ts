// Company profile definitions (R-04; requirements 35). Coverage is deliberately partial: a real
// provider covers the names it covers, and the interface has to show the rest honestly.

export interface ProfileDefinition {
  readonly legalName: string;
  readonly description: string;
  readonly incorporationCountry: string;
  readonly primaryListing: string;
  readonly secondaryListings: readonly string[];
  readonly listedSince: string | null;
  readonly headquarters: string;
  readonly website: string;
  readonly employees: number;
  readonly fiscalYearEnd: string;
  readonly isin: string | null;
  readonly localCode: string | null;
  readonly segments: readonly (readonly [string, number])[];
  readonly geographies: readonly (readonly [string, number])[];
  readonly people: readonly (readonly [
    'chief_executive' | 'chair' | 'chief_financial_officer',
    string,
    number | null,
    boolean,
  ])[];
  readonly auditor: readonly [string, string, boolean, string | null];
  readonly dependencies: readonly string[];
}

export const COMPANY_PROFILES: Readonly<Record<string, ProfileDefinition>> = {
  AAPL: {
    legalName: 'Apple Inc.',
    description:
      'Designs and sells consumer hardware — phones, computers, tablets, watches and audio — and earns a growing share of revenue from services attached to that hardware: the app store, subscriptions, payments and advertising.',
    incorporationCountry: 'United States',
    primaryListing: 'NASDAQ',
    secondaryListings: [],
    listedSince: '1980-12-12',
    headquarters: 'Cupertino, California, United States',
    website: 'apple.com',
    employees: 164000,
    fiscalYearEnd: '09-30',
    isin: 'US0378331005',
    localCode: 'AAPL',
    segments: [
      ['iPhone', 51.3],
      ['Services', 24.6],
      ['Mac', 8.1],
      ['Wearables and accessories', 8.0],
      ['iPad', 8.0],
    ],
    geographies: [
      ['Americas', 42.8],
      ['Europe', 25.9],
      ['Greater China', 17.1],
      ['Rest of Asia Pacific', 7.6],
      ['Japan', 6.6],
    ],
    people: [
      ['chief_executive', 'Timothy D. Cook', 2011, false],
      ['chief_financial_officer', 'Kevan Parekh', 2025, true],
      ['chair', 'Arthur D. Levinson', 2011, false],
    ],
    auditor: ['Ernst & Young LLP', '2025-11-01', false, null],
    dependencies: [
      'One product line is over half of revenue',
      'Manufacturing concentrated with a small number of contract assemblers',
    ],
  },
  RELIANCE: {
    legalName: 'Reliance Industries Limited',
    description:
      'A conglomerate built on oil refining and petrochemicals, now earning a large share of profit from telecom and organised retail held through subsidiaries. The listed company is where all three businesses meet.',
    incorporationCountry: 'India',
    primaryListing: 'NSE',
    secondaryListings: ['BSE'],
    listedSince: '1977-11-01',
    headquarters: 'Mumbai, Maharashtra, India',
    website: 'ril.com',
    employees: 389000,
    fiscalYearEnd: '03-31',
    isin: 'INE002A01018',
    localCode: 'RELIANCE',
    segments: [
      ['Oil to chemicals', 54.2],
      ['Retail', 27.4],
      ['Digital services', 13.1],
      ['Oil and gas exploration', 3.2],
      ['Other', 2.1],
    ],
    geographies: [
      ['India', 68.4],
      ['Exports and international', 31.6],
    ],
    people: [
      ['chief_executive', 'Mukesh D. Ambani', 2002, false],
      ['chief_financial_officer', 'V. Srikanth', 2024, false],
      ['chair', 'Mukesh D. Ambani', 2002, false],
    ],
    auditor: ['S R B C & CO LLP', '2026-05-12', false, null],
    dependencies: [
      'Refining margins move with the oil price',
      'Retail and telecom growth funded from the refining business',
    ],
  },
  TATAMOTORS: {
    legalName: 'Tata Motors Limited',
    description:
      'Builds commercial vehicles and passenger cars in India and owns Jaguar Land Rover, so a large share of profit is earned in Britain, China and Europe rather than at home. Electric passenger vehicles are a growing part of the Indian business.',
    incorporationCountry: 'India',
    primaryListing: 'NSE',
    secondaryListings: ['BSE', 'NYSE'],
    listedSince: '1998-07-22',
    headquarters: 'Mumbai, Maharashtra, India',
    website: 'tatamotors.com',
    employees: 91811,
    fiscalYearEnd: '03-31',
    isin: 'INE155A01022',
    localCode: 'TATAMOTORS',
    segments: [
      ['Jaguar Land Rover', 66.8],
      ['Commercial vehicles', 19.4],
      ['Passenger vehicles India', 12.1],
      ['Vehicle financing and other', 1.7],
    ],
    geographies: [
      ['India', 33.9],
      ['United Kingdom and Europe', 34.2],
      ['China', 17.8],
      ['North America', 14.1],
    ],
    people: [
      ['chief_executive', 'Shailesh Chandra', 2025, true],
      ['chief_financial_officer', 'P. B. Balaji', 2017, false],
      ['chair', 'Natarajan Chandrasekaran', 2017, false],
    ],
    auditor: ['B S R & Co. LLP', '2026-05-19', false, null],
    dependencies: [
      'Two thirds of revenue from one overseas subsidiary',
      'Chinese demand for premium vehicles',
    ],
  },
  TCS: {
    legalName: 'Tata Consultancy Services Limited',
    description:
      'Sells software development, maintenance and consulting to large companies abroad, mostly on multi-year contracts. Revenue follows client technology budgets in North America and Europe rather than the Indian economy.',
    incorporationCountry: 'India',
    primaryListing: 'NSE',
    secondaryListings: ['BSE'],
    listedSince: '2004-08-25',
    headquarters: 'Mumbai, Maharashtra, India',
    website: 'tcs.com',
    employees: 607979,
    fiscalYearEnd: '03-31',
    isin: 'INE467B01029',
    localCode: 'TCS',
    segments: [
      ['Banking, financial services and insurance', 31.8],
      ['Consumer business', 15.4],
      ['Life sciences and healthcare', 10.6],
      ['Manufacturing', 9.8],
      ['Communications and media', 9.1],
      ['Technology and services', 8.4],
      ['Energy, resources and utilities', 14.9],
    ],
    geographies: [
      ['North America', 48.1],
      ['United Kingdom', 16.9],
      ['Continental Europe', 15.2],
      ['India', 6.4],
      ['Rest of world', 13.4],
    ],
    people: [
      ['chief_executive', 'K. Krithivasan', 2023, false],
      ['chief_financial_officer', 'Samir Seksaria', 2021, false],
      ['chair', 'Natarajan Chandrasekaran', 2017, false],
    ],
    auditor: ['B S R & Co. LLP', '2026-04-14', false, null],
    dependencies: [
      'Client technology spending in North America',
      'Wage inflation and attrition among engineers',
    ],
  },
  AZN: {
    legalName: 'AstraZeneca PLC',
    description:
      'Discovers, manufactures and sells prescription medicines, concentrated in cancer, cardiovascular and respiratory treatments. Revenue depends on a handful of patented medicines and on what replaces them when those patents expire.',
    incorporationCountry: 'United Kingdom',
    primaryListing: 'LSE',
    secondaryListings: ['NASDAQ', 'OMX Stockholm'],
    listedSince: '1999-04-06',
    headquarters: 'Cambridge, United Kingdom',
    website: 'astrazeneca.com',
    employees: 94300,
    fiscalYearEnd: '12-31',
    isin: 'GB0009895292',
    localCode: 'AZN',
    segments: [
      ['Oncology', 41.2],
      ['Cardiovascular, renal and metabolism', 24.6],
      ['Respiratory and immunology', 17.3],
      ['Rare disease', 12.1],
      ['Other medicines', 4.8],
    ],
    geographies: [
      ['United States', 43.1],
      ['Emerging markets', 26.4],
      ['Europe', 20.2],
      ['Established rest of world', 10.3],
    ],
    people: [
      ['chief_executive', 'Pascal Soriot', 2012, false],
      ['chief_financial_officer', 'Aradhana Sarin', 2021, false],
      ['chair', 'Michel Demare', 2023, false],
    ],
    auditor: ['PricewaterhouseCoopers LLP', '2026-02-11', false, null],
    dependencies: [
      'A small number of patented medicines carry most of the growth',
      'Regulatory approval timetables',
    ],
  },
  D05: {
    legalName: 'DBS Group Holdings Ltd',
    description:
      'A Singapore bank earning most of its income from lending and deposits across Singapore, Hong Kong and the wider region, with wealth management and transaction banking on top. Profit moves with interest rates and regional credit quality.',
    incorporationCountry: 'Singapore',
    primaryListing: 'SGX',
    secondaryListings: [],
    listedSince: '1999-06-21',
    headquarters: 'Singapore',
    website: 'dbs.com',
    employees: 41000,
    fiscalYearEnd: '12-31',
    isin: 'SG1L01001701',
    localCode: 'D05',
    segments: [
      ['Consumer banking and wealth management', 44.3],
      ['Institutional banking', 39.8],
      ['Treasury markets', 10.2],
      ['Other', 5.7],
    ],
    geographies: [
      ['Singapore', 64.8],
      ['Hong Kong', 16.1],
      ['Rest of Greater China', 8.4],
      ['South and Southeast Asia', 6.2],
      ['Rest of world', 4.5],
    ],
    people: [
      ['chief_executive', 'Tan Su Shan', 2025, true],
      ['chief_financial_officer', 'Chng Sok Hui', 2008, false],
      ['chair', 'Peter Seah Lim Huat', 2010, false],
    ],
    auditor: ['PricewaterhouseCoopers LLP', '2026-02-06', false, null],
    dependencies: ['Interest rate levels', 'Regional property and corporate credit quality'],
  },
};

import type { Job } from './types';

/** Công nghệ cần theo dõi: [tên, regex nhận diện, màu nhãn] */
export const TECH: [string, RegExp, string][] = [
  ['Angular', /angular/i, '#dd0031'],
  ['TypeScript', /typescript/i, '#3178c6'],
  ['RxJS', /rxjs/i, '#b7178c'],
  ['C#', /(^|[^\w])c#/i, '#1f9d6b'],
  ['.NET', /(^|[^\w])(\.net|dotnet|asp\.net)(?![\w])/i, '#7c5cff'],
  ['Entity Framework', /entity framework/i, '#0891b2'],
];

export const techOf = (text: string) => TECH.filter(([, r]) => r.test(text)).map(([n]) => n);
export const techColor = (n: string) => TECH.find((t) => t[0] === n)?.[2] ?? '#6b7183';

export const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Từ khoá người dùng nhập có xuất hiện trong text (khớp theo biên từ) */
export const kwHit = (text: string, kw: string) =>
  new RegExp('(^|[^\\w])' + escapeRegExp(kw) + '(?![\\w])', 'i').test(text);

/* ---------- lọc theo thành phố trên bảng việc ---------- */
export const CITIES: [string, RegExp][] = [
  ['Hà Nội', /hà nội|hanoi|\bhn\b|cầu giấy|trung kính|tố hữu|phạm hùng|kim liên|duy tân|đào duy anh/i],
  ['HCM', /hcm|hồ chí minh|sài gòn|tân bình|tân thuận|\bq\d\b|d2/i],
  ['Remote', /remote/i],
];
export const cityOf = (j: Pick<Job, 'location' | 'title'>) =>
  CITIES.find(([, r]) => r.test(j.location + ' ' + j.title))?.[0] ?? '';

/* ---------- phân loại quốc gia cho job online ---------- */
const COUNTRY_VI: Record<string, string> = {
  germany: 'Đức', france: 'Pháp', switzerland: 'Thụy Sĩ', austria: 'Áo', netherlands: 'Hà Lan', spain: 'Tây Ban Nha',
  poland: 'Ba Lan', portugal: 'Bồ Đào Nha', italy: 'Ý', sweden: 'Thụy Điển', denmark: 'Đan Mạch', finland: 'Phần Lan',
  norway: 'Na Uy', ireland: 'Ireland', belgium: 'Bỉ', czechia: 'Séc', romania: 'Romania', greece: 'Hy Lạp', hungary: 'Hungary',
  estonia: 'Estonia', lithuania: 'Lithuania', croatia: 'Croatia', bulgaria: 'Bulgaria', slovakia: 'Slovakia', slovenia: 'Slovenia',
  ukraine: 'Ukraine', albania: 'Albania', andorra: 'Andorra', iceland: 'Iceland', japan: 'Nhật Bản', turkey: 'Thổ Nhĩ Kỳ',
  india: 'Ấn Độ', australia: 'Úc', 'new zealand': 'New Zealand', philippines: 'Philippines', pakistan: 'Pakistan',
  singapore: 'Singapore', israel: 'Israel', vietnam: 'Việt Nam', 'viet nam': 'Việt Nam', canada: 'Canada', mexico: 'Mexico',
  argentina: 'Argentina', peru: 'Peru', brazil: 'Brazil', 'united kingdom': 'Anh', uk: 'Anh', 'united states': 'Mỹ',
  usa: 'Mỹ', us: 'Mỹ', 'united states of america': 'Mỹ',
};
const REGION_VI: [RegExp, string][] = [
  [/^(worldwide|anywhere|global|remote)(\s+in the world)?$/i, 'Toàn cầu'],
  [/^(usa?|united states)(\s+timezones?)?$/i, 'Mỹ'],
  [/^(northern america|north america)$/i, 'Bắc Mỹ'],
  [/^americas$/i, 'Châu Mỹ'],
  [/^latam$/i, 'Mỹ Latin'],
  [/^europe$/i, 'Châu Âu'],
  [/^emea$/i, 'EMEA'],
  [/^apac$/i, 'APAC'],
  [/^asia$/i, 'Châu Á'],
];
const CITY_COUNTRY: [RegExp, string][] = [
  [/london|belfast|manchester|edinburgh|northern ireland|united kingdom|\buk\b/i, 'Anh'],
  [/paris|lyon/i, 'Pháp'],
  [/zürich|zurich|geneva|genf|bern\b|basel|switzerland|schweiz/i, 'Thụy Sĩ'],
  [/wien|vienna|graz|salzburg|austria|österreich/i, 'Áo'],
  [/amsterdam|rotterdam|utrecht|netherlands/i, 'Hà Lan'],
  [/madrid|barcelona|spain/i, 'Tây Ban Nha'],
  [/warsaw|krak|wroc|poland/i, 'Ba Lan'],
];
const VN_OK = new Set(['Toàn cầu', 'APAC', 'Châu Á', 'Việt Nam']);

const normToken = (t: string) =>
  t.replace(/\s*\(remote\)\s*$/i, '').replace(/\s+only$/i, '').replace(/\s+timezones?$/i, '').trim();
const viName = (t: string) => REGION_VI.find(([r]) => r.test(t))?.[1] ?? COUNTRY_VI[t.toLowerCase()];

/**
 * Chuẩn hoá chuỗi địa điểm của từng nguồn thành tên nước/vùng tiếng Việt.
 * - regions: danh sách vùng/nước cách nhau bằng dấu phẩy (Remotive, WWR, Jobspresso)
 * - city: tên thành phố của job board Đức (Arbeitnow) -> suy ra nước, mặc định Đức
 * - free: văn bản tự do (RemoteOK)
 * vnOk: nguồn tự khẳng định có/không nhận ứng viên từ Việt Nam (ưu tiên hơn suy luận).
 */
export function classify(kind: 'regions' | 'city' | 'free', location: string, vnOk?: boolean) {
  let regions: string[];
  if (kind === 'regions') {
    regions = location.split(',').map(normToken).filter(Boolean).map((t) => viName(t) ?? t);
    if (!regions.length) regions = ['Toàn cầu'];
  } else if (kind === 'city') {
    regions = [CITY_COUNTRY.find(([r]) => r.test(location))?.[1] ?? 'Đức'];
  } else {
    const t = normToken(location);
    regions = [viName(t) ?? CITY_COUNTRY.find(([r]) => r.test(t))?.[1] ?? (t.slice(0, 30) || 'Toàn cầu')];
  }
  regions = [...new Set(regions)];
  return { regions, vn: vnOk ?? regions.some((r) => VN_OK.has(r)) };
}

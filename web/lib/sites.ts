export type SiteGroup = 'vn' | 'intl' | 'niche';

export interface Site {
  name: string;
  group: SiteGroup;
  desc: string;
  /** Tên miền (để tìm bằng Google `site:`); bỏ trống nếu chưa chắc chắn */
  domain?: string;
  /** Link tìm kiếm trực tiếp trên site (best-effort, chưa kiểm chứng từng cái) */
  direct?: (kw: string) => string;
  /** Có nguồn tự động trong tab "Job online" */
  feed?: string;
  /** Lưu ý: không phải site tuyển dụng thông thường / đã ngừng / cần tài khoản… */
  note?: string;
  warn?: boolean;
}

export const GROUPS: Record<SiteGroup, string> = {
  vn: '🇻🇳 Việt Nam',
  intl: '🌍 Remote / Quốc tế',
  niche: '💻 Ngách / khu vực',
};

export const KEYWORDS = ['Angular', '.NET', 'C#', 'Angular .NET'];

const q = encodeURIComponent;

export const googleUrl = (s: Site, kw: string) =>
  'https://www.google.com/search?q=' + q(s.domain ? `site:${s.domain} ${kw}` : `"${s.name}" ${kw} jobs`);

export const SITES: Site[] = [
  /* ---------- Việt Nam ---------- */
  { name: 'TopDev', group: 'vn', domain: 'topdev.vn', desc: 'Kênh tuyển dụng chuyên biệt cho cộng đồng IT', direct: (k) => `https://topdev.vn/jobs/search?keyword=${q(k)}` },
  { name: 'ITviec', group: 'vn', domain: 'itviec.com', desc: 'Chuyên trang việc làm IT, "Ít nhưng mà chất"', direct: (k) => `https://itviec.com/it-jobs?query=${q(k)}` },
  { name: 'ViecLamIT', group: 'vn', desc: 'Nền tảng kết nối lập trình viên và doanh nghiệp' },
  { name: 'TopCV', group: 'vn', domain: 'topcv.vn', desc: 'Lượng tin tuyển IT rất lớn', direct: (k) => `https://www.topcv.vn/tim-viec-lam-moi-nhat?keyword=${q(k)}` },
  { name: 'VietnamWorks', group: 'vn', domain: 'vietnamworks.com', desc: 'Lâu đời, nhiều vị trí IT cấp cao / Manager', direct: (k) => `https://www.vietnamworks.com/viec-lam?q=${q(k)}` },
  { name: 'CareerViet', group: 'vn', domain: 'careerviet.vn', desc: 'Trước đây là CareerBuilder, nhiều job IT tập đoàn lớn' },
  { name: 'Navigos Search', group: 'vn', domain: 'navigossearch.com', desc: 'Săn đầu người cho Tech Lead / C-level' },
  { name: 'Glints Việt Nam', group: 'vn', domain: 'glints.com', desc: 'Phù hợp cả Intern, Junior và Senior', direct: (k) => `https://glints.com/vn/opportunities/jobs/explore?keyword=${q(k)}` },
  { name: 'Anphabe', group: 'vn', domain: 'anphabe.com', desc: 'Tìm môi trường làm việc IT tốt nhất Việt Nam' },
  { name: 'CakeResume', group: 'vn', desc: 'Tạo CV và tìm việc IT quốc tế tại Việt Nam' },

  /* ---------- Remote / Quốc tế ---------- */
  { name: 'LinkedIn', group: 'intl', domain: 'linkedin.com', desc: 'Mạng xã hội việc làm lớn nhất thế giới cho dân công nghệ', direct: (k) => `https://www.linkedin.com/jobs/search/?keywords=${q(k)}&location=Vietnam` },
  { name: 'Indeed', group: 'intl', domain: 'indeed.com', desc: 'Trang tìm việc toàn cầu (bản Việt Nam)', direct: (k) => `https://vn.indeed.com/jobs?q=${q(k)}` },
  { name: 'Upwork', group: 'intl', domain: 'upwork.com', desc: 'Nền tảng freelance IT lớn nhất thế giới', note: 'Freelance (đấu thầu dự án)', direct: (k) => `https://www.upwork.com/nx/search/jobs/?q=${q(k)}` },
  { name: 'Fiverr', group: 'intl', domain: 'fiverr.com', desc: 'Bán dịch vụ / sản phẩm IT theo gói', note: 'Chợ dịch vụ — không có tin tuyển dụng', warn: true },
  { name: 'Remote.co', group: 'intl', domain: 'remote.co', desc: 'Tổng hợp việc remote 100% về tech' },
  { name: 'We Work Remotely', group: 'intl', domain: 'weworkremotely.com', desc: 'Cộng đồng tìm việc từ xa lớn cho Developer', feed: 'We Work Remotely', direct: (k) => `https://weworkremotely.com/remote-jobs/search?term=${q(k)}` },
  { name: 'FlexJobs', group: 'intl', domain: 'flexjobs.com', desc: 'Việc làm từ xa được kiểm định nghiêm ngặt', note: 'Thu phí để xem chi tiết', direct: (k) => `https://www.flexjobs.com/search?search=${q(k)}` },
  { name: 'Toptal', group: 'intl', domain: 'toptal.com', desc: 'Mạng lưới top 3% chuyên gia IT freelance', note: 'Phải qua vòng kiểm tra để vào mạng lưới', warn: true },
  { name: 'Turing', group: 'intl', domain: 'turing.com', desc: 'Tuyển IT remote bằng AI cho các công ty Mỹ', note: 'Ứng tuyển vào hồ sơ, không có danh sách job công khai', warn: true },
  { name: 'Wellfound', group: 'intl', domain: 'wellfound.com', desc: 'Trước đây là AngelList Talent, job cho startup', note: 'Cần đăng nhập để xem' },
  { name: 'Glassdoor', group: 'intl', domain: 'glassdoor.com', desc: 'Tìm việc và xem review ẩn danh về công ty', direct: (k) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${q(k)}` },
  { name: 'Stack Overflow Jobs', group: 'intl', domain: 'stackoverflow.com', desc: 'Kênh tuyển dụng trên cộng đồng Developer', note: 'Đã ngừng hoạt động (2022)', warn: true },
  { name: 'Dice', group: 'intl', domain: 'dice.com', desc: 'Việc làm công nghệ tại Mỹ', direct: (k) => `https://www.dice.com/jobs?q=${q(k)}` },
  { name: 'Working Nomads', group: 'intl', domain: 'workingnomads.com', desc: 'Việc làm từ xa cập nhật hằng ngày cho Dev' },
  { name: 'Remotive', group: 'intl', domain: 'remotive.com', desc: 'Cộng đồng và bảng tin việc remote cho dân Tech', feed: 'Remotive' },
  { name: 'Gun.io', group: 'intl', domain: 'gun.io', desc: 'Kết nối freelance developer với doanh nghiệp', note: 'Freelance' },
  { name: 'Guru', group: 'intl', domain: 'guru.com', desc: 'Website freelancer IT lâu năm', note: 'Freelance', direct: (k) => `https://www.guru.com/d/jobs/q/${q(k)}/` },
  { name: 'Freelancer.com', group: 'intl', domain: 'freelancer.com', desc: 'Đấu thầu dự án phần mềm toàn cầu', note: 'Freelance', direct: (k) => `https://www.freelancer.com/jobs/?keyword=${q(k)}` },
  { name: 'Hubstaff Talent', group: 'intl', domain: 'hubstafftalent.net', desc: 'Tìm việc remote IT miễn phí, không qua trung gian' },
  { name: 'Crossover', group: 'intl', domain: 'crossover.com', desc: 'Vị trí IT remote lương cao, kiểm tra đầu vào gắt' },

  /* ---------- Ngách / khu vực ---------- */
  { name: 'Crypto.jobs', group: 'niche', domain: 'crypto.jobs', desc: 'Việc làm Web3, Blockchain và Crypto' },
  { name: 'Web3.career', group: 'niche', domain: 'web3.career', desc: 'Tuyển lập trình viên Blockchain / Smart Contract' },
  { name: 'GitHub Jobs', group: 'niche', domain: 'github.com', desc: 'Bảng tin tuyển dụng cho lập trình viên mã nguồn mở', note: 'Đã ngừng hoạt động (2021)', warn: true },
  { name: 'Dribbble', group: 'niche', domain: 'dribbble.com', desc: 'UI/UX Designer và Front-End Developer', note: 'Thiên về thiết kế', warn: true },
  { name: 'Behance', group: 'niche', domain: 'behance.net', desc: 'Việc thiết kế sản phẩm công nghệ và UI/UX', note: 'Thiên về thiết kế', warn: true },
  { name: 'RemoteOK', group: 'niche', domain: 'remoteok.com', desc: 'Tìm việc remote cho lập trình viên', feed: 'RemoteOK', direct: (k) => `https://remoteok.com/remote-${q(k.toLowerCase().replace(/[^a-z0-9#.]+/g, '-'))}-jobs` },
  { name: 'SkipTheDrive', group: 'niche', domain: 'skipthedrive.com', desc: 'Lọc các công việc IT tiết kiệm thời gian di chuyển', direct: (k) => `https://www.skipthedrive.com/?s=${q(k)}` },
  { name: 'JustRemote', group: 'niche', domain: 'justremote.co', desc: 'Khám phá việc remote ít xuất hiện ở trang khác' },
  { name: 'Pangara', group: 'niche', desc: 'Kết nối Developer Đông Nam Á với freelance toàn cầu' },
  { name: 'Jobspresso', group: 'niche', domain: 'jobspresso.co', desc: 'Việc làm remote 100% chất lượng cao', feed: 'Jobspresso' },
];

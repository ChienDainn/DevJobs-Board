# DevJobs Board

Bảng việc (kéo thả) cho job Angular / C# .NET.

| Phần | Stack |
|---|---|
| `web/` | Next.js 15 (App Router) + React 19 + TypeScript |
| `api/` | NestJS 10 + TypeORM + Postgres (SQLite khi chạy local) |

Trình duyệt chỉ nói chuyện với `web`; `web` proxy `/api/*` sang `api` (cùng origin nên cookie đăng nhập không cần CORS).
Mỗi job là một dòng trong bảng `jobs`; kéo thả/ghi chú/xoá là các request riêng lẻ nên nhiều thiết bị dùng cùng lúc không ghi đè nhau.

## Chạy local

```bash
# terminal 1 - API (http://localhost:3001)
cd api
npm install
npm run build
APP_PASSWORD=mat-khau-cua-ban npm start        # PowerShell: $env:APP_PASSWORD='mat-khau-cua-ban'; npm start

# terminal 2 - Web (http://localhost:3000)
cd web
npm install
npm run dev
```

Không đặt `DATABASE_URL` thì API lưu vào file `data.sqlite` (chỉ để thử). Lần chạy đầu, bảng trống sẽ tự nạp 33 job
Facebook mẫu từ `api/seed/fb-jobs.json`.

Chạy với Postgres local: `DATABASE_URL=postgres://user:pass@localhost:5432/db PGSSL=disable npm start`.

## API (đều cần đăng nhập, trừ `/api/auth/login` và `/api/healthz`)

| Method | Đường dẫn | Việc |
|---|---|---|
| POST | `/api/auth/login` `{password}` | Đăng nhập (cookie HttpOnly 30 ngày; 8 lần thử sai / 15 phút / IP) |
| POST | `/api/auth/logout` | Đăng xuất |
| GET | `/api/jobs` | Danh sách job (theo cột, vị trí) |
| POST | `/api/jobs` | Tạo job; trùng link hoặc tiêu đề+công ty thì trả job cũ `created:false` |
| PATCH | `/api/jobs/:id` | Sửa thông tin / ghi chú |
| POST | `/api/jobs/:id/move` `{col,index}` | Chuyển cột + chèn đúng vị trí |
| DELETE | `/api/jobs/:id` | Xoá |
| POST | `/api/jobs/seed` | Nạp lại job Facebook mẫu (bỏ qua job đã có) |
| GET | `/api/online?refresh=1` | Job Angular/.NET gộp từ Remotive, Arbeitnow, RemoteOK, We Work Remotely, Jobspresso (cache 20 phút, `refresh` tối đa 1 lần/phút) |

## Deploy lên Render

1. Đẩy thư mục `devjobs` lên GitHub (nên để **private**; danh sách có SĐT/email nhà tuyển dụng).
2. Render → **New → Blueprint** → chọn repo. `render.yaml` tạo Postgres + `devjobs-api` + `devjobs-web`.
3. Nhập `APP_PASSWORD` cho `devjobs-api`. Deploy xong, lấy URL công khai của `devjobs-api`
   (vd `https://devjobs-api.onrender.com`) và đặt vào biến `API_URL` của `devjobs-web` → Redeploy web.
4. Mở URL của `devjobs-web` và đăng nhập.

Gói miễn phí: service ngủ sau ~15 phút không dùng (lần mở đầu chậm); Postgres miễn phí của Render bị xoá sau ~30 ngày.
Muốn giữ lâu dài, tạo DB ở Neon/Supabase và đặt `DATABASE_URL` thủ công cho `devjobs-api`.

## Biến môi trường

**api**: `APP_PASSWORD` (bắt buộc, ≥ 6 ký tự) · `DATABASE_URL` · `PGSSL=disable` · `SESSION_SECRET` · `PORT` (3001) · `COOKIE_SECURE=true` · `SEED_FILE`

**web**: `API_URL` (mặc định `http://localhost:3001`, đọc lúc chạy) · `PORT`

## Ghi chú

- `synchronize: true` của TypeORM tự tạo/cập nhật bảng — hợp với app cá nhân nhỏ; dự án lớn nên dùng migrations.
- Tab "Job online": API (`api/src/online`) tải song song 5 nguồn công khai, lọc job nhắc Angular/.NET/C#/RxJS, cache 20 phút; một nguồn lỗi không làm hỏng các nguồn khác. Thêm nguồn = thêm một hàm `Fetcher` vào `SOURCES`.
- Tab "Tìm trên các site": danh mục 40 site tuyển dụng (`web/lib/sites.ts`) với link mở trang tìm kiếm theo từ khoá. Phần lớn site không có API công khai và cấm scraping nên chỉ là lối tắt; link tìm kiếm trực tiếp là best-effort, luôn có nút tìm qua Google làm phương án dự phòng.
- Tab "Dán bài Facebook" lọc bài theo từ khoá rồi thêm thẳng vào cột "Mới".

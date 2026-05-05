# HR Management System - Frontend

Frontend cho hệ thống quản lý nhân sự có phân quyền theo vai trò. Giao diện được xây dựng theo phong cách admin dashboard, phục vụ các nghiệp vụ quản lý nhân viên, phòng ban, yêu cầu nhân sự, phê duyệt, lương - tài vụ và nhật ký hệ thống.

## Công nghệ sử dụng

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router DOM
- Axios
- Lucide React

## Chức năng hiện có

| STT | Màn hình        | Mô tả                        |
| --: | --------------- | ---------------------------- |
|   1 | Login           | Đăng nhập hệ thống           |
|   2 | Dashboard       | Hiển thị tổng quan hệ thống  |
|   3 | Employees       | Quản lý danh sách nhân viên  |
|   4 | Employee Detail | Xem chi tiết hồ sơ nhân viên |
|   5 | Departments     | Quản lý phòng ban            |
|   6 | HR Requests     | Tạo yêu cầu nhân sự          |
|   7 | Approvals       | Phê duyệt yêu cầu nhân sự    |
|   8 | Salary          | Quản lý lương và phụ cấp     |
|   9 | Finance         | Xem thông tin tài vụ         |
|  10 | Audit Logs      | Xem nhật ký hệ thống         |
|  11 | Profile         | Xem hồ sơ cá nhân            |

## Cấu trúc thư mục

```bash
FRONTEND/
├── public/
├── src/
│   ├── components/        # Component dùng chung
│   ├── context/           # Context quản lý trạng thái
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Cấu hình API, helper
│   ├── pages/             # Các trang chính
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

## Cài đặt và chạy project

```bash
npm i
copy .env.example .env
npm run dev
```

Nếu dùng macOS/Linux:

```bash
cp .env.example .env
npm run dev
```

Sau khi chạy thành công, mở trình duyệt tại:

```text
http://localhost:5173
```

## Cấu hình môi trường

File `.env` cần có biến:

```env
VITE_API_URL=http://localhost:3000/api
```

Nếu backend chạy ở port khác, cập nhật lại `VITE_API_URL` cho phù hợp.

## Kết nối backend

Frontend gọi API thông qua Axios và sử dụng `VITE_API_URL` làm base URL.

Ví dụ:

```ts
const API_URL = import.meta.env.VITE_API_URL;
```

Sau khi đăng nhập, token sẽ được lưu ở client và gửi kèm trong các request cần xác thực.

```text
Authorization: Bearer <accessToken>
```

## Các lệnh thường dùng

| Lệnh              | Mô tả                       |
| ----------------- | --------------------------- |
| `npm i`           | Cài đặt dependencies        |
| `npm run dev`     | Chạy môi trường development |
| `npm run build`   | Build project               |
| `npm run preview` | Xem thử bản build           |

## Ghi chú

Frontend hiện đã có giao diện mẫu cho các module chính. Một số màn hình vẫn có thể sử dụng dữ liệu mẫu và sẽ tiếp tục được kết nối với REST API backend trong giai đoạn hoàn thiện.

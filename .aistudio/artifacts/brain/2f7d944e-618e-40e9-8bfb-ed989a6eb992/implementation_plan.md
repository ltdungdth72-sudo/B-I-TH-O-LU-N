# PHÒNG THẢO LUẬN SỐ: 12 NHÓM – 4 CHỦ ĐỀ – CÙNG HỌC VỀ BẢN QUYỀN
*Tin học 10 – Trường THPT Đinh Tiên Hoàng – Giáo viên: Lê Thị Dung*

Hệ thống cộng tác trực tuyến thời gian thực dành cho lớp học Tin học 10, cho phép 12 nhóm học sinh thảo luận và nộp câu trả lời trên điện thoại thông minh, đồng thời giáo viên trình chiếu, nhận xét và quản lý kết quả trực tiếp trên máy chiếu với độ trễ gần như bằng 0.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Các quyết định kiến trúc đã tối ưu cho lớp học:**
> 1. **Cơ chế đồng bộ thời gian thực (Server-Authoritative Real-Time Sync)**: Sử dụng backend Express tích hợp sẵn với giao thức **Server-Sent Events (SSE)** và REST API có cơ chế lưu trữ bền vững (`data/session.json`). Phương án này hoạt động tức thì ngay trên đường link ứng dụng, cho phép mọi điện thoại của học sinh quét mã QR và kết nối ngay mà **không yêu cầu** tạo tài khoản đám mây bên ngoài hay cài đặt phức tạp. Hệ thống cũng sẵn sàng mô-đun kết nối Firebase Firestore nếu giáo viên muốn cấu hình đám mây sau này.
> 2. **Xác thực và phân quyền bảo vệ màn hình giáo viên**: Màn hình giáo viên được bảo vệ bằng mã khóa quản trị (Mật khẩu phiên bản mặc định: `thpt-dth-2026`, có thể đổi trong giao diện). Học sinh khi truy cập chỉ được cấp quyền xem chủ đề và gửi bài của nhóm mình; hệ thống ngăn chặn mọi hành vi can thiệp hoặc sửa đổi bài của nhóm khác.
> 3. **Phản hồi âm thanh & Trực quan**: Hỗ trợ âm thanh thông báo dịu nhẹ (Web Audio chime tự nhiên, không gây ồn lớp học) kèm thông báo trực quan khi có bài nộp mới hoặc nhận xét mới, kèm nút bật/tắt âm thanh rõ ràng cho giáo viên.

---

## 1. Overview & Core Concept

- **Mục tiêu**: Hỗ trợ tiết học Tin học 10 - Chuyên đề "Bản quyền nội dung số, quyền lợi tác giả và cách sử dụng hợp pháp".
- **Người dùng mục tiêu**:
  - **Học sinh (12 nhóm)**: Sử dụng điện thoại cá nhân (iOS/Android), không cần cài đặt ứng dụng, quét mã QR vào thẳng giao diện nhóm được phân công, thảo luận và nộp 3 câu hỏi bắt buộc.
  - **Giáo viên (Cô Lê Thị Dung)**: Sử dụng máy tính kết nối máy chiếu lớp học, theo dõi tiến độ 12 nhóm dạng lưới 4 chủ đề, mở trình chiếu toàn màn hình câu trả lời nhóm bất kỳ, ghi nhận xét và xuất báo cáo CSV/in ấn.
- **Giá trị cốt lõi**:
  - Không mất thời gian thu phát giấy nháp.
  - Cập nhật tiến độ tức thì trên màn hình lớn.
  - Học sinh lớp 10 học trực quan từ tình huống thực tế và các góc nhìn đa chiều của các nhóm bạn.

---

## 2. User Experience & Visual Design

### 2.1 Quy trình trải nghiệm (Key User Flows)

```
[Màn hình chào mừng]
       │
       ├───► [Học sinh]: Quét QR / Nhập mã tham gia ──► Chọn nhóm (1-12) ──► Nhập 3 câu hỏi ──► Lưu nháp / Nộp bài
       │
       └───► [Giáo viên]: Nhập mã quản trị ──► Bảng điều khiển 12 nhóm ──► Trình chiếu toàn màn hình ──► Nhận xét & Đánh giá ──► Xuất CSV / Đóng buổi
```

- **Màn hình Welcome**: Thiết kế trang trọng, biểu tượng tri thức kết hợp công nghệ, hiển thị thông tin Cô Lê Thị Dung - THPT Đinh Tiên Hoàng - Tin học 10. Hai nút điều hướng lớn: "VÀO KHÔNG GIAN HỌC SINH" và "MÀN HÌNH GIÁO VIÊN".
- **Không gian Học sinh (Mobile-First 375px–430px)**:
  - Header nhỏ gọn hiển thị Tên phòng, Số nhóm, Chủ đề, và Chỉ báo kết nối thời gian thực (Đã kết nối / Đang đồng bộ / Ngoại tuyến).
  - Thẻ tình huống thực tế được giao nổi bật.
  - 3 ô nhập câu hỏi có hướng dẫn gợi ý, bộ đếm số từ/ký tự trực quan.
  - Tự động lưu bản nháp vào LocalStorage & gửi server định kỳ nếu có mạng.
  - Nút "GỬI CÂU TRẢ LỜI" với hộp thoại xác nhận, chống bấm liên tục (debounce/disable).
  - Trạng thái nộp thành công hiển thị dấu thời gian rõ ràng.
- **Không gian Giáo viên (Projector 16:9 / Desktop)**:
  - Thanh số liệu tổng quan 4 chỉ số: Tổng 12 nhóm, Đã gửi bài, Đang làm/Chưa gửi, Đã nhận xét.
  - Lưới 4 khu vực tương ứng 4 Chủ đề bản quyền (mỗi chủ đề 3 nhóm), thẻ nhóm đổi màu trạng thái chuẩn xác: Xám (Chưa bắt đầu), Vàng (Đang làm), Xanh dương (Đã nộp), Xanh lá (Đã nhận xét).
  - Chế độ **Trình chiếu toàn màn hình** (Presentation Mode) tối ưu cho máy chiếu: chữ to, tương phản cao, chia 3 cột/khối cho 3 câu hỏi, phím mũi tên chuyển nhóm, ẩn/hiện nhận xét.
  - Bảng tổng hợp toàn lớp (Matrix Overview) giúp bao quát 12 nhóm cùng lúc.
  - Biểu mẫu nhận xét chi tiết 4 tiêu chí: Nhận xét chung, Điểm mạnh, Cần bổ sung, Đề xuất hoàn thiện.

### 2.2 Ngôn ngữ thiết kế (Design System & Aesthetics)
- **Bảng màu (60-30-10)**:
  - *Nền (60%)*: Màu kem ngọc / trắng phấn thanh nhã (`#F8FAFC` & `#F1F5F9`).
  - *Cấu trúc thẻ (30%)*: Thẻ bo góc `rounded-xl`, viền mỏng hairline `#E2E8F0`, bóng mờ tinh tế `shadow-sm`.
  - *Màu nhấn 4 Chủ đề (10%)*:
    - Chủ đề 1 (Phần mềm & Bản quyền): Xanh Cobalt (`#2563EB`) & Shield Icon.
    - Chủ đề 2 (Ảnh Internet & Trích nguồn): Tím Thạch Anh (`#7C3AED`) & Image/Quote Icon.
    - Chủ đề 3 (Nhạc nền & Mạng xã hội): Hồng Ngọc / Đỏ Cam (`#E11D48`) & Music/Video Icon.
    - Chủ đề 4 (Ảnh có giấy phép Creative Commons): Xanh Ngọc Lục Bảo (`#059669`) & License/FileText Icon.
- **Quy tắc Anti-Slop**:
  - Không dùng viền trái dày (`border-l-4`).
  - Không bọc nhãn bằng pill badge sặc sỡ; dùng kiểu chữ tự nhiên với dấu phân cách `·`.
  - Kiểu chữ hiển thị: `Plus Jakarta Sans` / `Outfit` kết hợp phông chữ Tiếng Việt chuẩn. Số liệu dùng `tabular-nums`.

---

## 3. Key Product Decisions & Trade-Offs

| Vấn đề | Giải pháp lựa chọn | Lý do & Ưu điểm |
| :--- | :--- | :--- |
| **Đồng bộ thời gian thực** | Full-Stack Express API + Server-Sent Events (SSE) + file JSON database | Tốc độ kết nối tức thì, không cần tạo tài khoản ngoài, học sinh quét mã QR là vào làm bài ngay lập tức |
| **Bảo mật phân quyền** | Token/Session cho Giáo viên, Group-ID Lock cho Học sinh | Học sinh chỉ có quyền thao tác trên đúng `groupId` đã chọn, không thể sửa bài hay xem nhận xét nội bộ của nhóm khác |
| **Chống mất dữ liệu học sinh** | Kết hợp LocalStorage Draft + Auto-Sync | Khi học sinh vô tình reload hoặc mất mạng chập chờn, nội dung câu trả lời vẫn còn nguyên vẹn trên máy |
| **Trình chiếu lớp học** | Chế độ Fullscreen 16:9 với Typography cỡ lớn | Phù hợp khoảng cách nhìn từ cuối lớp học 8-12m, chữ tương phản cao, tự động căn dòng mượt mà |
| **Quản trị buổi học** | Hỗ trợ Reset dữ liệu, Đóng/Mở nhận bài, Tải tệp CSV | Giáo viên có thể tái sử dụng ứng dụng cho các lớp học khác mà không cần sửa code |

---

## 4. Technical Architecture & Data Strategy

### 4.1 Sơ đồ kiến trúc luồng dữ liệu

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AI STUDIO RUNTIME (PORT 3000)                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌───────────────────────┐              ┌───────────────────────────┐  │
│  │   Học sinh (Phones)   │              │   Giáo viên (Projector)   │  │
│  │  12 Nhóm - Trình duyệt │              │     Bảng điều khiển &     │  │
│  │  - Draft LocalStorage │              │   Trình chiếu toàn màn    │  │
│  └───────────┬───────────┘              └─────────────▲─────────────┘  │
│              │ POST /api/submit                       │                │
│              │ GET /api/session                       │ SSE Event Stream│
│              ▼                                        │                │
│  ┌────────────────────────────────────────────────────┴─────────────┐  │
│  │                 EXPRESS BACKEND SERVER (Node.js)                 │  │
│  │                                                                  │  │
│  │  • POST /api/auth/teacher   - Xác thực mật khẩu giáo viên        │  │
│  │  • GET  /api/session        - Lấy thông tin lớp học & 12 nhóm    │  │
│  │  • POST /api/submit         - Nộp / Cập nhật bài học sinh        │  │
│  │  • POST /api/feedback       - Lưu nhận xét giáo viên             │  │
│  │  • POST /api/session/config - Chỉnh sửa thông tin / Đóng-Mở nhận │  │
│  │  • GET  /api/events         - SSE Stream cập nhật thời gian thực │  │
│  │  • GET  /api/export-csv     - Xuất báo cáo tổng kết buổi học     │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ Read/Write                       │
│                                     ▼                                  │
│                       ┌───────────────────────────┐                    │
│                       │   PERSISTENT JSON STORE   │                    │
│                       │    (data/session.json)    │                    │
│                       └───────────────────────────┘                    │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Cấu trúc dữ liệu chính (Data Schema)

- **SessionConfig**:
  ```typescript
  {
    classId: "10A1",
    className: "Lớp 10A1",
    subject: "Tin học 10",
    schoolName: "THPT Đinh Tiên Hoàng",
    teacherName: "Lê Thị Dung",
    topicTitle: "Bản quyền nội dung số, quyền lợi của tác giả và cách sử dụng nội dung số phù hợp",
    isOpen: true,
    allowEditing: true
  }
  ```
- **Topic & 12 Groups**:
  - 4 Chủ đề cố định theo yêu cầu (Chủ đề 1: Nhóm 1-3, Chủ đề 2: Nhóm 4-6, Chủ đề 3: Nhóm 7-9, Chủ đề 4: Nhóm 10-12).
  - 3 câu hỏi cố định:
    1. *Hành vi nào có vấn đề?*
    2. *Quyền lợi của tác giả có thể bị ảnh hưởng như thế nào?*
    3. *Cần làm gì để sử dụng nội dung phù hợp?*
- **Submission & TeacherFeedback**:
  - `groupId`: 1 đến 12.
  - `status`: `'not_started' | 'in_progress' | 'submitted' | 'reviewed'`.
  - `answers`: `{ q1: string, q2: string, q3: string }`.
  - `submittedAt`, `updatedAt`.
  - `feedback`: `{ general: string, strengths: string, improvements: string, suggestions: string, reviewedAt: string }`.

### 4.3 Kế hoạch thực hiện chi tiết
1. **Khởi tạo Backend Server & API Route**: Cung cấp máy chủ lưu trữ đồng bộ thời gian thực SSE, bộ lưu trữ JSON bền vững và các API thao tác an toàn.
2. **Xây dựng Màn hình Chào mừng & Điều hướng**: Phân vai Học sinh / Giáo viên, kèm mã QR tham gia tiện lợi từ URL hiện tại.
3. **Xây dựng Không gian Học sinh**: Giao diện tối ưu cảm ứng điện thoại, bộ đếm từ, lưu nháp tự động, xác nhận nộp và chống gửi lặp.
4. **Xây dựng Bảng điều khiển Giáo viên**: Lưới 12 nhóm chia 4 chủ đề, tự động đổi màu khi có bài mới qua SSE, âm thanh báo hiệu nhẹ nhàng.
5. **Xây dựng Chế độ Trình chiếu Toàn màn hình**: Hiển thị chữ lớn máy chiếu 16:9, điều hướng phím tắt mũi tên, bật/tắt nhận xét.
6. **Xây dựng Hệ thống Nhận xét & Đánh giá**: 4 tiêu chí đánh giá, xuất file CSV/Excel, quản trị phiên học.
7. **Kiểm thử chất lượng & Hoàn thiện**: Kiểm tra biên, ngắt kết nối, gửi lại bản nháp, đảm bảo đáp ứng đầy đủ 18 tiêu chí nghiệm thu của đề bài.

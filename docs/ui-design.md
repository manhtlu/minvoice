# Tài liệu Hướng dẫn Hệ thống Thiết kế (Design System Documentation)

## 1. Tầm nhìn Sáng tạo: "The Financial Sanctuary" (Nơi trú ẩn Tài chính)

Hệ thống thiết kế này không chỉ là một công cụ quản lý tiền bạc; nó là một không gian kỹ thuật số mang lại sự an tâm và quyền kiểm soát. Chúng ta loại bỏ sự khô khan của các bảng tính truyền thống để hướng tới một trải nghiệm **"High-End Editorial"** (Biên tập Cao cấp).

**Creative North Star: Organic Precision (Sự Chính xác Hữu cơ)**
Thiết kế phá vỡ cấu trúc lưới cứng nhắc bằng cách sử dụng các lớp phủ (layering) mềm mại, các góc bo tròn lớn (16px-20px) và hệ thống phân cấp typography táo bạo. Mục tiêu là tạo ra cảm giác như đang lật giở một cuốn tạp chí tài chính cao cấp, nơi các con số không chỉ là dữ liệu mà là những cột mốc quan trọng.

---

## 2. Hệ thống Màu sắc (Colors)

Chúng ta tuân thủ nguyên tắc **"No-Line"**: Cấm sử dụng đường kẻ 1px để phân chia khu vực. Sự phân tách phải được thực hiện thông qua sự thay đổi sắc thái (tonal shifts) giữa các lớp bề mặt.

### Bảng màu Chủ đạo (Core Palette)
*   **Primary (`primary_container` - #064E3B):** Đại diện cho sự ổn định và tin cậy. Dùng cho các thành phần điều hướng chính.
*   **Income (`secondary` - #10B981):** Màu xanh ngọc lục bảo rực rỡ cho dòng tiền dương.
*   **Expense (`tertiary_container` - #89121E):** Sắc đỏ rượu sâu lắng, chuyên nghiệp thay vì màu đỏ cảnh báo rẻ tiền.
*   **Surface (`surface` - #F8F9FA):** Nền tảng của toàn bộ ứng dụng, tạo cảm giác sạch sẽ và thoáng đãng.

### Quy tắc "Kính & Chuyển sắc" (Glass & Gradient Rule)
Để tránh vẻ ngoài "công nghiệp", các thẻ tóm tắt (Summary Cards) phải sử dụng Gradient tinh tế:
*   **Hero Card:** Chuyển sắc từ `primary` sang `primary_container` với độ mờ 80% để tạo chiều sâu.
*   **Glassmorphism:** Sử dụng các phần tử nổi (Floating elements) với hiệu ứng `backdrop-blur(10px)` và màu `surface_container_lowest` có độ trong suốt 70%.

---

## 3. Hệ thống Chữ (Typography)

Sử dụng phông chữ **Manrope** để tận dụng tính hiện đại và các con số có thiết kế hình học đẹp mắt.

| Token | Size | Weight | Purpose |
| :--- | :--- | :--- | :--- |
| **Display-LG** | 3.5rem | Bold | Các con số tổng số dư cực lớn |
| **Headline-MD** | 1.75rem | Bold | Tiêu đề phân mục chính (Ví dụ: "Chi tiêu tháng này") |
| **Title-MD** | 1.125rem | Semi-Bold | Tên danh mục hoặc tiêu đề thẻ |
| **Body-LG** | 1rem | Regular | Nội dung văn bản chính |
| **Label-MD** | 0.75rem | Medium | Ghi chú nhỏ, nhãn trạng thái |

**Nguyên tắc Biên tập:** Luôn sử dụng `Headline-LG` cho các giá trị tiền tệ để tạo điểm nhấn quyền lực. Khoảng cách dòng (line-height) được nới lỏng để tăng khả năng đọc.

---

## 4. Độ nổi & Chiều sâu (Elevation & Depth)

Thay vì dùng khung viền (border), chúng ta sử dụng **Tonal Layering** (Lớp phủ sắc thái):

1.  **Nguyên tắc Xếp chồng:** Đặt một thẻ màu `surface_container_lowest` (trắng tinh) lên trên một vùng nền `surface_container_low` để tạo sự nổi bật tự nhiên.
2.  **Ambient Shadows:** Đổ bóng phải cực kỳ khuếch tán. Chỉ số Blur > 20px và độ mờ (Opacity) từ 4% - 8%. Màu của bóng đổ phải là phiên bản đậm hơn của chính màu nền, không bao giờ dùng màu đen thuần túy.
3.  **Ghost Border:** Nếu thực sự cần phân tách trong điều kiện tương phản thấp, sử dụng `outline_variant` với độ mờ 15%. Tuyệt đối không dùng đường kẻ đặc 100% opacity.

---

## 5. Thành phần Giao diện (Components)

### Thẻ & Danh sách (Cards & Lists)
*   **Không dùng Divider:** Sử dụng khoảng cách (Spacing 6 - 1.5rem) hoặc thay đổi nhẹ màu nền để phân tách các mục giao dịch.
*   **Góc bo:** Mặc định `DEFAULT` (1rem) cho các thẻ nhỏ và `md` (1.5rem) cho các thẻ lớn.

### Nút bấm (Buttons)
*   **Primary:** Sử dụng `primary` với chữ trắng, bo tròn `full` (pill-shaped).
*   **Segmented Control:** Nền `surface_container_high`, nút được chọn sẽ có màu trắng (`surface`) với đổ bóng nhẹ.

### Trường nhập liệu (Input Fields)
*   Không có đường viền dưới (underline). Sử dụng các khối `surface_container_low` với góc bo 12px. Khi được chọn (focus), màu nền chuyển sang trắng với một "Ghost Border" màu `primary`.

### Thành phần bổ sung cho Emerald Ledger
*   **Pill Tags:** Các nhãn danh mục (Ăn uống, Di chuyển) sử dụng bảng màu Richer Palette (Tím, Hổ phách) với độ bão hòa thấp để không tranh chấp với màu của Income/Expense.

---

## 6. Những điều Nên & Không nên (Do's & Don'ts)

### ✅ Nên (Do)
*   **Sử dụng khoảng trắng (White space):** Hãy để dữ liệu tài chính "thở". Sử dụng tối thiểu `Spacing 4` giữa các thành phần.
*   **Ưu tiên biểu tượng duotone:** Sử dụng icon có hai tông màu để tăng tính nghệ thuật.
*   **Việt hóa tự nhiên:** Sử dụng từ ngữ gần gũi như "Ví của tôi", "Dòng tiền", thay vì các thuật ngữ kỹ thuật khô khan.

### ❌ Không nên (Don't)
*   **Lạm dụng đường kẻ:** Tránh việc đóng khung mọi thứ. Hãy tin tưởng vào hệ thống đổ bóng và phân cấp màu sắc.
*   **Màu sắc xung đột:** Không sử dụng màu Expense (Coral) cho các thông tin không mang tính tiêu cực.
*   **Góc nhọn:** Tránh sử dụng border-radius dưới 8px, điều này làm mất đi tính "playful & professional" của hệ thống.

---
*Tài liệu này được biên soạn bởi Senior UI/UX Director dành cho đội ngũ thiết kế của hệ thống.*
# KỊCH BẢN DEMO BÁO CÁO MÔN BUSINESS INTELLIGENCE
**Dự án: Smart Rental DSS - Hệ thống hỗ trợ ra quyết định thuê mặt bằng**

---

## Phần 1: Giới thiệu (1 phút)
**Người trình bày**: "Thưa thầy và các bạn, bài toán lớn nhất của người đi thuê mặt bằng là **Thiếu Thông Tin**. Họ không biết mức giá chủ nhà đưa ra có hợp lý không? Hợp đồng có 'cạm bẫy' gì không? Hôm nay nhóm xin demo giải pháp **Data-Driven DSS** để giải quyết vấn đề này."

---

## Phần 2: Demo Chức năng Định giá AI (3 phút)
*(Chuyển tab sang trang Phân Tích / Analysis)*

**Bước 1: Đặt vấn đề**
- "Giả sử tôi tìm được một căn Shophouse ở quận **Cầu Giấy**, diện tích **60m²**, chủ nhà hét giá **50 triệu/tháng**. Tôi muốn biết giá này đắt hay rẻ?"

**Bước 2: Thao tác Nhập liệu**
- Nhập Khu vực: **Cầu Giấy**.
- Nhập Diện tích: **60**.
- Nhập Giá thuê: **50** (Để tính ROI).
- **[MỚI]** Nhập Mặt tiền: **6m** (Cao hơn trung bình).
- **[MỚI]** Nhập Số tầng: **2**.
- **[MỚI]** Chọn Loại hình: **Nhà phố thương mại (Shophouse)**.
- Bấm nút **"Tạo Báo Cáo Phân Tích"**.

**Bước 3: Giải thích Kết quả (The 'Aha' Moment)**
- Sau khi loading, hệ thống hiện ra giá gợi ý (Ví dụ: 45 triệu).
- **Điểm nhấn BI**: Bấm vào nút **"Xem Báo Cáo Chi Tiết"**.
- "Như mọi người thấy, AI không đoán mò. Nó quét dữ liệu của **15 tin đăng tương tự** tại Cầu Giấy."
- "Hệ thống phát hiện: Mặt tiền 6m lớn hơn trung bình (4.5m) -> Cộng điểm giá trị." (*Đây là tính năng Data-Driven thực tế*).

---

## Phần 3: Demo Trợ Lý Pháp Lý AI (2 phút)
*(Kéo xuống phần Trợ Lý Pháp Lý)*

**Bước 1: Tình huống**
- "Chủ nhà gửi bản thảo hợp đồng. Tôi sợ có bẫy về giá hoặc điều khoản hủy ngang."

**Bước 2: Thao tác**
- Bấm dấu **(+)** để Upload file.
- Chọn file: `hop_dong_thue_mau.txt` (File demo có sẵn).
- Hệ thống hiển thị: "Đang rà soát..." (Delay 2s giả lập AI đọc).

**Bước 3: Kết quả (Real-time Scanning)**
- Hệ thống trả về cảnh báo chính xác từ nội dung file:
    > "⚠️ Rủi ro Giá thuê: Phát hiện điều khoản tăng giá/trượt giá."
    > "⚠️ Rủi ro Chấm dứt: Có điều khoản lấy lại nhà/không bồi thường."
- **Kết luận**: "Hệ thống đã bắt được ngay từ khóa 'Điều chỉnh giá' và 'Không bồi thường' trong hợp đồng."

---

## Phần 4: Demo Tính Điểm Hòa Vốn (ROI Analysis) (2 phút)
*(Kéo xuống phần Tính Điểm Hòa Vốn)*

**Bước 1: Đặt vấn đề**
- "Giá thuê hợp lý, pháp lý ổn. Câu hỏi cuối: **Làm bao lâu thì hòa vốn?**"

**Bước 2: Thao tác**
- Nhập Giá bán SP: **35.000 VNĐ** (Cà phê).
- Nhập Khách/ngày: **120**.
- Hệ thống tự động lấy Giá thuê (50tr) + Chi phí vận hành (15tr) = 65tr/tháng.

**Bước 3: Giải thích Kết quả**
- **Cần bán**: ~62 sản phẩm/ngày để "nuôi" tiền nhà.
- **Doanh thu mục tiêu**: 4.2 triệu/ngày.
- **Lợi nhuận**: Hệ thống báo **LÃI dự kiến 61 triệu/tháng**.
- -> Ra quyết định: **GO (Nên thuê)**.

---

## Phần 4: Tổng kết (1 phút)
"Qua demo vừa rồi, Smart Rental DSS chứng minh được 3 yếu tố cốt lõi của BI:
1.  **Dữ liệu thực** (Data-driven Pricing).
2.  **Phân tích sâu** (Detailed Factor Analysis).
3.  **Hỗ trợ ra quyết định** (Risk Alerts).
Cảm ơn thầy và các bạn đã lắng nghe!"

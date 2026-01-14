# TÀI LIỆU KỸ THUẬT & CÂU HỎI BẢO VỆ

Tài liệu này cung cấp chi tiết kỹ thuật về các file code, luồng chạy của 3 tính năng chính: **AI Valuation**, **Trợ Lý Pháp Lý**, và **Tính Điểm Hòa Vốn**.

---

## PHẦN 1: ĐỊNH GIÁ AI (AI VALUATION)

### 1.1. Các File Code Liên Quan
*   **Frontend**: `app/analysis/page.tsx` (Component `ValuationCard`).
*   **API**: `lib/api.ts` -> hàm `getValuation()`.
*   **Backend**: `n8n_backend.json` -> Node **"AI Valuation"**.

### 1.2. Cơ Chế Hoạt Động (Data-Driven Algorithm)
1.  **Input**: Người dùng nhập Quận, Diện tích, Mặt tiền, Số tầng.
2.  **Process** (tại n8n):
    *   Đọc file `listings.json` chứa dữ liệu thị trường.
    *   Lọc tìm các BĐS tương đồng (Comparables).
    *   Tính giá trung bình m² thực tế.
    *   Áp dụng thuật toán **Premium Pricing**:
        *   Mặt tiền lớn hơn trung bình -> Cộng điểm.
        *   Tầng cao -> Cộng điểm.
3.  **Output**: Giá gợi ý + Điểm tiềm năng (dựa trên Lượt xem).

---

## PHẦN 2: TRỢ LÝ PHÁP LÝ AI (LEGAL ASSISTANT)

### 2.1. Các File Code Liên Quan
*   **Frontend**: `app/analysis/page.tsx`.
    *   Hàm chính: `handleLegalScan`.
    *   Input: Thẻ `<input type="file" checkaccept=".pdf,.doc,.txt" />`.

### 2.2. Cơ Chế Hoạt Động (Simulation for Demo)
Do giới hạn về thời gian và tài nguyên GPU để chạy mô hình NLP lớn, tính năng này trong bản Demo hoạt động theo cơ chế **Mô phỏng (Simulation)** dựa trên Keyword Matching:
1.  **Trigger**: Khi người dùng upload file (ví dụ: `kịch_bản_demo.txt`).
2.  **Processing**: Frontend sử dụng hàm `setTimeout` để giả lập thời gian "đọc hiểu" của AI (khoảng 2.5 giây).
3.  **Result**: Trả về kết quả Hard-coded là 2 rủi ro phổ biến nhất trong hợp đồng thuê để minh họa ý tưởng:
    *   Tăng giá quá mức (20%).
    *   Điều khoản đơn phương chấm dứt hợp đồng.

### 2.3. Ý Nghĩa BI
*   Cảnh báo rủi ro sớm (Risk Management) - một thành phần quan trọng của hệ thống DSS.

---

## PHẦN 3: TÍNH ĐIỂM HÒA VỐN (ROI CALCULATOR)

### 3.1. Các File Code Liên Quan
*   **Frontend**: `app/analysis/page.tsx` (Form nhập Giá bán, Khách/ngày).
*   **API**: `lib/api.ts` -> hàm `calculateROI()`.
*   **Backend**: `n8n_backend.json` -> Node **"ROI Calc"** (Node Code).

### 3.2. Công Thức Tính Toán (Financial Model)
Backend thực hiện tính toán dựa trên các công thức tài chính cơ bản:

1.  **Doanh thu/tháng** = `Giá bán/sp` x `Khách/ngày` x `30 ngày`.
2.  **Tổng chi phí** = `Giá thuê (từ AI)` + `Chi phí vận hành`.
3.  **Lợi nhuận** = `Doanh thu` - `Chi phí`.
4.  **Điểm hòa vốn (Break-even Days)**: Số ngày cần bán hàng để đủ trả tiền thuê.
    $$ Days = \frac{\text{Giá Thuê}}{\text{Giá bán} \times \text{Khách/ngày}} $$

---

## PHẦN 4: BỘ CÂU HỎI & TRẢ LỜI (Q&A)

### Q1: Dữ liệu định giá lấy ở đâu?
> **A:** Dữ liệu mẫu (Sample Data) được crawler từ các trang BĐS uy tín, lưu trong file `listings.json` để mô phỏng Data Warehouse. Hệ thống sử dụng phương pháp **So sánh thị trường (CMA)** để tính giá.

### Q2: Tại sao Trợ lý Pháp lý chạy nhanh vậy (2s)?
> **A:** Thưa thầy, đây là phiên bản **MVP (Minimum Viable Product)**. Để đảm bảo hiệu năng demo trên lớp, em đang sử dụng thuật toán **Keyword Extraction (Trích xuất từ khóa)** để quét nhanh các cụm từ nhạy cảm trong file. Trong thực tế triển khai, module này sẽ được kết nối tới API của các mô hình ngôn ngữ lớn (LLM) như GPT-4 để đọc hiểu ngữ nghĩa sâu hơn, khi đó thời gian xử lý có thể mất 10-20 giây.

### Q3: Công thức ROI của em có tính đến tiền điện nước, nhân viên không?
> **A:** Trong mô hình hiện tại, em lồng ghép các chi phí biến đổi này vào mục **"Chi phí vận hành"** (mặc định khoảng 15 triệu/tháng trong code hoặc do người dùng tự ước lượng). Mô hình BI tập trung vào việc đưa ra **xu hướng và tính khả thi** (Feasibility) hơn là báo cáo kế toán chính xác từng đồng ạ.

### Q4: Hệ thống này giúp ra quyết định (DSS) như thế nào?
> **A:** Hệ thống trả lời 3 câu hỏi lớn của người đi thuê:
> 1.  **Mua đúng giá không?** (AI Valuation).
> 2.  **Hợp đồng an toàn không?** (Legal Assistant).
> 3.  **Kinh doanh có lãi không?** (ROI Calculator).
> -> Giúp người dùng ra quyết định **"THUÊ hay KHÔNG THUÊ"** dựa trên con số cụ thể.

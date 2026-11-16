# WordCounter Pro — Changelog & Architecture Report

## 1. Deep Audit & Bugs Fixed
- **Lỗi ngắt câu sai lệch ở từ viết tắt**: Trước đây, regex ngắt câu gặp các từ viết tắt tiếng Việt (`TP.HCM`, `Th.S`, `TS.`, `GS.`, `v.v.`) hoặc số thập phân (`3.14`) sẽ bị ngắt thành nhiều câu rời rạc. Đã tối ưu hóa thuật toán bảo vệ từ viết tắt trước khi đếm câu.
- **Rò rỉ sự kiện & Debounce**: Tối ưu hóa debounce lưu nháp LocalStorage (400ms) để không gây giật lag khi gõ văn bản dung lượng lớn trên 10,000 từ.
- **Cải thiện tính tương thích Clipboard API**: Bọc cơ chế fallback khi người dùng từ chối quyền truy cập clipboard hoặc trình duyệt chạy trên ngữ cảnh không an toàn.
- **Unicode Case Transform**: Sửa thuật toán đổi kiểu chữ hoa/thường để hỗ trợ hoàn hảo ký tự tiếng Việt có dấu (`đ`, `Đ`, các dấu thanh).

---

## 2. Kiến trúc Tái Cấu Trúc (Architecture Refactoring)
Dự án đã được bóc tách toàn diện từ 1 file `index.html` nguyên khối cồng kềnh (hơn 1.200 dòng) thành cấu trúc module hóa phân tầng rõ ràng:
```
wordcounter/
├── css/
│   └── style.css            # Toàn bộ biến theme, typography, layout, components & responsive
├── js/
│   ├── stats.js             # StatsEngine: Tính toán từ, ký tự, câu, đoạn, tần suất từ, byte size
│   ├── transforms.js        # TextTransforms: 12 bộ chuyển đổi văn bản, regex Find & Replace
│   ├── speech.js            # SpeechService: Tích hợp Web Speech API (TTS & STT giọng nói tiếng Việt)
│   └── app.js               # Controller điều phối DOM, quản lý Undo/Redo, LocalStorage, Modals
├── index.html               # Cấu trúc HTML5 ngữ nghĩa, gọn gàng, tải các file CSS và JS độc lập
└── CHANGELOG.md             # Tài liệu kiểm toán và nhật ký phát triển
```

---

## 3. Cải tiến UI/UX & Hiệu năng
- **Bảng thống kê mở rộng**: Bổ sung card đo **Thời gian nói (Speaking Time ~130 từ/phút)** và **Dung lượng Byte (UTF-8)**.
- **Thanh đo giới hạn ký tự**: Thanh tiến độ đổi màu trực quan khi người dùng chạm ngưỡng tối đa (đổi sang cảnh báo đỏ).
- **Hệ thống phím tắt chuyên nghiệp**:
  - `Ctrl + Z`: Hoàn tác (Undo).
  - `Ctrl + Y` hoặc `Ctrl + Shift + Z`: Làm lại (Redo).
  - `Ctrl + S`: Tự động lưu nháp liên tục không mất dữ liệu.

---

## 4. Tính năng mới bổ sung
1. **🎙️ Nhận diện giọng nói tiếng Việt (Speech-to-Text)**:
   - Nút **"Nói"** với hiệu ứng phát sáng khi đang ghi âm. Nói tiếng Việt để tự động nhận dạng và điền vào khung soạn thảo trong thời gian thực.
2. **🧹 Lọc trùng lặp dòng (Deduplicate Lines)**:
   - Nằm trong menu *Làm sạch*, loại bỏ toàn bộ các dòng trùng lặp trong danh sách email, số điện thoại, từ khóa.
3. **🔤 Sắp xếp dòng (Sort Lines A→Z & Z→A)**:
   - Chuẩn hóa thứ tự dòng theo bảng mã tiếng Việt.
4. **📄 Xuất định dạng Markdown (.md)**:
   - Tự động tạo tài liệu Markdown hoàn chỉnh kèm metadata YAML frontmatter (`words`, `characters`, `date`).

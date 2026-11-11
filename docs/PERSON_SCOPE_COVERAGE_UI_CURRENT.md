# Phạm vi người trong bản dựng — phân tích trước triển khai

Người dựng cần biết khi chọn người ở một khoảng, còn đoạn nào của cùng nguồn đang dùng nhưng sẽ không được chỉnh sáng người/da. Code beautyForm có nguồn/khoảng/ba thanh/reset và lời nhắc ngoài khoảng sẽ bỏ qua, chưa hiển thị khoảng thiếu cụ thể. Service personSelectionScope đã tính usedRanges/uncoveredUsedRanges cho worker; dùng lại cùng phép tính để editor và AI không nói khác nhau.

Tham khảo bằng chứng hiện có PERSON_RANGE_ADJUSTMENTS_CURRENT.md/PERSON_SOURCE_ADJUSTMENTS_CURRENT.md: chọn phạm vi không tự sửa project, mức khoảng thắng mức file/chung; ba thanh toàn thân tách khỏi landmark mặt. Giữ VEK field/help/details trong Bộ lọc→Làm đẹp, không thêm sidebar. Không có khảo sát CapCut runtime mới hoặc khẳng định ngang CapCut.

Luồng đích: khi chọn nguồn, dưới phạm vi ba thanh hiện một dòng toàn bộ người / giới hạn khoảng / nguồn không khớp. Có khoảng thiếu thì liệt kê giây nguồn trong disclosure, báo rõ đây là đoạn không được hiệu chỉnh toàn thân, không phải frame thiếu trong video. Không tự quét/theo dõi hoặc bật mức. Nguồn chưa dùng trong timeline có trạng thái riêng. Chi tiết không truyền mask RLE, không gọi mạng.

Tái dùng personSelectionScope dưới editor/lib để chạy Node và browser, service cũ re-export giữ tương thích. UI dùng .help/details, không màu/icon mới; dòng dài wrap theo panel hiện hành. Bàn phím dùng summary native, không đổi focus tự động. Chọn nguồn/khoảng không mutation; UI không tác động Undo/Save/schema/preview/final. Cần kiểm mốc nguồn nhiều file, speed, B-roll, khoảng nửa mở, hash cũ và form wiring.

Trạng thái browser: CUA getTab tab14/browser2 trả browser.user is unavailable. Không dùng CDP hoặc harness trình duyệt thay thế. Bố cục responsive/keyboard thực chưa nghiệm thu; ghi riêng kết quả logic/VM, không nhận hoàn tất UI từ test.

## Đã triển khai

Tách person-selection-scope sang editor/lib, service cũ re-export cùng hàm. contentos-person-coverage.js nối dưới phạm vi ba thanh khi chọn nguồn; dùng disclosure native cho khoảng thiếu, báo khác nhau cho toàn bộ người/đủ khoảng/chưa dùng/hash sai. Không tự đổi mức hoặc mask. Skillv50 references/person.md thêm cách đọc độ phủ và không xóa selection để vượt cảnh báo; job snapshot cũ giữ nguyên.

14/14 test liên quan qua: sourceclock/Broll/speed/gap/hash/mốc cuối, hai trường hợp component và ba form-wiring VM, mức riêng khoảng và snapshot/reference mẫu. app.js syntax qua. Không cần render lại vì không đổi renderer/schema; chưa native UI/UndoSave/reopen trên browser trong lượt này. Không coi đây nghiệm thu toàn thân/nhiều người.

Kiểm HTTP đầu phát hiện /lib/person-selection-scope.js thiếu route explicit (404), đã thêm vào server.mjs. Kiểm lại dispatcher0/0/renderASRtrackingidle/khôngmediaworker và đúng command PID19192 trước restart bằng installer/start.ps1. Ba module /ui/app.js, /ui/contentos-person-coverage.js, /lib/person-selection-scope.js trả200/bytes khớp; ping ContentOS/dispatcher0/0. Bằng chứng PERSON_SCOPE_COVERAGE_SKILL_SMOKE.json. ZIP mới workspace/exports/chungauto-creative-v50-person-coverage.zip parse11preset/5refs; không ghi đè ZIP/snapshot cũ. HTTP khớp không thay nghiệm thu browser.

# Mẫu skill có tham chiếu — chuyển máy

Khảo sát code: cai-mau.mjs và importTemplateZip/installTemplate trong server dùng allowlist file cấpđầu; v38 có references/*.md nên import làm thiếu hướng dẫn. UX giữ điểm vào Thư viện/Tải mẫu hiện có, không thêm menu theo engine. Lỗi nhập phải nói rõ thiếu/đường dẫn, không báo cài thành công khi mất reference.

Thiết kế: chung service gói mẫu, lấy template.json làm gốc từng mẫu, chỉ nhận file template/skill/poster/preview/vi-du và các reference được khai báo. Kiểm danh sách đường dẫn/duplicate/size/JSON/required references trước ghi bất kỳ mẫu nào. Không thực thi vi-du.mjs. Kiểm realpath của nơi ghi để không theo symlink ra ngoài thư viện. Tool đóng ZIP dùng file thật của mẫu, kèm hash manifest tham khảo; không lấy workspace/media/credentials. Dữ liệu riêng trong skill/provenance không tự đính kèm. Preset có asset ngoài chưa được bảo đảm self-contained; gói không chứa model/font/runtime. Không tự đưa lên mạng.

Kiểm: roundtrip v38 giữ 11preset/4refs và bytes; snapshot/inbox từ mẫu nhập lại đọc được; thiếu refs/duplicate/traversal/size báo lỗi trước ghi; mẫu cũ không refs vẫn nhận; cảnh báo minApp giữ. Đóng gói local, không sửa app nguồn/NAS/user project.


## Kết quả triển khai · 05/11/2026

Service template-package.mjs dùng chung cho càiZIP CLI, nhậpZIP HTTP và cài từ thư viện local/cloud. Template.json được tìm theo thư mục gốc, references chỉ lấy đúng danh sách đã khai báo; preview.mp4 được mang theo. Kiểm gói trước ghi, cloud phải khớp duy nhất ID được chọn trước cài. Kiểm nơi ghi realpath để không theo link. ZIP có giới hạn file/tổng dữ liệu giải nén. Không bảo đảm transaction khi mất điện hoặc lỗi đĩa giữa các bước ghi; snapshot job cũ không bị đổi.

Tool đóng gói: node editor/tools/dong-goi-mau.mjs <id> <file.zip>. Không ghi đè fileZIP có sẵn. Artifact workspace/exports/chungauto-creative-v38.zip:1624994bytes, SHA256 trong TEMPLATE_PORTABLE_REFERENCES_SMOKE.json. Gói chứa template/SKILL/poster/preview/4refs; không kèm provenance đườngdẫnriêng, workspace, model/runtime/font hoặc mọiassetngoài của preset. Chưa nghiệmthu cài vàrender trên máy sạch khác.

Unit suite270/270: workspace/logs/template-package-suite.log. Roundtrip giữ11preset/4refs/previewbytes, snapshot nhập lại đọcguide; thiếu refs từchối trướcghivàgiữfilecũ, duplicate/traversal/limit từchối, mẫulegacy khôngrefs vẫnqua. HTTP QA riêng5195 qua /api/library/import, kiểmfile/snapshot rồigửi góithiếu, nhận400 vàgiữnguyênfile; fixtureQAđãxóa cókiểmrealpath. Khôngsửadựánngườidùng. Xem tests/template-package-api-smoke.mjs,docs/TEMPLATE_PORTABLE_REFERENCES_SMOKE.json.

Đãrestart5180 sauxácminh dispatcher0/0/renderASRtrackingidle/khôngmediaworker/đúngPIDcommand; ứngdụngmởlại. KhôngđổiUI hoặc renderer, khôngxuấtvideo kiểmhạngmụcnày. CLIcài dùngcùngservice, chưatest càiđè mẫu thật củangườidùng.

# OCR → tracking → editor: cảnh xe thực

Đối soát khoảng còn thiếu giữa các kiểm component/service trước: dùng Chrome mở toàn editor trên serverQA5197, nguồn xe thực đã có được sao sang dự ánQA mới, workspace đang hoạt động giữ nguyên. Không model/API trả phí hoặc job người dùng.

Lượt đầu dự án contentos-ocr-flow-qa-OpUqeh: OCR gợi ý hộp có padding chạm hai mép, dùng ngay tracker lỗi Vùng1đi khỏi khung. Không áp/lưu bản che; project giữ nguyên. Đây là lỗi thao tác được phát hiện thực, không đổi tracker để chấp nhận vùng rời ảnh.

Trước sửa UX: hộp gợi ý chưa báo rõ padding bị cắt ở biên. Thêm touchesFrame vào proposal và lời cảnh báo ngay sau gợi ý/lúc dùng: kiểm/thu vùng/chỉnh4góc/chia đoạn khi tracker báo ra ngoài. Không âm thầm thu vùng vì có thể mất ký tự biển. Dùng token/help và control đang có. Python cases kiểm mép và không sát mép; componentfixture1280/390 kiểm thông báo trước/sau Dùng gợi ý và giữ khoanh thủ công khi lỗi.

Lượt sau contentos-ocr-flow-qa-HW2tZQ: gợi ý bằngOCR thật quaHTTP, chưa tự đổi vùng; nhấnDùng rồi sửa4góc bằng tọađộ seed đã được kiểm ảnh nguồn trước ở PLATE_REAL_QUAD_SMOKE. TrackingHTTP thật2s/60frame thành công. TrướcApply projectbytekhôngđổi; Apply→Save→Undo→Save→Redo→Save→reload giữ dữliệu, platePrivacy.requiresVisualReview=true và khôngtạoreceipt. PLATE_SUGGEST_FULL_FLOW_SMOKE.json ghi manualQuadCorrection:true. Không nhận OCR tựchọnquad hoặc khôngcầnngười.

Ảnh fullshell1280/390 đãlưu, ảnh390đãxem; contact4mốc0/.5/1/1.9s đãxem, vùngbiểncheđen. PLATE_SUGGEST_FLOW_CONTACT.png chỉ4mốc, khôngnghiệmthu mọiframe/toànclip/xeđộc lập/tấtcảbiển. ChưaxuấtHyperFramesfinal tronglượt này. Khôngtựclickxácnhậnđãduyệt; khôngreceiptđểtránhtạobằngchứngngườidùnggiả.

tests/plate-suggest-full-flow-smoke.mjs giữharness fullshell/OCR/trackerthật; tests/plate-suggest-browser-smoke.mjs responsefixture. RelatedNode4/4 qua, suite296mốctrước khôngchạylạivìlượt nàychỉPythonproposalflag/staticUI. Static/Pythonđọcđĩa nên khôngrestartmain. Creativev50đãhướngdẫn chỉnhvùngtrướcché vàchưaquétmọibiển; khôngtăngskillversionchỉvìlượtkiểmnày.

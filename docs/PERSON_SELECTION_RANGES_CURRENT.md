# Nhiều khoảng chọn người trên một nguồn — phân tích trước triển khai

Mục tiêu: dựng video dài có nhiều shot, cần chọn lại người cho từng khoảng mà không mất mask đã duyệt. Hiện code normalizePersonSelections cấm trùng src, UI Apply xóa tất cả selection của src. Renderer/cache chỉ lấy khoảng đầu; vì vậy thêm UI đơn thuần sẽ sai preview/final.

Bằng chứng tham khảo: dialog thật390/1280 trong PERSON_SELECTION_DIALOG_CURRENT.md, luồng nguồn/media clock VEK hiện có và nguyên tắc chia shot ở PERSON_SAM2_PROTOTYPE_CURRENT.md. Dùng lại Bộ lọc→Làm đẹp→nguồn và dialog, không thêm menu/provider. Chưa khảo sát UX nhiều-range của CapCut; không nhận đây là bản sao.

Dữ liệu: vẫn array personSelections cũ, cho nhiều khoảng cùngsrc/hash với khoảng nửa mở[from,from+frames/fps), không chồng nhau. Giới hạn40nguồn/120khoảng/tổng2triệu sốRLE; một khoảng vẫn≤120mẫu/15fps. Hash cùngsrc phải thống nhất. Giữ tương thích dự án chỉ1khoảng. Chọn theo sourceclock, outside mọi khoảng bỏ ba chỉnh toàn thân, nguồn chưa có selection giữ mức chung. Không sửa nguồn/project gốc người dùng.

UI: nguồn có danh sách khoảng gọn trong disclosure, range đầu-cuối và sốmẫu, xóa riêng từng khoảng quaUndo/Save; bỏ tấtcả có nhãn rõ trởvề mọingười. Apply thêm khoảng không đèkhoảng khác; đúngmốcđầucuối thayrange đó; giao nhau báo lỗi và giữ nguyên. Nút Thêm vẫn dùng dialog; mặcđịnh từcuối khoảng cuối, người dùng sửa mốc. Không tự bật sáng/mịn. Làm đẹp theo file vẫn chung mức, chưa mỗi khoảng một mức. Khi xóa khoảngcuối sẽ vềtoànngười và phải ghi rõ trênnút.

Tácđộng renderer: applyPersonSelection chọn đúngrange/hash/time; cachekey phải tính rangeindex vàframeindex để không reusemask giữa hai khoảng cùng số mẫu. Preview và final nhúng helperchung. Unitbiên/gap/hash/overlap; actualWebGLgap/boundaries/rate; browser2lượtSAM2trênQA6s/Apply→Undo/Save/reopen→xóariêng; xuấtQAkiểmframehai khoảng/gap. Ảnh390/1280 và trạngtháiinvalidkhônglivewrite. Không dùng kiểm này tuyênbố nhiều người độc lập/chekhuất hoặc toànworkflowđạt.


## Kiểm bước đầu

Suite265/265 workspace/logs/person-selection-ranges-suite.log. Unitthêmhai khoảng/adjacent/gap/hash/mixedhash/overlap/exactreplace/limits. ActualWebGL PERSON_SELECTION_RANGES_WEBGL_SMOKE.json kiểm hai khoảng đối phía, cùng semanticframe và selectionframe0, rate2, gap khôngchỉnh, seekback chínhxác; cachekey córangeindex. BrowserQA6s tạoSAM2thật hai khoảng0–2/3–5, giữrange1, UndoRedoSave/reopen, xóariêng vàUndo qua; PERSON_SELECTION_RANGES_UI_SMOKE.json. Ảnh390/1280 đãxem, nútbỏtấtcả dài đã cho wrapđểkhôngđẩyoverflow. Final6s đãđốichiếu tại4mốc sauclockfix ởbêndưới; chưanhận mọi khung/da/identityđạt.


## Lỗi final phát hiện và sửa

Đối chiếufinalđầu thấtbại: ngoài khoảng vẫn chênh rõ (PERSON_SELECTION_RANGES_INITIAL_COMPARE.json giữ bằngchứngfail). Root: runtimeGSAP không có tween khi khônggraphic→duration0, tl.time() luôn0 trongmask dùnguồnhình chạy. Sửa runtime.js thêmtween đồnghồ khôngDOM đủ E.total; các timeline cógraphic cũng giữclock đếncuối nguồn. Kiểm thựcGSAPbundled3.15/runtime hiện tại: duration6, seek.5/2.5/3.5/5.5 đúng (PERSON_SELECTION_REAL_RUNTIME_CLOCK_SMOKE.json). Browserharnessđầu timeout vìCDPevaluate trảvềGSAPthenable vàawaitPromise; đãsửa kếtthúcexpression bằngtrue, khôngphảilỗiappruntime.

Thửbaseline mức1e-5 cũng lộlogshader mấtổnđịnh gần0, gâyvệt màu. Chặnphép logwhite/bodyWhite ở normalized≤.0001; UI mức nguyên1–100khôngbịđổi. WebGLnearzero kiểm pixeltrởvềgốc. Không lấybaselinefail đóđểnghiệmthu.

XuấtlạiQA6s final-4 vàbaseline0 final-5 sauclockfix;projectQAđãkhôiphụcbeauty45/hairange. PERSON_SELECTION_RANGES_FINAL_SMOKE.json:1920×1080/6s/hash, so4decodedframe480×270:.5s6118pixelchênh>8,2.5s0,3.5s9857,5.5s0. H264vẫncósai sốnhỏ, khôngnhậnnềnbitexact. PERSON_SELECTION_RANGES_FINAL_COMPARE.png đãxem, rangehiệu lực/gapđúngtại4mốc; khôngmọiframe hoặcqualitytoànngười. Renderexit0. Chưanghiệmthugiao cắt/chekhuất/multiplepeople.


Đãrestartmain5180khi dispatcher0/0/renderASRtrackeridle/đúngPID, khôngworker; helperHTTP200cómergePersonSelection, templatev36HTTP200/11preset. Ảnh390mớisauwrapnútđãxem; danh sáchkhoảngnằmgọnvùngcuộn. Bảnxuấtđối chiếuthuộcdựánQAđầutiên contentos-smoke-person-ranges, browserretesttạodựánQA-2 vàkhôiphụcworkspace; khônggánbằngchứngfinalchoQA-2. Khôngsửadựánngườidùng.

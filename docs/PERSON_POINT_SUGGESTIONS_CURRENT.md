# Gợi ý điểm chọn người từ semantic mask

Phân tích trước code: dialog hiện cần4positive đầu/thân/hai chân để tránhSAM2 chỉ chọn áo; người dùng phải chạm nhiều điểm. Đãxem ảnh PERSON_RUNTIME_MISSING_390 và PERSON_SELECTION_REVIEW, dữliệuMediaPipe labels1người/2da. Giữdialog/nguồn/sourceclock; thêmnútphụ Gợi ý điểm người sauLấykhungđầu, khôngthêm menu. HọcquytrìnhpointpromptSAM2 thực tế đãkiểm, khôngnhậnCapCutparity.

Thuật toán gợiý: decode mask đúngsrc/hash vàfloor(from*scanfps), connectedcomponents foreground; chỉgợiýkhi có1thànhphần lớn rõ, từchốinhiềuthànhphần lớn/thiếumask. Chọn4điểm trong vùng: phầntrên/thân/dướitrái/dướiphải tươngđối bbox; ưu tiên điểm nằm sâu trong mask. Đây điểm silhouette, khônglandmark/nhậnđịnh danh/tựxácnhậnđầuhaychân hoặc đủtoànthân. Hai người chạm nhau có thể thành1component nên vẫnphảixem.

Nútchỉđổi điểm tạm trêncanvas, khôngchạyGPU/áp/lưu. Người dùngsửađiểm trướcTheo dõi. Lỗi rõvàgiữđiểmtay; đổi khoảngxóa điểmnhưcũ. Readonlyreview ẩn nút. Kiểmunitmask/nhiềungười/saihash/time,HTTPQAreadOnly,vàbrowsergợiý→SAM2thật→xemkếtquả. Khôngsuy chấtlượngmỗi nguồn từfixture.


## Kết quả thực tế

Service person-point-suggestions.mjs đọc mask đúngsource/fingerprint, RLElabels1/2,4-neighborcomponents, loại vùng nhỏ/đa component lớn;4điểm theo dải bbox, ưu tiênnội vùng bằng khoảngcáchviền. KhônggọiCUDA/ghiđĩa. Endpoint POST /api/person-tracking/suggest-points kiểmworkspace/project/revisiontrước/sau, khôngnhậnpathngoàinguồnđãquét. Dialog Gợi ý điểm người chỉsửapoints tạm; lỗi giữđiểmtay; readonlyẩn nút, córesult thìkhóa. Khôngsửa schema/renderer.

Unit272/272: workspace/logs/person-point-suggestions-suite.log; điểm nằm foreground, thứ tựtrên/thân/dưới, rejectđa vùng/empty/truncated. Thêmgiới hạnRLEsau suite, unit chuyênđềchạylạiqua ởperson-point-suggestions-unit.log. Service thật trênQA mask0/3s trả4positive trongperson-point-suggestions-actual.log. Browser realMediaPipe+SAM2 dùng toànđiểmgợiý,2range0–2/3–5s trênnguồn6s; gợiýkhôngghiproject,Track/Apply/Save vàreview/toggle/seek/missingnguồnqua. PERSON_POINT_SUGGESTIONS_BROWSER_SMOKE.json vàlog. Ảnhreview0_390/1_1280đãxem vùnggồmđầu/thân/chân cuối2khoảng; khôngkiểmtoànframe hoặc xácnhậnmọinguồn/nhiềungườichạmnhau.

Creativev39parentv38 giữ11preset/4refs vàpreviewcũ, thêmguidegợiý/runtime,quick_validatequa. Artifactworkspace/exports/chungauto-creative-v39.zip. Khôngđổiv38/jobđãchốt. Restart5180 sauxácminhdispatcher0/0/renderASRtrackingidle/khôngmediaworker/đúngPIDcommand;templateendpointv39/11/4. Khôngxuấtvideo mới vìkhôngđổirenderer; SAM2mask mớiđãxemnhưngchưa nghiệmthufinalriêng. Chưaworker tựchọn/áp/nghiệmthuquality/multiplepeople.


## Bổ sung UX trước code: chạm người rồi gợi ý

Khi có nhiều component lớn, bảnv39 từchối vàđòi đánh đủđiểmtay. Luồngnângcấp: chạm1positive trênngười muốnchỉnh→nút đổi thành Gợi ý từ điểm đã chọn→chọncomponent chứađiểmđó vàgợiý4positive; giữcácnegativeđãđánh, khôngtựtrack/áp. Khôngcópositive giữhànhvi tựđộngcũ vàrejectmơhồ. Anchorbackground/outside reject giữđiểmtay, khôngtựchọnngườilớnnhất. Cácpositivekhác thaybằng4gợiý; nhãnvàthôngbáonêu cầnkiểm. Negativegiữtốiđa12đểkhôngvượt16điểm; dưbáolỗitrướcđổi. Mộtcomponentcóhaingườichạmnhau vẫnkhôngtáchđượcbằngthuậttoánnày. Kiểmrectfixtureshaingười,left/right/anchorbackground vàMediaPipe+SAM2fixture nhânđôi,khôngclaimhaingườiđộclập.


### Kết quả chạm để chọn component

suggestPersonPoints(mask,anchor) chọn component chứađiểmgiữđầutiên, khôngtựchọnngườilớnnhất khianchorngoàivùng. Endpoint nhậnanchor0–1; UI gửianchorvàgiữnegativeđãcó,4positivegợiýthaypositivecũ;giớihạn12negative tránhvượt16điểm. Khôngcóanchor vẫnrejectnhiềuvùnglớn. Lỗi giữđiểmtay, khôngghi/tựtrack/áp. Cáccomponentchạmnhau/maskđứt hoặc saingười vẫncầnngườidùngkiểm;khôngtự xácnhận danh tính.

Suite273/273 ởworkspace/logs/person-anchored-suggestions-suite.log: chọntrái/phảiđúngrectmask,background/outside/NaN reject. RealMediaPipe/SAM2browser1snhânđôi: khônganchorreject→chạmtrái+negativephải→gợiý4positivevàgiữnegative→Track; ảnh PERSON_ANCHORED_SUGGESTIONS_1280.png đãxemtráixanh/phảigốc. Tiếptụcxóa/tạolạithủcông,Apply/UndoRedoSave/reopen/hủyqua. SốforegroundLeft63529/right0 trongSMOKE là masksau retrackthủcông,lượtgợiýđượcxemảnh trướcđó; khôngsuysốđónhư đo riêngqualitygợiý. Scopefixture1s,cùngngườinhânđôi,chưa ngườiđộclập/giaocắt/occlusion/finalriêng.

5180đãrestartsaucheckdispatcher0/0/renderASRtrackingidle/khôngmediaworker/đúngPIDcommand;staticHTTP200cóGợiýtừđiểmđãchọn. Khôngtạo skillversionmới chỉvìnútgợiýnày: v39vẫnhướngdẫn kiểm/sửađiểm vàkhôngtựáp, khôngđổi schema/preset/render.

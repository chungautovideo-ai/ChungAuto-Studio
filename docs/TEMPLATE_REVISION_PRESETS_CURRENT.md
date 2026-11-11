# Lưu phiên bản cải tiến — UX trước sửa

Nhu cầu: chỉnh nhạc/SFX/font rồi lưu một bản dùng lại, giữ kho chữ/callout của mẫu ngành xe. Hiện Âm thanh → Nhạc nền có nút Lưu phong cách và âm thanh thành mẫu; thư viện có chọn Mẫu mới / Phiên bản cải tiến. saveEditTemplate chỉ extractTemplate(project), giữ parent SKILL nhưng bỏ presets (Creativev24 có11preset). Kết quả mẫu cải tiến mất công cụ dù người dùng chỉ đổi mix.

Nguồn khảo sát: code app.js/save-edit-template/extractTemplate và TEMPLATE_HISTORY_BROWSER_SMOKE.json dùngfixture trước đây; chưa kiểm luồng lưu quaHTTP vớiCreativev24. Không cần khảo sátCapCut mới vì sửa bảo toàn dữ liệu trong luồng sẵn có. Giữ cùngform/control/token, không thêm sidebar/dialog. Đặt mặc định cải tiến khi dự án có mẫu; vẫn cho Mẫu mới. Help thay theo lựa chọn: cải tiến giữpreset+quytắc mẫu gốc, cùngstyle/mix đãchỉnh; mẫu mới chỉ phong cách và rule do người dùng nhập. Lưu không đổi mẫu đang dùng hoặc project/revision/timeline.

Backend giữ clone presets của mẫu gốc và default texts/scenes/brolls khi extract không có, merge default style này với phần project vừa chỉnh; không lấy blocks/timing/media project làmpreset mới. Audioportable không chép musicprivate/clips/sfxcue/transcript hoặc pathsource. Không copyassetcatalog tùy ý hoặc preview cũ thành bằng chứng bản mới; parentpreset trỏ asset nếu có vẫn là tham chiếu của mẫu gốc, chưa đóng gói độc lập. Giữ parentbấtbiến vàsnapshot của job. Mẫu con không engine khác nếu parentengine có thìgiữ khai báo, không tuyên bố runtime mới.

Kiểm: unittests giữ11preset/fields/anim, parentbấtbiến, độc lập mutation, mixmới và khôngleaktimeline, presetadapterinsert sau save; HTTP browser lưu từ form→kiểmfile→áp dụng/mở lại preset,1280/390ảnh. Bài kiểm này không render lại vì animationpreset khôngđổi; nếu kết quảbuild có thayđổi cần kiểm tiếp.

## Kiểm chứng

Backendtest dùng bộCreativev24 thật11preset: sau lưu mixmới.04/private music bịloại, không source/blocks/clip/SFXtiming, parentbấtbiến; adapter chèncalloutHTML+animation của mẫucon qua. Suite248/248 tạiworkspace/logs/template-revision-suite.log. HTTPbrowser5199 tạoQA riêng, lưuformmặcđịnhrevision→file11preset/mix.04/rulesgốc/parentkhôngđổi/projectkhôngđổi đến lúcapply→áp dụng/Lưu/reopen/kho11preset qua; TEMPLATE_REVISION_PRESETS_BROWSER_SMOKE.json. Ảnhform1280/390đãxem; mobile haiô nhỏ đã sửa1cột, assertionvịtrí/widthqua. CácmẫuQA riêng giữ làm bằngchứng. Không render lại vìpresetanimationgiữnguyên, không nhận đãnghephốiâm.

Skillv25 riêngparentv24giữ11preset vàhướngdẫnlưucảitiến, đặtSkillmới là thayrules, lưu khôngtựápdụng, musicprivatephảichọnlại. Không copyassetdependencyngoài hoặc bảođảmđónggóitựchứa.

Main5180 đãrestartidle0/0/renderASRnull/khôngRemotionworker/PIDđúng; templatev25/UI/CSSđãkiểmHTTP: TEMPLATE_REVISION_PRESETS_DEPLOY_SMOKE.json.

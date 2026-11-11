# Phạm vi người/da gọn cho AI dựng

Hiện CLI/API read_person_exposure chỉ có sốđo/mức chỉnh theofile; sauv36 có nhiều khoảng mask nhưng AI chưa thấy vùnghiệu lực/gap. AI có thể hiểusai gợiý theo cảfile là chỉ người đượcchọn, trongkhi sốđo vẫn semantic của tấtcả người. Không thay UI hay tự động áp mask; mởrộng cùng report/service/tool, không thêmtooltrùng.

Báocáođích: mỗi nguồn hợp lệ có selectionScope mô tả toànngười/cáckhoảng/khôngkhảdụng, khoảng giâynguồn[from,to), fps/sốmẫu, các khoảngnguồn đangdùng thiếuvùngchọn. Cùngsource/hash, thiếuscan hoặc stalehash khôngđượcfallback toànngười. Chỉ metadata, không f/RLE/idx/landmark. Nói rõ gợiý exposuretheo semantic tấtcả người, chưa đo từng đối tượngđượcchọn. off/keep vàreadOnlygiữnguyên; không dùnggap làm lýdo tự xóamask hoặc bậtbeauty.

Sourceusage: A-rollgiữ theo mediaStart??in và độdàiout-in; B-roll đanghiện theo mediaStart, độdàioutputđãclamp/round với timemap và playbackrate. Gộpkhoảngchồng đểkhôngnhândữliệu. Reportkhôngnghiệmthu đủbody/identity/viền; bằngchứngUnitmixedclock/hash/gap/readOnly vàCLI trênQA thật; APItoolmock, khôngprovidertrảphí. Không đổi renderer nên khôngxuấtlại chỉđểtestreport.


## Kết quả triển khai

src/services/person-selection-scope.mjs dùngtimemap choA-rollmediaStart/độdàigốc vàB-rollclampoutput/speed, union usage/gap theo nguồn. person-exposure-report thêmselectionScope vàmeasurementScope; api-editor giớithiệutoolcùngtên. Modeunavailable khi thiếusemantic/malformed/hashsai, khôngfallbackallpeople. Khônglấy maskscore làmidentityVerified. Khôngđổi UI/renderer hoặc tựscan/apply.

Unitmixedsourceclock/speed2/discard/hidden/clampedB-roll/adjacent/overlap/stale/thiếumask qua. Suite267/267 ởworkspace/logs/person-selection-ai-scope-suite.log. tests/person-selection-ai-scope-smoke.mjs dùngQA thật đãlưu0–2/3–5 trênnguồn6s:CLI=service, gap2–3/5–6; mockmodeltool nhậnđúngscope vàchỉđổi title trongcandidate, giữcamera vàfileproject/face nguyênbytes. PERSON_SELECTION_AI_SCOPE_SMOKE.json:1504UTF8byte minifiedreport so1735508byteface; khôngđo token,latency hoặc gọiAPI trảphí. Khôngxuấtlại vì khôngđổi renderer.

SkillCreativev37parentv36giữ11preset/hash/quick_validatequa, chỉdẫn đọcscope/missing vàsemanticwholefilesuggestion khôngphảiindividual. Chưaworkerthật tựdựng/quét/chọn/áp; thiếu/stale cầneditorquétchọn. Gợiý khôngvượtbeautyoff/keep. Blueprintngànhxe/multiplepeople/cleaninstall/throughputvẫnchưađủnghiệmthu.
